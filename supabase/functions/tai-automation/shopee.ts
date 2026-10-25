// Shopee Affiliate Open API, Vietnam. All secrets remain in the Edge Function runtime.
// Signed payload: SHA256(AppId + unix_timestamp + exact_JSON_body + Secret).
const API="https://open-api.affiliate.shopee.vn/graphql";
const creds=()=>({id:String(Deno.env.get("SHOPEE_AFFILIATE_APP_ID")||"").trim(),
  key:String(Deno.env.get("SHOPEE_AFFILIATE_SECRET")||"").trim()});
const validNum=(v,max=1e10)=>{if(v===undefined||v===null||v==="")return null;const n=Number(v);
  return Number.isFinite(n)&&n>=0&&n<=max?n:null};
const rate=v=>validNum(v,1);
const validUrl=(raw,affiliate=false)=>{
 try{const url=new URL(String(raw||""));
  const domains=affiliate?["shopee.vn","www.shopee.vn","shope.ee","s.shopee.vn","vn.shp.ee"]:["shopee.vn","www.shopee.vn"];
  return url.protocol==="https:"&&!url.username&&!url.password&&domains.includes(url.hostname.toLowerCase())?url.href:null;
 }catch{return null}
};
const keywords=config=>{
 const raw=Array.isArray(config?.shopee_keywords)?config.shopee_keywords:["chăm sóc da","đồ gia dụng"];
 return [...new Set(raw.map(x=>String(x).replace(/[^\p{L}\p{N} _-]/gu," ").replace(/\s+/g," ").trim().slice(0,60))
   .filter(x=>x.length>=3))].slice(0,3);
};
const score=offer=>{
 const c=rate(offer.commissionRate)||0,r=validNum(offer.ratingStar,5),s=validNum(offer.sales,1e8),p=validNum(offer.priceMin);
 return Math.min(100,Math.max(0,Math.round(Math.min(45,c*160)+(r===null?0:Math.max(0,(r-3)*10))+
   (s===null?0:Math.min(20,Math.log10(s+1)*6))+(p!==null&&p>=30000&&p<=1500000?12:0))));
};
const opportunity=(offer,keyword)=>{
 const item=String(offer?.itemId??"").trim(),shop=String(offer?.shopId??"").trim();
 const name=String(offer?.productName||"").replace(/[\x00-\x1F\x7F]/g," ").replace(/\s+/g," ").trim().slice(0,180);
 const productUrl=validUrl(offer?.productLink),commission=rate(offer?.commissionRate);
 const end=validNum(offer?.periodEndTime,9999999999);
 if(!/^\d+$/.test(item)||!/^\d+$/.test(shop)||name.length<5||!productUrl||commission===null||commission<=0)return null;
 if(end&&end*1000<Date.now())return null;
 return {external_id:shop+":"+item,product_name:name,keyword,product_url:productUrl,
   offer_url:validUrl(offer?.offerLink,true),price_vnd:validNum(offer?.priceMin),
   commission_rate:commission,sales:validNum(offer?.sales,1e8),
   rating:validNum(offer?.ratingStar,5),shop_name:String(offer?.shopName||"").slice(0,150),
   score:score(offer)};
};
async function graphql(query){
 const {id,key}=creds();
 if(!/^[a-zA-Z0-9_-]{2,80}$/.test(id)||key.length<8)
   throw Error("Thiếu SHOPEE_AFFILIATE_APP_ID hoặc SHOPEE_AFFILIATE_SECRET.");
 const payload=JSON.stringify({query}),stamp=String(Math.floor(Date.now()/1000));
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(id+stamp+payload+key));
 const signature=Array.from(new Uint8Array(bytes)).map(n=>n.toString(16).padStart(2,"0")).join("");
 const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json",
     "Authorization":"SHA256 Credential="+id+", Timestamp="+stamp+", Signature="+signature},
   body:payload,signal:AbortSignal.timeout(14000)});
 if(!response.ok)throw Error("Shopee Open API HTTP "+response.status);
 const result=await response.json();
 if(result.errors?.length){
   const e=result.errors[0];
   throw Error("Shopee GraphQL "+String(e?.extensions?.code||e?.code||"")+": "+String(e?.message||"Error").slice(0,120));
 }
 if(!result.data)throw Error("Shopee API không có GraphQL data.");
 return result.data;
}
export function createShopeeAgent({db,traceJob,startTrackedJob,audit,uuid}){
 const getConfig=async uid=>(await db("app_settings?select=config&user_id=eq."+uid+"&limit=1"))?.[0]?.config||{};
 const status=async uid=>{
   const config=await getConfig(uid),{id,key}=creds();
   const rows=await db("shopee_opportunities?select=id,status&user_id=eq."+uid+"&limit=200");
   const configured=/^[a-zA-Z0-9_-]{2,80}$/.test(id)&&key.length>=8;
   return {ok:true,configured,enabled:config.shopee_enabled===true,
     autoImport:config.shopee_auto_import===true,keywords:keywords(config),
     discovered:(rows||[]).length,imported:(rows||[]).filter(x=>x.status==="imported").length};
 };
 const importOffer=async(uid,opportunityId,jobId=null)=>{
   if(!uuid(opportunityId))throw Error("ID cơ hội không hợp lệ.");
   const o=(await db("shopee_opportunities?select=*&id=eq."+opportunityId+"&user_id=eq."+uid+"&limit=1"))?.[0];
   if(!o)throw Error("Không tìm thấy cơ hội Shopee.");
   if(o.status==="rejected")throw Error("Offer đã bị từ chối.");
   if(o.status==="imported"&&o.product_id)return {ok:true,productId:o.product_id,alreadyImported:true};
   if(!validUrl(o.product_url)||Number(o.commission_rate)<=0)throw Error("Offer thiếu link gốc hoặc hoa hồng.");
   let link=validUrl(o.affiliate_url,true);
   if(!link){
     await traceJob(uid,jobId,"create_affiliate_link",80,"Đang yêu cầu Shopee tạo affiliate short link.");
     const query='mutation {generateShortLink(input:{originUrl:'+JSON.stringify(o.product_url)+
       ',subIds:["tai","threads"]}){shortLink}}';
     const data=await graphql(query);
     link=validUrl(data?.generateShortLink?.shortLink,true);
     if(!link)throw Error("Shopee không trả short link hợp lệ.");
     await db("shopee_opportunities?id=eq."+o.id+"&user_id=eq."+uid,
       {method:"PATCH",body:{affiliate_url:link,status:"linked",updated_at:new Date().toISOString()}});
   }
   // Recheck: a previous completed import may have happened in another request.
   const latest=(await db("shopee_opportunities?select=product_id&user_id=eq."+uid+"&id=eq."+o.id+"&limit=1"))?.[0];
   if(latest?.product_id)return {ok:true,productId:latest.product_id,alreadyImported:true};
   const row={user_id:uid,title:o.product_name,
     description:"Sản phẩm Shopee từ offer API. Shop: "+String(o.shop_name||"không xác định")+
       ". Hoa hồng tham khảo: "+(Math.round(Number(o.commission_rate)*10000)/100)+"%. Mức này có thể thay đổi.",
     category:"Shopee Affiliate",price:Math.max(0,Number(o.price_vnd)||0),currency:"VND",
     affiliate_url:link,status:"active"};
   const products=await db("products",{method:"POST",prefer:"return=representation",body:row});
   const productId=products?.[0]?.id;
   if(!productId)throw Error("Không lưu được sản phẩm vào kho tAI.");
   await db("shopee_opportunities?id=eq."+o.id+"&user_id=eq."+uid,
      {method:"PATCH",body:{status:"imported",product_id:productId,updated_at:new Date().toISOString()}});
   await audit(uid,"info","Shopee: đã nhập một sản phẩm với link affiliate được tạo qua Open API.");
   return {ok:true,productId};
 };
 const discover=async(uid,source="manual")=>{
   const jobId=await startTrackedJob(uid,"shopee_discovery",source);
   try{
     const {id,key}=creds();
     if(!id||!key){await traceJob(uid,jobId,"missing_credentials",100,
       "Thiếu App ID/Secret Shopee. Không tạo dữ liệu hoặc link giả.","skipped");
       return {ok:false,configured:false,reason:"missing_credentials",jobId,found:0}}
     const config=await getConfig(uid),terms=keywords(config);
     if(!terms.length){await traceJob(uid,jobId,"no_keywords",100,"Chưa cấu hình từ khóa.","skipped");
       return {ok:false,configured:true,reason:"no_keywords",jobId,found:0}}
     const candidates=new Map();
     for(let i=0;i<terms.length;i++){
       const keyword=terms[i];
       await traceJob(uid,jobId,"shopee_search",10+i*15,"Đang tìm sản phẩm: "+keyword);
       const query="{productOfferV2(keyword:"+JSON.stringify(keyword)+
         ",sortType:5,page:1,limit:10){nodes{itemId shopId productName productLink offerLink commissionRate priceMin sales ratingStar shopName periodEndTime}}}";
       const data=await graphql(query);
       const nodes=data?.productOfferV2?.nodes;
       if(!Array.isArray(nodes))throw Error("Shopee không trả danh sách productOfferV2.nodes.");
       for(const n of nodes){const item=opportunity(n,keyword);
         if(item&&(!candidates.has(item.external_id)||candidates.get(item.external_id).score<item.score))
           candidates.set(item.external_id,item)}
     }
     await traceJob(uid,jobId,"score_offers",60,"Đã chấm điểm "+candidates.size+" offer hợp lệ.");
     let saved=0;
     for(const o of [...candidates.values()].sort((a,b)=>b.score-a.score).slice(0,25)){
       const old=(await db("shopee_opportunities?select=id,status,product_id,affiliate_url&user_id=eq."+uid+
         "&external_id=eq."+encodeURIComponent(o.external_id)+"&limit=1"))?.[0];
       if(old?.status==="rejected")continue;
       await db("shopee_opportunities?on_conflict=user_id,external_id",{
         method:"POST",prefer:"resolution=merge-duplicates",body:{...o,user_id:uid,
           source:"shopee-affiliate-api",fetched_at:new Date().toISOString(),updated_at:new Date().toISOString(),
           ...(old?{id:old.id,status:old.status,product_id:old.product_id,affiliate_url:old.affiliate_url}:{status:"discovered"})}});
       saved++;
     }
     let imported=0,importError=null;
     if(config.shopee_auto_import===true&&saved>0){
       const tops=await db("shopee_opportunities?select=id,score&user_id=eq."+uid+
         "&status=in.(discovered,linked)&order=score.desc&limit=1");
       if(tops?.[0]?.score>=35){
         try{await importOffer(uid,tops[0].id,jobId);imported=1}
         catch(e){importError=String(e.message||e).slice(0,130);
           await traceJob(uid,jobId,"import_warning",90,"Không nhập được sản phẩm: "+importError)}
       }
     }
     await traceJob(uid,jobId,"completed",100,
       "Đã lưu "+saved+" offer; nhập "+imported+" sản phẩm xác minh link.","completed");
     return {ok:true,configured:true,found:candidates.size,saved,imported,importError,jobId};
   }catch(e){
     await traceJob(uid,jobId,"failed",100,"Shopee discovery thất bại: "+String(e.message||e).slice(0,180),"failed");
     throw e;
   }
 };
 const daily=async()=>{
   const entries=await db("app_settings?select=user_id,config&limit=100"),results=[];
   for(const e of (entries||[]).filter(x=>x.config?.shopee_enabled===true).slice(0,10)){
     if(!(await db("tai_admins?select=user_id&user_id=eq."+e.user_id+"&limit=1"))?.length)continue;
     try{results.push(await discover(e.user_id,"cron"))}
     catch(err){results.push({ok:false,error:String(err.message||err).slice(0,120)})}
   }
   return {ok:true,results};
 };
 const reject=async(uid,id)=>{
   if(!uuid(id))throw Error("ID cơ hội không hợp lệ.");
   await db("shopee_opportunities?id=eq."+id+"&user_id=eq."+uid+"&status=neq.imported",
     {method:"PATCH",body:{status:"rejected",updated_at:new Date().toISOString()}});
   return {ok:true};
 };
 return {status,discover,daily,importOffer,reject};
}
