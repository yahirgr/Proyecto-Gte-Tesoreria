/* Base de datos y reglas de negocio locales (reemplazan al backend Express + SQLite). Persisten en localStorage. */
/* ===== BACKEND LOCAL (reemplaza Express + SQLite + JWT; datos en localStorage del navegador) ===== */
const ALL=['cat','users','rates','lines','long','sum','rev','sofom','wh','macro'];
const KEY='omex_treasury_db_v1',TOK='omex_token',SES='omex_session',DEFAULT_ASOF='2025-09-15',ACTIVE=['VIG','REN'],mem={};
const ls={get(k){try{return localStorage.getItem(k)}catch{return mem[k]??null}},set(k,v){try{localStorage.setItem(k,v)}catch{mem[k]=String(v)}},del(k){try{localStorage.removeItem(k)}catch{delete mem[k]}}};
const uid=()=>'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const hsh=s=>{s='omex:'+s;let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return(4294967296*(2097151&b)+(a>>>0)).toString(36)}; // hash simple de demo (no es seguridad real)
const err=(s,m)=>Object.assign(new Error(m),{status:s});

function seed(){
 const CO=[1,2,3,4,5].map(i=>'c'+i),d={companies:CO.map((id,i)=>({id,name:'Empresa #'+(i+1),rfc:null,active:1})),users:[],banks:[],credit_types:[],collection_concepts:[],contract_statuses:[],credit_lines:[],banxico_rates:[],account_movements:[]},pw=hsh('Omex2025!');
 [['u1','Fernando García','fernando.garcia','admin',ALL,5],['u2','Diego Issac','diego.issac','treasury',ALL.filter(x=>x!=='users'),2],['u3','Esperanza Lopéz','esperanza.lopez','viewer',['sum','rev','sofom','wh','macro'],1],['u4','Alejandro Carrera','alejandro.carrera','treasury',ALL.filter(x=>x!=='users'),3],['u5','Alejandro Armendaríz','alejandro.armendariz','viewer',['sum','macro'],2]]
  .forEach(([id,name,username,role,perms,n])=>d.users.push({id,name,username,hash:pw,role,perms,active:1,companies:CO.slice(0,n)}));
 'ACTINVER,AFIRME,AZTECA,BAJIO,BANAMEX,BANCOMEXT,BANCOPPEL,BANORTE,BANREGIO,BBVA MEXICO,CITI MEXICO,HSBC,INBURSA,INTERCAM BANCO,INVEX,MIFEL,MULTIVA BANCO,NAFIN,SANTANDER,SCOTIABANK,VE POR MAS'.split(',').forEach(n=>d.banks.push({id:uid(),code:n.slice(0,4),name:n,note:'Banco'}));
 [['credit_types','SIMPLE','Crédito Simple','Largo plazo'],['credit_types','CC','Crédito de Cuenta Corriente','Corto plazo (pagar y disponer)'],['credit_types','SOFOM','SOFOM','Corto plazo (pagar y disponer)'],['credit_types','ALM','Almacenadora de Banorte','Corto plazo (pagar y disponer)'],
  ['collection_concepts','FM','Fin de Mes','Mes completo del 01 al 30 o 31'],['collection_concepts','MD','Mismo día del crédito','Mismo día de cada mes'],['collection_concepts','DH','Día hábil siguiente','Si cae en sábado, domingo o festivo, al siguiente día hábil'],
  ['contract_statuses','VIG','Vigente',''],['contract_statuses','REN','Renovado','Extender el plazo'],['contract_statuses','CAN','Cancelado',''],['contract_statuses','BLO','Bloqueado','No se puede utilizar la línea'],['contract_statuses','REV','Revisión anual','Inhabilita el crédito']]
  .forEach(([t,code,name,note])=>d[t].push({id:uid(),code,name,note}));
 const L=(id,companyId,alias,bk,type,concept,contract,amount,bullet,n,start,end,spread,extra={})=>d.credit_lines.push({id,companyId,alias,bk,type,concept,contract,acct:'',amount,bullet,n,start,end,review:'',spread,status:'VIG',notes:'',bi:{},bankTotal:0,...extra});
 L('l1','c1','BNTE SIMPLE','BANORTE','SIMPLE','DH','878233',1e5,3e4,23,'2024-04-01','2026-03-01',2.75,{acct:'3663332344',review:'2025-05-03'});
 L('l2','c1','BANCOPPEL CTA CORRIENTE','BANCOPPEL','CC','FM','1196323',5e7,0,0,'2025-08-07','2026-02-07',2.75,{bankTotal:463389.72});
 L('l3','c1','SOFOM BANORTE','BANORTE','SOFOM','FM','SF-2201',2e7,0,0,'2025-06-01','2025-12-01',3);
 L('l4','c1','ALMACENADORA BANORTE','BANORTE','ALM','FM','AL-3305',15e6,0,0,'2025-06-01','2025-12-01',2.5);
 L('l5','c2','BBVA SIMPLE','BBVA MEXICO','SIMPLE','MD','BB-9001',5e5,1e5,11,'2025-01-01','2026-01-01',2.5);
 [['l1','2025-04-01',8.0327],['l1','2025-04-02',8.0126],['l1','2025-04-03',8.0226],['l1','2025-04-04',8.0327],...['l2','l3','l4','l5'].flatMap(l=>['2025-08-14','2025-09-15'].map(x=>[l,x,8.0126]))]
  .forEach(([lineId,date,rate])=>d.banxico_rates.push({id:uid(),lineId,date,rate,source:'MANUAL'}));
 [['l2','2025-08-15','C',5e7],['l2','2025-08-17','A',5e6],['l2','2025-09-03','C',3e6],['l2','2025-09-07','A',9e6],['l3','2025-09-01','C',8e6],['l4','2025-09-01','C',6e6]]
  .forEach(([lineId,date,kind,amount])=>d.account_movements.push({id:uid(),lineId,date,kind,amount,ref:'Seed'}));
 return d}
let SRV_DB=null;
const SRV=()=>{if(!SRV_DB){try{SRV_DB=JSON.parse(ls.get(KEY)||'null')}catch{SRV_DB=null}if(!SRV_DB){SRV_DB=seed();persist()}}return SRV_DB};
const persist=()=>ls.set(KEY,JSON.stringify(SRV_DB));

/* Esquema y reglas de negocio (mismas que server.js) */
const T={banks:['code','name','note'],credit_types:['code','name','note'],collection_concepts:['code','name','note'],contract_statuses:['code','name','note'],companies:['name','rfc','active'],
 credit_lines:['companyId','alias','bk','type','concept','contract','acct','amount','bullet','n','start','end','review','spread','status','notes','bi','bankTotal'],
 banxico_rates:['lineId','date','rate','source'],account_movements:['lineId','date','kind','amount','ref']};
const DEF={banks:{note:''},credit_types:{note:''},collection_concepts:{note:''},contract_statuses:{note:''},companies:{rfc:null,active:1},
 credit_lines:{acct:'',bullet:0,n:0,review:'',spread:0,status:'VIG',notes:'',bi:{},bankTotal:0},banxico_rates:{source:'MANUAL'},account_movements:{ref:''}};
const CAT=['banks','credit_types','collection_concepts','contract_statuses','companies'];
const pub=u=>({id:u.id,name:u.name,username:u.username,role:u.role,active:!!u.active,perms:[...u.perms],companies:[...u.companies]});
const need=(me,...r)=>{if(!r.includes(me.role))throw err(403,'Sin permiso para esta acción')};
const lineOf=(S,id)=>S.credit_lines.find(l=>l.id===id);
const cOf=(S,t,o)=>t==='credit_lines'?o.companyId:lineOf(S,o.lineId)?.companyId;
const rsOf=(S,id)=>S.banxico_rates.filter(x=>x.lineId===id),mvOf=(S,id)=>S.account_movements.filter(x=>x.lineId===id);
function chkLine(S,o,self){
 if(!o.alias||!String(o.alias).trim()||!o.bk||!o.type||!o.concept||!o.contract||!o.start||!o.end)throw err(400,'Faltan datos requeridos de la línea');
 if(!(o.amount>0))throw err(400,'El importe debe ser mayor a 0');if(!(o.end>o.start))throw err(400,'La fecha final debe ser mayor a la inicial');if(!(o.bullet<o.amount))throw err(400,'El bullet debe ser menor al importe');
 if(S.credit_lines.some(l=>l!==self&&l.companyId===o.companyId&&l.alias===o.alias))throw err(400,'Ya existe una línea con ese alias en la empresa')}
function chkMove(S,b){ // línea vigente/renovada, monto > 0, la disposición no excede el importe
 const l=lineOf(S,b.lineId);if(!l)throw err(404,'Línea no encontrada');if(!ACTIVE.includes(l.status))throw err(409,'La línea no está vigente');if(!(b.amount>0))throw err(400,'Monto inválido');
 if(!['C','A'].includes(b.kind))throw err(400,'Tipo de movimiento inválido');
 if(b.kind==='C'&&Finance.bal(mvOf(S,l.id),'9999-12-31')+b.amount>l.amount)throw err(409,'La disposición excede el importe de la línea')}
const grantCo=(S,cs)=>[...new Set(cs||[])].filter(c=>S.companies.some(x=>x.id===c));

function route(m,p,b){
 const S=SRV(),seg=p.split('/').filter(Boolean),today=Finance.iso(new Date());
 if(m==='POST'&&p==='/auth/login'){const u=S.users.find(x=>x.username===String(b.username||'').trim()&&x.active);if(!u||u.hash!==hsh(String(b.password||'')))throw err(401,'Usuario o contraseña incorrectos');return{token:u.id}}
 const meRow=S.users.find(x=>x.id===TOKEN&&x.active);if(!meRow)throw err(401,'No autorizado');const me=pub(meRow),mine=id=>me.companies.includes(id);

 if(m==='GET'&&p==='/bootstrap'){
  const L=S.credit_lines.filter(l=>mine(l.companyId)),ids=new Set(L.map(l=>l.id));
  return{me,defaultAsof:DEFAULT_ASOF,companies:S.companies.filter(c=>mine(c.id)),users:me.role==='admin'?S.users.map(pub):[me],
   banks:S.banks,credit_types:S.credit_types,collection_concepts:S.collection_concepts,contract_statuses:S.contract_statuses,
   credit_lines:L,banxico_rates:S.banxico_rates.filter(r=>ids.has(r.lineId)),account_movements:S.account_movements.filter(r=>ids.has(r.lineId))}}

 if(seg[0]==='users'){need(me,'admin');
  if(m==='POST'&&seg.length===1){if(!b.name||!b.username||String(b.password||'').length<8)throw err(400,'Nombre, usuario y contraseña (mínimo 8 caracteres) son requeridos');
   if(S.users.some(u=>u.username===b.username))throw err(400,'El usuario ya existe');
   const u={id:uid(),name:b.name,username:b.username,hash:hsh(b.password),role:b.role||'viewer',perms:b.perms||['sum','macro'],active:1,companies:grantCo(S,b.companies)};S.users.push(u);persist();return pub(u)}
  if(m==='PUT'&&seg.length===2){const u=S.users.find(x=>x.id===seg[1]);if(!u)throw err(404,'Usuario no encontrado');
   u.name=b.name??u.name;u.role=b.role??u.role;if(b.perms)u.perms=b.perms;if(b.active!==undefined)u.active=+!!b.active;if(b.password)u.hash=hsh(b.password);if(b.companies)u.companies=grantCo(S,b.companies);persist();return pub(u)}}

 if(m==='POST'&&p==='/sync-rates'){need(me,'admin','treasury'); // TIIE simulada; la captura manual prevalece
  const rate=+(8+Math.random()*.05).toFixed(4);let c=0;S.credit_lines.filter(l=>mine(l.companyId)).forEach(l=>{if(!S.banxico_rates.some(r=>r.lineId===l.id&&r.date===today)){S.banxico_rates.push({id:uid(),lineId:l.id,date:today,rate,source:'SIMULADO'});c++}});persist();return{date:today,rate,source:'SIMULADO',inserted:c}}

 const t=seg[0];
 if(m==='POST'&&seg.length===1){need(me,'admin','treasury');if(!T[t])throw err(404,'Recurso no existe');
  if(CAT.includes(t)?me.role!=='admin':!mine(cOf(S,t,b)))throw err(403,'Empresa o recurso no autorizado');
  const o={id:uid(),...JSON.parse(JSON.stringify(DEF[t]||{}))};T[t].filter(x=>b[x]!==undefined).forEach(x=>o[x]=b[x]);
  if(t==='credit_lines')chkLine(S,o,null);
  if(t==='account_movements')chkMove(S,b);
  if(t==='banxico_rates'){if(!lineOf(S,o.lineId)||!o.date||typeof o.rate!=='number'||isNaN(o.rate))throw err(400,'Línea, fecha y tasa requeridas');if(S.banxico_rates.some(r=>r.lineId===o.lineId&&r.date===o.date))throw err(400,'Ya existe una tasa para esa fecha')}
  if(CAT.includes(t)&&t!=='companies'&&!String(o.name||'').trim())throw err(400,'Nombre requerido');
  S[t].push(o);persist();return o}
 if(m==='PUT'&&seg.length===2){need(me,'admin','treasury');if(!T[t])throw err(404,'Recurso no existe');
  const o=S[t].find(x=>x.id===seg[1]);if(!o)throw err(404,'No encontrado');
  if(CAT.includes(t)?me.role!=='admin':!mine(cOf(S,t,o))||(b.companyId&&!mine(b.companyId)))throw err(403,'Sin permiso');
  const k=T[t].filter(x=>x in b);if(!k.length)throw err(400,'Nada que actualizar');
  const n={...o};k.forEach(x=>n[x]=b[x]);if(t==='credit_lines')chkLine(S,n,o);
  Object.assign(o,n);persist();return o}
 throw err(404,'Ruta no encontrada')}
