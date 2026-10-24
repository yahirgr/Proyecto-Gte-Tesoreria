/* ===== ACCIONES ===== */
const val=id=>$(id).value;
const A={tog(){S.col=!S.col;render()},go(s){S.screen=s;render()},co(v){DB.session.c=v;S.lid=null;save();render()},
us(v){const u=DB.users.find(x=>x.id===v);DB.session.u=v;if(!u.companies.includes(DB.session.c))DB.session.c=u.companies[0];if(!u.perms.includes(S.screen))S.screen=u.perms[0];S.lid=null;save();render()},
asof(v){if(v){DB.session.asof=v;save();render()}},lid(v){S.lid=v;S.edit=null;render()},tab(k){S.cat=k;S.q='';render()},
q(v){S.q=v;$('main').querySelector('tbody').innerHTML=cr(DB[CT[S.cat][1]].filter(x=>x.name.toLowerCase().includes(v.toLowerCase())))},
async addCat(){if(!val('cn').trim())return alert('Nombre requerido');await apiService.post(CT[S.cat][1],{code:val('cc'),name:val('cn'),note:val('cm')});render()},
async perm(u,s,on){const x=DB.users.find(z=>z.id===u),p=on?[...new Set([...x.perms,s])]:x.perms.filter(q=>q!==s);await apiService.put('users',u,{perms:p});render()},
async addRate(){const d=val('rd'),r=parseFloat(val('rv'));if(!d||isNaN(r))return alert('Fecha y tasa requeridas');const e=DB.banxico_rates.find(x=>x.lineId===S.lid&&x.date===d);e?await apiService.put('banxico_rates',e.id,{rate:r,source:'MANUAL'}):await apiService.post('banxico_rates',{lineId:S.lid,date:d,rate:r,source:'MANUAL'});render()},
edit(id){S.edit=id;render()},
async saveLine(){const o={};F.forEach(([k,,t])=>{const v=val('f_'+k);o[k]=t==='number'?parseFloat(v)||0:v});if(!o.alias.trim()||!o.amount||o.end<=o.start||o.bullet>=o.amount)return alert('Revisa alias, importe, fechas (fin > inicio) y bullet < importe');
 if(S.edit)await apiService.put('credit_lines',S.edit,o);else{o.companyId=DB.session.c;o.bi={};const r=await apiService.post('credit_lines',o);S.lid=r.id}S.edit=null;render()},
async cfg(k,v){await apiService.put('credit_lines',S.lid,{[k]:Math.max(0,parseFloat(v)||0)});render()},
async bi(k,v){const l=DB.credit_lines.find(x=>x.id===S.lid);await apiService.put('credit_lines',l.id,{bi:{...l.bi,[k]:v===''?null:parseFloat(v)}});render()},
async bt(v){await apiService.put('credit_lines',S.lid,{bankTotal:parseFloat(v)||0});render()},
async mov(){const l=DB.credit_lines.find(x=>x.id===S.lid),d=val('md'),k=val('mk'),a=parseFloat(val('ma'));if(!d||!(a>0))return alert('Fecha y monto > 0 requeridos');
 if(!act(l))return alert('La línea no está vigente/renovada: no admite movimientos');if(k==='C'&&bal(l,'9999-12-31')+a>l.amount)return alert('La disposición excede el importe de la línea');
 await apiService.post('account_movements',{lineId:l.id,date:d,kind:k,amount:a,ref:val('mr')});render()},
async quick(id,k){const l=DB.credit_lines.find(x=>x.id===id),a=parseFloat(prompt((k==='C'?'Cargo':'Abono')+' a '+l.alias+' (MXN):'));if(!(a>0))return;
 if(!act(l))return alert('Línea no vigente');if(k==='C'&&bal(l,'9999-12-31')+a>l.amount)return alert('Excede la línea');await apiService.post('account_movements',{lineId:id,date:DB.session.asof,kind:k,amount:a,ref:'Rápido'});render()},
async sync(){const t=iso(new Date());for(const l of lines()){if(!DB.banxico_rates.some(r=>r.lineId===l.id&&r.date===t))await apiService.post('banxico_rates',{lineId:l.id,date:t,rate:+(8+Math.random()*.05).toFixed(4),source:'API (sim)'})}DB.session.sync=new Date().toLocaleTimeString('es-MX');save();render()}};
