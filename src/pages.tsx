import {useEffect,useMemo,useState} from "react";
import type {FormEvent,ReactNode} from "react";
import {Activity,AlertCircle,ArrowDownRight,ArrowRight,ArrowUpRight,BarChart3,Bell,Box,BrainCircuit,Check,CheckCircle2,ChevronDown,ChevronRight,Clock3,ExternalLink,Eye,FileText,Filter,Globe2,Heart,Info,Link as LinkIcon,LoaderCircle,LockKeyhole,MessageCircle,MoreHorizontal,PauseCircle,Play,Plus,RefreshCw,Search,Send,Settings2,ShieldCheck,Sparkles,TrendingUp,Wallet,Wifi,WifiOff,X,Zap} from "lucide-react";
import {Area,AreaChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {useApp} from "./App";
import {createDraft,createProduct,saveSettings,updateProduct,invokeAgent,SUPABASE_URL, SUPABASE_KEY} from "./lib/supabase";
import type {AgentSettings,JobRun,Post,Product,ShopeeConnection} from "./types";
import {date,number,STATUS_LABEL,validUrl} from "./types";

type ButtonTone="primary"|"soft"|"ghost"|"danger";
function Button({children,onClick,type="button",disabled=false,tone="soft",className=""}:{children:ReactNode;onClick?:()=>void;type?:"button"|"submit";disabled?:boolean;tone?:ButtonTone;className?:string}){return <button type={type} onClick={onClick} disabled={disabled} className={"button button-"+tone+" "+className}>{children}</button>}
function Heading({eyebrow,title,description,actions}:{eyebrow:string;title:string;description:string;actions?:ReactNode}){return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{actions}</div></div>}
function Card({children,className=""}:{children:ReactNode;className?:string}){return <section className={"card "+className}>{children}</section>}
function Status({status}:{status:string}){return <span className={"status-pill status-"+status}><span className="status-dot"/>{STATUS_LABEL[status]||status}</span>}
function Empty({title,body,icon:Icon=Box}:{title:string;body:string;icon?:typeof Box}){return <div className="empty"><Icon size={30}/><strong>{title}</strong><p>{body}</p></div>}
function Metric({label,value,subtitle,icon:Icon,variant="neutral"}:{label:string;value:string|number;subtitle:string;icon:typeof Box;variant?:"neutral"|"mint"|"blue"|"amber"}){return <article className={"card metric-card metric-"+variant}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={19}/></span></div><strong>{value}</strong><p>{subtitle}</p></article>}
function BusyButton({children,execute,disabled=false,tone="soft"}:{children:ReactNode;execute:()=>Promise<unknown>;disabled?:boolean;tone?:ButtonTone}){const [running,setRunning]=useState(false);return <Button tone={tone} disabled={running||disabled} onClick={()=>{setRunning(true);void execute().catch(()=>{}).finally(()=>setRunning(false))}}>{running?<LoaderCircle className="spin" size={16}/>:null}{children}</Button>}
function TrendChart({posts,days=30}:{posts:Post[];days?:number}){
 const chart=useMemo(()=>Array.from({length:14},(_,i)=>{const end=Date.now(),width=days*86400000/14;const from=end-(14-i)*width,to=from+width;
 const views=posts.filter(p=>p.status==="published"&&p.published_at&&new Date(p.published_at).getTime()>=from&&new Date(p.published_at).getTime()<to).reduce((n,p)=>n+(p.views||0),0);
 return {label:new Date(from).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"}),views}
 }),[posts,days]);
 const any=chart.some(p=>p.views>0);
 return <div className="chart-holder" role="img" aria-label="Xu hướng lượt xem bài đăng theo thời gian">
 <ResponsiveContainer width="100%" height={270}><AreaChart data={chart} margin={{top:10,right:12,left:-20,bottom:0}}><defs><linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#359a7b" stopOpacity={.27}/><stop offset="100%" stopColor="#359a7b" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ef" strokeDasharray="4 4"/><XAxis dataKey="label" tick={{fill:"#81928e",fontSize:11}} tickLine={false} axisLine={false} interval="preserveStartEnd"/><YAxis allowDecimals={false} tick={{fill:"#81928e",fontSize:11}} tickLine={false} axisLine={false}/><Tooltip formatter={(v:number)=>[number(v),"Lượt xem"]} contentStyle={{borderRadius:12,border:"1px solid #e3eae7",boxShadow:"0 14px 30px #10282012"}}/><Area dataKey="views" type="monotone" stroke="#308f70" strokeWidth={2.7} fill="url(#viewsGradient)" dot={false} activeDot={{r:5}}/></AreaChart></ResponsiveContainer>
 {!any&&<p className="chart-note"><Info size={15}/> Chưa có lượt xem hợp lệ trong khoảng thời gian này.</p>}
 </div>
}
function formatAction(kind:string){const names:Record<string,string>={agent_cycle:"AI Agent tự chủ",manual_ai:"Tạo nội dung AI",analytics_sync:"Đồng bộ Analytics",manual_publish:"Xuất bản Threads",reconcile:"Đối soát Threads",diagnostic:"Chẩn đoán"};return names[kind]||kind}
function formatStage(stage:string){const n:Record<string,string>={started:"Đã bắt đầu",scan_products:"Đang quét sản phẩm",select_product:"Chọn sản phẩm",read_context:"Đọc lịch sử nội dung",ai_request:"Đang gọi mô hình AI",ai_response:"AI đã phản hồi",draft_saved:"Đã lưu bản nháp",content_verified:"Đã kiểm tra nội dung",publisher_request:"Đang gửi Upload-Post",publisher_response:"Upload-Post đã nhận",await_reconcile:"Đang chờ xác nhận Threads",reconcile:"Đang đối soát",threads_published:"Threads đã xác nhận",profile_metrics:"Đọc thống kê tài khoản",memory_update:"Cập nhật bộ nhớ AI",completed:"Hoàn thành",failed:"Thất bại",no_safe_products:"Không có sản phẩm hợp lệ",duplicate:"Đã chạy hôm nay",disabled:"Agent đang tắt"};return n[stage]||stage.replaceAll("_"," ")}
function RecentRuns({limit=4}:{limit?:number}){const {data}=useApp();const rows=data.jobs.slice(0,limit);return rows.length?<div className="run-list">{rows.map(j=><a href="#live" className="run-row" key={j.id}><span className={"run-icon run-"+j.status}><Activity size={17}/></span><span className="run-copy"><strong>{formatAction(j.kind)}</strong><small>{formatStage(j.stage)} · {date(j.started_at)}</small></span><Status status={j.status}/><ChevronRight size={15}/></a>)}</div>:<Empty icon={Activity} title="Chưa có lượt chạy" body="Nhật ký AI sẽ xuất hiện sau lượt chạy đầu tiên."/>}
export function OverviewPage(){
 const {data,refresh,run,busy,liveStatus}=useApp();const [days,setDays]=useState(30);
 const published=data.posts.filter(p=>p.status==="published");const views=published.reduce((n,p)=>n+(p.views||0),0);const engagement=published.reduce((n,p)=>n+(p.likes||0)+(p.replies||0)+(p.reposts||0),0);
 const live=data.jobs.find(j=>j.status==="running"&&(j.kind==="agent_cycle"||j.kind==="manual_ai"));
 const latest=data.jobs.find(j=>j.kind==="agent_cycle"||j.kind==="manual_ai");
 return <><Heading eyebrow="MISSION CONTROL / OVERVIEW" title="Tổng quan vận hành" description="Một nơi để xem AI đã làm gì, nội dung nào đã xuất bản và hệ thống đang hoạt động ra sao." actions={<><span className="updated-label"><RefreshCw size={14}/> {data.updatedAt?data.updatedAt.toLocaleTimeString("vi-VN"):"—"}</span><BusyButton execute={refresh}><RefreshCw size={16}/> Làm mới</BusyButton></>}/>
 <div className="metrics-grid"><Metric icon={FileText} label="Bài đã xuất bản" value={number(published.length)} subtitle="Đã xác nhận trên Threads" variant="mint"/><Metric icon={Eye} label="Lượt xem ghi nhận" value={number(views)} subtitle="Số liệu riêng bài đăng" variant="blue"/><Metric icon={Heart} label="Tương tác bài đăng" value={number(engagement)} subtitle="Likes + replies + reposts"/><Metric icon={Clock3} label="Đang xử lý" value={number(data.posts.filter(p=>p.status==="processing"||p.status==="paused").length)} subtitle="Chờ xác nhận từ Upload-Post" variant="amber"/></div>
 <div className="main-columns"><div className="main-primary">
 <Card className="hero-agent"><div className="hero-agent-head"><div><span className="eyebrow light">AGENT STATUS</span><h2>AI đang {live?"làm việc":"sẵn sàng"}</h2><p>{live?live.message:latest?("Lượt gần nhất: "+formatStage(latest.stage)):"Chưa có lượt Agent nào được ghi nhận."}</p></div><span className="hero-agent-icon"><BrainCircuit size={31}/></span></div><div className="hero-agent-bottom"><div className="agent-indicator"><span className={"pulse"+(live?" on":"")}/>{live?"Đang thực thi":"Chờ lịch kế tiếp"} · {data.settings.agent_enabled?"Agent đang bật":"Agent đang tắt"}</div><a href="#live">Theo dõi AI trực tiếp <ArrowRight size={17}/></a></div>{live&&<div className="hero-progress"><span style={{width:Math.max(0,Math.min(100,live.progress||0))+"%"}}/></div>}</Card>
 <Card className="chart-card"><div className="section-head"><div><span className="eyebrow">PERFORMANCE</span><h2>Xu hướng lượt xem</h2><p>Tổng hợp từ các bài Threads đã xuất bản</p></div><select aria-label="Khoảng thời gian" className="select-inline" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option></select></div><TrendChart posts={data.posts} days={days}/></Card>
 </div><div className="main-aside"><Card className="quick-card"><div className="section-head"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Thao tác nhanh</h2></div></div><div className="quick-actions"><a href="#posts"><span><SquarePenIcon/></span><div><strong>Quản lý bài viết</strong><small>Tạo, duyệt và xuất bản</small></div><ArrowRight size={16}/></a><a href="#products"><span><Box size={20}/></span><div><strong>Kho sản phẩm</strong><small>Sản phẩm affiliate</small></div><ArrowRight size={16}/></a><a href="#automation"><span><Settings2 size={20}/></span><div><strong>Điều khiển Agent</strong><small>Mô hình & lịch tự chạy</small></div><ArrowRight size={16}/></a></div></Card><Card><div className="section-head"><div><span className="eyebrow">LATEST EXECUTIONS</span><h2>Hoạt động gần đây</h2></div><a className="subtle-link" href="#live">Xem tất cả <ArrowRight size={14}/></a></div><RecentRuns limit={4}/></Card></div></div>
 <div className="data-provenance"><ShieldCheck size={16}/> Dữ liệu thật từ Supabase. Không sử dụng chỉ số hoặc hiệu suất mô phỏng. <span className={"connection-small "+(liveStatus==="SUBSCRIBED"?"online":"")}>{liveStatus==="SUBSCRIBED"?"Realtime đang kết nối":"Đang sử dụng dữ liệu đã tải"}</span></div>
 </>;
}
function SquarePenIcon(){return <FileText size={20}/>}

export function LivePage(){
 const {data,liveStatus,refresh}=useApp();const [selected,setSelected]=useState<string|null>(null);
 const aiJobs=data.jobs.filter(j=>j.kind==="agent_cycle"||j.kind==="manual_ai");
 const current=aiJobs.find(j=>j.id===selected)||aiJobs.find(j=>j.status==="running")||aiJobs[0];
 const post=data.posts.find(p=>p.id===current?.post_id),product=data.products.find(p=>p.id===current?.product_id);
 const logs=data.logs.filter(l=>l.job_run_id===current?.id).sort((a,b)=>Date.parse(a.created_at)-Date.parse(b.created_at));
 const has=(s:string)=>logs.some(l=>l.stage===s);
 const steps=[{name:"Chọn sản phẩm",start:"scan_products",end:"select_product"},{name:"Đọc ngữ cảnh",start:"read_context",end:"read_context"},{name:"Tạo nội dung bằng AI",start:"ai_request",end:"ai_response"},{name:"Lưu bản nháp",start:"draft_saved",end:"draft_saved"},{name:"Kiểm tra nội dung",start:"content_verified",end:"content_verified"},{name:"Gửi tới Upload-Post",start:"publisher_request",end:"publisher_response"},{name:"Xác minh Threads",start:"await_reconcile",end:"threads_published"}];
 const p=current?Math.max(0,Math.min(100,current.progress||0)):0;
 return <><Heading eyebrow="AI EXECUTION / REALTIME" title="AI đang làm gì?" description="Quan sát từng mốc xử lý được ghi nhận bởi backend — không phải suy luận nội bộ của mô hình." actions={<><span className={"live-connection "+(liveStatus==="SUBSCRIBED"?"live":"")}><span className="pulse"/>{liveStatus==="SUBSCRIBED"?"Đã kết nối Realtime":"Đang tải lại định kỳ"}</span><BusyButton execute={refresh}><RefreshCw size={16}/> Đồng bộ</BusyButton></>}/>
 {!current?<Card><Empty icon={BrainCircuit} title="Chưa có lượt AI nào" body="Các bước xử lý sẽ xuất hiện khi AI chạy theo lịch hoặc khi bạn yêu cầu tạo bài."/><div className="center-link"><a href="#automation" className="button button-primary">Mở điều khiển AI <ArrowRight size={16}/></a></div></Card>:
 <div className="live-grid"><Card className="live-main"><div className="live-head"><div><span className="eyebrow">CURRENT EXECUTION</span><h2>{formatAction(current.kind)}</h2><p>Khởi chạy lúc {date(current.started_at)} · {current.trigger_source==="cron"?"Tự động theo lịch":"Thủ công"}</p></div><Status status={current.status}/></div><div className="live-message"><span className={"live-glyph "+(current.status==="running"?"working":"")}><BrainCircuit size={26}/></span><div><strong>{formatStage(current.stage)}</strong><p>{current.message}</p></div></div><div className="progress-line"><div className="progress-track"><span style={{width:p+"%"}}/></div><b>{p}%</b></div>
 <div className="live-meta">{product&&<span><Box size={14}/> {product.title}</span>}<span><Clock3 size={14}/> {date(current.updated_at)}</span></div>
 <div className="live-process"><h3>Tiến trình thực thi</h3><ol className="step-list">{steps.map((step,i)=>{
   const started=has(step.start)||has(step.end),done=has(step.end);let status=done?"done":started?"active":"pending";
   if(i===6){status=post?.status==="published"?"done":post?.status==="failed"?"error":has("publisher_response")?"waiting":"pending"}
   if(current.status!=="running"&&status==="active")status=current.status==="failed"?"error":"waiting";
   const time=logs.findLast(e=>e.stage===step.end)?.created_at||logs.findLast(e=>e.stage===step.start)?.created_at;
   return <li className={"workflow-step "+status} key={step.name}><span className="workflow-marker">{status==="done"?<Check size={16}/>:String(i+1).padStart(2,"0")}</span><div><div className="workflow-step-title"><strong>{step.name}</strong>{time&&<time>{date(time)}</time>}</div><p>{i===2&&status==="active"?"Đang chờ AI phản hồi; không thể xem suy luận nội bộ.":i===6&&status==="waiting"?"Đã gửi Upload-Post, đang chờ Threads xác nhận.":status==="done"?"Đã ghi nhận hoàn tất":status==="active"?"Đang thực hiện":status==="error"?"Cần kiểm tra lỗi":status==="pending"?"Chưa tới bước này":"Đang chờ xử lý"}</p></div></li>
 })}</ol></div>
 {post?.content&&<div className="draft-preview"><div className="section-head"><div><span className="eyebrow">GENERATED CONTENT</span><h3>Nội dung AI đã lưu</h3></div><a href="#posts" className="subtle-link">Mở bài viết <ArrowRight size={15}/></a></div><p>{post.content}</p></div>}
 </Card><div className="live-side"><Card><div className="section-head"><div><span className="eyebrow">EXECUTION HISTORY</span><h2>Các lượt AI gần đây</h2></div></div><div className="job-history">{aiJobs.slice(0,12).map(j=><button key={j.id} className={"job-history-item"+(j.id===current.id?" selected":"")} aria-pressed={j.id===current.id} onClick={()=>setSelected(j.id)}><span className="history-icon"><BrainCircuit size={18}/></span><span><strong>{formatAction(j.kind)}</strong><small>{date(j.started_at)} · {STATUS_LABEL[j.status]||j.status}</small></span><ChevronRight size={16}/></button>)}</div></Card><Card className="info-card"><Info size={20}/><strong>Realtime là tiến độ thật</strong><p>Hệ thống cập nhật khi Supabase ghi một bước mới. Khi AI API đang xử lý, màn hình không thể hiển thị nội dung suy luận ẩn hoặc tốc độ sinh token.</p></Card></div></div>}
 </>;
}
function PostModal({close,onSaved,products,ai=false}:{close:()=>void;onSaved:()=>Promise<void>;products:Product[];ai?:boolean}){
 const {session,run,notify}=useApp();const [content,setContent]=useState("");const [productId,setProductId]=useState(products.find(p=>p.status==="active")?.id||"");const [submitting,setSubmitting]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();if(!session)return;setSubmitting(true);try{
  if(ai){if(!productId)throw new Error("Chưa có sản phẩm hợp lệ.");await run("generate",{productId},"AI đã tạo bản nháp.")}
  else{if(!content.trim())throw new Error("Nội dung không được trống.");await createDraft(session.user.id,content.trim());notify("Đã lưu bản nháp.");}
  await onSaved();close();
 }catch(err){notify(err instanceof Error?err.message:"Không lưu được bài viết","error")}finally{setSubmitting(false)}}
 return <div className="modal-overlay" onMouseDown={e=>{if(e.currentTarget===e.target)close()}}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="post-dialog-title"><div className="dialog-head"><div><span className="eyebrow">{ai?"AI CONTENT GENERATION":"NEW DRAFT"}</span><h2 id="post-dialog-title">{ai?"Tạo nội dung bằng AI":"Tạo bản nháp"}</h2></div><button className="icon-button" aria-label="Đóng" onClick={close}><X size={19}/></button></div><form onSubmit={submit}><div className="dialog-body">{ai?<><label htmlFor="draft-product">Sản phẩm affiliate</label><select id="draft-product" value={productId} required onChange={e=>setProductId(e.target.value)}>{products.filter(p=>p.status==="active").map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select><p className="field-help">AI sẽ tạo bản nháp dựa trên thông tin sản phẩm và lưu vào Supabase.</p></>:<><label htmlFor="draft-content">Nội dung Threads</label><textarea rows={7} id="draft-content" required maxLength={5000} value={content} onChange={e=>setContent(e.target.value)} placeholder="Viết bài Threads của bạn…"/></>}</div><div className="dialog-actions"><Button onClick={close}>Hủy</Button><Button tone="primary" type="submit" disabled={submitting}>{submitting?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} {ai?"Tạo bản nháp AI":"Lưu bản nháp"}</Button></div></form></div></div>
}
export function PostsPage(){
 const {data,run,refresh,busy}=useApp();const [query,setQuery]=useState("");const [status,setStatus]=useState("all");const [modal,setModal]=useState<"ai"|"manual"|null>(null);const [expanded,setExpanded]=useState<string|null>(null);
 const filtered=data.posts.filter(p=>(status==="all"||p.status===status)&&p.content.toLowerCase().includes(query.toLowerCase()));
 async function publish(p:Post){if(!window.confirm("Gửi bài này lên Threads qua Upload-Post? Bài có thể được công khai và không thể hoàn tác từ dashboard."))return;await run("publish",{postId:p.id,confirm:true},"Đã gửi yêu cầu Upload-Post; chờ đối soát.")}
 return <><Heading eyebrow="CONTENT LIBRARY" title="Quản lý bài đăng" description="Từ bản nháp đến xuất bản Threads. Mỗi trạng thái đều được lưu ở Supabase." actions={<><Button onClick={()=>setModal("ai")}><Sparkles size={17}/> AI tạo nháp</Button><Button tone="primary" onClick={()=>setModal("manual")}><Plus size={17}/> Bản nháp mới</Button></>}/>
 <Card><div className="table-toolbar"><div className="search-box"><Search size={17}/><input aria-label="Tìm nội dung" placeholder="Tìm nội dung bài đăng…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filter-pills" role="group" aria-label="Lọc trạng thái">{[["all","Tất cả"],["draft","Bản nháp"],["processing","Đang xử lý"],["published","Đã đăng"],["failed","Thất bại"]].map(([key,label])=><button key={key} className={status===key?"active":""} aria-pressed={status===key} onClick={()=>setStatus(key)}>{label}</button>)}</div></div>
 {filtered.length===0?<Empty icon={FileText} title="Chưa có bài viết phù hợp" body="Tạo bài nháp hoặc chọn bộ lọc khác để tiếp tục."/>:<div className="table-scroll"><table className="data-table"><thead><tr><th>Nội dung</th><th>Trạng thái</th><th>Nguồn</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><button className="table-main-text" onClick={()=>setExpanded(expanded===p.id?null:p.id)} aria-expanded={expanded===p.id}>{p.content.slice(0,140)}{p.content.length>140?"…":""}<ChevronDown size={14}/></button>{expanded===p.id&&<div className="expanded-content">{p.content}{p.last_error&&<p className="text-error">Lỗi: {p.last_error}</p>}</div>}</td><td><Status status={p.status}/></td><td><span className="data-source">{p.provider||"—"}</span></td><td className="muted-cell">{date(p.created_at)}</td><td><div className="row-actions">{p.status==="draft"&&<BusyButton disabled={busy} execute={()=>publish(p)} tone="primary"><Send size={15}/> Đăng</BusyButton>}{["processing","paused"].includes(p.status)&&p.upload_post_request_id&&<BusyButton execute={()=>run("reconcile",{postId:p.id},"Đã cập nhật đối soát.")}><RefreshCw size={15}/> Đối soát</BusyButton>}{p.status==="published"&&<span className="published-text"><CheckCircle2 size={17}/> Đã xác nhận</span>}</div></td></tr>)}</tbody></table></div>}
 <div className="table-footer">{filtered.length} / {data.posts.length} bài · Yêu cầu đăng được xử lý phía Supabase Edge Function.</div></Card>
 {modal&&<PostModal ai={modal==="ai"} close={()=>setModal(null)} onSaved={refresh} products={data.products}/>}
 </>;
}
function ProductModal({close,onSaved,product}:{close:()=>void;onSaved:()=>Promise<void>;product?:Product}){
 const {session,notify}=useApp();const [title,setTitle]=useState(product?.title||"");const [category,setCategory]=useState(product?.category||"");const [price,setPrice]=useState(String(product?.price||0));const [url,setUrl]=useState(product?.affiliate_url||"");const [pending,setPending]=useState(false);const [error,setError]=useState("");
 const submit=async(e:FormEvent)=>{e.preventDefault();if(!session)return;if(!validUrl(url)){setError("Liên kết affiliate cần sử dụng HTTPS hợp lệ.");return}setError("");setPending(true);const input={title:title.trim(),category:category.trim(),price:Number(price),affiliate_url:url.trim()};try{if(product)await updateProduct(product.id,session.user.id,input);else await createProduct(session.user.id,input);await onSaved();notify("Đã lưu thông tin sản phẩm.");close()}catch(err){setError(err instanceof Error?err.message:"Không lưu được sản phẩm")}finally{setPending(false)}};
 return <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title"><div className="dialog-head"><div><span className="eyebrow">AFFILIATE CATALOG</span><h2 id="product-dialog-title">{product?"Cập nhật sản phẩm":"Thêm sản phẩm affiliate"}</h2></div><button className="icon-button" aria-label="Đóng" onClick={close}><X size={19}/></button></div><form onSubmit={submit}><div className="dialog-body"><label htmlFor="product-name">Tên sản phẩm</label><input id="product-name" required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}/><div className="fields-two"><div><label htmlFor="product-category">Danh mục</label><input id="product-category" value={category} onChange={e=>setCategory(e.target.value)}/></div><div><label htmlFor="product-price">Giá (VND)</label><input id="product-price" type="number" required min="0" value={price} onChange={e=>setPrice(e.target.value)}/></div></div><label htmlFor="product-url">Liên kết affiliate HTTPS</label><input type="url" id="product-url" required placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)}/><p className="field-help">Chỉ nhập link affiliate được cấp cho tài khoản của bạn. tAI không tự thêm mã hoa hồng.</p>{error&&<p className="form-error" role="alert">{error}</p>}</div><div className="dialog-actions"><Button onClick={close}>Hủy</Button><Button type="submit" tone="primary" disabled={pending}>{pending?<LoaderCircle size={16} className="spin"/>:<Check size={16}/>} Lưu sản phẩm</Button></div></form></div></div>
}
export function ProductsPage(){
 const {data,refresh}=useApp();const [query,setQuery]=useState("");const [editing,setEditing]=useState<Product|null>(null);const [open,setOpen]=useState(false);
 const products=data.products.filter(p=>(p.title+" "+(p.category||"")).toLowerCase().includes(query.toLowerCase()));
 return <><Heading eyebrow="AFFILIATE CATALOG" title="Kho sản phẩm" description="Nguồn dữ liệu AI sử dụng để lựa chọn sản phẩm và tạo nội dung." actions={<Button tone="primary" onClick={()=>{setEditing(null);setOpen(true)}}><Plus size={17}/> Thêm sản phẩm</Button>}/>
 <div className="table-toolbar product-toolbar"><div className="search-box"><Search size={18}/><input placeholder="Tìm sản phẩm hoặc danh mục…" aria-label="Tìm sản phẩm" value={query} onChange={e=>setQuery(e.target.value)}/></div><span className="catalog-count">{products.length} sản phẩm</span></div>
 {products.length?<div className="products-grid">{products.map(p=><article className="card product-card" key={p.id}><div className="product-illustration"><Box size={36}/><span className="mini-chip">AFFILIATE</span></div><div className="product-content"><span className="product-category">{p.category||"Chưa phân loại"}</span><h3>{p.title}</h3><div className="product-value">{p.price!=null?number(p.price)+" ₫":"Chưa có giá"}</div><div className="product-foot"><a className="subtle-link" href={validUrl(p.affiliate_url)?p.affiliate_url:"#"} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Link affiliate</a><Button onClick={()=>{setEditing(p);setOpen(true)}}><Settings2 size={15}/> Sửa</Button></div></div></article>)}</div>:<Card><Empty title="Chưa có sản phẩm" body="Thêm sản phẩm affiliate hợp lệ để AI có thể bắt đầu lựa chọn nội dung." icon={Box}/></Card>}
 {open&&<ProductModal product={editing||undefined} onSaved={refresh} close={()=>setOpen(false)}/>}
 </>;
}
export function AnalyticsPage(){
 const {data,refresh,run}=useApp();const p=data.profile;
 const published=data.posts.filter(x=>x.status==="published");
 const views=published.reduce((n,x)=>n+(x.views||0),0),engagement=published.reduce((n,x)=>n+(x.likes||0)+(x.replies||0)+(x.reposts||0),0);
 return <><Heading eyebrow="AUDIENCE INTELLIGENCE" title="Phân tích hiệu quả" description="Phân biệt số liệu cấp tài khoản Upload-Post và số liệu riêng từng bài Threads." actions={<BusyButton execute={()=>run("profile-sync",{},"Đã yêu cầu đồng bộ Upload-Post.")} tone="primary"><RefreshCw size={16}/> Đồng bộ Upload-Post</BusyButton>}/>
 <div className="analytics-source"><span className="analytics-source-icon"><Globe2 size={20}/></span><div><strong>Upload-Post · Threads</strong><p>Dữ liệu từ profile <b>{p?.profile_username||"default"}</b> · Cập nhật {date(p?.fetched_at)}</p></div><Status status={p?"completed":"paused"}/></div>
 <div className="metrics-grid"><Metric icon={Activity} label="Followers" value={number(p?.followers)} subtitle="Người theo dõi cấp tài khoản" variant="mint"/><Metric icon={Eye} label="Impressions · 7 ngày" value={number(p?.weekly_impressions)} subtitle={p?.week_start&&p?.week_end?p.week_start+" → "+p.week_end:"Chưa có kỳ báo cáo"} variant="blue"/><Metric icon={Heart} label="Likes cấp tài khoản" value={number(p?.likes)} subtitle="Số liệu Upload-Post"/><Metric icon={LinkIcon} label="Link clicks" value={number(p?.clicks)} subtitle="Số lượt click được báo cáo" variant="amber"/></div>
 <Card className="analytics-warning"><Info size={20}/><div><strong>Không cộng nhầm số liệu</strong><p>Impressions của profile không phải lượt xem riêng từng bài. Nếu Upload-Post chưa cung cấp metric riêng bài, màn hình sẽ hiển thị “—” thay vì giả định bằng 0.</p></div></Card>
 <div className="main-columns analytics-columns"><Card><div className="section-head"><div><span className="eyebrow">POST PERFORMANCE</span><h2>Lượt xem từng bài</h2><p>{published.length} bài đã được xác nhận xuất bản</p></div></div><TrendChart posts={published}/></Card><Card><div className="section-head"><div><span className="eyebrow">ENGAGEMENT</span><h2>Tương tác ghi nhận</h2></div></div><div className="engagement-summary"><div><Heart size={22}/><strong>{number(engagement)}</strong><span>Tổng lượt tương tác</span></div><div><Eye size={22}/><strong>{number(views)}</strong><span>Tổng lượt xem</span></div></div><p className="field-help">Chỉ tính từ dữ liệu bài đã được API trả về.</p></Card></div>
 </>;
}
export function AutomationPage(){
 const {data,session,run,notify,refresh,busy}=useApp();
 const [cfg,setCfg]=useState<AgentSettings>({...data.settings});const [saving,setSaving]=useState(false);
 useEffect(()=>setCfg({...data.settings}),[data.settings]);
 const set=<K extends keyof AgentSettings,>(k:K,v:AgentSettings[K])=>setCfg(prev=>({...prev,[k]:v}));
 async function save(){if(!session)return;if(cfg.model===cfg.fallback){notify("AI chính và AI dự phòng phải khác nhau.","error");return}
 const isAutopublish=cfg.agent_enabled&&cfg.agent_mode==="publish"&&cfg.auto_publish&&!cfg.require_review;
 if(isAutopublish&&!window.confirm("Xác nhận bật tự đăng Threads công khai không qua duyệt? Hãy chắc chắn tài khoản Upload-Post và sản phẩm affiliate đã đúng."))return;
 setSaving(true);try{await saveSettings(session.user.id,{...cfg,daily_limit:Math.max(0,Math.min(1,Number(cfg.daily_limit)))});await refresh();notify("Đã lưu cấu hình Agent.")}catch(e){notify(e instanceof Error?e.message:"Không lưu được cấu hình","error")}finally{setSaving(false)}}
 const autopub=cfg.agent_enabled&&cfg.agent_mode==="publish"&&cfg.auto_publish&&!cfg.require_review;
 async function runNow(){if(!window.confirm(autopub?"Chạy AI ngay? Agent có thể đăng bài công khai lên Threads theo cấu hình hiện tại.":"Chạy AI ngay? Hành động có thể sử dụng hạn mức API AI và chỉ chạy tối đa 1 lần/ngày."))return;await run("agent-tick",{},"Đã hoàn thành yêu cầu chạy Agent.")}
 return <><Heading eyebrow="AGENT CONTROL CENTER" title="AI & Tự động hóa" description="Cấu hình quy trình vận hành, mô hình AI và điều kiện xuất bản an toàn." actions={<BusyButton tone="primary" disabled={saving} execute={save}><Check size={16}/> Lưu cấu hình</BusyButton>}/>
 <div className="settings-columns"><div className="settings-primary"><Card><div className="settings-card-header"><span className="settings-symbol"><BrainCircuit size={23}/></span><div><h2>Quy trình AI Agent</h2><p>Điều khiển bộ lập lịch tự chủ trong Supabase</p></div><Status status={cfg.agent_enabled?"running":"paused"}/></div>
 <div className="setting-toggle"><div><strong>Cho phép Agent tự chạy</strong><p>Bật lịch tạo nội dung hằng ngày. Có thể tắt bất cứ lúc nào.</p></div><label className="switch"><input type="checkbox" checked={cfg.agent_enabled} onChange={e=>set("agent_enabled",e.target.checked)}/><span/></label></div>
 <div className="field-group"><label htmlFor="agent-mode">Chế độ vận hành</label><select id="agent-mode" value={cfg.agent_mode} onChange={e=>set("agent_mode",e.target.value as "draft"|"publish")}><option value="draft">Tự chọn sản phẩm + tạo bản nháp</option><option value="publish">Tạo nội dung + tự đăng Threads</option></select><p className="field-help">Chế độ tự đăng chỉ hoạt động khi đồng thời bật tự động xuất bản và tắt duyệt trước.</p></div>
 <div className="setting-toggle"><div><strong>Tự động xuất bản</strong><p>Cho phép gửi nội dung qua Upload-Post.</p></div><label className="switch"><input type="checkbox" checked={cfg.auto_publish} onChange={e=>set("auto_publish",e.target.checked)}/><span/></label></div>
 <div className="setting-toggle"><div><strong>Yêu cầu duyệt trước khi đăng</strong><p>Nên bật trong giai đoạn thử nghiệm.</p></div><label className="switch"><input type="checkbox" checked={cfg.require_review} onChange={e=>set("require_review",e.target.checked)}/><span/></label></div>
 {autopub&&<div className="warning-callout"><AlertCircle size={19}/><span>Đang cấu hình đăng công khai không qua phê duyệt. Hãy xác nhận sản phẩm và profile Threads chính xác.</span></div>}
 <div className="safe-callout"><ShieldCheck size={18}/> Giới hạn an toàn phía backend: một lần tạo nội dung mỗi ngày, chống chạy trùng theo ngày và chặn URL demo/test.</div>
 <BusyButton execute={runNow} disabled={busy}><Play size={16}/> Chạy AI Agent ngay</BusyButton>
 </Card>
 <Card><div className="settings-card-header"><span className="settings-symbol neutral"><Zap size={23}/></span><div><h2>Mô hình AI</h2><p>Nhà cung cấp chính và phương án dự phòng</p></div></div><div className="fields-two"><div className="field-group"><label htmlFor="model-main">Mô hình chính</label><select id="model-main" value={cfg.model} onChange={e=>set("model",e.target.value as "gemini"|"groq")}><option value="gemini">Google Gemini</option><option value="groq">Groq</option></select></div><div className="field-group"><label htmlFor="model-fallback">Dự phòng</label><select id="model-fallback" value={cfg.fallback} onChange={e=>set("fallback",e.target.value as "gemini"|"groq")}><option value="groq">Groq</option><option value="gemini">Google Gemini</option></select></div></div><div className="field-group"><label htmlFor="ai-prompt">Chỉ dẫn nội dung bổ sung</label><textarea id="ai-prompt" rows={4} value={String(cfg.prompt||"")} onChange={e=>set("prompt",e.target.value)} placeholder="Ví dụ: Ưu tiên nội dung hữu ích, không lặp lại mở bài…"/></div></Card>
 </div><aside className="settings-aside"><Card><span className="eyebrow">SCHEDULED AUTOMATION</span><h2>Lịch trình tự động</h2><div className="schedule-list"><div><span className="schedule-icon"><Clock3 size={19}/></span><span><strong>10:10</strong><small>AI tạo nội dung hằng ngày</small></span></div><div><span className="schedule-icon"><BarChart3 size={19}/></span><span><strong>19:20</strong><small>Phân tích & cập nhật Memory</small></span></div><div><span className="schedule-icon"><RefreshCw size={19}/></span><span><strong>30 phút/lần</strong><small>Đối soát Upload-Post</small></span></div></div><p className="field-help">Giờ Việt Nam · Các Cron job chạy tại Supabase, kể cả khi đóng dashboard.</p></Card><Card><span className="eyebrow">LAST AGENT EXECUTION</span><h2>Lượt xử lý gần nhất</h2>{data.agentRuns[0]?<div className="agent-run-mini"><Status status={data.agentRuns[0].status}/><strong>{data.agentRuns[0].slot_date}</strong><p>{data.agentRuns[0].note||"Không có ghi chú"}</p></div>:<Empty title="Chưa có lượt chạy" body="Lịch sử sẽ xuất hiện khi Agent hoạt động." icon={Activity}/>}<a href="#live" className="button button-soft button-block">Xem tiến trình <ArrowRight size={16}/></a></Card></aside></div>
 </>;
}
export function SettingsPage(){
 const {session,liveStatus}=useApp();return <><Heading eyebrow="WORKSPACE / SETTINGS" title="Cài đặt & kết nối" description="Thông tin dự án, trạng thái xác thực và bảo mật hệ thống."/>
 <div className="settings-columns"><Card><div className="settings-card-header"><span className="settings-symbol"><ShieldCheck size={22}/></span><div><h2>Phiên đăng nhập</h2><p>Supabase Auth · RLS</p></div><Status status="completed"/></div><div className="details-list"><div><span>Email</span><strong>{session?.user.email||"—"}</strong></div><div><span>User ID</span><code>{session?.user.id||"—"}</code></div><div><span>Realtime</span><strong>{liveStatus==="SUBSCRIBED"?"Đang kết nối":"Đang dự phòng tải lại"}</strong></div></div></Card><Card><div className="settings-card-header"><span className="settings-symbol neutral"><Globe2 size={22}/></span><div><h2>Hạ tầng hoạt động</h2><p>Hosting tĩnh miễn phí trên Cloudflare Pages</p></div></div><div className="details-list"><div><span>Frontend</span><strong>React 18 · Vite 5 · TypeScript</strong></div><div><span>Supabase Project</span><code>{SUPABASE_URL}</code></div><div><span>Client API Key</span><strong>Publishable Key (công khai)</strong></div><div><span>AI / Upload-Post secrets</span><strong>Chỉ lưu tại Supabase Edge Secrets</strong></div></div><div className="safe-callout"><LockKeyhole size={17}/> Giao diện không truy cập service_role hoặc khóa API riêng tư.</div></Card></div>
 </>;
}

export function ShopeePage(){
 const {data,run,refresh,session,notify,busy}=useApp();
 const [connection,setConnection]=useState<ShopeeConnection|null>(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [enabled,setEnabled]=useState(data.settings.shopee_enabled===true);
 const [autoImport,setAutoImport]=useState(data.settings.shopee_auto_import===true);
 const [terms,setTerms]=useState((data.settings.shopee_keywords||["chăm sóc da","đồ gia dụng"]).join(", "));
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("all");
 useEffect(()=>{
   let active=true;setLoading(true);
   invokeAgent<ShopeeConnection>("shopee-status").then(x=>{if(active)setConnection(x)})
    .catch(()=>{if(active)setConnection(null)}).finally(()=>{if(active)setLoading(false)});
   return()=>{active=false};
 },[data.shopeeOffers.length]);
 useEffect(()=>{
  setEnabled(data.settings.shopee_enabled===true);
  setAutoImport(data.settings.shopee_auto_import===true);
  setTerms((data.settings.shopee_keywords||["chăm sóc da","đồ gia dụng"]).join(", "));
 },[data.settings.shopee_enabled,data.settings.shopee_auto_import,data.settings.shopee_keywords?.join("|")]);
 const records=data.shopeeOffers.filter(o=>
   (filter==="all"||o.status===filter)&&
   (o.product_name+" "+o.shop_name+" "+o.keyword).toLowerCase().includes(query.toLowerCase()));
 const ready=connection?.configured===true;
 const linked=data.shopeeOffers.filter(o=>o.affiliate_url&&o.status!=="rejected").length;
 async function saveConfig(){
   if(!session)return;
   const kw=[...new Set(terms.split(",").map(x=>x.trim()).filter(x=>x.length>=3))].slice(0,3);
   if(!kw.length){notify("Cần ít nhất một từ khóa từ 3 ký tự.","error");return}
   if(autoImport&&enabled&&!window.confirm("Bật tự nhập sản phẩm Shopee đã xác minh link vào kho tAI? Agent hiện tại có thể tự đăng sản phẩm đó trên Threads trong lượt kế tiếp."))return;
   setSaving(true);
   try{
     await saveSettings(session.user.id,{...data.settings,shopee_enabled:enabled,shopee_auto_import:autoImport,shopee_keywords:kw});
     await refresh();notify("Đã lưu cấu hình Shopee Discovery.");
   }catch(err){notify(err instanceof Error?err.message:"Không lưu được cấu hình Shopee","error")}
   finally{setSaving(false)}
 }
 async function discover(){
   const r=await run("shopee-discover");
   if(r.ok===false&&r.reason==="missing_credentials"){
     notify("Chưa có Shopee App ID/Secret trong Supabase Secrets.","error");return;
   }
   notify("Shopee: đã tìm "+String(r.found??0)+" offer và lưu "+String(r.saved??0)+" cơ hội.");
 }
 async function importOffer(id:string){
   if(!window.confirm("Tạo link affiliate chính thức qua Shopee và thêm sản phẩm này vào kho tAI? Nếu Agent đang tự đăng, sản phẩm có thể được chọn ở kỳ tiếp theo."))return;
   await run("shopee-import",{opportunityId:id},"Đã yêu cầu Shopee tạo link và nhập sản phẩm vào tAI.");
 }
 async function reject(id:string){
   if(!window.confirm("Loại cơ hội này khỏi danh sách lựa chọn?"))return;
   await run("shopee-reject",{opportunityId:id},"Đã loại cơ hội Shopee.");
 }
 return <>
  <Heading eyebrow="AUTONOMOUS AFFILIATE / PHASE 01" title="Shopee Discovery"
    description="AI tự tìm offer, đánh giá hoa hồng và tạo link affiliate được Shopee cấp — không sử dụng link giả."
    actions={<><BusyButton execute={refresh}><RefreshCw size={16}/> Làm mới</BusyButton>
    <BusyButton execute={discover} disabled={!ready||busy} tone="primary"><Search size={16}/> Tìm sản phẩm ngay</BusyButton></>}/>
  <div className={"shopee-connection "+(ready?"ready":"pending")}>
    <div className="shopee-connection-icon">{ready?<CheckCircle2 size={25}/>:<LockKeyhole size={25}/>}</div>
    <div><span className="eyebrow">SHOPEE AFFILIATE OPEN API</span>
      <strong>{loading?"Đang kiểm tra kết nối...":ready?"Đã cấu hình App ID + Secret":"Chưa kết nối Shopee Open API"}</strong>
      <p>{ready?"Khóa được giữ phía Supabase Edge Function. Có thể dùng nút tìm sản phẩm để kiểm tra quyền Open API.":"Hệ thống chưa có bằng chứng Shopee App ID/Secret. Chưa thể tự tìm offer hoặc tạo link nhận hoa hồng."}</p></div>
    <a href="https://affiliate.shopee.vn/open_api/list" target="_blank" rel="noopener noreferrer" className="button button-soft">Shopee Open API <ExternalLink size={15}/></a>
  </div>
  <div className="metrics-grid">
    <Metric label="Cơ hội từ Shopee" value={number(data.shopeeOffers.length)} subtitle="Lưu từ API chính thức" icon={Box} variant="mint"/>
    <Metric label="Link đã tạo" value={number(linked)} subtitle="Short link được xác minh" icon={LinkIcon} variant="blue"/>
    <Metric label="Đã nhập kho tAI" value={number(data.shopeeOffers.filter(o=>o.status==="imported").length)} subtitle="Sẵn sàng cho Content Agent" icon={CheckCircle2}/>
    <Metric label="Tự động tìm hàng ngày" value={connection?.enabled?"Đang bật":"Đang tắt"} subtitle="08:30 giờ Việt Nam" icon={Clock3} variant="amber"/>
  </div>
  <div className="shopee-grid">
   <div className="shopee-primary">
    <Card>
     <div className="section-head shopee-section-head"><div><span className="eyebrow">DISCOVERED OPPORTUNITIES</span><h2>Danh sách sản phẩm tìm được</h2><p>Chỉ gồm dữ liệu do Shopee API trả về.</p></div></div>
     <div className="table-toolbar"><div className="search-box"><Search size={16}/>
       <input aria-label="Tìm cơ hội Shopee" placeholder="Tìm sản phẩm, shop hoặc từ khóa..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
       <select aria-label="Lọc cơ hội" value={filter} onChange={e=>setFilter(e.target.value)}>
         <option value="all">Tất cả</option><option value="discovered">Mới tìm thấy</option>
         <option value="linked">Đã tạo link</option><option value="imported">Đã nhập tAI</option>
         <option value="rejected">Đã loại</option></select>
     </div>
     {records.length?<div className="shopee-list">{records.map(o=>
       <article className="shopee-offer" key={o.id}>
        <div className="shopee-offer-top"><div className="shopee-score"><strong>{o.score}</strong><small>/100</small></div>
         <div className="shopee-offer-main"><h3>{o.product_name}</h3><p>{o.shop_name||"Shop Shopee"} · {o.keyword}</p>
           <div className="shopee-offer-details"><span>Hoa hồng <b>{o.commission_rate===null?"—":(o.commission_rate*100).toLocaleString("vi-VN",{maximumFractionDigits:2})+"%"}</b></span>
            <span>Giá <b>{o.price_vnd===null?"—":number(o.price_vnd)+" ₫"}</b></span>
            <span>Đã bán <b>{number(o.sales)}</b></span></div></div>
        </div>
        <div className="shopee-offer-foot"><Status status={o.status}/>
         <a href={o.product_url||"#"} target="_blank" rel="noopener noreferrer" className="subtle-link"><ExternalLink size={14}/> Sản phẩm</a>
         {o.affiliate_url&&<a href={o.affiliate_url} target="_blank" rel="noopener noreferrer" className="subtle-link"><LinkIcon size={14}/> Affiliate link</a>}
         {o.status!=="imported"&&o.status!=="rejected"&&<BusyButton disabled={!ready} execute={()=>importOffer(o.id)} tone="primary"><Plus size={14}/> Tạo link & nhập</BusyButton>}
         {o.status==="discovered"&&<BusyButton execute={()=>reject(o.id)}>Loại</BusyButton>}
        </div>
       </article>)}</div>:
       <Empty icon={Search} title="Chưa có cơ hội Shopee"
         body={ready?"Nhấn “Tìm sản phẩm ngay” để gọi API và chấm điểm các offer.":"Cần được Shopee cấp quyền Open API và cấu hình credentials phía server trước khi có dữ liệu thật."}/>}
    </Card>
   </div>
   <div className="shopee-side">
    <Card>
     <div className="settings-card-header"><span className="settings-symbol"><BrainCircuit size={22}/></span><div><h2>Discovery Agent</h2><p>Thiết lập tự tìm và nhập sản phẩm</p></div></div>
     <div className="setting-toggle"><div><strong>Tự tìm offer mỗi ngày</strong><p>Chạy lúc 08:30 qua Supabase Cron.</p></div>
       <label className="switch"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} aria-label="Bật Shopee Discovery hằng ngày"/><span/></label></div>
     <div className="setting-toggle"><div><strong>Tự tạo link và nhập sản phẩm</strong><p>Tối đa một sản phẩm phù hợp mỗi lượt, chỉ dùng link Shopee cấp.</p></div>
       <label className="switch"><input type="checkbox" checked={autoImport} onChange={e=>setAutoImport(e.target.checked)} aria-label="Tự nhập sản phẩm Shopee vào tAI"/><span/></label></div>
     <div className="field-group"><label htmlFor="shopee-keywords">Từ khóa tìm kiếm (tối đa 3)</label>
       <textarea id="shopee-keywords" rows={3} value={terms} onChange={e=>setTerms(e.target.value)} placeholder="chăm sóc da, đồ gia dụng"/>
       <p className="field-help">Phân cách bằng dấu phẩy. Tối đa 10 offer/từ khóa trong mỗi lượt chạy.</p></div>
     {enabled&&autoImport&&<div className="warning-callout"><AlertCircle size={18}/><span>Khi sản phẩm được nhập vào kho đang hoạt động, AI Agent có thể chọn và tự đăng Threads theo cấu hình hiện tại.</span></div>}
     <BusyButton disabled={saving} execute={saveConfig} tone="primary"><Check size={16}/> Lưu cấu hình Shopee</BusyButton>
    </Card>
    <Card className="shopee-setup">
      <span className="eyebrow">SECURE SETUP</span><h2>Kết nối tài khoản Shopee</h2>
      <p>Đăng ký quyền Shopee Affiliate Open API, rồi lưu hai biến trong <strong>Supabase → Edge Functions → Secrets</strong>:</p>
      <code>SHOPEE_AFFILIATE_APP_ID</code><code>SHOPEE_AFFILIATE_SECRET</code>
      <p>Không dán Secret vào dashboard, GitHub hoặc ChatGPT. Dữ liệu chỉ được đồng bộ khi kết nối API hợp lệ.</p>
      <a className="subtle-link" href="https://supabase.com/dashboard/project/idovyelypzisdngfcecc/settings/functions" target="_blank" rel="noopener noreferrer">Mở Supabase Secrets <ExternalLink size={15}/></a>
    </Card>
   </div>
  </div>
 </>;
}
