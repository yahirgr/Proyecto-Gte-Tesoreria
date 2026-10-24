/* ===== CLIENTE (misma interfaz que usaba la UI con fetch; ahora llama a route() local) ===== */
let DB={session:{}},TOKEN=ls.get(TOK),ME=null;
const save=()=>ls.set(SES,JSON.stringify(DB.session));
async function call(method,path,body){try{return JSON.parse(JSON.stringify(route(method,path,body||{})))}catch(e){if(e.status===401&&TOKEN&&path!=='/auth/login')logout();throw e}}
async function boot(){const b=await call('GET','/bootstrap'),s=JSON.parse(ls.get(SES)||'{}');ME=b.me;DB={...b,session:{u:ME.id,c:ME.companies.includes(s.c)?s.c:ME.companies[0],asof:s.asof||b.defaultAsof,sync:s.sync}}}
function logout(){TOKEN=ME=null;ls.del(TOK);render()}
const apiService={async get(t,fn){return fn?DB[t].filter(fn):[...DB[t]]},
 async post(t,o){const r=await call('POST','/'+t,o);DB[t].push(r);return r},
 async put(t,id,p){const r=await call('PUT',`/${t}/${id}`,p);Object.assign(DB[t].find(x=>x.id===id),r);return r}};
window.addEventListener('unhandledrejection',e=>alert(e.reason?.message||e.reason));
