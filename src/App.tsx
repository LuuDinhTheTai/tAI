import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import type {ReactNode} from "react";
import type {Session} from "@supabase/supabase-js";
import {Activity,ArrowRight,BarChart3,Bell,Box,ChevronLeft,ChevronsUpDown,Command,LayoutDashboard,LogOut,Menu,RefreshCw,Settings2,ShieldCheck,SquarePen,Wifi,Zap} from "lucide-react";
import {supabase,loadData,migrateLegacySession,invokeAgent} from "./lib/supabase";
import type {DataState,JobLog,JobRun,Post} from "./types";
import {DEFAULT_SETTINGS,date} from "./types";
import {OverviewPage,PostsPage,ProductsPage,AnalyticsPage,LivePage,AutomationPage,SettingsPage} from "./pages";

type Page="overview"|"posts"|"products"|"analytics"|"live"|"automation"|"settings";
type ActionResult={ok?:boolean;status?:string;[key:string]:unknown};
interface AppContextValue{data:DataState;session:Session|null;liveStatus:string;refresh:()=>Promise<void>;run:(action:string,fields?:Record<string,unknown>,notice?:string)=>Promise<ActionResult>;notify:(message:string,type?:"success"|"error")=>void;busy:boolean}
const AppContext=createContext<AppContextValue|null>(null);
export function useApp(){const value=useContext(AppContext);if(!value)throw new Error("Missing AppContext");return value}
const initial:DataState={posts:[],products:[],jobs:[],logs:[],agentRuns:[],profile:null,settings:DEFAULT_SETTINGS,updatedAt:null};
const routes:Record<Page,{label:string;icon:typeof Activity;description:string}>={
 overview:{label:"Tổng quan",icon:LayoutDashboard,description:"Toàn cảnh vận hành"},
 live:{label:"AI trực tiếp",icon:Activity,description:"Theo dõi tác vụ thời gian thực"},
 posts:{label:"Bài đăng",icon:SquarePen,description:"Nội dung & xuất bản"},
 products:{label:"Sản phẩm",icon:Box,description:"Kho affiliate"},
 analytics:{label:"Phân tích",icon:BarChart3,description:"Hiệu quả Threads"},
 automation:{label:"AI & Tự động hóa",icon:Zap,description:"Điều khiển agent"},
 settings:{label:"Cài đặt",icon:Settings2,description:"Tài khoản & kết nối"}
};
function routeFromHash():Page{const key=window.location.hash.replace(/^#/,"");return key==="logs"?"live":key in routes?key as Page:"overview"}
const ordered:Page[]=["overview","live","posts","products","analytics","automation","settings"];
function mergeOne<T extends {id:string}>(items:T[],record:T,limit:number){return [record,...items.filter(x=>x.id!==record.id)].slice(0,limit)}
function ApplicationShell({children,logout,session,refresh,loading,liveStatus,page,sidebarOpen,setSidebarOpen}:{
 children:ReactNode;logout:()=>Promise<void>;session:Session;refresh:()=>Promise<void>;loading:boolean;liveStatus:string;page:Page;sidebarOpen:boolean;setSidebarOpen:(open:boolean)=>void
}){
 const jobsRunning=useApp().data.jobs.filter(j=>j.status==="running"&&(j.kind==="agent_cycle"||j.kind==="manual_ai")).length;
 return <div className="app-shell">
  {sidebarOpen&&<button className="sidebar-backdrop" aria-label="Đóng điều hướng" onClick={()=>setSidebarOpen(false)}/>}
  <aside className={"sidebar"+(sidebarOpen?" open":"")} aria-label="Điều hướng tAI">
   <a className="brand" href="#overview" onClick={()=>setSidebarOpen(false)}>
     <span className="brand-mark">t<span>AI</span><i/></span>
     <span className="brand-word">tAI <small>OPERATIONS</small></span>
   </a>
   <div className="workspace-select"><span className="workspace-glyph"><Command size={19}/></span><span><b>tAI Workspace</b><small>Personal · Production</small></span><ChevronsUpDown size={16}/></div>
   <div className="sidebar-group-title">WORKSPACE</div>
   <nav className="nav-stack" aria-label="Điều hướng chính">
   {ordered.slice(0,5).map(route=>{const I=routes[route].icon;return <a key={route} href={"#"+route} onClick={()=>setSidebarOpen(false)} className={"nav-item"+(page===route?" active":"")} aria-current={page===route?"page":undefined}><I size={18} strokeWidth={1.9}/><span>{routes[route].label}</span>{route==="live"&&jobsRunning>0?<b className="nav-count">{jobsRunning}</b>:null}</a>})}
   </nav>
   <div className="sidebar-group-title second">CẤU HÌNH</div>
   <nav className="nav-stack" aria-label="Cấu hình hệ thống">
   {ordered.slice(5).map(route=>{const I=routes[route].icon;return <a key={route} href={"#"+route} onClick={()=>setSidebarOpen(false)} className={"nav-item"+(page===route?" active":"")} aria-current={page===route?"page":undefined}><I size={18} strokeWidth={1.9}/><span>{routes[route].label}</span></a>})}
   </nav>
   <div className="sidebar-end">
     <div className="sidebar-ai-card"><span className="small-spark"><Zap size={16}/></span><strong>AI Agent tự chủ</strong><p>Lịch chạy vận hành phía Supabase, độc lập với dashboard.</p><a href="#live">Xem tiến trình <ArrowRight size={15}/></a></div>
     <div className="profile-tile"><span className="avatar">TA</span><span className="profile-copy"><b>tAI Admin</b><small title={session.user.email}>{session.user.email||"Đã đăng nhập"}</small></span><button className="icon-button" aria-label="Đăng xuất" title="Đăng xuất" onClick={logout}><LogOut size={18}/></button></div>
   </div>
  </aside>
  <div className="content-layout">
   <header className="topbar">
    <div className="topbar-crumb"><button className="icon-button menu-button" aria-label="Mở menu" onClick={()=>setSidebarOpen(true)}><Menu size={21}/></button><span>Workspace</span><ChevronLeft size={14} className="crumb-divider"/><strong>{routes[page].label}</strong></div>
    <div className="topbar-right"><div className="topbar-system"><span className={"system-dot"+(liveStatus==="SUBSCRIBED"?" online":"")}/>{liveStatus==="SUBSCRIBED"?"Realtime active":"Supabase connected"}</div><button className={"icon-button refresh-button"+(loading?" loading":"")} aria-label="Làm mới dữ liệu" title="Làm mới dữ liệu" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={18}/></button><a href="#settings" className="top-avatar" title="Cài đặt tài khoản">TA</a></div>
   </header>
   <main className="app-content" id="main-content">{children}</main>
   <footer className="app-footer"><span>© 2026 tAI Console · AI Affiliate Operations</span><span><ShieldCheck size={14}/> Powered by Supabase & Cloudflare Pages</span></footer>
  </div>
 </div>
}

function Login({onLogin,loading,error}:{onLogin:(email:string,password:string)=>Promise<void>;loading:boolean;error:string}){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");
 return <div className="auth-layout"><div className="auth-ambient"/>
  <div className="auth-brand"><div className="brand-mark large">t<span>AI</span><i/></div><div><strong>tAI Console</strong><span>AI Affiliate Operations</span></div></div>
  <form className="auth-card" onSubmit={e=>{e.preventDefault();void onLogin(email,password)}}>
   <div className="auth-icon"><ShieldCheck size={25}/></div>
   <div className="eyebrow">SECURE WORKSPACE</div><h1>Chào mừng trở lại</h1><p>Đăng nhập vào không gian điều hành AI Agent của bạn.</p>
   <label htmlFor="auth-email">Email</label><input id="auth-email" required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
   <label htmlFor="auth-password">Mật khẩu</label><input id="auth-password" required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu Supabase"/>
   {error&&<div className="form-error" role="alert">{error}</div>}
   <button type="submit" className="button button-primary button-block" disabled={loading}>{loading?"Đang xác thực…":"Đăng nhập vào tAI"} <ArrowRight size={18}/></button>
   <div className="auth-foot"><ShieldCheck size={16}/> Phiên đăng nhập được xác thực bằng Supabase Auth.</div>
  </form>
  <p className="auth-copyright">© 2026 tAI · Designed for autonomous workflows</p>
 </div>
}
export default function App(){
 const [session,setSession]=useState<Session|null>(null);
 const [authReady,setAuthReady]=useState(false);
 const [loginError,setLoginError]=useState("");
 const [loginLoading,setLoginLoading]=useState(false);
 const [data,setData]=useState<DataState>(initial);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [fetchError,setFetchError]=useState("");
 const [page,setPage]=useState<Page>(()=>routeFromHash());
 const [liveStatus,setLiveStatus]=useState("CLOSED");
 const [sidebarOpen,setSidebarOpen]=useState(false);
 const [toast,setToast]=useState<{message:string;type:"success"|"error"}|null>(null);
 const notify=useCallback((message:string,type:"success"|"error"="success")=>{setToast({message,type})},[]);
 useEffect(()=>{if(!toast)return;const id=window.setTimeout(()=>setToast(null),5000);return()=>clearTimeout(id)},[toast]);
 useEffect(()=>{const fn=()=>setPage(routeFromHash());window.addEventListener("hashchange",fn);return()=>window.removeEventListener("hashchange",fn)},[]);
 useEffect(()=>{
  let mounted=true;
  const subscription=supabase.auth.onAuthStateChange((_event,next)=>{if(mounted)setSession(next)});
  (async()=>{try{await migrateLegacySession();const {data:{session:current}}=await supabase.auth.getSession();if(mounted)setSession(current)}
   finally{if(mounted)setAuthReady(true)}})().catch(()=>{if(mounted)setAuthReady(true)});
  return()=>{mounted=false;subscription.data.subscription.unsubscribe()};
 },[]);
 const refresh=useCallback(async()=>{
  if(!session)return;
  setLoading(true);setFetchError("");
  try{setData(await loadData())}catch(err){setFetchError(err instanceof Error?err.message:"Không thể đọc Supabase")}
  finally{setLoading(false)}
 },[session?.user?.id]);
 useEffect(()=>{if(session){void refresh()}else{setData(initial);setLiveStatus("CLOSED")}},[session?.user?.id,refresh]);
 useEffect(()=>{
  if(!session?.user?.id)return;
  const uid=session.user.id;
  const channel=supabase.channel("tai-react-"+uid)
   .on("postgres_changes",{event:"*",schema:"public",table:"job_runs",filter:"user_id=eq."+uid},event=>{
     if(event.eventType==="DELETE"){void refresh();return}
     const record=event.new as JobRun;
     setData(old=>({...old,jobs:mergeOne(old.jobs,record,40).sort((a,b)=>Date.parse(b.started_at)-Date.parse(a.started_at)),updatedAt:new Date()}));
   })
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"job_logs",filter:"user_id=eq."+uid},event=>{
     const record=event.new as JobLog;setData(old=>({...old,logs:mergeOne(old.logs,record,200).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)),updatedAt:new Date()}));
   })
   .on("postgres_changes",{event:"*",schema:"public",table:"posts",filter:"user_id=eq."+uid},event=>{
     if(event.eventType==="DELETE"){void refresh();return}
     const record=event.new as Post;setData(old=>({...old,posts:mergeOne(old.posts,record,200).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)),updatedAt:new Date()}));
   })
   .subscribe(status=>setLiveStatus(status));
  const fallback=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh()},60000);
  return()=>{window.clearInterval(fallback);void supabase.removeChannel(channel);setLiveStatus("CLOSED")};
 },[session?.user?.id,refresh]);
 const run=useCallback(async(action:string,fields:Record<string,unknown>={},notice?:string)=>{
   setBusy(true);
   try{const res=await invokeAgent<ActionResult>(action,fields);await refresh();if(notice)notify(notice);return res}
   catch(err){const msg=err instanceof Error?err.message:String(err);notify(msg,"error");throw err}
   finally{setBusy(false)}
 },[refresh,notify]);
 const login=async(email:string,password:string)=>{setLoginError("");setLoginLoading(true);try{const r=await supabase.auth.signInWithPassword({email,password});if(r.error)throw r.error}
 catch(err){setLoginError(err instanceof Error?err.message:"Đăng nhập thất bại")}
 finally{setLoginLoading(false)}};
 const logout=async()=>{await supabase.auth.signOut();window.location.hash="#overview"};
 const context=useMemo(()=>({data,session,liveStatus,refresh,run,notify,busy}),[data,session,liveStatus,refresh,run,notify,busy]);
 if(!authReady)return <div className="boot-screen"><div className="brand-mark large">t<span>AI</span></div><span>Đang chuẩn bị workspace…</span></div>;
 if(!session)return <Login onLogin={login} loading={loginLoading} error={loginError}/>;
 const PageComponent=({overview:OverviewPage,posts:PostsPage,products:ProductsPage,analytics:AnalyticsPage,live:LivePage,automation:AutomationPage,settings:SettingsPage})[page];
 return <AppContext.Provider value={context}>
  <a href="#main-content" className="skip-link">Chuyển đến nội dung</a>
  <ApplicationShell session={session} logout={logout} page={page} liveStatus={liveStatus} refresh={refresh} loading={loading} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
    {fetchError&&<div className="alert-banner" role="alert"><Wifi size={18}/> Không thể tải dữ liệu: {fetchError}<button className="button button-small" onClick={()=>void refresh()}>Thử lại</button></div>}
    <PageComponent/>
  </ApplicationShell>
  {toast&&<div className={"toast "+(toast.type==="error"?"toast-error":"")} role="status">{toast.message}<button aria-label="Đóng thông báo" onClick={()=>setToast(null)}>×</button></div>}
 </AppContext.Provider>;
}
