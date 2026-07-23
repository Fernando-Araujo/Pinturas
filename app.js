const STORAGE_KEY = 'paintCompanionDataV1';
const STATUSES = ['Na caixa','Desmontado','Montado','Com primer','Em pintura','Pintado'];

const starterData = {
  paints: [
    {id:crypto.randomUUID(),code:'72.001',name:'Dead White',line:'Game Color',hex:'#f3f1df',owned:true,level:'Médio'},
    {id:crypto.randomUUID(),code:'72.005',name:'Moon Yellow',line:'Game Color',hex:'#f2d53c',owned:false,level:'Cheio'},
    {id:crypto.randomUUID(),code:'72.010',name:'Bloody Red',line:'Game Color',hex:'#b72b32',owned:true,level:'Cheio'},
    {id:crypto.randomUUID(),code:'72.019',name:'Night Blue',line:'Game Color',hex:'#182347',owned:true,level:'Médio'},
    {id:crypto.randomUUID(),code:'72.020',name:'Imperial Blue',line:'Game Color',hex:'#273875',owned:true,level:'Baixo'},
    {id:crypto.randomUUID(),code:'72.021',name:'Magic Blue',line:'Game Color',hex:'#245bb6',owned:true,level:'Cheio'},
    {id:crypto.randomUUID(),code:'72.022',name:'Ultramarine Blue',line:'Game Color',hex:'#3248a8',owned:true,level:'Médio'},
    {id:crypto.randomUUID(),code:'72.023',name:'Electric Blue',line:'Game Color',hex:'#2a98d8',owned:true,level:'Cheio'},
    {id:crypto.randomUUID(),code:'72.024',name:'Turquoise',line:'Game Color',hex:'#179aa2',owned:false,level:'Cheio'},
    {id:crypto.randomUUID(),code:'72.034',name:'Bonewhite',line:'Game Color',hex:'#d9c89a',owned:true,level:'Médio'},
    {id:crypto.randomUUID(),code:'72.051',name:'Black',line:'Game Color',hex:'#15171a',owned:true,level:'Cheio'},
    {id:crypto.randomUUID(),code:'72.056',name:'Glorious Gold',line:'Game Color',hex:'#c58a27',owned:true,level:'Baixo'}
  ],
  miniatures: [
    {id:crypto.randomUUID(),name:'Captain in Terminator Armour',unit:'Captain',faction:'Ultramarines',quantity:1,points:95,status:'Pintado',notes:'Armadura azul com luz fria.'},
    {id:crypto.randomUUID(),name:'Eliminator Squad',unit:'Eliminators',faction:'Ultramarines',quantity:3,points:85,status:'Em pintura',notes:'Camuflagem em andamento.'},
    {id:crypto.randomUUID(),name:'Great Unclean One',unit:'Great Unclean One',faction:'Death Guard',quantity:1,points:230,status:'Pintado',notes:'Finalizado e envernizado.'},
    {id:crypto.randomUUID(),name:'Norn Emissary',unit:'Norn Emissary',faction:'Tyranids',quantity:1,points:260,status:'Com primer',notes:'Primer preto e zenital branco.'},
    {id:crypto.randomUUID(),name:'Combat Patrol',unit:'Infantry assortment',faction:'World Eaters',quantity:20,points:450,status:'Na caixa',notes:'Separar por unidade antes da montagem.'},
    {id:crypto.randomUUID(),name:'Comissário',unit:'Commissar',faction:'Astra Militarum',quantity:1,points:30,status:'Montado',notes:'Base pronta.'}
  ]
};

let data = loadData();
let currentView = 'dashboard';

function loadData(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(starterData); }
  catch { return structuredClone(starterData); }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); renderAll(); }
function escapeHtml(str=''){ return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function toast(message){ const el=document.getElementById('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2200); }

function hexToRgb(hex){ const v=hex.replace('#',''); return {r:parseInt(v.substring(0,2),16),g:parseInt(v.substring(2,4),16),b:parseInt(v.substring(4,6),16)}; }
function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function rgbToHsl(r,g,b){ r/=255;g/=255;b/=255; const max=Math.max(r,g,b),min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2; if(max!==min){ const d=max-min; s=l>.5?d/(2-max-min):d/(max+min); switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;} h/=6;} return {h:h*360,s:s*100,l:l*100}; }
function hslToRgb(h,s,l){ h/=360;s/=100;l/=100; const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}; let r,g,b;if(s===0){r=g=b=l;}else{const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);}return {r:r*255,g:g*255,b:b*255}; }
function shiftColor(hex,{h=0,s=0,l=0}){ const rgb=hexToRgb(hex),base=rgbToHsl(rgb.r,rgb.g,rgb.b); const out=hslToRgb((base.h+h+360)%360,Math.max(0,Math.min(100,base.s+s)),Math.max(0,Math.min(100,base.l+l))); return rgbToHex(out.r,out.g,out.b); }
function colorDistance(a,b){ const A=hexToRgb(a),B=hexToRgb(b); return Math.sqrt((A.r-B.r)**2+(A.g-B.g)**2+(A.b-B.b)**2); }
function nearestPaint(hex, excludeId=null){ return [...data.paints].filter(p=>p.id!==excludeId).sort((a,b)=>colorDistance(hex,a.hex)-colorDistance(hex,b.hex))[0]; }
function textColor(hex){ const {r,g,b}=hexToRgb(hex); return ((r*299+g*587+b*114)/1000)>145?'#101318':'#ffffff'; }

function navigate(view){
  currentView=view;
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(`${view}-view`).classList.add('active');
  const titles={dashboard:'Visão geral',paints:'Catálogo de tintas',lab:'Laboratório de cores',miniatures:'Miniaturas',armies:'Exércitos',settings:'Dados e backup'};
  document.getElementById('page-title').textContent=titles[view];
  window.scrollTo({top:0,behavior:'smooth'});
  if(view==='lab') setTimeout(renderLab,30);
}

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.view)));

function renderDashboard(){
  const owned=data.paints.filter(p=>p.owned), low=owned.filter(p=>['Baixo','Vazio'].includes(p.level));
  const totalPoints=data.miniatures.reduce((s,m)=>s+Number(m.points||0),0);
  const paintedPoints=data.miniatures.filter(m=>m.status==='Pintado').reduce((s,m)=>s+Number(m.points||0),0);
  const paintedMinis=data.miniatures.filter(m=>m.status==='Pintado').reduce((s,m)=>s+Number(m.quantity||1),0);
  const totalMinis=data.miniatures.reduce((s,m)=>s+Number(m.quantity||1),0);
  const factions=[...new Set(data.miniatures.map(m=>m.faction))];
  const percent=totalPoints?Math.round(paintedPoints/totalPoints*100):0;
  document.getElementById('hero-painted-points').textContent=paintedPoints;
  document.getElementById('hero-painted-percent').textContent=`${percent}% da coleção`;
  document.getElementById('stat-paints').textContent=owned.length;
  document.getElementById('stat-low-paints').textContent=`${low.length} em nível baixo`;
  document.getElementById('stat-minis').textContent=totalMinis;
  document.getElementById('stat-painted-minis').textContent=`${paintedMinis} pintadas`;
  document.getElementById('stat-total-points').textContent=totalPoints;
  document.getElementById('stat-factions').textContent=factions.length;

  const statusBars=document.getElementById('status-bars');
  statusBars.innerHTML=STATUSES.map(status=>{const count=data.miniatures.filter(m=>m.status===status).reduce((s,m)=>s+Number(m.quantity||1),0);const pct=totalMinis?Math.max(4,Math.round(count/totalMinis*100)):0;return `<div class="status-row"><span>${status}</span><div class="bar"><i style="width:${count?pct:0}%"></i></div><small>${count}</small></div>`}).join('');

  const queue=data.miniatures.filter(m=>m.status!=='Pintado').sort((a,b)=>STATUSES.indexOf(b.status)-STATUSES.indexOf(a.status)).slice(0,5);
  document.getElementById('work-queue').innerHTML=queue.length?queue.map(m=>`<div class="queue-item"><div><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.faction)} · ${escapeHtml(m.status)}</small></div><span class="queue-badge">${m.points} pts</span></div>`).join(''):'<div class="empty-state">Nenhuma miniatura pendente.</div>';

  document.getElementById('faction-cards').innerHTML=factions.map(f=>{const minis=data.miniatures.filter(m=>m.faction===f);const total=minis.reduce((s,m)=>s+Number(m.points||0),0);const painted=minis.filter(m=>m.status==='Pintado').reduce((s,m)=>s+Number(m.points||0),0);const pct=total?Math.round(painted/total*100):0;return `<div class="faction-card"><h4>${escapeHtml(f)}</h4><strong>${total} pts</strong><div class="faction-meta"><span>${painted} pintados</span><span>${pct}%</span></div><div class="bar" style="margin-top:12px"><i style="width:${pct}%"></i></div></div>`}).join('')||'<div class="empty-state">Cadastre uma miniatura para começar.</div>';
}

function renderPaints(){
  const q=document.getElementById('paint-search').value.trim().toLowerCase();
  const line=document.getElementById('paint-line-filter').value;
  const stock=document.getElementById('paint-stock-filter').value;
  const filtered=data.paints.filter(p=>{
    const matchText=!q||`${p.name} ${p.code} ${p.line}`.toLowerCase().includes(q);
    const matchLine=line==='all'||p.line===line;
    const matchStock=stock==='all'||(stock==='owned'&&p.owned)||(stock==='low'&&p.owned&&['Baixo','Vazio'].includes(p.level));
    return matchText&&matchLine&&matchStock;
  });
  document.getElementById('paint-grid').innerHTML=filtered.map(p=>`<article class="paint-card"><div class="paint-swatch" style="background:${p.hex}"></div><div class="paint-card-body"><span class="paint-code">${escapeHtml(p.code||'Sem código')}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.line)}</p><div class="paint-card-footer"><span class="level-badge">${p.owned?escapeHtml(p.level):'Catálogo'}</span><button class="owned-toggle" title="Alternar estoque" data-paint-id="${p.id}">${p.owned?'★':'☆'}</button></div></div></article>`).join('')||'<div class="empty-state">Nenhuma tinta encontrada.</div>';
  document.querySelectorAll('[data-paint-id]').forEach(btn=>btn.addEventListener('click',()=>{const p=data.paints.find(x=>x.id===btn.dataset.paintId);p.owned=!p.owned;saveData();toast(p.owned?'Adicionada ao estoque':'Removida do estoque');}));
  const lines=[...new Set(data.paints.map(p=>p.line))].sort();
  const select=document.getElementById('paint-line-filter'); const current=select.value;
  select.innerHTML='<option value="all">Todas as linhas</option>'+lines.map(l=>`<option>${escapeHtml(l)}</option>`).join(''); if(lines.includes(current))select.value=current;
}

function renderLab(){
  const select=document.getElementById('lab-paint-select');
  const prev=select.value;
  const owned=data.paints.filter(p=>p.owned);
  const source=owned.length?owned:data.paints;
  select.innerHTML=source.map(p=>`<option value="${p.id}">${escapeHtml(p.code)} · ${escapeHtml(p.name)}</option>`).join('');
  if(source.some(p=>p.id===prev)) select.value=prev;
  const paint=source.find(p=>p.id===select.value)||source[0];
  if(!paint) return;
  select.value=paint.id;
  document.getElementById('selected-paint-preview').innerHTML=`<div class="preview-color" style="background:${paint.hex}"></div><div class="preview-meta"><h3>${escapeHtml(paint.name)}</h3><span>${escapeHtml(paint.code)} · ${escapeHtml(paint.line)}</span></div>`;
  const rgb=hexToRgb(paint.hex),hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
  const undercoats=getUndercoats(hsl);
  document.getElementById('undercoat-recommendations').innerHTML=undercoats.map(u=>`<div class="recommendation"><i style="background:${u.hex}"></i><div><strong>${u.name}</strong><small>${u.reason}</small></div></div>`).join('');
  renderToneRamp(paint);
  drawColorWheel(paint.hex,paint.name);
}
function getUndercoats(hsl){
  const list=[];
  if(hsl.l<35) list.push({name:'Cinza médio',hex:'#777b82',reason:'Ajuda a enxergar volumes sem perder profundidade.'});
  else list.push({name:'Preto',hex:'#16181c',reason:'Facilita sombras profundas e acabamento dramático.'});
  if(hsl.l>65||hsl.s>65) list.push({name:'Branco',hex:'#f1f0e8',reason:'Preserva luminosidade e saturação nas camadas finas.'});
  else list.push({name:'Cinza claro',hex:'#b7bac0',reason:'Equilibra cobertura, leitura e luminosidade.'});
  const comp=hslToRgb((hsl.h+180)%360,Math.min(65,hsl.s),28);
  list.push({name:'Complementar escuro',hex:rgbToHex(comp.r,comp.g,comp.b),reason:'Cria sombras cromáticas mais ricas e contrastadas.'});
  return list;
}
function renderToneRamp(paint){
  const steps=[
    {label:'Sombra profunda',hex:shiftColor(paint.hex,{h:8,s:4,l:-28})},
    {label:'Sombra',hex:shiftColor(paint.hex,{h:4,s:2,l:-15})},
    {label:'Base',hex:paint.hex},
    {label:'Luz',hex:shiftColor(paint.hex,{h:-3,s:-4,l:16})},
    {label:'Luz máxima',hex:shiftColor(paint.hex,{h:-6,s:-10,l:30})}
  ];
  document.getElementById('tone-ramp').innerHTML=steps.map((s,i)=>{const nearest=i===2?paint:nearestPaint(s.hex,paint.id);return `<div class="tone-step" style="background:${s.hex};color:${textColor(s.hex)};text-shadow:none"><small>${s.label}</small><strong>${nearest?escapeHtml(nearest.name):s.hex}</strong><span>${nearest?escapeHtml(nearest.code):s.hex}</span></div>`}).join('');
}
function drawColorWheel(selectedHex,name){
  const canvas=document.getElementById('color-wheel'); const ctx=canvas.getContext('2d'); const size=canvas.width, cx=size/2, cy=size/2, outer=size*.46, inner=size*.25;
  ctx.clearRect(0,0,size,size);
  for(let a=0;a<360;a+=1){const start=(a-90)*Math.PI/180,end=(a+1-90)*Math.PI/180;ctx.beginPath();ctx.arc(cx,cy,outer,start,end);ctx.arc(cx,cy,inner,end,start,true);ctx.closePath();ctx.fillStyle=`hsl(${a},72%,55%)`;ctx.fill();}
  const rgb=hexToRgb(selectedHex),hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
  const markers=[{h:hsl.h,color:'#ffffff',r:outer-18,size:13},{h:(hsl.h-30+360)%360,color:'#54d2a0',r:outer-36,size:10},{h:(hsl.h+30)%360,color:'#54d2a0',r:outer-36,size:10},{h:(hsl.h+180)%360,color:'#ef6c7b',r:outer-18,size:13}];
  markers.forEach(m=>{const rad=(m.h-90)*Math.PI/180,x=cx+Math.cos(rad)*m.r,y=cy+Math.sin(rad)*m.r;ctx.beginPath();ctx.arc(x,y,m.size,0,Math.PI*2);ctx.fillStyle=m.color;ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#0c0f14';ctx.stroke();});
  document.getElementById('wheel-center').innerHTML=`<div><span style="display:block;width:52px;height:52px;border-radius:50%;background:${selectedHex};margin:0 auto 8px;border:1px solid rgba(255,255,255,.25)"></span>${escapeHtml(name)}</div>`;
}

function renderMiniatures(){
  const q=document.getElementById('mini-search').value.trim().toLowerCase();
  const faction=document.getElementById('mini-faction-filter').value;
  const status=document.getElementById('mini-status-filter').value;
  const filtered=data.miniatures.filter(m=>(!q||`${m.name} ${m.unit} ${m.faction}`.toLowerCase().includes(q))&&(faction==='all'||m.faction===faction)&&(status==='all'||m.status===status));
  document.getElementById('kanban-board').innerHTML=STATUSES.map(s=>{const items=filtered.filter(m=>m.status===s);return `<section class="kanban-column"><div class="kanban-header"><h3>${s}</h3><span class="count-badge">${items.length}</span></div>${items.map(m=>`<article class="mini-card"><h4>${escapeHtml(m.name)}</h4><p>${escapeHtml(m.faction)} · ${escapeHtml(m.unit||'Sem unidade')}</p><div class="mini-card-footer"><span class="points-badge">${m.points} pts</span><select class="status-select" data-mini-status="${m.id}">${STATUSES.map(st=>`<option ${st===m.status?'selected':''}>${st}</option>`).join('')}</select></div></article>`).join('')||'<div class="empty-state">Sem itens</div>'}</section>`}).join('');
  document.querySelectorAll('[data-mini-status]').forEach(sel=>sel.addEventListener('change',()=>{const m=data.miniatures.find(x=>x.id===sel.dataset.miniStatus);m.status=sel.value;saveData();toast('Status atualizado');}));
  const factions=[...new Set(data.miniatures.map(m=>m.faction))].sort();
  const fs=document.getElementById('mini-faction-filter'); const current=fs.value; fs.innerHTML='<option value="all">Todas as facções</option>'+factions.map(f=>`<option>${escapeHtml(f)}</option>`).join(''); if(factions.includes(current))fs.value=current;
  const ss=document.getElementById('mini-status-filter'); const sc=ss.value; ss.innerHTML='<option value="all">Todos os status</option>'+STATUSES.map(s=>`<option>${s}</option>`).join(''); if(STATUSES.includes(sc))ss.value=sc;
}

function renderArmies(){
  const factions=[...new Set(data.miniatures.map(m=>m.faction))].sort();
  document.getElementById('army-list').innerHTML=factions.map(f=>{const units=data.miniatures.filter(m=>m.faction===f);const total=units.reduce((s,m)=>s+Number(m.points||0),0);const painted=units.filter(m=>m.status==='Pintado').reduce((s,m)=>s+Number(m.points||0),0);const pct=total?Math.round(painted/total*100):0;return `<article class="army-card"><div class="army-head"><div><h3>${escapeHtml(f)}</h3><p>${units.length} unidades cadastradas · ${painted} pontos pintados</p></div><div class="army-score"><strong>${total}</strong><span>pontos totais</span></div></div><div class="army-body"><div class="bar" style="margin-bottom:18px"><i style="width:${pct}%"></i></div>${units.map(m=>`<div class="unit-row"><div><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.unit||'Sem unidade')}</small></div><div>${escapeHtml(m.status)}</div><div>${m.quantity} modelos</div><div><strong>${m.points} pts</strong></div></div>`).join('')}</div></article>`}).join('')||'<div class="empty-state">Cadastre sua primeira unidade.</div>';
}

function renderAll(){ renderDashboard(); renderPaints(); renderLab(); renderMiniatures(); renderArmies(); }

const paintDialog=document.getElementById('paint-dialog');
const miniDialog=document.getElementById('mini-dialog');
function openPaintDialog(){ document.getElementById('paint-form').reset(); document.querySelector('#paint-form [name="hex"]').value='#3157c8'; document.querySelector('#paint-form [name="line"]').value='Game Color'; paintDialog.showModal(); }
function openMiniDialog(){ const form=document.getElementById('mini-form'); form.reset(); const status=form.querySelector('[name="status"]'); status.innerHTML=STATUSES.map(s=>`<option>${s}</option>`).join(''); miniDialog.showModal(); }
['add-paint','quick-add-paint'].forEach(id=>document.getElementById(id).addEventListener('click',openPaintDialog));
['add-mini','quick-add-mini','add-army-mini'].forEach(id=>document.getElementById(id).addEventListener('click',openMiniDialog));

document.getElementById('paint-form').addEventListener('submit',e=>{e.preventDefault(); const fd=new FormData(e.target); data.paints.push({id:crypto.randomUUID(),name:fd.get('name').trim(),code:fd.get('code').trim(),line:fd.get('line').trim()||'Game Color',hex:fd.get('hex'),level:fd.get('level'),owned:fd.get('owned')==='on'}); paintDialog.close(); saveData(); toast('Tinta adicionada');});
document.getElementById('mini-form').addEventListener('submit',e=>{e.preventDefault(); const fd=new FormData(e.target); data.miniatures.push({id:crypto.randomUUID(),name:fd.get('name').trim(),unit:fd.get('unit').trim(),faction:fd.get('faction').trim(),quantity:Number(fd.get('quantity')||1),points:Number(fd.get('points')||0),status:fd.get('status'),notes:fd.get('notes').trim()}); miniDialog.close(); saveData(); toast('Miniatura adicionada');});

['paint-search','paint-line-filter','paint-stock-filter'].forEach(id=>document.getElementById(id).addEventListener(id.includes('search')?'input':'change',renderPaints));
['mini-search','mini-faction-filter','mini-status-filter'].forEach(id=>document.getElementById(id).addEventListener(id.includes('search')?'input':'change',renderMiniatures));
document.getElementById('lab-paint-select').addEventListener('change',renderLab);

document.getElementById('export-data').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`paint-companion-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast('Backup exportado');});
document.getElementById('import-data').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());data=parsed.data||parsed;if(!Array.isArray(data.paints)||!Array.isArray(data.miniatures))throw new Error('Formato inválido');saveData();toast('Backup restaurado');}catch(err){alert('Não foi possível importar este arquivo.');}e.target.value='';});
document.getElementById('reset-data').addEventListener('click',()=>{if(confirm('Restaurar os dados de demonstração?')){data=structuredClone(starterData);saveData();toast('Dados restaurados');}});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}
renderAll();
