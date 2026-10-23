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
  let prompt=["Viết bài tiếng Việt đăng Threads tối đa 390 ký tự trước phần link và disclosure.",
    "Chỉ dùng thông tin sản phẩm được cung cấp, không bịa giá, trải nghiệm, bảo hành hoặc review.",
    "Giọng tự nhiên, thu hút, không spam, không hashtag tràn lan.",
    "Không tự chèn đường link. Trả đúng duy nhất nội dung bài viết, không chú thích.",
    "Tên: "+p.title,"Mô tả: "+String(p.description||"").slice(0,1200),
    "Giá tham khảo: "+(Number(p.price)>0?Number(p.price)+" "+p.currency:"không có giá xác nhận"),
    userPrompt?"Nguyên tắc bổ sung: "+userPrompt:""].join("\n");
  if(body.context)prompt+= "\nNgữ cảnh liên quan (không coi là thông tin sản phẩm đã xác minh): "+String(body.context).slice(0,1100);
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
    const rid=response?.request_id||response?.requestId||response?.data?.request_id||
      response?.result?.request_id||response?.result?.data?.request_id||null;
    const jid=response?.job_id||response?.jobId||response?.data?.job_id||
      response?.result?.job_id||null;
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
  const results=remote?.results||remote?.data?.results||[];
  const threads=Array.isArray(results)?results.filter(x=>x.platform==="threads"):[];
  const target=(threads.some(x=>x.success===true)||remoteStatus==="success")
    ?"published":(threads.some(x=>x.success===false)||remoteStatus==="failed")
    ?"failed":"processing";
  await db("posts?id=eq."+p.id+"&user_id=eq."+uid,{method:"PATCH",body:{status:target,...(target==="published"?{published_at:new Date().toISOString()}:{}),...(target==="failed"?{last_error:JSON.stringify(remote).slice(0,450)}:{})}});
  await audit(uid,target==="failed"?"error":"info","Đối soát Upload-Post: "+remoteStatus,p.id);
  return {ok:true,postId:p.id,status:target,remoteStatus,remote};
}

/* Autonomous tAI, conservative Free-tier schedule: max one generated draft per UTC day.
   Does not post unless the admin explicitly enables both agent_mode=publish and auto_publish.
   A durable run row prevents duplicate generation on overlapping ticks. */
const SAFE_PRODUCT_HOST = (u)=>{
  try{
    const x=new URL(u);
    const h=x.hostname.toLowerCase();
    return x.protocol==="https:" && !!h && h.includes(".") &&
      !/(^|\.)((?:test|example|localhost|invalid|local)\.(?:com|org|net|test)|localhost)$/.test(h) &&
      !/^(127\.|10\.|192\.168\.)/.test(h) &&
      !/(^|\.)example\.(com|net|org)$/.test(h);
  }catch{return false}
};
const isSafeProduct=p=>p?.status==="active" && typeof p.title==="string" &&
  !/\b(?:test|demo|fake|mock)\b/i.test(p.title) && SAFE_PRODUCT_HOST(String(p.affiliate_url||""));
const dateSlot=()=>new Date().toISOString().slice(0,10);
async function requireCron(req){
  const token=req.headers.get("x-tai-cron")||"";
  if(!/^[0-9a-f]{64}$/.test(token))throw Object.assign(Error("Invalid scheduler token"),{status:401});
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));
  const actual=Array.from(digest).map(b=>b.toString(16).padStart(2,"0")).join("");
  const rows=await db("tai_scheduler_auth?select=secret_sha256&id=eq.1&limit=1");
  const expected=rows?.[0]?.secret_sha256||"";
  let diff=actual.length===expected.length?0:1;
  for(let i=0;i<64;i++)diff|=(actual.charCodeAt(i)||0)^(expected.charCodeAt(i)||0);
  if(diff!==0)throw Object.assign(Error("Scheduler authentication failed"),{status:401});
}
function safeRunNote(message){return String(message||"").slice(0,380).replace(/(?:AIza|sb_secret_)[A-Za-z0-9_-]+/g,"[redacted]")}
async function updateAgentRun(runId,data){
  await db("agent_runs?id=eq."+runId,{method:"PATCH",body:data});
}
async function tickUser(uid,config){
  if(config?.agent_enabled!==true)return {skipped:"agent_disabled"};
  const limit=Math.min(1,Math.max(0,Number(config.daily_limit??1)));
  if(limit<1)return {skipped:"daily_limit_zero"};
  const slot=dateSlot();
  const mode=config?.agent_mode==="publish"?"publish":"draft";
  const claimed=await db("agent_runs?on_conflict=user_id,slot_date",{
    method:"POST",prefer:"resolution=ignore-duplicates,return=representation",
    body:{user_id:uid,slot_date:slot,mode,status:"running"}
  });
  if(!claimed?.length)return {skipped:"already_run_today"};
  const run=claimed[0];let selected=null;
  try{
    const products=await db("products?select=*&user_id=eq."+uid+"&status=eq.active&limit=200");
    const safe=(products||[]).filter(isSafeProduct);
    if(!safe.length){
      await updateAgentRun(run.id,{status:"skipped",note:"Không có sản phẩm thật với HTTPS affiliate URL hợp lệ. Bỏ qua để tránh nội dung thử nghiệm.",finished_at:new Date().toISOString()});
      await audit(uid,"warning","Agent bỏ qua: chưa có sản phẩm affiliate thật (không dùng link demo/test).");
      return {skipped:"no_safe_products",runId:run.id};
    }
    // Rotate products; use historical performance as a low-sample signal, not a false claim of learning.
    const recent=await db("posts?select=product_id,content,views,likes,replies,reposts,status,created_at&user_id=eq."+uid+"&order=created_at.desc&limit=40");
    const counts=new Map(),scores=new Map();
    for(const post of recent||[]){
      if(!post.product_id)continue;
      counts.set(post.product_id,(counts.get(post.product_id)||0)+1);
      if(post.status==="published"&&Number(post.views)>25){
        const rate=(Number(post.likes||0)+Number(post.replies||0)+Number(post.reposts||0))/Math.max(1,Number(post.views));
        scores.set(post.product_id,(scores.get(post.product_id)||0)+Math.min(0.2,rate));
      }
    }
    safe.sort((a,b)=>{
      const ca=counts.get(a.id)||0,cb=counts.get(b.id)||0;
      return (ca*2-(scores.get(a.id)||0)*5)-(cb*2-(scores.get(b.id)||0)*5) ||
        a.id.localeCompare(b.id);
    });
    selected=safe[0];
    const avoidance=(recent||[]).slice(0,5).map(p=>String(p.content||"").slice(0,70)).join(" | ");
    const context="Bạn đang là AI Content Agent tự chủ của tAI. Mục tiêu: nội dung có ích, chính xác, không trùng bài trước. "+
      "Các mở bài gần nhất cần tránh lặp: "+avoidance.slice(0,500)+
      ". Không tự nhận đã trải nghiệm hoặc kiểm chứng sản phẩm; thông tin sản phẩm do người quản trị cung cấp.";
    const result=await actionGenerate(uid,{productId:selected.id,context});
    const draft=result?.draft;
    if(!draft?.id)throw Error("AI returned no saved draft");
    const approved=String(draft.content||"").includes("Liên kết tiếp thị") &&
      Array.from(String(draft.content||"")).length<=500 && SAFE_PRODUCT_HOST(selected.affiliate_url);
    if(!approved)throw Error("Nội dung AI không qua kiểm tra độ dài/disclosure/link");
    await updateAgentRun(run.id,{product_id:selected.id,post_id:draft.id,status:"completed",note:"Đã tạo và kiểm tra bản nháp tự động.",finished_at:new Date().toISOString()});
    const auto=(mode==="publish"&&config.auto_publish===true&&config.require_review===false);
    if(!auto)return {ok:true,mode:"draft",runId:run.id,postId:draft.id};
    if(!Deno.env.get("UPLOAD_POST_API_KEY")){
      await audit(uid,"warning","Agent có bản nháp nhưng chưa có Upload-Post API key; dừng trước bước đăng.",draft.id);
      return {ok:true,mode:"draft",runId:run.id,postId:draft.id,reason:"upload_post_secret_missing"};
    }
    try{
      const pub=await actionPublish(uid,{postId:draft.id,confirm:true});
      await audit(uid,"info","Agent tự gửi bản nháp đã kiểm tra lên Threads; chờ đối soát.",draft.id);
      return {ok:true,mode:"publish",runId:run.id,postId:draft.id,publisher:pub.state};
    }catch(e){
      await audit(uid,"error","Agent ngừng xuất bản: "+safeRunNote(e.message),draft.id);
      return {ok:true,mode:"draft",runId:run.id,postId:draft.id,publishError:safeRunNote(e.message)};
    }
  }catch(e){
    await updateAgentRun(run.id,{product_id:selected?.id||null,status:"failed",note:safeRunNote(e.message),finished_at:new Date().toISOString()});
    await audit(uid,"error","Agent tự chạy thất bại: "+safeRunNote(e.message));
    return {ok:false,runId:run.id,error:safeRunNote(e.message)};
  }
}
async function agentTick(uidFilter=null){
  const settings=await db("app_settings?select=user_id,config&limit=200");
  const relevant=(settings||[]).filter(x=>x.config?.agent_enabled===true&&(!uidFilter||x.user_id===uidFilter));
  // Sequential to keep Free-tier AI requests bounded.
  const results=[];
  for(const setting of relevant.slice(0,10)){
    const allowed=await db("tai_admins?select=user_id&user_id=eq."+setting.user_id+"&limit=1");
    if(!allowed?.length)continue;
    results.push(await tickUser(setting.user_id,setting.config));
  }
  return {ok:true,checked:relevant.length,results};
}
async function agentReconcileAndAnalyze(uidFilter=null){
  const settings=await db("app_settings?select=user_id,config&limit=200");
  const results=[];
  for(const setting of (settings||[]).filter(x=>x.config?.agent_enabled===true&&(!uidFilter||x.user_id===uidFilter)).slice(0,10)){
    const uid=setting.user_id;
    if(!(await db("tai_admins?select=user_id&user_id=eq."+uid+"&limit=1"))?.length)continue;
    const pending=await db("posts?select=id,upload_post_request_id&user_id=eq."+uid+"&status=eq.processing&upload_post_request_id=not.is.null&limit=8");
    for(const post of pending||[]){
      try{await actionReconcile(uid,{postId:post.id})}catch(e){await audit(uid,"warning","Tự đối soát Upload-Post lỗi: "+safeRunNote(e.message),post.id)}
    }
    const published=await db("posts?select=id,product_id,views,likes,replies,reposts,upload_post_request_id&user_id=eq."+uid+"&status=eq.published&order=published_at.desc&limit=12");
    const rates=[];
    for(const post of published||[]){
      if(!post.upload_post_request_id)continue;
      try{
        const remote=await mcpCall("get_post_analytics",{requestId:post.upload_post_request_id});
        const details=remote?.platforms?.threads||remote?.post_metrics?.threads||remote?.post_metrics||{};
        if(details?.post_metrics_error)continue;
        const m=details?.metrics||details;
        const views=Number(m.views??m.impressions??m.view_count);
        const likes=Number(m.likes??m.like_count);
        const replies=Number(m.replies??m.comments);
        const reposts=Number(m.reposts??m.shares);
        const body={};
        if(Number.isFinite(views)&&views>=0)body.views=Math.round(views);
        if(Number.isFinite(likes)&&likes>=0)body.likes=Math.round(likes);
        if(Number.isFinite(replies)&&replies>=0)body.replies=Math.round(replies);
        if(Number.isFinite(reposts)&&reposts>=0)body.reposts=Math.round(reposts);
        if(Object.keys(body).length){
          await db("posts?id=eq."+post.id+"&user_id=eq."+uid,{method:"PATCH",body});
          if(body.views>0)rates.push((body.likes||0)+(body.replies||0)+(body.reposts||0))/body.views;
        }
      }catch(e){console.error("agent-analytics",safeRunNote(e.message))}
    }
    const count=(published||[]).length;
    const mean=rates.length?Math.round(10000*rates.reduce((a,b)=>a+b,0)/rates.length)/100:0;
    await db("agent_memory?on_conflict=user_id",{method:"POST",prefer:"resolution=merge-duplicates",
      body:{user_id:uid,metrics:{observed_published_posts:count,engagement_rate_percent:mean,samples_with_metrics:rates.length,last_analyzed_at:new Date().toISOString()}}});
    results.push({user_id:uid,reconciled:pending?.length||0,published:count,metrics_samples:rates.length});
  }
  return {ok:true,results};
}

Deno.serve(async(req)=>{
  const origin=req.headers.get("Origin")||"";
  if(!originAllowed(origin))return result({error:"Origin not allowed"},403,origin);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return result({error:"Use POST"},405,origin);
  // Scheduler token is verified against a hash stored in a server-only table.
  // A browser cannot list this hash or obtain the encrypted Vault secret.
  if(req.headers.has("x-tai-cron")){
    try{
      await requireCron(req);
      const job=await req.json();
      if(job.action==="agent-tick")return result(await agentTick(),200,origin);
      if(job.action==="agent-analyze")return result(await agentReconcileAndAnalyze(),200,origin);
      return result({error:"Invalid cron action"},400,origin);
    }catch(e){console.error("tai-cron",safeRunNote(e.message));return result({error:"Unauthorized scheduler request"},401,origin)}
  }
  let activeUser=null;
  let activeAction="";
  try{
    const uid=await requireOwner(req);
    activeUser=uid;
    const size=Number(req.headers.get("content-length")||0);if(size>12000)throw Object.assign(Error("Payload too large"),{status:413});
    const body=await req.json();const action=String(body?.action||"");
    activeAction=action;
    if(action==="status")return result({ok:true,admin:true,mode:"review-first",providers:{gemini:!!Deno.env.get("GEMINI_API_KEY"),groq:!!Deno.env.get("GROQ_API_KEY"),uploadPost:!!Deno.env.get("UPLOAD_POST_API_KEY")},uploadProfile:Deno.env.get("UPLOAD_POST_PROFILE")||"default"},200,origin);
    if(action==="agent-tick")return result(await agentTick(uid),200,origin);
    if(action==="agent-analyze")return result(await agentReconcileAndAnalyze(uid),200,origin);
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
