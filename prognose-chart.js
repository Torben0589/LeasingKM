/* Fuhrpark Cockpit - Prognose-Chart V4
   Zwei getrennte Auswertungen:
   1. Mehrkostenentwicklung
   2. Entwicklung des erwarteten Kilometerstands bei Vertragsende
*/
(() => {
  'use strict';

  const CHART_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
  let chart = null;

  const euro = v => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(v)||0);
  const km = v => `${Math.round(Number(v)||0).toLocaleString('de-DE')} km`;
  const dateDE = v => new Date(`${v}T12:00:00`).toLocaleDateString('de-DE');
  const signedEuro = v => `${Number(v)>0?'+':''}${euro(v)}`;
  const signedKm = v => `${Number(v)>0?'+':''}${km(v)}`;
  const colorClass = v => Number(v)>0.004?'fc-bad':Number(v)<-0.004?'fc-good':'fc-neutral';

  function loadChart(){
    if(window.Chart) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=CHART_URL;s.onload=resolve;s.onerror=()=>reject(new Error('Diagrammbibliothek konnte nicht geladen werden.'));
      document.head.appendChild(s);
    });
  }

  function createUI(){
    if(document.getElementById('forecastChartDialog')) return;
    const style=document.createElement('style');
    style.textContent=`
      .metric.forecast-clickable{cursor:pointer;border:1px solid transparent;transition:.15s}
      .metric.forecast-clickable:hover,.metric.forecast-clickable:focus-visible{border-color:var(--mint,#22d3b6);transform:translateY(-1px);outline:none}
      .metric.forecast-clickable::after{content:'Verlauf anzeigen';display:block;margin-top:7px;color:var(--mint,#22d3b6);font-size:11px;font-weight:800}
      #forecastChartDialog{width:min(96vw,900px);height:min(94vh,920px);max-width:900px;max-height:94vh;padding:0;overflow:hidden;border-radius:20px}
      #forecastChartDialog::backdrop{background:rgba(0,0,0,.78)}
      .fc-shell{height:100%;display:grid;grid-template-rows:auto auto minmax(280px,1fr) auto minmax(130px,210px) auto;gap:11px;padding:16px;overflow:hidden}
      .fc-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start}.fc-head h2{margin:0 0 4px;font-size:20px}
      .fc-evaluations{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fc-eval{background:var(--panel2,#17283d);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:11px;min-width:0}
      .fc-eval h3{margin:0 0 9px;font-size:13px}.fc-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.fc-kpi{min-width:0;background:rgba(7,17,31,.38);border-radius:10px;padding:8px}
      .fc-kpi span{display:block;min-height:28px;color:var(--muted,#9fb0c5);font-size:10px;line-height:1.25}.fc-kpi b{display:block;margin-top:3px;font-size:13px;overflow-wrap:anywhere}
      .fc-good{color:#7ff2de}.fc-bad{color:#ff9a9a}.fc-neutral{color:var(--text,#f5f8fc)}
      .fc-chart{position:relative;min-height:280px;background:rgba(7,17,31,.3);border-radius:14px;padding:7px}.fc-note{margin:0;color:var(--muted,#9fb0c5);font-size:11px;line-height:1.4}
      .fc-table-wrap{overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:12px}.fc-table{width:100%;min-width:690px;border-collapse:collapse;font-size:12px}.fc-table th,.fc-table td{padding:8px 9px;border-bottom:1px solid rgba(255,255,255,.07);text-align:right;white-space:nowrap}
      .fc-table th{position:sticky;top:0;background:var(--panel,#101e31);color:var(--muted,#9fb0c5);z-index:2}.fc-table th:first-child,.fc-table td:first-child{position:sticky;left:0;text-align:left;background:var(--panel,#101e31);z-index:1}.fc-table th:first-child{z-index:3}
      .fc-foot{display:flex;justify-content:space-between;gap:10px;color:var(--muted,#9fb0c5);font-size:10px}
      @media(max-width:700px){#forecastChartDialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;border:0;border-radius:0}.fc-shell{grid-template-rows:auto auto minmax(260px,1fr) auto minmax(120px,170px) auto;padding:max(10px,env(safe-area-inset-top)) 8px max(10px,env(safe-area-inset-bottom));gap:8px}.fc-head h2{font-size:17px}.fc-head button{padding:8px 9px;font-size:12px}.fc-evaluations{grid-template-columns:1fr 1fr;gap:6px}.fc-eval{padding:7px}.fc-eval h3{font-size:11px;margin-bottom:6px}.fc-kpis{grid-template-columns:1fr 1fr;gap:4px}.fc-kpi{padding:5px}.fc-kpi span{min-height:25px;font-size:8px}.fc-kpi b{font-size:11px}.fc-chart{min-height:260px;padding:3px}.fc-note{font-size:9px}.fc-foot{font-size:8px}}
    `;
    document.head.appendChild(style);

    const d=document.createElement('dialog');d.id='forecastChartDialog';d.innerHTML=`
      <div class="fc-shell">
        <div class="fc-head"><div><h2 id="fcTitle">Prognoseverlauf</h2><small id="fcSubtitle"></small></div><button class="ghost" id="fcClose" type="button">Schließen</button></div>
        <div class="fc-evaluations">
          <section class="fc-eval"><h3>1. Mehrkostenentwicklung</h3><div class="fc-kpis">
            <div class="fc-kpi"><span>Erste Prognose</span><b id="cFirst">–</b></div><div class="fc-kpi"><span>Aktuelle Prognose</span><b id="cNow">–</b></div>
            <div class="fc-kpi"><span>Seit letzter Ablesung</span><b id="cLast">–</b></div><div class="fc-kpi"><span>Ersparnis seit Höchststand</span><b id="cSave">–</b></div>
          </div></section>
          <section class="fc-eval"><h3>2. Kilometer-Endprognose</h3><div class="fc-kpis">
            <div class="fc-kpi"><span>Erster erwarteter Endstand</span><b id="kFirst">–</b></div><div class="fc-kpi"><span>Aktuell erwarteter Endstand</span><b id="kNow">–</b></div>
            <div class="fc-kpi"><span>Seit letzter Ablesung</span><b id="kLast">–</b></div><div class="fc-kpi"><span>Verbesserung seit Höchststand</span><b id="kSave">–</b></div>
          </div></section>
        </div>
        <div class="fc-chart"><canvas id="fcCanvas"></canvas></div>
        <p class="fc-note"><b>Gelb:</b> erwartete Mehrkosten bei Vertragsende. <b>Blau:</b> erwarteter Kilometerstand bei Vertragsende, jeweils berechnet und dauerhaft gespeichert am Datum der Kilometerablesung.</p>
        <div class="fc-table-wrap"><table class="fc-table"><thead><tr><th>Ablesedatum</th><th>Tachostand</th><th>Endprognose</th><th>Änderung Endstand</th><th>Mehr-km</th><th>Mehrkosten</th><th>Änderung Kosten</th></tr></thead><tbody id="fcRows"></tbody></table></div>
        <div class="fc-foot"><span>Historische Punkte bleiben trotz späterer Vertragsänderungen erhalten.</span><span id="fcUpdated"></span></div>
      </div>`;
    document.body.appendChild(d);document.getElementById('fcClose').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()});
  }

  function put(id,text,change=null){const e=document.getElementById(id);e.textContent=text;e.className=change===null?'fc-neutral':colorClass(change)}

  function renderRows(p){document.getElementById('fcRows').innerHTML=p.map((x,i)=>{const pc=i?Number(p[i-1].forecast_cost_eur):null,pk=i?Number(p[i-1].forecast_odometer):null;const dc=pc===null?null:Number(x.forecast_cost_eur)-pc,dk=pk===null?null:Number(x.forecast_odometer)-pk;return `<tr><td>${dateDE(x.snapshot_date)}</td><td>${km(x.odometer)}</td><td>${km(x.forecast_odometer)}</td><td class="${dk===null?'fc-neutral':colorClass(dk)}">${dk===null?'–':signedKm(dk)}</td><td>${km(x.forecast_over_km)}</td><td>${euro(x.forecast_cost_eur)}</td><td class="${dc===null?'fc-neutral':colorClass(dc)}">${dc===null?'–':signedEuro(dc)}</td></tr>`}).join('')}

  async function open(vehicleId){
    createUI();const vehicle=vehicles.find(v=>v.id===vehicleId);if(!vehicle)return;
    const {data:p,error}=await db.from('forecast_snapshots').select('snapshot_date,odometer,forecast_odometer,forecast_over_km,forecast_cost_eur,created_at').eq('vehicle_id',vehicleId).order('snapshot_date',{ascending:true}).order('created_at',{ascending:true});
    if(error){alert('Prognose-Historie konnte nicht geladen werden: '+error.message);return}if(!p?.length){alert('Noch keine gespeicherte Prognose vorhanden.');return}
    try{await loadChart()}catch(e){alert(e.message);return}

    const costs=p.map(x=>Number(x.forecast_cost_eur)||0),ends=p.map(x=>Number(x.forecast_odometer)||0);const ci=costs.at(-1),ki=ends.at(-1),cp=costs.length>1?costs.at(-2):null,kp=ends.length>1?ends.at(-2):null;
    put('cFirst',euro(costs[0]));put('cNow',euro(ci));put('cLast',cp===null?'–':signedEuro(ci-cp),cp===null?null:ci-cp);put('cSave',euro(Math.max(...costs)-ci),-(Math.max(...costs)-ci));
    put('kFirst',km(ends[0]));put('kNow',km(ki));put('kLast',kp===null?'–':signedKm(ki-kp),kp===null?null:ki-kp);put('kSave',km(Math.max(...ends)-ki),-(Math.max(...ends)-ki));
    document.getElementById('fcTitle').textContent=`Prognoseverlauf: ${vehicle.short_name||vehicle.name}`;document.getElementById('fcSubtitle').textContent=`${p.length} gespeicherte Ablesung${p.length===1?'':'en'} · ${dateDE(p[0].snapshot_date)} bis ${dateDE(p.at(-1).snapshot_date)}`;document.getElementById('fcUpdated').textContent=`Letzter Stand: ${dateDE(p.at(-1).snapshot_date)}`;renderRows(p);

    if(chart)chart.destroy();chart=new Chart(document.getElementById('fcCanvas'),{type:'line',data:{labels:p.map(x=>dateDE(x.snapshot_date)),datasets:[
      {label:'Mehrkosten-Prognose',data:costs,yAxisID:'yCost',borderColor:'#ffbd59',backgroundColor:'rgba(255,189,89,.13)',borderWidth:3,pointRadius:4,pointHoverRadius:6,fill:true,tension:.28},
      {label:'Kilometer-Endprognose',data:ends,yAxisID:'yKm',borderColor:'#67adff',backgroundColor:'#67adff',borderWidth:2,pointRadius:3,pointHoverRadius:5,borderDash:[6,5],fill:false,tension:.28}
    ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',align:'start',labels:{color:'#dce7f5',boxWidth:12,usePointStyle:true,pointStyle:'line',font:{size:10}}},tooltip:{callbacks:{label:c=>c.dataset.yAxisID==='yCost'?`${c.dataset.label}: ${euro(c.parsed.y)}`:`${c.dataset.label}: ${km(c.parsed.y)}`,afterBody:items=>{const i=items[0].dataIndex;return [`Tachostand: ${km(p[i].odometer)}`,`Kostenpflichtige Mehr-km: ${km(p[i].forecast_over_km)}`]}}}},scales:{x:{ticks:{color:'#9fb0c5',autoSkip:true,maxTicksLimit:7,maxRotation:0,font:{size:10}},grid:{color:'rgba(255,255,255,.05)'}},yCost:{position:'left',beginAtZero:true,ticks:{color:'#ffbd59',maxTicksLimit:6,callback:v=>`${Number(v).toLocaleString('de-DE')} €`,font:{size:10}},grid:{color:'rgba(255,255,255,.06)'}},yKm:{position:'right',ticks:{color:'#7db8ff',maxTicksLimit:6,callback:v=>`${Math.round(Number(v)/1000)} Tsd.`,font:{size:10}},grid:{drawOnChartArea:false}}}}});
    document.getElementById('forecastChartDialog').showModal();
  }

  function bind(){document.querySelectorAll('.vehicle').forEach(card=>{const short=card.querySelector('small')?.textContent?.trim(),v=vehicles.find(x=>x.short_name===short);if(!v)return;[...card.querySelectorAll('.metric')].forEach(m=>{if(m.querySelector('span')?.textContent?.trim()!=='Mehrkosten Prognose')return;m.classList.add('forecast-clickable');m.tabIndex=0;m.setAttribute('role','button');m.onclick=()=>open(v.id);m.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(v.id)}}})})}

  createUI();new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});bind();
})();
