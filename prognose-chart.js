/* Fuhrpark Cockpit: dauerhaft gespeicherte Prognose-Historie */
(() => {
  const CHART_SRC = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
  let chartInstance = null;

  function loadChartJs() {
    if (window.Chart) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHART_SRC;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Chart.js konnte nicht geladen werden.'));
      document.head.appendChild(script);
    });
  }

  function ensureUi() {
    if (document.getElementById('forecastChartDialog')) return;
    const style = document.createElement('style');
    style.textContent = `
      .metric.forecast-clickable{cursor:pointer;position:relative;border:1px solid transparent;transition:.15s}
      .metric.forecast-clickable:hover,.metric.forecast-clickable:focus-visible{transform:translateY(-1px);border-color:var(--mint,#22d3b6)}
      .metric.forecast-clickable::after{content:'Gespeicherten Verlauf öffnen';display:block;margin-top:7px;color:var(--mint,#22d3b6);font-size:11px;font-weight:700}
      #forecastChartDialog{width:min(94vw,760px);max-height:92vh;padding:0;overflow:auto}
      #forecastChartDialog .chart-shell{padding:18px}
      #forecastChartDialog .chart-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
      #forecastChartDialog .chart-head h2{margin:0 0 4px}
      #forecastChartDialog .chart-wrap{position:relative;height:360px;min-height:300px}
      #forecastChartDialog .chart-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}
      #forecastChartDialog .chart-kpi{background:var(--panel2,#17283d);border-radius:12px;padding:10px;min-width:0}
      #forecastChartDialog .chart-kpi span{display:block;color:var(--muted,#9fb0c5);font-size:11px;margin-bottom:3px}
      #forecastChartDialog .chart-note{color:var(--muted,#9fb0c5);font-size:12px;margin-top:10px}
      @media(max-width:600px){#forecastChartDialog .chart-shell{padding:14px}#forecastChartDialog .chart-wrap{height:330px}#forecastChartDialog .chart-summary{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    const dialog = document.createElement('dialog');
    dialog.id = 'forecastChartDialog';
    dialog.innerHTML = `
      <div class="chart-shell">
        <div class="chart-head">
          <div><h2 id="forecastChartTitle">Mehrkosten-Prognose</h2><small id="forecastChartSubtitle"></small></div>
          <button type="button" class="ghost" id="closeForecastChart">Schließen</button>
        </div>
        <div class="chart-wrap"><canvas id="forecastChartCanvas"></canvas></div>
        <div class="chart-summary">
          <div class="chart-kpi"><span>Erste gespeicherte Prognose</span><b id="forecastFirst">–</b></div>
          <div class="chart-kpi"><span>Aktuelle gespeicherte Prognose</span><b id="forecastCurrent">–</b></div>
          <div class="chart-kpi"><span>Veränderung</span><b id="forecastChange">–</b></div>
        </div>
        <p class="chart-note">Neue Punkte werden beim Speichern einer Ablesung dauerhaft in Supabase angelegt. Spätere Vertragsänderungen verändern bereits gespeicherte Prognosepunkte nicht.</p>
      </div>`;
    document.body.appendChild(dialog);
    document.getElementById('closeForecastChart').onclick = () => dialog.close();
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }

  const eur = value => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(value)||0);
  const km = value => `${Math.round(Number(value)||0).toLocaleString('de-DE')} km`;

  async function openChart(vehicleId) {
    ensureUi();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const { data:points, error } = await db
      .from('forecast_snapshots')
      .select('snapshot_date,odometer,forecast_odometer,forecast_over_km,forecast_cost_eur,created_at')
      .eq('vehicle_id', vehicleId)
      .order('snapshot_date', { ascending:true })
      .order('created_at', { ascending:true });

    if (error) {
      alert('Prognose-Historie konnte nicht geladen werden: ' + error.message);
      return;
    }
    if (!points?.length) {
      alert('Noch keine dauerhaft gespeicherte Prognose vorhanden. Speichere zuerst einen neuen Kilometerstand.');
      return;
    }

    try { await loadChartJs(); }
    catch (e) { alert(e.message); return; }

    document.getElementById('forecastChartTitle').textContent = `Mehrkosten-Prognose: ${vehicle.short_name || vehicle.name}`;
    document.getElementById('forecastChartSubtitle').textContent = `${points.length} dauerhaft gespeicherte${points.length===1?'r':' '} Prognosepunkt${points.length===1?'':'e'}`;
    const first = Number(points[0].forecast_cost_eur);
    const current = Number(points.at(-1).forecast_cost_eur);
    const change = current - first;
    document.getElementById('forecastFirst').textContent = eur(first);
    document.getElementById('forecastCurrent').textContent = eur(current);
    const changeNode = document.getElementById('forecastChange');
    changeNode.textContent = `${change>0?'+':''}${eur(change)}`;
    changeNode.style.color = change>0?'#ff9a9a':change<0?'#7ff2de':'';

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(document.getElementById('forecastChartCanvas'), {
      type:'line',
      data:{
        labels:points.map(p=>new Date(p.snapshot_date+'T12:00:00').toLocaleDateString('de-DE')),
        datasets:[
          {label:'Gespeicherte Mehrkosten-Prognose',data:points.map(p=>Number(p.forecast_cost_eur)),yAxisID:'yCost',borderColor:'#ffbd59',backgroundColor:'rgba(255,189,89,.14)',fill:true,tension:.3,pointRadius:4,pointHoverRadius:6},
          {label:'Gespeicherter Endstand',data:points.map(p=>Number(p.forecast_odometer)),yAxisID:'yKm',borderColor:'#4da3ff',backgroundColor:'#4da3ff',fill:false,tension:.3,pointRadius:3,borderDash:[5,4]}
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#dce7f5',boxWidth:12}},tooltip:{callbacks:{label:ctx=>ctx.dataset.yAxisID==='yCost'?`${ctx.dataset.label}: ${eur(ctx.parsed.y)}`:`${ctx.dataset.label}: ${km(ctx.parsed.y)}`}}},scales:{x:{ticks:{color:'#9fb0c5',maxRotation:45},grid:{color:'rgba(255,255,255,.06)'}},yCost:{position:'left',beginAtZero:true,ticks:{color:'#ffbd59',callback:v=>`${v.toLocaleString('de-DE')} €`},grid:{color:'rgba(255,255,255,.06)'}},yKm:{position:'right',ticks:{color:'#7db8ff',callback:v=>`${Math.round(v/1000)} Tsd.`},grid:{drawOnChartArea:false}}}}
    });
    document.getElementById('forecastChartDialog').showModal();
  }

  function bindCards() {
    document.querySelectorAll('.vehicle').forEach(card => {
      const shortName = card.querySelector('small')?.textContent?.trim();
      const vehicle = vehicles.find(v => v.short_name === shortName);
      if (!vehicle) return;
      [...card.querySelectorAll('.metric')].forEach(metric => {
        if (metric.querySelector('span')?.textContent?.trim() === 'Mehrkosten Prognose') {
          metric.classList.add('forecast-clickable');
          metric.tabIndex = 0;
          metric.setAttribute('role','button');
          metric.onclick = () => openChart(vehicle.id);
          metric.onkeydown = e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openChart(vehicle.id); } };
        }
      });
    });
  }

  ensureUi();
  new MutationObserver(bindCards).observe(document.body,{childList:true,subtree:true});
  bindCards();
})();
