/* ===== MOTOR (js/finance.js) ===== */
const days=Finance.days,iso=Finance.iso,rts=id=>DB.banxico_rates.filter(x=>x.lineId===id),mv=id=>DB.account_movements.filter(x=>x.lineId===id);
const rateAt=(id,d)=>Finance.rateAt(rts(id),d),sched=l=>Finance.schedule(l,rts(l.id)),bal=(l,as)=>Finance.bal(mv(l.id),as),accr=(l,as)=>Finance.accrual(l,mv(l.id),rts(l.id),as),debt=(l,as)=>Finance.debt(l,rts(l.id),mv(l.id),as);

/* ===== UI HELPERS ===== */
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const m=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const S={screen:'cat',cat:'types',lid:null,edit:null,q:'',col:false},user=()=>DB.users.find(u=>u.id===DB.session.u),canEdit=()=>user().role!=='viewer';
const lines=t=>DB.credit_lines.filter(l=>l.companyId===DB.session.c&&(!t||l.type===t)),act=l=>['VIG','REN'].includes(l.status);
const pick=L=>{const l=L.find(x=>x.id===S.lid)||L[0];S.lid=l.id;return l};
const lsel=(L,l)=>`<select class="inp !w-auto mb-3" onchange="A.lid(this.value)">${L.map(x=>`<option value=${x.id} ${x.id===l.id?'selected':''}>${esc(x.alias)}</option>`).join('')}</select>`;
const empty=t=>`<div class="card text-slate-400">${t}</div>`,tbl=(h,b)=>`<div class="overflow-auto max-h-[60vh] rounded border border-slate-800"><table class="t"><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${b}</tbody></table></div>`;
const kpi=(t,v,c='text-cyan-300')=>`<div class="card"><div class="text-xs text-slate-400">${t}</div><div class="text-xl font-bold ${c}">${v}</div></div>`;
const CT={types:['Tipos de crédito','credit_types'],conc:['Conceptos de cobro','collection_concepts'],banks:['Bancos','banks'],stat:['Estatus de contrato','contract_statuses']};
const cr=r=>r.map(x=>`<tr><td>${esc(x.code)}</td><td>${esc(x.name)}</td><td class="text-slate-400">${esc(x.note)}</td></tr>`).join('');
const opts=(tb,v)=>DB[tb].map(x=>{const k=tb==='banks'?x.name:x.code;return`<option value="${k}" ${k===v?'selected':''}>${esc(x.name)}</option>`}).join('');
const F=[['alias','Alias (línea de captura)','text'],['bk','Banco','banks'],['type','Tipo de línea','credit_types'],['concept','Cobro de intereses','collection_concepts'],['contract','No. contrato','text'],['acct','Cuenta cargo','text'],['amount','Importe','number'],['bullet','Bullet (pago final)','number'],['n','# amortizaciones','number'],['start','Fecha inicial','date'],['end','Fecha final','date'],['review','Revisión anual','date'],['spread','Sobretasa %','number'],['status','Estatus','contract_statuses'],['notes','Observaciones','text']];
const ro=()=>canEdit()?'':'disabled';
