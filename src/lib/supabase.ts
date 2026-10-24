import {createClient} from "@supabase/supabase-js";
import type {AgentSettings,AgentRun,DataState,JobLog,JobRun,Post,Product,ProfileSnapshot} from "../types";
import {DEFAULT_SETTINGS} from "../types";
const legacy=(()=>{try{return JSON.parse(localStorage.getItem("tai.supabase.config")||"{}")}catch{return {}}})();
export const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL||legacy.url||"https://idovyelypzisdngfcecc.supabase.co";
export const SUPABASE_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||legacy.key||"sb_publishable_kaFpG58YI0SNa-8gfWcqFw_s2HmLEip";
export const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true},realtime:{params:{eventsPerSecond:10}}});
export async function migrateLegacySession(){
 try{const raw=sessionStorage.getItem("tai.session");if(!raw)return;const previous=JSON.parse(raw) as {access_token?:string;refresh_token?:string};
 if(previous.access_token&&previous.refresh_token){const current=await supabase.auth.getSession();if(!current.data.session)await supabase.auth.setSession({access_token:previous.access_token,refresh_token:previous.refresh_token})}
 sessionStorage.removeItem("tai.session");}catch{sessionStorage.removeItem("tai.session")}
}
async function readRows<T>(table:string,limit:number,order:string="created_at"):Promise<T[]>{
 const {data,error}=await supabase.from(table).select("*").order(order,{ascending:false}).limit(limit);
 if(error)throw error;return (data||[]) as T[];
}
export async function loadData():Promise<DataState>{
 const [posts,products,jobs,logs,agents,profiles,settings]=await Promise.all([
  readRows<Post>("posts",200),readRows<Product>("products",200),readRows<JobRun>("job_runs",40,"started_at"),readRows<JobLog>("job_logs",200),
  readRows<AgentRun>("agent_runs",10,"started_at"),readRows<ProfileSnapshot>("social_profile_snapshots",1,"snapshot_date"),
  supabase.from("app_settings").select("config").limit(1)
 ]);
 if(settings.error)throw settings.error;
 return {posts,products,jobs,logs,agentRuns:agents,profile:profiles[0]||null,settings:{...DEFAULT_SETTINGS,...((settings.data?.[0]?.config||{}) as Partial<AgentSettings>)},updatedAt:new Date()};
}
export async function invokeAgent<T=Record<string,unknown>>(action:string,fields:Record<string,unknown>={}):Promise<T>{
 const {data,error}=await supabase.functions.invoke("tai-automation",{body:{action,...fields}});
 if(error){const raw=typeof data==="object"&&data!==null?JSON.stringify(data):"";throw new Error(raw||error.message)}
 if(data?.error)throw new Error(String(data.error));return data as T;
}
export async function saveSettings(userId:string,config:AgentSettings){const {error}=await supabase.from("app_settings").upsert({user_id:userId,config},{onConflict:"user_id"});if(error)throw error}
export async function createProduct(userId:string,input:Pick<Product,"title"|"category"|"price"|"affiliate_url">){const {error}=await supabase.from("products").insert({...input,user_id:userId,status:"active"});if(error)throw error}
export async function updateProduct(id:string,userId:string,input:Pick<Product,"title"|"category"|"price"|"affiliate_url">){const {error}=await supabase.from("products").update(input).eq("id",id).eq("user_id",userId);if(error)throw error}
export async function createDraft(userId:string,content:string){const {error}=await supabase.from("posts").insert({user_id:userId,content,status:"draft",provider:"Manual"});if(error)throw error}
