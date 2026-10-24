/**
 * tAI Console • Cloudflare Pages frontend
 * Vanilla JS, no build, no third-party scripts.
 * Backend contracts: Supabase PostgREST + GoTrue. Publishing is intentionally server-only.
 */
const iconPaths = {
 layout:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 'file-text':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h8"/>',
 package:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10"/>',chart:'<path d="M3 3v18h18"/><path d="m6 15 4-5 4 3 6-8"/>',sparkles:'<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/>',settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2 2-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.52V21h-3v-.09a1.65 1.65 0 0 0-1-1.52 1.65 1.65 0 0 0-1.82.33l-.06.06-2-2 .06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.52-1H6v-3h.09a1.65 1.65 0 0 0 1.52-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 2-2 .06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.52V6h3v.09a1.65 1.65 0 0 0 1 1.52 1.65 1.65 0 0 0 1.82-.33l.06-.06 2 2-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.52 1H21v3h-.09A1.65 1.65 0 0 0 19.4 15Z" transform="translate(-1 -1)"/>',zap:'<polygon points="13 2 3 14 11 14 10 22 21 10 13 10 13 2"/>','arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>','arrow-right':'<path d="M5 12h14m-6-6 6 6-6 6"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>','refresh-cw':'<path d="M20 11a8 8 0 0 0-14-5L4 8m0-5v5h5M4 13a8 8 0 0 0 14 5l2-2m0 5v-5h-5"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>','shield-check':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>','check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',trending:'<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>',arrow:'<path d="m9 18 6-6-6-6"/>',external:'<path d="M13 5h6v6M19 5l-9 9M19 13v6H5V5h6"/>','log-out':'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',link:'<path d="M10 13a5 5 0 0 0 7 .4l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.4l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',activity:'<path d="M2 12h4l3-8 6 16 3-8h4"/>','bar-chart':'<path d="M4 20V9M10 20V4M16 20v-7M22 20v-11"/>',lock:'<rect x="4" y="11" width="16" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',wifi:'<path d="M2 9a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 15a6 6 0 0 1 8 0M12 19h.01"/>',upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 2 18 2 18 0V5M3 12c0 3 18 3 18 0"/>',bot:'<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4M9 3h6M8 13h.01M16 13h.01M9 17h6"/>',pause:'<rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/>',play:'<path d="m7 4 14 8-14 8V4Z"/>'
};
const svg=(name,extra='')=>`<svg ${extra} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.info}</svg>`;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('vi-VN',{notation:n>=10000?'compact':'standard',maximumFractionDigits:1}).format(n||0);
const dateFmt=s=>s?new Date(s).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}):'—';
const demoPosts=[
 {id:'d1',content:'Bàn phím cơ gọn đẹp cho góc làm việc — 3 điểm mình thích nhất sau một tuần sử dụng.',status:'published',provider:'Gemini',views:4230,likes:142,replies:18,reposts:8,published_at:'2026-10-23T09:20:00+07:00',created_at:'2026-10-23T09:10:00+07:00'},
 {id:'d2',content:'5 món đồ setup góc học tập dưới 500K đáng cân nhắc.',status:'published',provider:'Groq',views:3190,likes:94,replies:13,reposts:9,published_at:'2026-10-22T19:20:00+07:00',created_at:'2026-10-22T18:20:00+07:00'},
 {id:'d3',content:'Tai nghe chống ồn có đáng mua khi học ở thư viện?',status:'scheduled',provider:'Gemini',views:0,likes:0,replies:0,reposts:0,scheduled_at:'2026-10-25T12:00:00+07:00',created_at:'2026-10-24T00:10:00+07:00'},
 {id:'d4',content:'Những phụ kiện công nghệ mình sẽ mua lại lần thứ hai.',status:'draft',provider:'Gemini',views:0,likes:0,replies:0,reposts:0,created_at:'2026-10-23T21:15:00+07:00'},
 {id:'d5',content:'Chuột không dây nhỏ gọn cho laptop và học tập.',status:'published',provider:'Gemini',views:2940,likes:76,replies:7,reposts:4,published_at:'2026-10-21T12:30:00+07:00',created_at:'2026-10-21T12:00:00+07:00'}
];
const demoProducts=[
 {id:'p1',title:'Bàn phím cơ không dây 75%',category:'Phụ kiện máy tính',price:790000,status:'active',affiliate_url:'https://example.com/demo-keyboard'},
 {id:'p2',title:'Tai nghe Bluetooth chống ồn',category:'Âm thanh',price:1250000,status:'active',affiliate_url:'https://example.com/demo-headphones'},
 {id:'p3',title:'Đèn LED để bàn tối giản',category:'Góc làm việc',price:329000,status:'active',affiliate_url:'https://example.com/demo-lamp'},
 {id:'p4',title:'Chuột không dây ergonomic',category:'Phụ kiện máy tính',price:459000,status:'active',affiliate_url:'https://example.com/demo-mouse'}
];
const demoLogs=[{id:'l1',event:'Bài viết đã được đăng thành công',level:'info',created_at:'2026-10-23T09:20:00+07:00'},{id:'l2',event:'AI Gemini tạo nội dung mới',level:'info',created_at:'2026-10-23T09:10:00+07:00'},{id:'l3',event:'Đã thêm bài viết vào hàng đợi',level:'info',created_at:'2026-10-23T08:00:00+07:00'},{id:'l4',event:'Kiểm tra kết nối Upload-Post',level:'warning',created_at:'2026-10-22T16:10:00+07:00'}];
const DEFAULTS={model:'gemini',fallback:'groq',daily_limit:1,agent_enabled:false,agent_mode:'draft',auto_publish:false,require_review:true,prompt:'Viết bài Threads affiliate tự nhiên, trung thực, ngắn gọn. Có hook, lợi ích thực tế và lời kêu gọi hành động. Ghi rõ đây là nội dung có liên kết tiếp thị. Không bịa trải nghiệm sử dụng hay giá sản phẩm.'};
const state={page:'overview',period:30,tab:'all',search:'',productsSearch:'',posts:demoPosts,products:demoProducts,logs:demoLogs,settings:{...DEFAULTS},agentRuns:[],jobRuns:[],jobKind:'all',liveSelectedJobId:null,liveSocketStatus:'idle',profileMetrics:null,demo:true,config:readConfig(),session:null,backend:null,loading:false,updated:new Date(),modal:null,logLevel:'all',logSearch:'',logsError:null,logsUpdated:null,logRefreshing:false};
let wsAI=null,wsAIUser='',wsAIHeartbeat=null,wsAIRetry=null,wsAISeq=0,wsAIJoinRef=null;
function isAILiveRoute(){return getPage()==="live"||getPage()==="logs"}
function paintAILive(){
 const root=document.querySelector("#ai-live-root");
 if(root&&isAILiveRoute())root.innerHTML=aiLiveContent();
}
function aiLiveConnectionStatus(status){
 if(state.liveSocketStatus===status)return;
 state.liveSocketStatus=status;paintAILive();
}
function closeAILiveSocket(){
 if(wsAIRetry){clearTimeout(wsAIRetry);wsAIRetry=null}
 if(wsAIHeartbeat){clearInterval(wsAIHeartbeat);wsAIHeartbeat=null}
 const old=wsAI;wsAI=null;wsAIUser="";wsAIJoinRef=null;
 if(old&&old.readyState<=1){try{old.close(1000,"Page inactive")}catch{}}
 state.liveSocketStatus="idle";
}
function liveSend(topic,event,payload,joinRef=null){
 if(!wsAI||wsAI.readyState!==1)return;
 wsAI.send(JSON.stringify({topic,event,payload,ref:String(++wsAISeq),join_ref:joinRef}));
}
function updateLiveAuth(token){
 if(wsAI&&wsAI.readyState===1&&wsAIJoinRef&&token){
   liveSend("realtime:ai-progress-"+wsAIUser,"access_token",{access_token:token},wsAIJoinRef);
 }
}
function mergeAIRealtime(table,record){
 if(!state.session?.user?.id || record?.user_id!==state.session.user.id)return;
 if(table==="job_runs"){
   const old=(state.jobRuns||[]).filter(j=>j.id!==record.id);
   state.jobRuns=[record,...old].sort((a,b)=>Date.parse(b.started_at)-Date.parse(a.started_at)).slice(0,40);
 }else if(table==="job_logs"){
   const old=(state.logs||[]).filter(j=>j.id!==record.id);
   state.logs=[record,...old].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,200);
 }else if(table==="posts"){
   const existing=(state.posts||[]).find(j=>j.id===record.id);
   if(existing){state.posts=state.posts.map(j=>j.id===record.id?{...j,...record}:j)}
   else state.posts=[record,...state.posts];
 }else return;
 state.logsUpdated=new Date();
 paintAILive();
}
async function connectAILiveSocket(){
 if(!isAILiveRoute()||state.demo||!state.session?.user?.id){
   closeAILiveSocket();return;
 }
 const userId=state.session.user.id;
 if(wsAI&&wsAIUser===userId&&wsAI.readyState<=1)return;
 if(!await ensureSession()||!isAILiveRoute()||state.demo)return;
 let socketUrl;
 try{
   const origin=new URL(state.config.url);
   if(origin.protocol!=="https:")throw Error("Invalid Supabase URL");
   socketUrl=new URL("/realtime/v1/websocket",origin);
   socketUrl.protocol="wss:";
   socketUrl.searchParams.set("apikey",state.config.key);
   socketUrl.searchParams.set("vsn","1.0.0");
 }catch{aiLiveConnectionStatus("offline");return}
 closeAILiveSocket();
 aiLiveConnectionStatus("connecting");
 let socket;
 try{socket=new WebSocket(socketUrl.toString())}
 catch{aiLiveConnectionStatus("offline");return}
 wsAI=socket;wsAIUser=userId;
 const topic="realtime:ai-progress-"+userId;
 socket.onopen=()=>{
   if(wsAI!==socket)return;
   const ref=String(++wsAISeq);
   wsAIJoinRef=ref;
   socket.send(JSON.stringify({topic,event:"phx_join",payload:{
     access_token:state.session.access_token,
     config:{private:false,broadcast:{ack:false,self:false},presence:{enabled:false},
       postgres_changes:[
         {event:"*",schema:"public",table:"job_runs",filter:"user_id=eq."+userId},
         {event:"INSERT",schema:"public",table:"job_logs",filter:"user_id=eq."+userId},
         {event:"*",schema:"public",table:"posts",filter:"user_id=eq."+userId}
       ]}
   },ref,join_ref:ref}));
   wsAIHeartbeat=setInterval(()=>liveSend("phoenix","heartbeat",{},null),20000);
 };
 socket.onmessage=event=>{
   if(wsAI!==socket)return;
   let msg;try{msg=JSON.parse(event.data)}catch{return}
   if(msg.event==="phx_reply"&&msg.topic===topic&&msg.ref===wsAIJoinRef){
     if(msg.payload?.status==="ok"){
       aiLiveConnectionStatus("connected");
       // Catch changes between the first REST read and successful subscription.
       fetchActivityLogs().then(()=>paintAILive()).catch(()=>{});
     }else{aiLiveConnectionStatus("offline");socket.close()}
   }else if(msg.event==="postgres_changes"&&msg.topic===topic){
     const d=msg.payload?.data;
     if(d?.table&&d?.record)mergeAIRealtime(d.table,d.record);
   }else if((msg.event==="phx_error"||msg.event==="phx_close")&&msg.topic===topic){
     aiLiveConnectionStatus("offline");socket.close();
   }else if(msg.event==="system"&&msg.payload?.status==="error"){
     aiLiveConnectionStatus("offline");socket.close();
   }
 };
 socket.onerror=()=>{if(wsAI===socket)aiLiveConnectionStatus("offline")};
 socket.onclose=()=>{
   if(wsAI!==socket)return;
   wsAI=null;wsAIJoinRef=null;
   if(wsAIHeartbeat){clearInterval(wsAIHeartbeat);wsAIHeartbeat=null}
   aiLiveConnectionStatus("offline");
   if(isAILiveRoute()&&state.session&&!state.demo&&!wsAIRetry){
     wsAIRetry=setTimeout(()=>{wsAIRetry=null;connectAILiveSocket()},5000);
   }
 };
}
function readConfig(){const defaults={url:'https://idovyelypzisdngfcecc.supabase.co',key:'sb_publishable_kaFpG58YI0SNa-8gfWcqFw_s2HmLEip'};try{return {...defaults,...JSON.parse(localStorage.getItem('tai.supabase.config')||'{}')}}catch{return defaults}}
function readSession(){try{return JSON.parse(sessionStorage.getItem('tai.session')||'null')}catch{return null}}
state.session=readSession();
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const getPage=()=>['overview','posts','products','analytics','live','logs','automation','settings'].includes(location.hash.substring(1))?location.hash.substring(1):'overview';
const isReady=()=>Boolean(state.config.url&&state.config.key);
const authHeaders=(extra={})=>({'apikey':state.config.key,...(state.session?.access_token?{'Authorization':`Bearer ${state.session.access_token}`}:{}) ,...extra});
const safeUrl=()=>String(state.config.url||'').replace(/\/$/,'');
function toast(message,error=false){let el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=message;$('#toast-region').append(el);setTimeout(()=>el.remove(),4600)}
function refreshStaticIcons(){ $$('[data-icon]').forEach(el=>{el.innerHTML=svg(el.dataset.icon)}) }
function statusTag(s){const data={published:['published','Đã đăng'],scheduled:['scheduled','Đã lên lịch'],draft:['draft','Bản nháp'],failed:['failed','Thất bại'],paused:['paused','Tạm dừng']};const [cls,label]=data[s]||data.draft;return `<span class="tag ${cls}">${label}</span>`}
const sourceNotice=()=>state.demo?`<div class="notice"><div>${svg('info')}<span><strong>Chế độ demo:</strong> toàn bộ số liệu bên dưới là dữ liệu minh họa. Chưa có bài đăng thực tế nào được thực hiện.</span></div><button data-goto="settings">Kết nối Supabase →</button></div>`:`<div class="notice"><div>${svg('check-circle')}<span>Đang hiển thị dữ liệu Supabase thực tế. Những thao tác đăng Threads cần Edge Functions backend.</span></div><button data-action="refresh">Làm mới</button></div>`;
const pageHeader=(eyebrow,title,description,actions='')=>`<div class="page-heading"><div><div class="eyebrow"><span class="eyebrow-dot"></span>${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${actions?`<div class="heading-actions">${actions}</div>`:''}</div>`;
const periodSelect=()=>`<label class="select-wrap">${svg('calendar')}<select id="period" aria-label="Chọn thời gian"><option value="7" ${state.period===7?'selected':''}>7 ngày qua</option><option value="30" ${state.period===30?'selected':''}>30 ngày qua</option><option value="90" ${state.period===90?'selected':''}>90 ngày qua</option></select></label>`;
function visiblePosts(){let days=state.period;return state.posts.filter(p=>!p.published_at || new Date(p.published_at).getTime() >= Date.now()-days*86400000)}
function metrics(){const pub=visiblePosts().filter(p=>p.status==='published');return {pub:pub.length,views:pub.reduce((a,p)=>a+(p.views||0),0),engagement:pub.reduce((a,p)=>a+(p.likes||0)+(p.replies||0)+(p.reposts||0),0),queue:state.posts.filter(p=>p.status==='scheduled').length}}
function kpi(label,value,icon,type,subtitle){return `<article class="panel kpi"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon ${type}">${svg(icon)}</span></div><div class="kpi-value">${fmt(value)}</div><div class="kpi-foot"><span class="metric-tag neutral">${subtitle}</span></div></article>`}
function chartSvg(){let data=state.demo?[24,35,29,42,37,45,42,55,50,68,54,61,70,63,80]:Array(15).fill(0);if(!state.demo){const cutoff=Date.now()-state.period*86400000;for(let i=0;i<15;i++){const start=cutoff+(state.period*86400000/15)*i;const end=cutoff+(state.period*86400000/15)*(i+1);data[i]=state.posts.filter(p=>p.status==='published'&&new Date(p.published_at).getTime()>=start&&new Date(p.published_at).getTime()<end).reduce((a,p)=>a+(p.views||0),0)}}let max=Math.max(...data,1)*1.25;const x=i=>45+(i/(data.length-1))*620,y=v=>173-(v/max)*145;const points=data.map((v,i)=>`${x(i)},${y(v)}`).join(' ');const prev=data.map((v,i)=>`${x(i)},${y(v*.77+(max*.06*Math.sin(i)))}`).join(' ');return `<svg class="plot" viewBox="0 0 710 215" role="img" aria-label="Đồ thị lượt xem bài đăng theo thời gian"><defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#40a78b" stop-opacity=".21"/><stop offset="1" stop-color="#40a78b" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3].map(i=>`<line class="plot-grid" x1="45" y1="${33+i*47}" x2="670" y2="${33+i*47}"/><text class="plot-label" x="31" y="${37+i*47}" text-anchor="end">${fmt(Math.round(max*(1-i/3)))}</text>`).join('')}<polygon class="plot-fill" points="45,173 ${points} 665,173"/>${state.demo?`<polyline class="plot-prev" points="${prev}"/>`:''}<polyline class="plot-line" points="${points}"/><circle cx="${x(14)}" cy="${y(data[14])}" r="5.5" fill="#fff" stroke="#299786" stroke-width="3"/>${[0,3,6,9,12,14].map(i=>`<text class="plot-label" x="${x(i)}" y="198" text-anchor="middle">${Math.round((state.period/14)*(i-14))===0?'Hôm nay':`${Math.abs(Math.round((state.period/14)*(i-14)))} ngày`}</text>`).join('')}</svg>`}
function postTable(posts,full=false){if(!posts.length)return `<div class="empty-state">${svg('file-text')}<strong>Chưa có bài viết phù hợp</strong><p>Thêm bản nháp mới hoặc thay đổi bộ lọc.</p></div>`;return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Nội dung</th><th>Trạng thái</th><th>AI</th><th>Lượt xem</th><th>Ngày</th>${full?'<th>Thao tác</th>':''}</tr></thead><tbody>${posts.map(p=>`<tr><td><span class="table-title" title="${escapeHtml(p.content)}">${escapeHtml(p.content)}</span><span class="table-sub">${escapeHtml(p.id)}</span></td><td>${statusTag(p.status)}</td><td>${escapeHtml(p.provider||'—')}</td><td>${fmt(p.views)}</td><td class="nowrap">${dateFmt(p.published_at||p.scheduled_at||p.created_at)}</td>${full?`<td>${!state.demo&&['draft','scheduled'].includes(p.status)?`<button class="btn btn-soft" data-publish-id="${escapeHtml(p.id)}">Đăng Threads</button>`:!state.demo&&['processing','paused'].includes(p.status)&&p.upload_post_request_id?`<button class="btn btn-soft" data-reconcile-id="${escapeHtml(p.id)}">Đối soát</button>`:'—'}</td>`:''}</tr>`).join('')}</tbody></table></div>`}
function recentAISummary(){
 const ids=new Set((state.jobRuns||[]).filter(j=>j.kind==="agent_cycle"||j.kind==="manual_ai").map(j=>j.id));
 const events=(state.logs||[]).filter(e=>e.job_run_id&&ids.has(e.job_run_id)).slice(0,4);
 if(!events.length)return '<div class="empty-state"><strong>Chưa có hoạt động AI mới</strong><p>Mở AI trực tiếp để xem các lượt chạy.</p></div>';
 const name={scan_products:"Đang rà soát sản phẩm",select_product:"Đã chọn sản phẩm",read_context:"Đang đọc ngữ cảnh",ai_request:"Đang gọi AI",ai_response:"AI đã tạo phản hồi",draft_saved:"Đã lưu bản nháp",content_verified:"Đã kiểm tra nội dung",publisher_request:"Đang gửi Threads",publisher_response:"Upload-Post đã tiếp nhận",await_reconcile:"Đang chờ xác nhận Threads",completed:"Đã hoàn tất",failed:"Tác vụ thất bại"};
 return events.map(e=>'<div class="activity-item"><div class="activity-icon '+(e.level==="error"?"error":e.level==="warning"?"warning":"")+'">'+svg(e.level==="error"?"alert-circle":"check-circle")+'</div><div class="activity-body"><strong>'+escapeHtml(name[e.stage]||e.event||"Bước thực thi AI")+'</strong><p>'+escapeHtml(dateFmt(e.created_at))+'</p></div></div>').join('');
}
function latestJobStrip(){
 if(state.demo||!state.jobRuns?.length)return '';
 const j=state.jobRuns[0];
 const map={running:'Đang chạy',completed:'Hoàn tất',failed:'Thất bại',skipped:'Bỏ qua'};
 const kind={agent_cycle:'AI Agent',analytics_sync:'Analytics',manual_ai:'Tạo bài AI',manual_publish:'Đăng Threads',reconcile:'Đối soát',diagnostic:'Chẩn đoán'};
 const p=Math.max(0,Math.min(100,Number(j.progress)||0));
 return '<section class="latest-job"><div><strong>'+svg('activity')+' Job gần nhất: '+escapeHtml(kind[j.kind]||j.kind)+'</strong><p>'+escapeHtml(map[j.status]||j.status)+' · '+escapeHtml(j.message||j.stage)+' · '+escapeHtml(dateFmt(j.started_at))+'</p></div><div class="latest-job-end"><span>'+p+'%</span><button class="btn btn-soft" data-goto="live">Xem tiến trình '+svg('arrow')+'</button></div></section>';
}
function overview(){const m=metrics();const actions=`${periodSelect()}<button class="btn btn-primary" data-action="new-post">${svg('plus')} Tạo bài viết</button>`;return `${pageHeader('BẢNG ĐIỀU KHIỂN','Một nơi. Toàn bộ hoạt động.','Theo dõi chiến dịch affiliate và tiến độ tự động hóa của tAI.',actions)}${sourceNotice()}<section class="status-strip"><div class="strip-copy"><div class="strip-label"><span class="live-ping"></span> AI AUTOMATION CENTER</div><h2>Hệ thống đang ở chế độ ${state.demo?'mô phỏng':state.settings.agent_enabled?'AI Agent tự chủ':'thủ công'}</h2><p>${state.demo?'Kết nối Supabase để bật quy trình AI và xuất bản thực tế.':state.settings.agent_enabled?(state.settings.agent_mode==='publish'&&state.settings.auto_publish&&!state.settings.require_review?'Agent tự tạo và đăng bài có giới hạn qua Supabase Cron.':'Agent tự chọn sản phẩm và tạo nháp mỗi ngày; cần duyệt để đăng Threads.'):'Agent đang tắt; bật trong AI & Tự động hóa để chạy lịch.'}</p></div><div class="strip-actions"><span class="strip-tick">${svg('bot')} ${escapeHtml(String(state.settings.model).toUpperCase())}</span><button class="btn btn-lime" data-goto="automation">${svg('sparkles')} Điều khiển AI</button></div></section>${latestJobStrip()}<section class="kpi-grid">${kpi('Bài đã đăng',m.pub,'check-circle','','Trong khoảng thời gian chọn')}${kpi('Tổng lượt xem',m.views,'eye','blue','Từ bài đã xuất bản')}${kpi('Lượt tương tác',m.engagement,'heart','purple','Like + reply + repost')}${kpi('Bài chờ đăng',m.queue,'clock','orange','Hàng đợi hiện tại')}</section><div class="content-grid"><section class="panel chart-panel"><div class="panel-heading"><div><h3>Hiệu suất nội dung</h3><p>Xu hướng lượt xem trong ${state.period} ngày gần nhất</p></div><span class="pill-inline">${state.demo?'Demo':'Supabase'}</span></div><div class="chart-summary"><strong>${fmt(m.views)}</strong><small>lượt xem ghi nhận</small></div>${chartSvg()}<div class="chart-legend"><span><i class="legend-dot"></i>Kỳ hiện tại</span>${state.demo?'<span><i class="legend-dot prev"></i>Đường tham chiếu minh họa</span>':''}</div></section><section class="panel funnel-panel"><div class="panel-heading"><div><h3>Phễu vận hành</h3><p>Trạng thái quy trình xuất bản</p></div>${svg('activity')}</div><div class="funnel-list">${[{label:'Tổng bài viết',v:state.posts.length,color:''},{label:'Đã đăng',v:state.posts.filter(p=>p.status==='published').length,color:'pale'},{label:'Đã lên lịch',v:state.posts.filter(p=>p.status==='scheduled').length,color:'blue'},{label:'Bản nháp',v:state.posts.filter(p=>p.status==='draft').length,color:'orange'}].map(f=>`<div><div class="funnel-top"><span>${f.label}</span><strong>${f.v}</strong></div><div class="progress-track"><div class="progress-fill ${f.color}" style="width:${state.posts.length?(f.v/state.posts.length*100):0}%"></div></div></div>`).join('')}</div><div class="funnel-note">${svg('info')} &nbsp; Tập trung vào bài chờ duyệt và bài lỗi trước khi tăng số lượng đăng.</div></section></div><div class="lower-grid"><section class="panel table-panel"><div class="panel-heading"><div><h3>Bài đăng gần đây</h3><p>Trạng thái nội dung từ thư viện của bạn</p></div><button class="small-link" data-goto="posts">Xem tất cả ${svg('arrow-right')}</button></div>${postTable([...state.posts].slice(0,5))}</section><section class="panel activity-panel"><div class="panel-heading"><div><h3>AI đã làm gì gần đây?</h3><p>Những bước xử lý AI mới nhất</p></div><button class="small-link" data-goto="live">Xem trực tiếp ${svg('arrow-right')}</button></div><div class="activity-list">${recentAISummary()}</div></section></div>`}
function postsPage(){const arr=state.posts.filter(p=>(state.tab==='all'||p.status===state.tab)&&p.content.toLowerCase().includes(state.search.toLowerCase()));const actions=`<button class="btn btn-soft" data-action="new-ai-post">${svg('sparkles')} AI tạo nháp</button> <button class="btn btn-primary" data-action="new-post">${svg('plus')} Tạo bản nháp</button>`;return `${pageHeader('THƯ VIỆN NỘI DUNG','Quản lý bài đăng','Theo dõi nội dung từ bản nháp đến khi xuất bản trên Threads.',actions)}${sourceNotice()}<div class="toolbar"><div class="search-input">${svg('search')}<input id="post-search" aria-label="Tìm bài đăng" value="${escapeHtml(state.search)}" placeholder="Tìm nội dung bài viết..."></div><div class="tab-list">${[['all','Tất cả'],['draft','Bản nháp'],['scheduled','Lên lịch'],['published','Đã đăng'],['failed','Thất bại']].map(([id,label])=>`<button class="tab ${state.tab===id?'active':''}" data-tab="${id}">${label}</button>`).join('')}</div></div><section class="panel big-table">${postTable(arr,true)}</section><p class="filter-note">${arr.length} bài viết hiển thị. Đăng bài chỉ thực hiện khi bạn nhấn xác nhận và Supabase Secrets đã cấu hình. Không tự đăng khi chưa duyệt.</p>`}
function productsPage(){let products=state.products.filter(p=>`${p.title} ${p.category}`.toLowerCase().includes(state.productsSearch.toLowerCase()));return `${pageHeader('KHO SẢN PHẨM','Sản phẩm affiliate','Lưu trữ thông tin và liên kết tiếp thị cho AI sử dụng.',`<button class="btn btn-primary" data-action="new-product">${svg('plus')} Thêm sản phẩm</button>`)}${sourceNotice()}<div class="toolbar"><div class="search-input">${svg('search')}<input id="product-search" aria-label="Tìm sản phẩm" value="${escapeHtml(state.productsSearch)}" placeholder="Tìm tên hoặc danh mục..."></div><span class="pill-inline">${products.length} sản phẩm</span></div><div class="product-grid">${products.map(p=>`<article class="panel product-card"><div class="product-image">${svg('package')}</div><div class="product-title">${escapeHtml(p.title)}</div><div class="product-meta">${escapeHtml(p.category||'Chưa phân loại')}</div><div class="product-footer"><b>${fmt(p.price)} đ</b><a class="link-mini" href="${escapeHtml(validExternalUrl(p.affiliate_url)||'#')}" target="_blank" rel="noopener noreferrer" aria-label="Xem link affiliate">Xem link ${svg('external')}</a></div></article>`).join('')||'<div class="panel empty-state">Chưa có sản phẩm nào.</div>'}</div><p class="filter-note">Sản phẩm và giá trong chế độ demo chỉ để minh họa, không đại diện cho ưu đãi thực tế.</p>`}
function analyticsPage(){const m=metrics();const total=state.posts.filter(p=>p.status==='published').length;const rate=m.views>0?m.engagement/m.views*100:0;const p=state.demo?null:state.profileMetrics;const val=(x)=>x===null||x===undefined?'—':fmt(x);const profileCards=`
  <section class="panel profile-analytics-panel" aria-label="Số liệu Upload-Post Threads">
   <div class="panel-heading"><div><h3>Upload-Post · Threads</h3>
     <p>Số liệu cấp tài khoản của profile <strong>${escapeHtml(p?.profile_username||'default')}</strong>, không phải số liệu riêng từng bài.</p></div>
     <button class="btn btn-soft" data-action="profile-sync">${svg('refresh-cw')} Đồng bộ Upload-Post</button></div>
   <div class="profile-metrics-grid">
     <div class="profile-metric"><small>Người theo dõi</small><strong>${val(p?.followers)}</strong></div>
     <div class="profile-metric"><small>Impressions · 7 ngày</small><strong>${val(p?.weekly_impressions)}</strong></div>
     <div class="profile-metric"><small>Likes · tài khoản</small><strong>${val(p?.likes)}</strong></div>
     <div class="profile-metric"><small>Link clicks · tài khoản</small><strong>${val(p?.clicks)}</strong></div>
   </div>
   <p class="filter-note">${p?'Kỳ hiển thị 7 ngày: '+escapeHtml(p.week_start||'chưa rõ')+' đến '+escapeHtml(p.week_end||'chưa rõ')+' · Đồng bộ: '+escapeHtml(dateFmt(p.fetched_at)):'Chưa có số liệu từ Upload-Post. Đăng nhập và chọn Đồng bộ Upload-Post.'}
    Số lần hiển thị tổng hợp từ get_analytics: ${val(p?.account_impressions)} (API không xác định kỳ). Thống kê riêng bài đăng chưa có nếu Threads API từ chối.</p>
  </section>`;
return `${pageHeader('PERFORMANCE INTELLIGENCE','Phân tích nội dung','Thống kê tài khoản từ Upload-Post và hiệu quả từng bài, được lưu riêng để tránh cộng nhầm.',periodSelect())}${sourceNotice()}${profileCards}<h3 class="section-title" style="margin:22px 0 14px">Số liệu từng bài Threads</h3><div class="tiny-grid"><div class="panel mini-card"><small>Tỷ lệ tương tác</small><strong>${rate.toFixed(1)}%</strong></div><div class="panel mini-card"><small>Views mỗi bài</small><strong>${fmt(m.pub?m.views/m.pub:0)}</strong></div><div class="panel mini-card"><small>Hàng đợi</small><strong>${m.queue}</strong></div></div><div class="content-grid" style="margin-top:18px"><section class="panel chart-panel"><div class="panel-heading"><div><h3>Xu hướng lượng tiếp cận</h3><p>Biểu đồ thống kê theo ngày</p></div></div>${chartSvg()}</section><section class="panel funnel-panel"><div class="panel-heading"><div><h3>Thông tin đo lường</h3><p>Phạm vi dữ liệu</p></div></div><div class="callout">${svg('info')} Upload-Post cung cấp thống kê mạng xã hội. Doanh thu affiliate cần API hoặc báo cáo riêng của nền tảng affiliate.</div><ul class="help-list"><li>Views: tổng lượt xem bài đã đăng</li><li>Engagement: like + reply + repost</li><li>Engagement rate: engagement / views</li><li>Báo cáo sẽ cập nhật khi backend đồng bộ</li></ul></section></div>`}
function filteredActivityLogs(){
  if(state.demo)return [];
  const term=state.logSearch.trim().toLocaleLowerCase('vi-VN');
  return state.logs.filter(l=>
    (state.logLevel==='all'||l.level===state.logLevel) &&
    (!term||String(l.event||'').toLocaleLowerCase('vi-VN').includes(term) ||
     String(l.post_id||'').toLowerCase().includes(term))
  );
}
function activityLogRows(){
  const rows=filteredActivityLogs();
  if(state.demo)return '<div class="empty-state"><strong>Chế độ demo</strong><p>Đăng nhập Supabase để xem nhật ký thật. Log minh họa không được hiển thị ở đây.</p></div>';
  if(!rows.length)return '<div class="empty-state"><strong>Không có sự kiện phù hợp</strong><p>Thử đổi bộ lọc hoặc tạo một bản nháp AI.</p></div>';
  return rows.map(l=>{
    const level=['info','warning','error'].includes(l.level)?l.level:'info';
    const label={info:'Thông tin',warning:'Cảnh báo',error:'Lỗi'}[level];
    const details=l.details&&typeof l.details==='object'&&Object.keys(l.details).length
      ? '<details class="log-details"><summary>Xem dữ liệu bổ sung</summary><pre>'+escapeHtml(JSON.stringify(l.details,null,2).slice(0,2000))+'</pre></details>' : '';
    return '<article class="log-entry log-'+level+'">'
      +'<div class="log-mark" aria-hidden="true">'+svg(level==='error'?'alert-circle':level==='warning'?'info':'check-circle')+'</div>'
      +'<div class="log-entry-body">'
      +'<div class="log-entry-meta"><span class="log-level">'+label+'</span><time datetime="'+escapeHtml(l.created_at||'')+'">'+escapeHtml(dateFmt(l.created_at))+'</time></div>'
      +'<p class="log-message">'+escapeHtml(l.event||'Sự kiện không có mô tả')+'</p>'
      +(l.post_id?'<div class="log-post-id">Bài đăng: <code>'+escapeHtml(l.post_id)+'</code></div>':'')
      +details+'</div></article>';
  }).join('');
}
function jobTimeline(){
 const types={agent_cycle:'AI Agent',analytics_sync:'Phân tích',diagnostic:'Kiểm tra hệ thống',manual_ai:'Tạo bài AI',manual_publish:'Đăng Threads',reconcile:'Đối soát'};
 const stages={started:'Bắt đầu',scan_products:'Kiểm tra sản phẩm',select_product:'Chọn sản phẩm',read_context:'Đọc ngữ cảnh',ai_request:'Đang gọi AI',ai_response:'AI đã phản hồi',draft_saved:'Đã lưu bài',content_verified:'Kiểm tra nội dung',publisher_request:'Đang gửi Threads',publisher_response:'Đã gửi tới Upload-Post',await_reconcile:'Chờ đối soát',scan_pending:'Kiểm tra hàng đợi',post_metrics:'Phân tích bài đăng',post_metrics_unavailable:'Chưa có thống kê riêng bài',profile_metrics:'Phân tích tài khoản',profile_saved:'Đã lưu thống kê',memory_update:'Cập nhật bộ nhớ',check_database:'Kiểm tra database',check_cron:'Kiểm tra backend',no_safe_products:'Không có sản phẩm hợp lệ',disabled:'Đã tắt',duplicate:'Đã chạy hôm nay',failed:'Lỗi',completed:'Hoàn thành'};
 const st={running:'Đang chạy',completed:'Hoàn tất',failed:'Thất bại',skipped:'Bỏ qua'};
 const all=state.demo?[]:(state.jobRuns||[]);
 const running=all.filter(x=>x.status==='running').length,errors=all.filter(x=>x.status==='failed').length,completed=all.filter(x=>x.status==='completed').length;
 const filtered=all.filter(j=>state.jobKind==='all'||state.jobKind===j.kind);
 const item=filtered.length?filtered.map((j,i)=>{
  const status=['running','completed','failed','skipped'].includes(j.status)?j.status:'running';
  const p=Math.max(0,Math.min(100,Number(j.progress)||0));
  const start=new Date(j.started_at).getTime();
  const end=j.finished_at?new Date(j.finished_at).getTime():Date.now();
  const duration=Number.isFinite(start)&&Number.isFinite(end)?Math.max(0,Math.round((end-start)/1000))+' giây':'—';
  const stale=status==='running'&&end-start>600000;
  const trail=(state.logs||[]).filter(e=>e.job_run_id===j.id).sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
  const steps=trail.length?trail.map(e=>'<li class="job-step"><div class="job-step-name">'+escapeHtml(stages[e.stage]||e.stage||'Sự kiện')+'<time>'+escapeHtml(dateFmt(e.created_at))+'</time></div><p>'+escapeHtml(e.event||'')+'</p></li>').join(''):'<li>Chưa có sự kiện chi tiết.</li>';
  return '<details class="job-item status-'+status+'" '+(i===0?'open':'')+'><summary><div class="job-title"><strong>'+escapeHtml(types[j.kind]||j.kind)+'</strong><span class="job-badge '+status+'">'+(stale?'Có thể bị kẹt':st[status])+'</span></div><div class="job-meta">'+escapeHtml(dateFmt(j.started_at))+' · '+escapeHtml(j.trigger_source==='cron'?'Theo lịch':j.trigger_source==='manual'?'Thủ công':'Hệ thống')+' · '+escapeHtml(stages[j.stage]||j.stage)+'</div><div class="job-bar"><span style="width:'+p+'%"></span></div><div class="job-summary"><span>'+escapeHtml(j.message||'Không có thông báo')+'</span><b>'+p+'%</b></div></summary><div class="job-details"><p class="filter-note">Mã job: <code>'+escapeHtml(j.id)+'</code> · Thời gian: '+duration+'</p><ol class="job-steps">'+steps+'</ol></div></details>';
 }).join(''):'<div class="empty-state"><strong>Chưa có job</strong><p>Nhấn “Kiểm tra ghi log” để tạo một lượt chẩn đoán an toàn.</p></div>';
 const choices=[['all','Tất cả'],['agent_cycle','AI Agent'],['analytics_sync','Analytics'],['manual_ai','AI thủ công'],['manual_publish','Đăng Threads'],['diagnostic','Chẩn đoán']];
 return '<section class="panel job-panel"><div class="panel-heading"><div><h3>Tiến độ thực thi</h3><p>Chi tiết từng bước AI, job Cron, Upload-Post và phân tích.</p></div><span class="pill-inline">30 giây/lần</span></div>'
  +'<div class="job-stats"><span>Đang chạy <b>'+running+'</b></span><span>Hoàn tất <b>'+completed+'</b></span><span>Lỗi <b>'+errors+'</b></span></div>'
  +'<div class="job-tools"><label for="job-kind">Loại job <select id="job-kind">'+choices.map(([v,n])=>'<option value="'+v+'" '+(state.jobKind===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label><button class="btn btn-soft" data-action="job-health">'+svg('shield-check')+' Kiểm tra ghi log</button></div>'
  +'<div id="jobs-content" class="job-items">'+item+'</div><p class="filter-note">Các job mới được ghi từng bước. Lịch sử cũ có thể không có mốc chi tiết. Gửi Upload-Post chưa có nghĩa Threads đã xác nhận đăng.</p></section>';
}
function aiLiveContent(){
 const kindName={agent_cycle:"AI Agent tự chủ",manual_ai:"AI tạo bài thủ công"};
 const jobs=(state.demo?[]:state.jobRuns||[]).filter(j=>j.kind==="agent_cycle"||j.kind==="manual_ai").slice().sort((a,b)=>Date.parse(b.started_at)-Date.parse(a.started_at));
 const active=jobs.find(j=>j.status==="running");
 const current=jobs.find(j=>j.id===state.liveSelectedJobId)||active||jobs[0];
 const socket=state.liveSocketStatus==="connected"?"Đã kết nối trực tiếp":state.liveSocketStatus==="connecting"?"Đang kết nối":state.liveSocketStatus==="offline"?"Dự phòng tải lại":"Chưa kết nối";
 const connection='<span class="ai-live-connection '+(state.liveSocketStatus==="connected"?"connected":"")+'"><span class="ai-live-pulse"></span>'+escapeHtml(socket)+'</span>';
 const itemLabel=(j)=>kindName[j.kind]||"AI";
 const recent=jobs.slice(0,8).map(j=>{
   const selected=j.id===current?.id;
   const label={running:"Đang thực hiện",completed:"Hoàn tất",failed:"Thất bại",skipped:"Bỏ qua"}[j.status]||"Chưa rõ";
   return '<button class="ai-live-run '+(selected?'selected':'')+'" data-live-job="'+escapeHtml(j.id)+'" aria-pressed="'+selected+'"><span>'+escapeHtml(itemLabel(j))+'</span><span class="ai-live-run-meta">'+escapeHtml(dateFmt(j.started_at))+' · '+escapeHtml(label)+'</span></button>';
 }).join('');
 if(!current)return '<section class="panel ai-live-screen">'+connection+'<div class="ai-live-empty"><div class="ai-live-symbol">'+svg('brain-circuit')+'</div><h3>AI hiện chưa có lượt chạy để theo dõi</h3><p>Khi Cron hoặc thao tác tạo bài AI bắt đầu, các bước xử lý sẽ xuất hiện trực tiếp tại đây. Lịch AI Agent đang được đặt lúc 10:10 mỗi ngày (giờ Việt Nam).</p></div></section>';
 const events=(state.logs||[]).filter(x=>x.job_run_id===current.id).sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
 const seen=(stage)=>events.some(e=>e.stage===stage);
 const lastEvent=(stage)=>events.findLast(e=>e.stage===stage);
 const spec=[
  {name:"Lựa chọn sản phẩm",starts:["scan_products"],ends:["select_product"]},
  {name:"Đọc thông tin và lịch sử",starts:["read_context"],ends:["read_context"]},
  {name:"Gọi mô hình AI",starts:["ai_request"],ends:["ai_response"]},
  {name:"Lưu nội dung AI",starts:["draft_saved"],ends:["draft_saved"]},
  {name:"Kiểm tra chất lượng và liên kết",starts:["content_verified"],ends:["content_verified"]},
  {name:"Gửi yêu cầu đăng Threads",starts:["publisher_request"],ends:["publisher_response"]},
  {name:"Xác minh bài đăng trên Threads",starts:["publisher_response","await_reconcile"],ends:[]}
 ];
 const post=(state.posts||[]).find(x=>x.id===current.post_id);
 const product=(state.products||[]).find(x=>x.id===current.product_id);
 const serverState=post?.status;
 const steps=spec.map((item,i)=>{
   const starts=item.starts.some(seen);
   const ends=item.ends.some(seen);
   let status=ends?"done":starts?"active":"pending";
   if(i===6)status=serverState==="published"?"done":serverState==="failed"?"error":starts?"waiting":"pending";
   if(current.status!=="running"&&status==="active")status=current.status==="failed"?"error":"waiting";
   if(i===5&&current.status==="completed"&&!starts&&seen("draft_saved"))status="skipped";
   if(i===6&&current.status==="completed"&&!starts&&seen("draft_saved"))status="skipped";
   const desc=i===2&&starts&&!ends?"Đã gửi yêu cầu. Đang chờ AI phản hồi, chưa có dữ liệu về suy luận nội bộ.":
      i===5&&status==="skipped"?"Tác vụ này chỉ tạo bản nháp, không gửi xuất bản.":
      i===6&&status==="skipped"?"Chưa có yêu cầu xuất bản để đối soát.":
      i===6&&status==="done"?"Threads đã xác nhận đăng thành công.":
      i===6&&status==="waiting"?"Upload-Post đã nhận yêu cầu; chờ xác nhận Threads.":
      status==="pending"?"Chưa tới bước này":status==="active"?"Đang thực hiện":status==="done"?"Đã ghi nhận hoàn tất":status==="error"?"Cần kiểm tra": "Đã kết thúc";
   const last=events.filter(e=>item.starts.concat(item.ends).includes(e.stage)).at(-1);
   return '<li class="ai-live-step '+status+'"><span class="ai-live-step-marker">'+(status==="done"?svg('check'):(i+1))+'</span><div class="ai-live-step-body"><div class="ai-live-step-head"><strong>'+escapeHtml(item.name)+'</strong><small>'+(last?escapeHtml(dateFmt(last.created_at)):"")+'</small></div><p>'+escapeHtml(desc)+'</p>'+'</div></li>';
 }).join('');
 const progress=Math.min(100,Math.max(0,Number(current.progress)||0));
 const statusText={running:"ĐANG THỰC HIỆN",completed:"ĐÃ KẾT THÚC",failed:"THẤT BẠI",skipped:"BỎ QUA"}[current.status]||"KHÔNG RÕ";
 const recentStage=events.at(-1);
 const model=events.find(e=>e.stage==="ai_response"&&e.details?.model)?.details?.model;
 const startTime=new Date(current.started_at).getTime();
 const duration=Math.max(0,Math.round(((current.finished_at?new Date(current.finished_at).getTime():Date.now())-startTime)/1000));
 const stalled=current.status==="running"&&duration>600;
 const statusNote=stalled?"Job không cập nhật hơn 10 phút; có thể đã gián đoạn.":current.message||"Đang nhận tiến trình...";
 return '<section class="ai-live-screen panel"><div class="ai-live-top"><div><span class="ai-live-eyebrow">'+svg('activity')+' AI EXECUTION MONITOR</span><h3>'+escapeHtml(itemLabel(current))+'</h3><p>'+escapeHtml(current.status==="running"?"Tiến trình đang được cập nhật khi backend hoàn tất từng bước.":"Lần xử lý gần đây nhất của AI; mở khi có lượt chạy mới để xem trực tiếp.")+'</p></div>'+connection+'</div>'
  +'<div class="ai-live-state"><span class="ai-live-state-tag '+escapeHtml(current.status)+'">'+(stalled?"CÓ THỂ GIÁN ĐOẠN":statusText)+'</span><span class="ai-live-current-text">'+escapeHtml(statusNote)+'</span></div>'
  +'<div class="ai-live-progress"><div class="ai-live-progress-track"><span style="width:'+progress+'%"></span></div><strong>'+progress+'%</strong></div>'
  +'<div class="ai-live-meta"><span>'+svg('clock')+' Bắt đầu: '+escapeHtml(dateFmt(current.started_at))+'</span><span>Thời gian: '+duration+' giây</span>'+(product?'<span>Sản phẩm: '+escapeHtml(product.title)+'</span>':'')+(model?'<span>Model phản hồi: '+escapeHtml(String(model))+'</span>':'')+'</div>'
  +'<div class="ai-live-layout"><div class="ai-live-process"><h4>Các bước AI đã thực hiện</h4><ol class="ai-live-steps">'+steps+'</ol></div>'
  +'<aside class="ai-live-side"><h4>Các lượt chạy gần đây</h4><div class="ai-live-runs">'+recent+'</div><p class="ai-live-small">Đây là tiến trình công việc do backend ghi nhận, không phải nội dung suy nghĩ ẩn hoặc từng token AI đang tạo.</p></aside></div>'
  +(post?.content?'<div class="ai-live-preview"><div class="ai-live-preview-label">'+svg('file-text')+' Nội dung AI đã lưu</div><p>'+escapeHtml(String(post.content).slice(0,1000))+'</p></div>':'')
  +(recentStage?'<p class="ai-live-last">Cập nhật cuối: '+escapeHtml(dateFmt(recentStage.created_at))+' · '+escapeHtml(recentStage.event||"")+'</p>':'')
  +'</section>';
}
function aiLivePage(){
 return `${pageHeader("AI LIVE MONITOR","AI đang làm gì?","Xem trực tiếp từng bước tAI đang xử lý, không phải log kỹ thuật.",
  `<button class="btn btn-soft" data-action="refresh-logs">${svg("refresh-cw")} Đồng bộ lại</button>`)}
 ${sourceNotice()}
 <div id="ai-live-root" aria-live="off">${aiLiveContent()}</div>
 <p class="filter-note ai-live-note">Trạng thái được đẩy qua kết nối Supabase Realtime khi trang đang mở. Nếu kết nối bị gián đoạn, dữ liệu sẽ được tải lại định kỳ. Các bước gọi AI thể hiện trạng thái request thực, không có khả năng đọc suy luận bên trong Gemini hoặc Groq.</p>`;
}
function logsPage(){
  const data=state.demo?[]:state.logs;
  const warning=data.filter(x=>x.level==='warning').length;
  const error=data.filter(x=>x.level==='error').length;
  return `${pageHeader('SYSTEM ACTIVITY','Theo dõi tiến trình','Biết tAI đang làm đến bước nào và vì sao job dừng.',
    '<button class="btn btn-primary" data-action="refresh-logs">'+svg('refresh-cw')+' Làm mới</button>')}
    ${sourceNotice()}
    ${jobTimeline()}
    <div class="log-stats">
      <div class="panel log-stat"><span>Sự kiện gần đây</span><strong>${data.length}</strong></div>
      <div class="panel log-stat"><span>Cảnh báo</span><strong>${warning}</strong></div>
      <div class="panel log-stat"><span>Lỗi</span><strong>${error}</strong></div>
    </div>
    <section class="panel log-panel" aria-label="Danh sách nhật ký hoạt động">
      <div class="panel-heading">
        <div><h3>Dòng thời gian</h3><p>Tự kiểm tra sự kiện mới mỗi 30 giây khi bạn mở trang này.</p></div>
        <span class="pill-inline">Supabase RLS</span>
      </div>
      <div class="toolbar log-toolbar">
        <div class="search-input">${svg('search')}<input id="log-search" type="search" placeholder="Tìm sự kiện hoặc mã bài đăng..." value="${escapeHtml(state.logSearch)}" aria-label="Tìm nhật ký"></div>
        <label class="log-select-label" for="log-level">Mức độ
          <select id="log-level">
            ${[['all','Tất cả'],['info','Thông tin'],['warning','Cảnh báo'],['error','Lỗi']].map(([value,label])=>`<option value="${value}" ${state.logLevel===value?'selected':''}>${label}</option>`).join('')}
          </select>
        </label>
      </div>
      <div id="logs-content" class="log-entries">${activityLogRows()}</div>
      ${state.logsError?`<p class="log-fetch-error" role="status">${svg('info')} ${escapeHtml(state.logsError)}</p>`:''}
      <p class="filter-note">Hiển thị tối đa 100 sự kiện mới nhất, theo giờ địa phương. ${state.logsUpdated?'Đồng bộ lần cuối '+escapeHtml(new Date(state.logsUpdated).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))+'.':''} Log kỹ thuật cấp nền tảng được giữ trong Supabase Logs, không cấp quyền trực tiếp cho trình duyệt.</p>
    </section>`;
}
function automationPage(){const s=state.settings;return `${pageHeader('AI CONTROL CENTER','AI & Tự động hóa','Thiết lập nguồn AI, lịch đăng và chính sách kiểm duyệt nội dung.',`<button class="btn btn-primary" data-action="save-ai">${svg('check-circle')} Lưu cấu hình</button>`)}${sourceNotice()}<div class="settings-layout"><section class="panel setting-panel"><h3 class="section-title">AI Agent tự chủ</h3>
<p class="section-description">Chạy trên Supabase Cron, ngay cả khi dashboard đang đóng. Lịch 10:10 và 19:20 mỗi ngày (giờ Việt Nam).</p>
<div class="toggle-row"><div><strong>Cho phép agent tự chạy</strong><span>Đã có lịch server; tắt ở đây sẽ khiến agent bỏ qua các kỳ chạy.</span></div>
<label class="switch"><input type="checkbox" id="ai-agent-enabled" ${s.agent_enabled?'checked':''}><span class="switch-slider"></span></label></div>
<div class="field"><label for="ai-agent-mode">Chế độ</label>
<select id="ai-agent-mode"><option value="draft" ${s.agent_mode!=='publish'?'selected':''}>Tự chọn sản phẩm + tạo nháp (an toàn)</option>
<option value="publish" ${s.agent_mode==='publish'?'selected':''}>Tạo nháp + tự đăng Threads (yêu cầu bật các công tắc bên dưới)</option></select>
<span class="field-hint">Tự đăng chỉ được thực hiện khi đồng thời bật “Tự động xuất bản” và tắt “Duyệt bài trước khi đăng”. Tài khoản cần API key Upload-Post và sản phẩm thật.</span></div>
<div class="callout">${svg('shield-check')} Giới hạn phía server: 1 lượt tạo nháp/ngày, chống trùng theo ngày. Sản phẩm có tên hoặc liên kết demo/test bị chặn.</div>
<div class="field"><label>Trạng thái lần chạy gần nhất</label>
<p class="section-description">${state.agentRuns[0]?
  escapeHtml(state.agentRuns[0].slot_date+" — "+state.agentRuns[0].status+" — "+(state.agentRuns[0].note||"Không có ghi chú")) :
  "Chưa có lượt chạy nào (hoặc chưa đăng nhập)."}</p></div>
<button class="btn btn-soft" data-action="agent-tick">${svg('zap')} Chạy agent ngay (có giới hạn một lần/ngày)</button>
<hr class="divider"><h3 class="section-title">Cấu hình mô hình AI</h3><p class="section-description">AI Engine chạy ở Supabase Edge Functions. Frontend chỉ lưu cấu hình được phép.</p><div class="field-row"><div class="field"><label for="ai-model">Nhà cung cấp chính</label><select id="ai-model"><option value="gemini" ${s.model==='gemini'?'selected':''}>Google Gemini</option><option value="groq" ${s.model==='groq'?'selected':''}>Groq</option></select></div><div class="field"><label for="ai-fallback">Nhà cung cấp dự phòng</label><select id="ai-fallback"><option value="groq" ${s.fallback==='groq'?'selected':''}>Groq</option><option value="gemini" ${s.fallback==='gemini'?'selected':''}>Google Gemini</option></select></div></div><div class="field"><label for="ai-prompt">System prompt tạo nội dung</label><textarea id="ai-prompt" rows="6">${escapeHtml(s.prompt)}</textarea><div class="field-hint">Không đưa API key vào prompt. AI luôn phải kiểm chứng thông tin sản phẩm.</div></div><hr class="divider"><h3 class="section-title">Quy tắc xuất bản</h3><div class="field"><label for="ai-limit">Giới hạn bài/ngày</label><input id="ai-limit" type="number" min="0" max="1" value="${Number(s.daily_limit)??1}"><span class="field-hint">Chạy tự động tối đa 1 lượt tạo bài/ngày để giữ chi phí thấp.</span></div><div class="toggle-row"><div><strong>Tự động xuất bản</strong><span>Chỉ hoạt động trong chế độ Tự đăng và khi tắt duyệt trước.</span></div><label class="switch"><input type="checkbox" id="ai-autopublish" ${s.auto_publish?'checked':''}><span class="switch-slider"></span></label></div><div class="toggle-row"><div><strong>Duyệt bài trước khi đăng</strong><span>Khuyến nghị bật khi mới vận hành.</span></div><label class="switch"><input type="checkbox" id="ai-review" ${s.require_review?'checked':''}><span class="switch-slider"></span></label></div></section><aside class="panel setting-panel"><h3 class="section-title">Tình trạng dịch vụ</h3><p class="section-description">Các tích hợp cần cấu hình phía server.</p>${[['Supabase Database',!state.demo],['AI Provider',Boolean(state.backend?.providers?.gemini||state.backend?.providers?.groq)],['Upload-Post MCP',Boolean(state.backend?.providers?.uploadPost)],['Supabase Cron',true]].map(([t,active])=>`<div class="toggle-row"><div><strong>${t}</strong><span>${active?'Đã kết nối dữ liệu':'Chưa xác minh backend'}</span></div><span class="tag ${active?'published':'paused'}">${active?'Connected':'Pending'}</span></div>`).join('')}<div class="callout">${svg('lock')} Không nhập API key AI hoặc Upload-Post trực tiếp trên dashboard. Chỉ lưu các khóa này ở Supabase Secrets.</div></aside></div>`}
function settingsPage(){return `${pageHeader('WORKSPACE SETTINGS','Kết nối Supabase','Thiết lập dữ liệu backend cho tAI Console. Mọi kết nối sử dụng quyền truy cập của người dùng.')}${sourceNotice()}<div class="settings-layout"><section class="panel setting-panel"><h3 class="section-title">Thông tin dự án</h3><p class="section-description">Chỉ nhập Project URL và publishable/anon key. Đây là các giá trị được thiết kế để dùng trong trình duyệt khi bật Row Level Security.</p><form id="connection-form"><div class="field"><label for="sb-url">Supabase Project URL</label><input id="sb-url" type="url" placeholder="https://xxxxx.supabase.co" autocomplete="off" required value="${escapeHtml(state.config.url||'')}"></div><div class="field"><label for="sb-key">Supabase Publishable Key</label><input id="sb-key" placeholder="sb_publishable_... hoặc anon key" autocomplete="off" required value="${escapeHtml(state.config.key||'')}"><div class="field-hint">Không nhập service_role hoặc secret key. Dữ liệu này được lưu trên trình duyệt hiện tại.</div></div><div class="button-group"><button class="btn btn-primary" type="submit">${svg('link')} Lưu kết nối</button><button class="btn btn-soft" type="button" data-action="disconnect">${svg('x')} Xóa cấu hình</button></div></form><hr class="divider"><div class="connection-status">${svg(state.session?'check-circle':'lock')}<div><strong>${state.session?'Đã đăng nhập Supabase':'Trạng thái xác thực'}</strong><span>${state.session?escapeHtml(state.session.user?.email||'Phiên đã xác thực'):'Chưa có phiên đăng nhập hợp lệ'}</span></div></div>${isReady()?state.session?`<button class="btn btn-soft" data-action="sign-out">${svg('log-out')} Đăng xuất</button>`:`<form id="auth-form"><div class="field"><label for="auth-email">Email</label><input type="email" id="auth-email" autocomplete="username" required></div><div class="field"><label for="auth-pass">Mật khẩu</label><input type="password" id="auth-pass" autocomplete="current-password" required></div><button class="btn btn-primary" type="submit">${svg('lock')} Đăng nhập Supabase</button></form>`:'<div class="callout">'+svg('info')+' Lưu kết nối để kích hoạt đăng nhập qua Supabase Auth.</div>'}</section><aside class="panel setting-panel"><h3 class="section-title">Hướng dẫn kết nối</h3><p class="section-description">Cấu hình một lần, không cần Cloudflare Worker backend.</p><ol class="help-list"><li>Tạo dự án trên Supabase.</li><li>Chạy SQL trong file <code>supabase/schema.sql</code> của repository.</li><li>Bật Email authentication và tạo một người dùng trong Supabase Auth.</li><li>Điền Project URL và publishable key.</li><li>Đăng nhập bằng tài khoản đã tạo.</li><li>Cấu hình CORS phù hợp với domain dashboard (nếu dùng Edge Functions).</li></ol><hr class="divider"><h3 class="section-title">Bảo mật</h3><ul class="help-list"><li>Bật RLS cho tất cả bảng chứa dữ liệu người dùng.</li><li>Không đưa service_role key vào trình duyệt hoặc GitHub.</li><li>Cron và Upload-Post chạy riêng trong Supabase backend.</li><li>Dashboard không gọi Upload-Post MCP trực tiếp.</li></ul></aside></div>`}
const pages={overview:overview,posts:postsPage,products:productsPage,analytics:analyticsPage,logs:aiLivePage,live:aiLivePage,automation:automationPage,settings:settingsPage};
function render(){state.page=getPage();$('#content').innerHTML=pages[state.page]();$('#breadcrumb-page').textContent={overview:'Tổng quan',posts:'Bài đăng',products:'Sản phẩm',analytics:'Phân tích',logs:'AI trực tiếp',live:'AI trực tiếp',automation:'AI & Tự động hóa',settings:'Cài đặt'}[state.page];$('#nav-post-count').textContent=state.posts.filter(p=>p.status==='scheduled').length;$('#profile-caption').textContent=state.demo?'Chế độ Demo':state.session?.user?.email||'Chưa đăng nhập';$('#sidebar-signout').hidden=!state.session;$('#footer-source').textContent=`Nguồn: ${state.demo?'Demo minh họa':'Supabase'} · Cập nhật ${new Date(state.updated).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`;$$('.nav-link').forEach(a=>{a.classList.toggle('selected',a.dataset.page===state.page);a.getAttribute('aria-current')&&a.removeAttribute('aria-current');if(a.dataset.page===state.page)a.setAttribute('aria-current','page')});refreshStaticIcons();if(isAILiveRoute())void connectAILiveSocket();else closeAILiveSocket();}
function closeMobile(){$('#sidebar').classList.remove('open');$('#mobile-scrim').hidden=true}
function modal(title,caption,inner,submitLabel,formId){$('#modal-root').innerHTML=`<div class="modal-backdrop" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><div><h2 id="modal-title">${title}</h2><p>${caption}</p></div><button class="icon-button modal-close" data-action="modal-close" aria-label="Đóng">${svg('x')}</button></div><form id="${formId}">${inner}<div class="modal-footer"><button type="button" class="btn btn-soft" data-action="modal-close">Hủy</button><button class="btn btn-primary" type="submit">${svg('check-circle')} ${submitLabel}</button></div></form></div></div>`;setTimeout(()=>$('#modal-root input, #modal-root textarea')?.focus(),40)}
function showAIDraftModal(){if(state.demo){toast('Đăng nhập Supabase trước khi dùng AI.',true);return}if(!state.products.length){toast('Thêm một sản phẩm affiliate trước khi tạo bài AI.',true);return}modal('AI tạo bản nháp','Bản nháp sẽ được lưu vào Supabase, không tự đăng Threads.',`<div class="field"><label for="ai-product">Chọn sản phẩm affiliate</label><select id="ai-product" required>${state.products.filter(p=>p.status==='active').map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.title)}</option>`).join('')}</select></div>`,'Tạo bản nháp AI','ai-draft-form')}
function showDraftModal(){modal('Tạo bản nháp mới','Nội dung sẽ được lưu vào Supabase nếu đã đăng nhập.',`<div class="field"><label for="draft-content">Nội dung Threads</label><textarea id="draft-content" rows="6" maxlength="5000" placeholder="Viết nội dung bài đăng..." required></textarea></div><div class="field"><label for="draft-provider">Nguồn nội dung</label><select id="draft-provider"><option value="Manual">Viết thủ công</option><option value="Gemini">Gemini</option><option value="Groq">Groq</option></select></div>`,'Lưu bản nháp','draft-form')}
function showProductModal(){modal('Thêm sản phẩm','Lưu sản phẩm affiliate để chuẩn bị nội dung.',`<div class="field"><label for="prod-title">Tên sản phẩm</label><input id="prod-title" required maxlength="180"></div><div class="field-row"><div class="field"><label for="prod-category">Danh mục</label><input id="prod-category" placeholder="Phụ kiện..."></div><div class="field"><label for="prod-price">Giá (VND)</label><input id="prod-price" type="number" min="0" value="0" required></div></div><div class="field"><label for="prod-url">Link affiliate HTTPS</label><input id="prod-url" type="url" placeholder="https://..." required></div>`,'Lưu sản phẩm','product-form')}
function validExternalUrl(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}}
async function request(path,options={}){const response=await fetch(`${safeUrl()}${path}`,{...options,headers:authHeaders(options.headers||{})});const text=await response.text();let body;try{body=JSON.parse(text)}catch{body=text}if(!response.ok)throw Error(body?.msg||body?.message||body?.error_description||body?.error||`HTTP ${response.status}`);return body}
async function callAutomation(action,fields={}){if(!await ensureSession())throw Error('Cần đăng nhập Supabase.');return request('/functions/v1/tai-automation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...fields})})}
async function ensureSession(){if(!isReady()||!state.session)return false;if(Date.now()<Number(state.session.expires_at||0)*1000-60000)return true;try{const body=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:state.session.refresh_token})});state.session={...body,expires_at:Math.floor(Date.now()/1000)+body.expires_in};sessionStorage.setItem('tai.session',JSON.stringify(state.session));updateLiveAuth(state.session.access_token);return true}catch{state.session=null;sessionStorage.removeItem('tai.session');return false}}
async function fetchActivityLogs(){
  if(!await ensureSession())throw Error('Bạn cần đăng nhập để xem nhật ký.');
  try{
    const [logs,jobs]=await Promise.all([request('/rest/v1/job_logs?select=id,job_run_id,stage,event_status,post_id,event,level,details,created_at&order=created_at.desc&limit=200'),request('/rest/v1/job_runs?select=id,kind,trigger_source,status,stage,progress,message,post_id,started_at,updated_at,finished_at&order=started_at.desc&limit=40')]);
    state.jobRuns=jobs;state.logs=logs;
    state.logsError=null;
    state.logsUpdated=new Date();
    return logs;
  }catch(e){
    state.logsError='Không tải được nhật ký: '+String(e.message||e).slice(0,160);
    throw e;
  }
}
async function loadLive(){if(!await ensureSession()){state.demo=true;state.posts=demoPosts;state.products=demoProducts;state.logs=demoLogs;state.agentRuns=[];state.jobRuns=[];state.profileMetrics=null;return}state.loading=true;try{const [posts,products,logs,settings,runs,snapshots,jobs]=await Promise.all([request('/rest/v1/posts?select=*&order=created_at.desc&limit=200'),request('/rest/v1/products?select=*&order=created_at.desc&limit=200'),request('/rest/v1/job_logs?select=id,job_run_id,stage,event_status,post_id,event,level,details,created_at&order=created_at.desc&limit=200'),request('/rest/v1/app_settings?select=config&limit=1'),request('/rest/v1/agent_runs?select=id,slot_date,status,mode,note,post_id,product_id,started_at,finished_at&order=started_at.desc&limit=7'),request('/rest/v1/social_profile_snapshots?select=platform,profile_username,snapshot_date,followers,account_impressions,weekly_impressions,week_start,week_end,likes,comments,shares,quotes,clicks,profile_views,reach,fetched_at&order=snapshot_date.desc&limit=1'),request('/rest/v1/job_runs?select=id,kind,trigger_source,status,stage,progress,message,post_id,started_at,updated_at,finished_at&order=started_at.desc&limit=40')]);state.jobRuns=jobs;state.profileMetrics=snapshots[0]||null;state.agentRuns=runs;state.posts=posts;state.products=products;state.logs=logs;state.logsError=null;state.logsUpdated=new Date();state.settings={...DEFAULTS,...(settings[0]?.config||{})};state.demo=false;state.updated=new Date();try{state.backend=await callAutomation('status')}catch{state.backend=null}}catch(e){state.demo=true;state.posts=demoPosts;state.products=demoProducts;state.logs=demoLogs;toast('Không thể đọc bảng Supabase: '+e.message,true)}finally{state.loading=false;render()}}
async function insertRow(table,body){await ensureSession();if(!state.session)throw Error('Vui lòng đăng nhập Supabase.');return request(`/rest/v1/${table}`,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify({...body,user_id:state.session.user.id})})}
async function saveAi(){const config={...state.settings,agent_enabled:$('#ai-agent-enabled').checked,agent_mode:$('#ai-agent-mode').value,model:$('#ai-model').value,fallback:$('#ai-fallback').value,daily_limit:Math.min(1,Math.max(0,Number($('#ai-limit').value))),auto_publish:$('#ai-autopublish').checked,require_review:$('#ai-review').checked,prompt:$('#ai-prompt').value.trim()};if(config.agent_mode==='publish'&&config.auto_publish&&!config.require_review){if(!window.confirm('Bật đăng Threads tự động mỗi ngày? Nội dung có thể được công khai mà không yêu cầu bạn xác nhận từng bài. Chỉ chọn OK khi đã kiểm tra tài khoản, sản phẩm và liên kết tiếp thị thật.'))return}if(config.model===config.fallback){toast('AI chính và dự phòng cần khác nhau.',true);return}if(state.demo){state.settings=config;toast('Đã cập nhật cấu hình trong bản demo (không lưu trên server).');render();return}try{await ensureSession();await request('/rest/v1/app_settings?on_conflict=user_id',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:state.session.user.id,config})});state.settings=config;toast('Đã lưu cấu hình vào Supabase.');render()}catch(e){toast('Không lưu được cấu hình: '+e.message,true)}}
async function handleSubmit(e){e.preventDefault();const id=e.target.id;if(id==='connection-form'){const url=$('#sb-url').value.trim().replace(/\/$/,'');const key=$('#sb-key').value.trim();if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(url)){toast('Project URL cần là địa chỉ https://...supabase.co',true);return}if(!key||key.includes('service_role')||key.startsWith('sb_secret_')){toast('Không nhập secret/service_role key!',true);return}state.config={url,key};localStorage.setItem('tai.supabase.config',JSON.stringify(state.config));state.session=null;sessionStorage.removeItem('tai.session');toast('Đã lưu cấu hình. Đăng nhập để tải dữ liệu.');render()}if(id==='auth-form'){try{const body=await request('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#auth-email').value.trim(),password:$('#auth-pass').value})});state.session={...body,expires_at:Math.floor(Date.now()/1000)+body.expires_in};sessionStorage.setItem('tai.session',JSON.stringify(state.session));toast('Đăng nhập thành công.');await loadLive()}catch(err){toast('Đăng nhập thất bại: '+err.message,true)}}if(id==='ai-draft-form'){try{const p=$('#ai-product').value;const out=await callAutomation('generate',{productId:p});$('#modal-root').innerHTML='';await loadLive();toast('Đã tạo bản nháp AI ('+(out.draft?.provider||'AI')+'). Vào Bài đăng để duyệt.')}catch(e){toast('Không tạo được bài AI: '+e.message,true)}return}if(id==='draft-form'){const obj={content:$('#draft-content').value.trim(),provider:$('#draft-provider').value,status:'draft',views:0,likes:0,replies:0,reposts:0};if(!obj.content)return;try{if(state.demo){state.posts.unshift({...obj,id:`demo-${Date.now()}`,created_at:new Date().toISOString()});toast('Đã thêm bản nháp trong chế độ demo.')}else{await insertRow('posts',obj);await loadLive();toast('Đã lưu bản nháp lên Supabase.')}$('#modal-root').innerHTML='';render()}catch(e){toast('Lỗi: '+e.message,true)}}if(id==='product-form'){const affiliate_url=$('#prod-url').value.trim();if(!validExternalUrl(affiliate_url)){toast('URL sản phẩm không hợp lệ.',true);return}const obj={title:$('#prod-title').value.trim(),category:$('#prod-category').value.trim(),price:Number($('#prod-price').value),affiliate_url,status:'active'};try{if(state.demo){state.products.unshift({...obj,id:`demo-${Date.now()}`});toast('Đã thêm sản phẩm trong chế độ demo.')}else{await insertRow('products',obj);await loadLive();toast('Đã thêm sản phẩm vào Supabase.')}$('#modal-root').innerHTML='';render()}catch(e){toast('Lỗi: '+e.message,true)}}}
async function handleAction(action){if(action==='new-post')showDraftModal();if(action==='new-ai-post')showAIDraftModal();if(action==='agent-tick'){if(state.demo){toast('Đăng nhập Supabase để kích hoạt agent.',true)}else if(window.confirm('Chạy thử AI Agent ngay bây giờ? Agent tối đa một lượt/ngày, có thể sử dụng hạn mức API của nhà cung cấp AI.')){try{const r=await callAutomation('agent-tick');await loadLive();toast(r?.results?.[0]?.skipped?'Agent: '+r.results[0].skipped:'Agent đã hoàn thành lượt kiểm tra. Xem Nhật ký.')}catch(e){toast('Agent chưa chạy được: '+e.message,true)}}}if(action==='profile-sync'){if(state.demo){toast('Đăng nhập Supabase để đồng bộ Upload-Post.',true)}else{try{const out=await callAutomation('profile-sync');await loadLive();toast('Đã đồng bộ '+(out.profile?.followers??'—')+' followers và '+(out.profile?.weekly_impressions??'—')+' impressions 7 ngày.')}catch(e){toast('Lỗi đồng bộ Upload-Post: '+e.message,true)}}}if(action==='new-product')showProductModal();if(action==='modal-close')$('#modal-root').innerHTML='';if(action==='refresh'){await loadLive();toast('Đã làm mới giao diện.')}if(action==='job-health'){if(state.demo){toast('Đăng nhập để kiểm tra log.',true)}else{try{await callAutomation('job-health');await fetchActivityLogs();render();toast('Đã ghi job chẩn đoán. Không gọi AI hoặc đăng Threads.')}catch(e){toast('Không ghi được job: '+e.message,true)}}}if(action==='refresh-logs'){try{await fetchActivityLogs();render();toast('Đã tải nhật ký mới nhất.')}catch(e){render();toast('Không tải được nhật ký: '+e.message,true)}}if(action==='save-ai')saveAi();if(action==='disconnect'){state.config={};state.session=null;sessionStorage.removeItem('tai.session');localStorage.removeItem('tai.supabase.config');await loadLive();toast('Đã xóa cấu hình Supabase khỏi trình duyệt.')}if(action==='sign-out'){state.session=null;sessionStorage.removeItem('tai.session');await loadLive();toast('Đã đăng xuất khỏi dashboard.')}}
document.addEventListener('click',async e=>{const selectLive=e.target.closest('[data-live-job]');if(selectLive){state.liveSelectedJobId=selectLive.dataset.liveJob;render();return}const nav=e.target.closest('[data-goto]');if(nav){location.hash=nav.dataset.goto;closeMobile();return}const pub=e.target.closest('[data-publish-id]');if(pub){if(state.demo){toast('Không thể đăng bài demo.',true);return}if(!window.confirm('Đăng bài Threads này qua Upload-Post? Hành động có thể phát sinh lượt đăng và không thể hoàn tác từ dashboard.'))return;try{await callAutomation('publish',{postId:pub.dataset.publishId,confirm:true});await loadLive();toast('Đã gửi Upload-Post. Đợi đối soát kết quả.')}catch(err){await loadLive();toast('Không đăng được: '+err.message,true)}return}const rec=e.target.closest('[data-reconcile-id]');if(rec){try{const out=await callAutomation('reconcile',{postId:rec.dataset.reconcileId});await loadLive();toast(out.status==='published'?'Đối soát thành công: bài đã đăng Threads.':out.status==='failed'?'Upload-Post xác nhận đăng thất bại.':'Upload-Post chưa xác nhận; giữ trạng thái chờ đối soát.',out.status==='failed')}catch(err){toast('Không đối soát được: '+err.message,true)}return}const a=e.target.closest('[data-action]');if(a){await handleAction(a.dataset.action);return}const tab=e.target.closest('[data-tab]');if(tab){state.tab=tab.dataset.tab;render();return}if(e.target.classList?.contains('modal-backdrop'))$('#modal-root').innerHTML=''});
document.addEventListener('change',e=>{if(e.target.id==='period'){state.period=Number(e.target.value);render()}if(e.target.id==='log-level'){state.logLevel=e.target.value;const target=$('#logs-content');if(target)target.innerHTML=activityLogRows()}if(e.target.id==='job-kind'){state.jobKind=e.target.value;render()}});
document.addEventListener('input',e=>{if(e.target.id==='log-search'){state.logSearch=e.target.value;const target=$('#logs-content');if(target)target.innerHTML=activityLogRows();return}if(e.target.id==='post-search'){state.search=e.target.value;const selection=e.target.selectionStart;const input=e.target;const t=$('.big-table');if(t){let arr=state.posts.filter(p=>(state.tab==='all'||p.status===state.tab)&&p.content.toLowerCase().includes(state.search.toLowerCase()));t.innerHTML=postTable(arr,true)}return}if(e.target.id==='product-search'){state.productsSearch=e.target.value;const active=document.activeElement;const start=active.selectionStart;render();$('#product-search')?.focus();$('#product-search')?.setSelectionRange(start,start)}});
document.addEventListener('submit',handleSubmit);
window.addEventListener('hashchange',()=>{closeMobile();render();if(isAILiveRoute()&&!state.demo){fetchActivityLogs().then(paintAILive).catch(paintAILive)}});
setInterval(async()=>{
 if(!isAILiveRoute()||state.demo||!state.session||state.logRefreshing||document.hidden)return;
 // Realtime delivers immediate updates. Periodic REST refresh recovers missed events
 // after tab suspension, temporary WebSocket outages, or initial subscription delays.
 state.logRefreshing=true;
 try{await ensureSession();await fetchActivityLogs();paintAILive()}
 catch{if(state.liveSocketStatus!=="connected")aiLiveConnectionStatus("offline")}
 finally{state.logRefreshing=false}
},30000);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){closeAILiveSocket()}
 else if(isAILiveRoute()&&!state.demo){fetchActivityLogs().then(paintAILive).catch(()=>{});void connectAILiveSocket()}
});
$('#mobile-menu').addEventListener('click',()=>{$('#sidebar').classList.toggle('open');$('#mobile-scrim').hidden=!$('#sidebar').classList.contains('open')});$('#mobile-scrim').addEventListener('click',closeMobile);
$('#top-refresh').addEventListener('click',()=>handleAction('refresh'));$('#top-avatar').addEventListener('click',()=>location.hash='settings');$('#sidebar-signout').addEventListener('click',()=>handleAction('sign-out'));
if(isReady()&&state.session)loadLive();else render();
