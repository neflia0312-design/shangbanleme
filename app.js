const VERSION='v0.2.0';
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const ART_THEMES=['Japanese textile pattern','butterfly print','botanical drawing','spring flowers print','textile design','night landscape print','summer garden painting','abstract pattern','autumn botanical print','black and white print','butterfly illustration','winter landscape print'];
const FESTIVALS={
  '01-01':'元旦','02-14':'情人节','03-08':'妇女节','03-12':'植树节','04-22':'世界地球日','05-01':'劳动节','05-04':'青年节','06-01':'儿童节','06-05':'世界环境日','07-01':'建党节','08-01':'建军节','09-10':'教师节','10-01':'国庆节','10-31':'万圣夜','12-24':'平安夜','12-25':'圣诞节'
};
const FESTIVALS_2026={'2026-03-20':'春分','2026-04-05':'清明','2026-05-10':'母亲节','2026-06-19':'端午节','2026-06-21':'父亲节','2026-09-22':'秋分','2026-09-25':'中秋节','2026-11-26':'感恩节','2026-12-22':'冬至'};
const WORLD_KEYS=new Set(['02-14','03-08','04-22','05-10','06-05','06-21','10-31','11-26','12-24','12-25']);
const initialRoster={year:2026,month:9,owner:'陈可',people:[
  {name:'骆蒋婷',location:'六小龙展厅',rest:[5,6,13,14,20,21,26,27,28]},
  {name:'孙思怡',location:'六小龙展厅',rest:[4,5,11,12,18,19,24,25,30]},
  {name:'潘柳杉',location:'数贸港（2楼）',rest:[4,5,11,12,19,20,21,22,23]},
  {name:'林雨柔',location:'数贸港（2楼）暂时',rest:[6,7,13,14,20,28,29,30]},
  {name:'陈可',location:'数贸港（1楼+2楼）',rest:[4,5,9,10,17,24,25,26]},
  {name:'朱紫珂',location:'数贸港（1楼）',rest:[6,7,13,14,20,27,28,29]},
  {name:'郭仕仕',location:'二区东A展厅',rest:[5,6,12,13,19,25,26,27]},
  {name:'朱晓璐',location:'中福（暂时）',rest:[5,6,12,13,19,28,29,30]}
]};
let roster=JSON.parse(localStorage.getItem('slm-roster')||'null')||initialRoster;
let notes=JSON.parse(localStorage.getItem('slm-notes')||'{}');
let settings=JSON.parse(localStorage.getItem('slm-settings')||'{"world":true,"lunar":true}');
let cursor=new Date();cursor.setDate(1);let selectedDate=''; let selectedPerson='全部';
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];

function pad(n){return String(n).padStart(2,'0')} function keyFor(y,m,d){return `${y}-${pad(m)}-${pad(d)}`}
function daysIn(y,m){return new Date(y,m,0).getDate()}
function weekendCount(y,m){let n=0;for(let d=1;d<=daysIn(y,m);d++){const w=new Date(y,m-1,d).getDay();if(w===0||w===6)n++}return n}
function ownerRow(y,m){return y===roster.year&&m===roster.month?roster.people.find(p=>p.name===roster.owner):null}
function lunarText(date){try{const parts=new Intl.DateTimeFormat('zh-CN-u-ca-chinese',{day:'numeric'}).formatToParts(date);return parts.find(p=>p.type==='day')?.value||''}catch{return ''}}
function festival(y,m,d){const md=`${pad(m)}-${pad(d)}`,full=`${y}-${md}`;if(WORLD_KEYS.has(md)&&!settings.world)return '';return FESTIVALS_2026[full]||FESTIVALS[md]||''}
function dayStatus(y,m,d){const override=notes[keyFor(y,m,d)]?.status;if(override&&override!=='unset')return override;const row=ownerRow(y,m);if(!row)return 'unset';return row.rest.includes(d)?'rest':'work'}

async function renderArt(y,m){
  const card=$('.art-card'),img=$('#monthArt'),title=$('#artTitle'),note=$('#artNote'),cacheKey=`slm-art-${y}-${m}`;
  card.classList.add('loading');img.removeAttribute('src');title.textContent='本月艺术作品';note.textContent='正在策展…';
  try{
    let work=JSON.parse(localStorage.getItem(cacheKey)||'null');
    if(!work){
      const fields='id,title,artist_title,date_display,image_id,is_public_domain';
      const url=`https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(ART_THEMES[m-1])}&query[term][is_public_domain]=true&limit=40&fields=${fields}`;
      const response=await fetch(url);if(!response.ok)throw new Error('museum unavailable');
      const payload=await response.json(),works=(payload.data||[]).filter(item=>item.image_id&&item.is_public_domain===true);
      if(!works.length)throw new Error('no artwork');
      work=works[Math.abs(y*37+m*11)%works.length];work.iiif=payload.config?.iiif_url||'https://www.artic.edu/iiif/2';
      localStorage.setItem(cacheKey,JSON.stringify(work));
    }
    img.onload=()=>card.classList.remove('loading');img.onerror=()=>{card.classList.add('loading');note.textContent='艺术馆图片暂时无法载入'};
    img.src=`${work.iiif}/${work.image_id}/full/843,/0/default.jpg`;img.alt=`${work.artist_title||'佚名艺术家'}《${work.title}》`;
    title.textContent=work.title;note.textContent=`${work.artist_title||'佚名艺术家'}${work.date_display?' · '+work.date_display:''} · AIC`;
  }catch(error){title.textContent='本月艺术留白';note.textContent=`网络恢复后自动更新 · ${VERSION}`}
}

function render(){
  const y=cursor.getFullYear(),m=cursor.getMonth()+1,total=daysIn(y,m),first=(new Date(y,m-1,1).getDay()+6)%7,row=ownerRow(y,m);
  $('#monthEn').textContent=MONTHS[m-1];$('#monthNum').textContent=`/${pad(m)}`;$('#yearText').textContent=y;$('#teamMonth').textContent=`${y}.${pad(m)}`;
  renderArt(y,m);
  const rest=row?row.rest.length:0,work=row?total-rest:0,expected=weekendCount(y,m);
  $('#summaryStrip').innerHTML=summaryHTML([['上班',work],['休息',rest],['本月应休',expected]]);
  $('#recordSummary').innerHTML=summaryHTML([['已记录',Object.keys(notes).filter(k=>k.startsWith(`${y}-${pad(m)}`)).length],['排班天数',work],['与应休差',row?rest-expected:'—']]);
  const grid=$('#calendarGrid');grid.innerHTML='';for(let i=0;i<first;i++)grid.insertAdjacentHTML('beforeend','<span class="day empty"></span>');
  const now=new Date();
  for(let d=1;d<=total;d++){
    const date=new Date(y,m-1,d),key=keyFor(y,m,d),status=dayStatus(y,m,d),fest=festival(y,m,d),minor=fest||(settings.lunar?lunarText(date):''),rec=notes[key];
    const btn=document.createElement('button');btn.className=`day ${status==='work'?'work-day':status==='rest'?'rest-day':''} ${rec&&(rec.title||rec.note)?'has-record':''} ${now.getFullYear()===y&&now.getMonth()+1===m&&now.getDate()===d?'today':''}`;
    btn.innerHTML=`<span class="num">${d}</span><span class="minor">${rec?.title||minor||'&nbsp;'}</span>${status!=='unset'?`<span class="status">${status==='work'?'班':'休'}</span>`:''}`;btn.addEventListener('click',()=>openDay(key));grid.append(btn);
  }
  renderTeam();
}
function summaryHTML(items){return items.map(([label,value])=>`<div class="summary-item"><strong>${value}</strong><span>${label}</span></div>`).join('')}
function renderTeam(){
  const same=cursor.getFullYear()===roster.year&&cursor.getMonth()+1===roster.month,people=same?roster.people:[];
  $('#teamFilter').innerHTML=['全部',...new Set(people.map(p=>p.location.replace(/（.*?）/g,'')))].map(v=>`<button class="${v===selectedPerson?'active':''}" data-filter="${v}">${v}</button>`).join('');
  $$('#teamFilter button').forEach(b=>b.onclick=()=>{selectedPerson=b.dataset.filter;renderTeam()});
  const visible=selectedPerson==='全部'?people:people.filter(p=>p.location.includes(selectedPerson));
  $('#teamList').innerHTML=visible.length?visible.map(p=>`<article class="team-card"><header><h3>${p.name}${p.name===roster.owner?' · 我':''}</h3><small>${p.location}</small></header><div class="date-chips">${p.rest.map(d=>`<span class="date-chip">${d}日休</span>`).join('')}</div></article>`).join(''):'<div class="panel muted">这个月份还没有导入团队排班。</div>';
}
function openDay(key){selectedDate=key;const [y,m,d]=key.split('-').map(Number),n=notes[key]||{},status=dayStatus(y,m,d);$('#dialogDate').textContent=`${y} / ${pad(m)} / ${pad(d)}`;$('#dialogTitle').textContent=festival(y,m,d)||`星期${'日一二三四五六'[new Date(y,m-1,d).getDay()]}`;$('#eventTitle').value=n.title||'';$('#eventNote').value=n.note||'';const radio=$(`input[name="status"][value="${n.status||status}"]`)||$('input[name="status"][value="unset"]');radio.checked=true;$('#dayDialog').showModal()}
function saveDay(){const status=$('input[name="status"]:checked').value,title=$('#eventTitle').value.trim(),note=$('#eventNote').value.trim();notes[selectedDate]={status,title,note};localStorage.setItem('slm-notes',JSON.stringify(notes));render();toast('已保存当天记录')}
function deleteDay(){delete notes[selectedDate];localStorage.setItem('slm-notes',JSON.stringify(notes));$('#dayDialog').close();render();toast('记录已删除')}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function validate(data){if(!data||!Number.isInteger(data.year)||!Number.isInteger(data.month)||data.month<1||data.month>12||!Array.isArray(data.people))throw new Error('文件缺少正确的年份、月份或人员列表');const max=daysIn(data.year,data.month);for(const p of data.people){if(!p.name||!Array.isArray(p.rest)||p.rest.some(d=>!Number.isInteger(d)||d<1||d>max))throw new Error(`“${p.name||'未命名'}”的休息日期有误`)}return data}
function importRoster(file){const reader=new FileReader();reader.onload=()=>{try{const data=validate(JSON.parse(reader.result));if(!confirm(`将导入 ${data.year}年${data.month}月、${data.people.length} 人的排班，是否继续？`))return;roster=data;localStorage.setItem('slm-roster',JSON.stringify(roster));cursor=new Date(data.year,data.month-1,1);$('#importStatus').textContent='导入成功，已切换到对应月份。';render();toast('排班导入成功')}catch(e){$('#importStatus').textContent=`导入失败：${e.message}`}};reader.readAsText(file)}
function exportBackup(){const data={app:'上班了没',schemaVersion:1,exportedAt:new Date().toISOString(),...roster,notes};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`上班了没-${roster.year}-${pad(roster.month)}.json`;a.click();URL.revokeObjectURL(a.href);toast('备份已导出')}

$('#prevMonth').onclick=()=>{cursor.setMonth(cursor.getMonth()-1);render()};$('#nextMonth').onclick=()=>{cursor.setMonth(cursor.getMonth()+1);render()};$('#todayBtn').onclick=()=>{cursor=new Date();render()};
$$('.nav-item').forEach(b=>b.onclick=()=>{$$('.nav-item,.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(`#${b.dataset.view}`).classList.add('active')});
$('#saveDay').addEventListener('click',e=>{e.preventDefault();saveDay();$('#dayDialog').close()});$('#deleteRecord').onclick=deleteDay;$('#importFile').onchange=e=>e.target.files[0]&&importRoster(e.target.files[0]);$('#exportBtn').onclick=exportBackup;
$('#worldToggle').checked=settings.world;$('#lunarToggle').checked=settings.lunar;$('#worldToggle').onchange=e=>{settings.world=e.target.checked;localStorage.setItem('slm-settings',JSON.stringify(settings));render()};$('#lunarToggle').onchange=e=>{settings.lunar=e.target.checked;localStorage.setItem('slm-settings',JSON.stringify(settings));render()};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
render();
