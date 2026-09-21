/* Fuhrpark Cockpit: Verlauf der Mehrkosten-Prognose
   Einbindung in index.html direkt NACH app.js:
   <script src="prognose-chart.js"></script>
*/
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
      .metric.forecast-clickable { cursor:pointer; position:relative; transition:transform .15s ease,border-color .15s ease; border:1px solid transparent; }
      .metric.forecast-clickable:hover,.metric.forecast-clickable:focus-visible { transform:translateY(-1px); border-color:var(--mint,#22d3b6); }
      .metric.forecast-clickable::after { content:'Verlauf öffnen'; display:block; margin-top:7px; color:var(--mint,#22d3b6); font-size:11px; font-weight:700; }
      #forecastChartDialog { width:min(94vw,760px); max-height:92vh; padding:0; overflow:hidden; }
      #forecastChartDialog .chart-shell { padding:18px; }
      #forecastChartDialog .chart-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:12px; }
      #forecastChartDialog .chart-head h2 { margin:0 0 4px; }
      #forecastChartDialog .chart-wrap { position:relative; height:360px; min-height:300px; }
      #forecastChartDialog .chart-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:12px 0 0; }
      #forecastChartDialog .chart-kpi { background:var(--panel2,#17283d); border-radius:12px; padding:10px; min-width:0; }
      #forecastChartDialog .chart-kpi span { display:block; color:var(--muted,#9fb0c5); font-size:11px; margin-bottom:3px; }
      #forecastChartDialog .chart-kpi b { overflow-wrap:anywhere; }
      #forecastChartDialog .chart-note { color:var(--muted,#9fb0c5); font-size:12px; margin-top:10px; }
      @media(max-width:600px){
        #forecastChartDialog .chart-shell { padding:14px; }
        #forecastChartDialog .chart-wrap { height:330px; }
        #forecastChartDialog .chart-summary { grid-template-columns:1fr; }
      }
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
          <div class="chart-kpi"><span>Erste Prognose</span><b id="forecastFirst">–</b></div>
          <div class="chart-kpi"><span>Aktuelle Prognose</span><b id="forecastCurrent">–</b></div>
          <div class="chart-kpi"><span>Veränderung</span><b id="forecastChange">–</b></div>
        </div>
        <p class="chart-note">Jeder Punkt verwendet den damaligen Kilometerstand und schreibt den bis dahin gefahrenen Tagesdurchschnitt bis zum Vertragsende fort. Sinkt die Linie, wurde die Endprognose durch geringere Fahrleistung verbessert.</p>
      </div>`;
    document.body.appendChild(dialog);
    document.getElementById('closeForecastChart').onclick = () => dialog.close();
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }

  function deNumber(value) {
    return new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR' }).format(value || 0);
  }

  function km(value) {
    return `${Math.round(value || 0).toLocaleString('de-DE')} km`;
  }

  function buildHistory(vehicle) {
    const vehicleReadings = readings
      .filter(r => r.vehicle_id === vehicle.id)
      .slice()
      .sort((a,b) => a.reading_date.localeCompare(b.reading_date));

    const start = new Date(vehicle.contract_start + 'T12:00:00');
    const end = new Date(vehicle.contract_end + 'T12:00:00');
    const durationDays = Math.max(1, Math.round((end - start) / 86400000));
    const startOdo = Number(vehicle.start_odometer || 0);
    const freeEndOdo = startOdo + Number(vehicle.total_km || 0) + Number(vehicle.tolerance_km || 0);
    const price = Number(vehicle.overage_eur_km || 0);

    return vehicleReadings.map(r => {
      const date = new Date(r.reading_date + 'T12:00:00');
      const elapsedDays = Math.round((date - start) / 86400000);
      if (elapsedDays <= 0) return null;
      const driven = Number(r.odometer) - startOdo;
      const forecastOdo = startOdo + (driven / elapsedDays) * durationDays;
      const paidOverKm = Math.max(0, forecastOdo - freeEndOdo);
      return {
        date: r.reading_date,
        label: date.toLocaleDateString('de-DE'),
        forecastOdo,
        paidOverKm,
        cost: paidOverKm * price
      };
    }).filter(Boolean);
  }

  async function openChart(vehicleId) {
    ensureUi();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const points = buildHistory(vehicle);
    if (!points.length) {
      alert('Für dieses Fahrzeug ist noch keine auswertbare Ablesung nach Vertragsbeginn vorhanden.');
      return;
    }

    try { await loadChartJs(); }
    catch (e) { alert(e.message); return; }

    document.getElementById('forecastChartTitle').textContent = `Mehrkosten-Prognose: ${vehicle.short_name || vehicle.name}`;
    document.getElementById('forecastChartSubtitle').textContent = `${points.length} Prognosepunkt${points.length === 1 ? '' : 'e'} aus gespeicherten Ablesungen`;

    const first = points[0].cost;
    const current = points.at(-1).cost;
    const change = current - first;
    document.getElementById('forecastFirst').textContent = deNumber(first);
    document.getElementById('forecastCurrent').textContent = deNumber(current);
    const changeNode = document.getElementById('forecastChange');
    changeNode.textContent = `${change > 0 ? '+' : ''}${deNumber(change)}`;
    changeNode.style.color = change > 0 ? '#ff9a9a' : change < 0 ? '#7ff2de' : '';

    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('forecastChartCanvas');
    chartInstance = new Chart(ctx, {
      type:'line',
      data:{
        labels:points.map(p => p.label),
        datasets:[
          {
            label:'Prognostizierte Mehrkosten',
            data:points.map(p => p.cost),
            yAxisID:'yCost',
            borderColor:'#ffbd59',
            backgroundColor:'rgba(255,189,89,.14)',
            fill:true,
            tension:.3,
            pointRadius:4,
            pointHoverRadius:6
          },
          {
            label:'Prognostizierter Endstand',
            data:points.map(p => p.forecastOdo),
            yAxisID:'yKm',
            borderColor:'#4da3ff',
            backgroundColor:'#4da3ff',
            fill:false,
            tension:.3,
            pointRadius:3,
            borderDash:[5,4]
          }
        ]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{
          legend:{labels:{color:'#dce7f5',boxWidth:12}},
          tooltip:{callbacks:{label:ctx => ctx.dataset.yAxisID === 'yCost' ? `${ctx.dataset.label}: ${deNumber(ctx.parsed.y)}` : `${ctx.dataset.label}: ${km(ctx.parsed.y)}`}}
        },
        scales:{
          x:{ticks:{color:'#9fb0c5',maxRotation:45,minRotation:0},grid:{color:'rgba(255,255,255,.06)'}},
          yCost:{position:'left',beginAtZero:true,ticks:{color:'#ffbd59',callback:v=>`${v.toLocaleString('de-DE')} €`},grid:{color:'rgba(255,255,255,.06)'}},
          yKm:{position:'right',ticks:{color:'#7db8ff',callback:v=>`${Math.round(v/1000)} Tsd.`},grid:{drawOnChartArea:false}}
        }
      }
    });
    document.getElementById('forecastChartDialog').showModal();
  }

  function bindCards() {
    document.querySelectorAll('.vehicle').forEach(card => {
      const vehicleName = card.querySelector('small')?.textContent?.trim();
      const vehicle = vehicles.find(v => v.short_name === vehicleName);
      if (!vehicle) return;
      [...card.querySelectorAll('.metric')].forEach(metric => {
        if (metric.querySelector('span')?.textContent?.trim() === 'Mehrkosten Prognose') {
          metric.classList.add('forecast-clickable');
          metric.tabIndex = 0;
          metric.setAttribute('role','button');
          metric.setAttribute('aria-label',`Verlauf der Mehrkosten-Prognose für ${vehicle.short_name || vehicle.name} öffnen`);
          metric.onclick = () => openChart(vehicle.id);
          metric.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChart(vehicle.id); } };
        }
      });
    });
  }

  ensureUi();
  new MutationObserver(bindCards).observe(document.body,{childList:true,subtree:true});
  bindCards();
})();
