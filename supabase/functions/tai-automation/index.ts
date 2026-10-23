// tAI: authenticated, owner-only AI draft + Upload-Post Hosted MCP adapter.
// Secrets: GEMINI_API_KEY, GROQ_API_KEY, UPLOAD_POST_API_KEY; NEVER pass secrets to browsers.
// Start-up safety: creates drafts only. Publishing requires a separate explicit request.
const BASE = Deno.env.get("SUPABASE_URL") ?? "";
function getPublicKey() { try { return JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""; } catch { return Deno.env.get("SUPABASE_ANON_KEY") ?? ""; } }
function getSecretKey() { try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""; } catch { return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""; } }
const originAllowed = (o) => !o || o === "https://tai-console.pages.dev" || o === "https://tai-console-preview.luudinhthetai741.workers.dev";
function cors(origin) { return { "Access-Control-Allow-Origin":originAllowed(origin) && origin ? origin : "https://tai-console.pages.dev", "Access-Control-Allow-Headers":"authorization,apikey,content-type", "Access-Control-Allow-Methods":"POST,OPTIONS", "Vary":"Origin" }; }
function result(body, code=200, origin="") { return new Response(JSON.stringify(body), {status:code,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...cors(origin)}}); }
const uuid = (x) => typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
function secretHeaders() { const k=getSecretKey(); if(!k)throw Error("Supabase server secret unavailable"); return {"apikey":k,...(k.startsWith("eyJ")?{"Authorization":"Bearer "+k}:{})}; }
async function db(path,{method="GET",body,prefer}={}) {
  const h={...secretHeaders(), ...(body!==undefined?{"Content-Type":"application/json"}:{}), ...(prefer?{"Prefer":prefer}:{})};
  const res=await fetch(BASE+"/rest/v1/"+path,{method,headers:h,...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const text=await res.text();let value=null;try{value=text?JSON.parse(text):null}catch{}
  if(!res.ok)throw Error("DB "+res.status+": "+String(value?.message||text).slice(0,160));
  return value;
}
async function requireOwner(req) {
  const bearer=req.headers.get("Authorization")||"";
  if(!bearer.startsWith("Bearer ")||bearer.length<30)throw Object.assign(Error("Đăng nhập Supabase để tiếp tục."),{status:401});
  const pub=getPublicKey(); if(!pub)throw Error("Supabase public key unavailable");
  const resp=await fetch(BASE+"/auth/v1/user",{headers:{"apikey":pub,"Authorization":bearer},signal:AbortSignal.timeout(9000)});
  if(!resp.ok)throw Object.assign(Error("Phiên đăng nhập không hợp lệ."),{status:401});
  const u=await resp.json();if(!uuid(u.id))throw Object.assign(Error("Invalid account"),{status:401});
  const admins=await db("tai_admins?select=user_id&user_id=eq."+encodeURIComponent(u.id)+"&limit=1");
  if(!Array.isArray(admins)||admins.length!==1)throw Object.assign(Error("Tài khoản chưa được cấp quyền quản trị tAI."),{status:403});
  return u.id;
}
async function audit(uid,level,event,postId) {
  try{await db("job_logs",{method:"POST",body:{user_id:uid,level,event:String(event).slice(0,600),...(postId?{post_id:postId}:{})}})}catch(e){console.error("audit_error",String(e).slice(0,150))}
}
function mcpParse(text) {
  let raw;
  try{raw=JSON.parse(text)}catch{
    const parts=text.split(/\r?\n/).filter(l=>l.startsWith("data:")).map(l=>l.slice(5).trim()).filter(x=>x&&x!=="[DONE]");
    for(const t of parts.reverse()){try{const j=JSON.parse(t);if(j.result||j.error){raw=j;break}}catch{}}
  }
  if(!raw)throw Error("MCP response not JSON");
  if(raw.error)throw Error("MCP: "+String(raw.error.message||"remote error").slice(0,180));
  if(raw.result?.isError)throw Error("MCP tool failed: "+JSON.stringify(raw.result.content||[]).slice(0,180));
  let x=raw.result?.structuredContent ?? raw.result ?? raw;
  if(Array.isArray(x?.content)){
    const t=x.content.find(c=>c.type==="text")?.text;
    if(t){try{return JSON.parse(t)}catch{return {message:t}}}
  }
  return x;
}
async function mcpCall(tool,args) {
  const key=Deno.env.get("UPLOAD_POST_API_KEY");if(!key)throw Object.assign(Error("UPLOAD_POST_API_KEY chưa được cấu hình."),{status:503});
  let session="";
  async function send(message) {
    const h={"Authorization":"ApiKey "+key,"Content-Type":"application/json","Accept":"application/json, text/event-stream","MCP-Protocol-Version":"2025-06-18"};
    if(session)h["Mcp-Session-Id"]=session;
    const res=await fetch("https://mcp.upload-post.com/mcp",{method:"POST",headers:h,body:JSON.stringify(message),signal:AbortSignal.timeout(15000)});
    if(res.headers.get("mcp-session-id"))session=res.headers.get("mcp-session-id");
    const text=await res.text();if(!res.ok)throw Error("MCP HTTP "+res.status+": "+text.slice(0,160));
    return text?mcpParse(text):null;
  }
  await send({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"tai-supabase",version:"1.0.0"}}});
  if(session)await send({jsonrpc:"2.0",method:"notifications/initialized"});
  return await send({jsonrpc:"2.0",id:2,method:"tools/call",params:{name:tool,arguments:args}});
}
// Resolve model availability at runtime; old Gemini 2.5 models may return 404 to newly provisioned keys.
// Default to Flash-Lite models with free-tier availability, without changing account billing settings.
async function availableGeminiModels(key) {
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",{
    headers:{"x-goog-api-key":key},
    signal:AbortSignal.timeout(9000)
  });
  if(!r.ok)throw Error("Gemini models.list HTTP "+r.status);
  const data=await r.json();
  return new Set((data.models||[])
    .filter(m=>Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes("generateContent"))
    .map(m=>String(m.name||"").replace(/^models\//,"")));
}
async function generateAI(prompt,priority="gemini") {
  const gemini=Deno.env.get("GEMINI_API_KEY");
  const groq=Deno.env.get("GROQ_API_KEY");
  const errors=[];
  const providers=priority==="groq"?["groq","gemini"]:["gemini","groq"];
  for(const provider of providers) {
    if(provider==="gemini"&&gemini) {
      // A manually configured model is attempted first only when it is in the accessible model catalogue.
      const configured=String(Deno.env.get("GEMINI_MODEL")||"").replace(/^models\//,"").trim();
      const choices=[configured,"gemini-3.5-flash-lite","gemini-3.1-flash-lite"]
        .filter((name,i,items)=>name&&/^[a-z0-9._-]+$/.test(name)&&items.indexOf(name)===i);
      let accessible=null;
      try{accessible=await availableGeminiModels(gemini)}
      catch(e){errors.push("Gemini model listing: "+String(e.message).slice(0,85))}
      const models=accessible&&accessible.size>0?choices.filter(m=>accessible.has(m)):choices;
      if(!models.length)errors.push("Gemini: key does not list supported Flash-Lite text models");
      for(const model of models.slice(0,3)) {
        try {
          const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{
            method:"POST",
            headers:{"Content-Type":"application/json","x-goog-api-key":gemini},
            body:JSON.stringify({
              contents:[{parts:[{text:prompt}]}],
              generationConfig:{temperature:0.7,maxOutputTokens:2048}
            }),
            signal:AbortSignal.timeout(20000)
          });
          if(!r.ok) {
            errors.push("Gemini "+model+": HTTP "+r.status);
            // Do not burn the quota by retrying other models if quota was exhausted.
            if(r.status===429)break;
            continue;
          }
          const j=await r.json();
          const text=j.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
          if(text)return {text,provider:"Gemini ("+model+")"};
          errors.push("Gemini "+model+": empty text response");
        } catch(e) {
          errors.push("Gemini "+model+": "+String(e?.name==="TimeoutError"?"timeout":e?.message||e).slice(0,90));
        }
      }
    }
    if(provider==="groq"&&groq)try {
      const model=Deno.env.get("GROQ_MODEL")||"llama-3.3-70b-versatile";
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+groq},
        body:JSON.stringify({model,messages:[{role:"user",content:prompt}],temperature:0.7,max_tokens:750}),
        signal:AbortSignal.timeout(16000)
      });
      if(!r.ok)throw Error("HTTP "+r.status);
      const j=await r.json();
      const text=j.choices?.[0]?.message?.content?.trim();
      if(text)return {text,provider:"Groq"};
      throw Error("Empty Groq response");
    }catch(e){errors.push("Groq: "+String(e.message).slice(0,100))}
  }
  if(!gemini&&!groq)throw Object.assign(Error("Chưa cấu hình GEMINI_API_KEY hoặc GROQ_API_KEY trong Supabase Secrets."),{status:503});
  throw Object.assign(Error("Không thể tạo nội dung AI. "+errors.join("; ").slice(0,350)),{status:503});
}
async function actionGenerate(uid,body) {
  if(!uuid(body.productId))throw Object.assign(Error("Thiếu productId hợp lệ."),{status:400});
  const products=await db("products?select=*&id=eq."+body.productId+"&user_id=eq."+uid+"&limit=1");
  const p=products?.[0];if(!p||p.status!=="active")throw Object.assign(Error("Sản phẩm không tồn tại hoặc đang tắt."),{status:404});
  const settings=await db("app_settings?select=config&user_id=eq."+uid+"&limit=1");
  const userPrompt=String(settings?.[0]?.config?.prompt||"").slice(0,1200);
  const prompt=["Viết bài tiếng Việt đăng Threads tối đa 390 ký tự trước phần link và disclosure.",
    "Chỉ dùng thông tin sản phẩm được cung cấp, không bịa giá, trải nghiệm, bảo hành hoặc review.",
    "Giọng tự nhiên, thu hút, không spam, không hashtag tràn lan.",
    "Không tự chèn đường link. Trả đúng duy nhất nội dung bài viết, không chú thích.",
    "Tên: "+p.title,"Mô tả: "+String(p.description||"").slice(0,1200),
    "Giá tham khảo: "+(Number(p.price)>0?Number(p.price)+" "+p.currency:"không có giá xác nhận"),
    userPrompt?"Nguyên tắc bổ sung: "+userPrompt:""].join("\n");
  const ai=await generateAI(prompt, String(settings?.[0]?.config?.model||'gemini'));
  let text=ai.text.replace(/^["'“]|["'”]$/g,"").trim();
  const url=String(p.affiliate_url||"").trim();if(url){let u;try{u=new URL(url)}catch{}if(!u||!["http:","https:"].includes(u.protocol))throw Object.assign(Error("Link affiliate không hợp lệ."),{status:422})}
  const suffix="\n\nLiên kết tiếp thị"+(url?": "+url:".");
  if(Array.from(text+suffix).length>500)text=Array.from(text).slice(0,Math.max(0,500-Array.from(suffix).length)).join("").trim();
  const finalText=text+suffix;
  if(!text||Array.from(finalText).length>500)throw Error("AI content exceeds Threads length");
  const rows=await db("posts",{method:"POST",prefer:"return=representation",body:{user_id:uid,product_id:p.id,content:finalText,status:"draft",provider:ai.provider}});
  await audit(uid,"info","Đã tạo bản nháp AI; đang chờ người quản trị duyệt.",rows?.[0]?.id);
  return {ok:true,draft:rows?.[0],note:"Chưa đăng Threads; cần duyệt trước."};
}
async function actionPublish(uid,body) {
  if(!uuid(body.postId)||body.confirm!==true)throw Object.assign(Error("Cần postId và confirm=true để đăng bài."),{status:400});
  if(!Deno.env.get("UPLOAD_POST_API_KEY"))throw Object.assign(Error("Chưa có UPLOAD_POST_API_KEY ở Supabase Secrets."),{status:503});
  const rows=await db("posts?select=*&id=eq."+body.postId+"&user_id=eq."+uid+"&limit=1");
  const p=rows?.[0];
  if(!p||!["draft","scheduled"].includes(p.status)||p.upload_post_request_id)throw Object.assign(Error("Bài không hợp lệ hoặc đã được gửi đi."),{status:409});
  if(Array.from(p.content).length>500||!p.content.includes("Liên kết tiếp thị"))throw Object.assign(Error("Bài đăng cần tối đa 500 ký tự và disclosure affiliate."),{status:422});
  const locked=await db("posts?id=eq."+p.id+"&user_id=eq."+uid+"&status=in.(draft,scheduled)&upload_post_request_id=is.null",{method:"PATCH",prefer:"return=representation",body:{status:"processing",attempts:p.attempts+1,last_error:null}});
  if(locked?.length!==1)throw Object.assign(Error("Bài đang xử lý bởi phiên khác."),{status:409});
  try{
    const response=await mcpCall("upload_text",{title:p.content,user:Deno.env.get("UPLOAD_POST_PROFILE")||"default",platforms:["threads"],asyncUpload:true});
    const rid=response?.request_id||response?.requestId||response?.data?.request_id||null;
    const jid=response?.job_id||response?.jobId||null;
    await db("posts?id=eq."+p.id+"&user_id=eq."+uid,{method:"PATCH",body:{status:rid?"processing":"paused",upload_post_request_id:rid,upload_post_job_id:jid,last_error:rid?null:"Đã gửi MCP nhưng không nhận request_id; cần kiểm tra thủ công trước khi thử lại."}});
    await audit(uid,"info","Đã gửi tới Upload-Post MCP; chờ đối soát kết quả.",p.id);
    return {ok:true,postId:p.id,requestId:rid,state:rid?"processing":"reconciliation_required",note:"Không tự động gửi lại bài khi kết quả bất định."};
  }catch(e){
    await db("posts?id=eq."+p.id+"&user_id=eq."+uid,{method:"PATCH",body:{status:"paused",last_error:"MCP result uncertain: "+String(e.message).slice(0,250)}});
    await audit(uid,"warning","MCP không xác nhận được kết quả; tạm dừng, không retry.",p.id);
    throw Object.assign(Error("Kết quả từ Upload-Post chưa rõ. Đã tạm dừng bài để tránh đăng trùng."),{status:502});
  }
}
async function actionReconcile(uid,body) {
  if(!uuid(body.postId))throw Object.assign(Error("Invalid postId"),{status:400});
  const p=(await db("posts?select=*&id=eq."+body.postId+"&user_id=eq."+uid+"&limit=1"))?.[0];
  if(!p?.upload_post_request_id)throw Object.assign(Error("Bài chưa có request_id để đối soát."),{status:409});
  const remote=await mcpCall("get_status",{requestId:p.upload_post_request_id});
  const remoteStatus=String(remote?.status||remote?.data?.status||"unknown").toLowerCase();
  const target=remoteStatus==="success"?"published":remoteStatus==="failed"?"failed":"processing";
  await db("posts?id=eq."+p.id+"&user_id=eq."+uid,{method:"PATCH",body:{status:target,...(target==="published"?{published_at:new Date().toISOString()}:{}),...(target==="failed"?{last_error:JSON.stringify(remote).slice(0,450)}:{})}});
  await audit(uid,target==="failed"?"error":"info","Đối soát Upload-Post: "+remoteStatus,p.id);
  return {ok:true,postId:p.id,status:target,remoteStatus,remote};
}
Deno.serve(async(req)=>{
  const origin=req.headers.get("Origin")||"";
  if(!originAllowed(origin))return result({error:"Origin not allowed"},403,origin);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return result({error:"Use POST"},405,origin);
  let activeUser=null;
  let activeAction="";
  try{
    const uid=await requireOwner(req);
    activeUser=uid;
    const size=Number(req.headers.get("content-length")||0);if(size>12000)throw Object.assign(Error("Payload too large"),{status:413});
    const body=await req.json();const action=String(body?.action||"");
    activeAction=action;
    if(action==="status")return result({ok:true,admin:true,mode:"review-first",providers:{gemini:!!Deno.env.get("GEMINI_API_KEY"),groq:!!Deno.env.get("GROQ_API_KEY"),uploadPost:!!Deno.env.get("UPLOAD_POST_API_KEY")},uploadProfile:Deno.env.get("UPLOAD_POST_PROFILE")||"default"},200,origin);
    if(action==="generate")return result(await actionGenerate(uid,body),200,origin);
    if(action==="publish")return result(await actionPublish(uid,body),202,origin);
    if(action==="reconcile")return result(await actionReconcile(uid,body),200,origin);
    return result({error:"Unknown action"},400,origin);
  }catch(e){
    const safeError=String(e?.message||"Request failed")
      .replace(/Bearer\s+\S+/gi,"Bearer [redacted]")
      .replace(/(?:sb_secret_|AIza)[A-Za-z0-9_-]+/g,"[redacted]")
      .slice(0,220);
    console.error("tai-api",activeAction||"request",safeError);
    // Only authenticated admins can create activity records. Never log tokens, prompts or credentials.
    if(activeUser&&["generate","publish","reconcile"].includes(activeAction)){
      await audit(activeUser,"error",
        (activeAction==="generate"?"Tạo bài AI":activeAction==="publish"?"Đăng Threads":"Đối soát Threads")+" thất bại: "+safeError);
    }
    return result({error:safeError},e?.status||500,origin)
  }
});
