/* Fuhrpark Cockpit: Historische und aktuelle Live-Prognose */
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

  const euro = value => new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR'
  }).format(Number(value) || 0);

  const km = value => `${Math.round(Number(value) || 0).toLocaleString('de-DE')} km`;
  const localDate = value => new Date(value + 'T12:00:00').toLocaleDateString('de-DE');
  const dayCount = (a, b) => Math.round((b - a) / 86400000);

  function ensureUi() {
    if (document.getElementById('forecastChartDialog')) return;

    const style = document.createElement('style');
    style.textContent = `
      .metric.forecast-clickable{cursor:pointer;position:relative;border:1px solid transparent;transition:.15s ease}
      .metric.forecast-clickable:hover,.metric.forecast-clickable:focus-visible{transform:translateY(-1px);border-color:var(--mint,#22d3b6)}
      .metric.forecast-clickable::after{content:'Verlauf öffnen';display:block;margin-top:7px;color:var(--mint,#22d3b6);font-size:11px;font-weight:700}
      #forecastChartDialog{width:min(95vw,820px);max-height:94vh;padding:0;overflow:auto}
      #forecastChartDialog .chart-shell{padding:18px}
      #forecastChartDialog .chart-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
      #forecastChartDialog .chart-head h2{margin:0 0 4px}
      #forecastChartDialog .chart-wrap{position:relative;height:390px;min-height:310px}
      #forecastChartDialog .chart-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}
      #forecastChartDialog .chart-kpi{background:var(--panel2,#17283d);border-radius:12px;padding:10px;min-width:0}
      #forecastChartDialog .chart-kpi span{display:block;color:var(--muted,#9fb0c5);font-size:11px;margin-bottom:3px}
      #forecastChartDialog .chart-kpi b{overflow-wrap:anywhere}
      #forecastChartDialog .chart-note{color:var(--muted,#9fb0c5);font-size:12px;margin:10px 0 0}
      @media(max-width:600px){
        #forecastChartDialog .chart-shell{padding:14px}
        #forecastChartDialog .chart-head h2{font-size:20px}
        #forecastChartDialog .chart-wrap{height:350px}
        #forecastChartDialog .chart-summary{grid-template-columns:1fr 1fr}
      }
      @media(max-width:390px){#forecastChartDialog .chart-summary{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const dialog = document.createElement('dialog');
    dialog.id = 'forecastChartDialog';
    dialog.innerHTML = `
      <div class="chart-shell">
        <div class="chart-head">
          <div>
            <h2 id="forecastChartTitle">Mehrkosten-Prognose</h2>
            <small id="forecastChartSubtitle"></small>
          </div>
          <button type="button" class="ghost" id="closeForecastChart">Schließen</button>
        </div>
        <div class="chart-wrap"><canvas id="forecastChartCanvas"></canvas></div>
        <div class="chart-summary">
          <div class="chart-kpi"><span>Erste gespeicherte Prognose</span><b id="forecastFirst">–</b></div>
          <div class="chart-kpi"><span>Letzte gespeicherte Prognose</span><b id="forecastSaved">–</b></div>
          <div class="chart-kpi"><span>Aktuelle Live-Prognose</span><b id="forecastLive">–</b></div>
          <div class="chart-kpi"><span>Live-Veränderung seit Beginn</span><b id="forecastChange">–</b></div>
        </div>
        <p class="chart-note"><b>Gelb</b> zeigt die Prognose bei jeder gespeicherten Ablesung. <b>Blau</b> zeigt den damals erwarteten Endstand. <b style="color:#48d597">Grün</b> berechnet die aktuelle Live-Prognose für heute mit dem zuletzt gespeicherten Tachostand. Sinkt Grün gegenüber Gelb, verbessert die geringere Fahrleistung seit der letzten Ablesung die Prognose.</p>
      </div>`;
    document.body.appendChild(dialog);
    document.getElementById('closeForecastChart').onclick = () => dialog.close();
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }

  function forecastAt(vehicle, reading, calculationDate) {
    const start = new Date(vehicle.contract_start + 'T12:00:00');
    const end = new Date(vehicle.contract_end + 'T12:00:00');
    const calc = new Date(calculationDate + 'T12:00:00');
    const contractDays = Math.max(1, dayCount(start, end));
    const elapsedDays = dayCount(start, calc);
    if (elapsedDays <= 0) return null;

    const startOdo = Number(vehicle.start_odometer || 0);
    const driven = Number(reading.odometer) - startOdo;
    const forecastOdo = startOdo + (driven / elapsedDays) * contractDays;
    const freeLimit = startOdo + Number(vehicle.total_km || 0) + Number(vehicle.tolerance_km || 0);
    const overKm = Math.max(0, forecastOdo - freeLimit);
    return {
      date: calculationDate,
      forecastOdo,
      overKm,
      cost: overKm * Number(vehicle.overage_eur_km || 0)
    };
  }

  function buildData(vehicle) {
    const sorted = readings
      .filter(item => item.vehicle_id === vehicle.id)
      .slice()
      .sort((a,b) => a.reading_date.localeCompare(b.reading_date));

    // Übergabepunkt am Vertragsbeginn ist noch keine echte Prognose und wird ausgelassen.
    const saved = sorted
      .map(reading => forecastAt(vehicle, reading, reading.reading_date))
      .filter(Boolean)
      .filter((point, index) => {
        const reading = sorted[index];
        return point.date !== vehicle.contract_start || Number(reading.odometer) !== Number(vehicle.start_odometer || 0);
      });

    if (!saved.length) return { saved: [], live: null };
    const latestReading = sorted.at(-1);
    const today = new Date().toISOString().slice(0,10);
    const liveDate = today < latestReading.reading_date ? latestReading.reading_date : today;
    const live = forecastAt(vehicle, latestReading, liveDate);
    return { saved, live };
  }

  async function openChart(vehicleId) {
    ensureUi();
    const vehicle = vehicles.find(item => item.id === vehicleId);
    if (!vehicle) return;
    const { saved, live } = buildData(vehicle);
    if (!saved.length || !live) {
      alert('Für dieses Fahrzeug ist noch keine auswertbare Ablesung nach Vertragsbeginn vorhanden.');
      return;
    }

    try { await loadChartJs(); }
    catch (error) { alert(error.message); return; }

    const latestSaved = saved.at(-1);
    const liveIsNewDate = live.date !== latestSaved.date;
    const labels = saved.map(point => localDate(point.date));
    if (liveIsNewDate) labels.push(`${localDate(live.date)} (live)`);

    const savedCosts = saved.map(point => point.cost);
    const savedEnd = saved.map(point => point.forecastOdo);
    const liveCosts = Array(labels.length).fill(null);
    // Verbindung vom letzten gespeicherten Punkt zur Live-Prognose.
    liveCosts[saved.length - 1] = latestSaved.cost;
    if (liveIsNewDate) liveCosts[labels.length - 1] = live.cost;
    else liveCosts[saved.length - 1] = live.cost;

    if (liveIsNewDate) {
      savedCosts.push(null);
      savedEnd.push(null);
    }

    const first = saved[0].cost;
    const change = live.cost - first;
    document.getElementById('forecastChartTitle').textContent = `Mehrkosten-Prognose: ${vehicle.short_name || vehicle.name}`;
    document.getElementById('forecastChartSubtitle').textContent = `${saved.length} gespeicherte Prognosepunkt${saved.length === 1 ? '' : 'e'} plus aktuelle Live-Berechnung`;
    document.getElementById('forecastFirst').textContent = euro(first);
    document.getElementById('forecastSaved').textContent = euro(latestSaved.cost);
    document.getElementById('forecastLive').textContent = euro(live.cost);
    const changeNode = document.getElementById('forecastChange');
    changeNode.textContent = `${change > 0 ? '+' : ''}${euro(change)}`;
    changeNode.style.color = change > 0 ? '#ff9a9a' : change < 0 ? '#7ff2de' : '';

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(document.getElementById('forecastChartCanvas'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Gespeicherte Mehrkosten-Prognose', data: savedCosts, yAxisID: 'yCost',
            borderColor: '#ffbd59', backgroundColor: 'rgba(255,189,89,.13)', fill: true,
            tension: .25, pointRadius: 4, pointHoverRadius: 6, spanGaps: false
          },
          {
            label: 'Gespeicherter Endstand', data: savedEnd, yAxisID: 'yKm',
            borderColor: '#4da3ff', backgroundColor: '#4da3ff', fill: false,
            tension: .25, pointRadius: 3, borderDash: [5,4], spanGaps: false
          },
          {
            label: 'Aktuelle Live-Prognose', data: liveCosts, yAxisID: 'yCost',
            borderColor: '#48d597', backgroundColor: '#48d597', fill: false,
            tension: 0, pointRadius: 6, pointHoverRadius: 8, borderWidth: 3, spanGaps: true
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#dce7f5', boxWidth: 12 } },
          tooltip: { callbacks: { label: context => context.dataset.yAxisID === 'yCost'
            ? `${context.dataset.label}: ${euro(context.parsed.y)}`
            : `${context.dataset.label}: ${km(context.parsed.y)}` } }
        },
        scales: {
          x: { ticks: { color: '#9fb0c5', maxRotation: 45 }, grid: { color: 'rgba(255,255,255,.06)' } },
          yCost: { position: 'left', beginAtZero: true, ticks: { color: '#ffbd59', callback: value => `${value.toLocaleString('de-DE')} €` }, grid: { color: 'rgba(255,255,255,.06)' } },
          yKm: { position: 'right', ticks: { color: '#7db8ff', callback: value => `${Math.round(value).toLocaleString('de-DE')} km` }, grid: { drawOnChartArea: false } }
        }
      }
    });
    document.getElementById('forecastChartDialog').showModal();
  }

  function bindCards() {
    document.querySelectorAll('.vehicle').forEach(card => {
      const shortName = card.querySelector('small')?.textContent?.trim();
      const vehicle = vehicles.find(item => item.short_name === shortName);
      if (!vehicle) return;
      card.querySelectorAll('.metric').forEach(metric => {
        if (metric.querySelector('span')?.textContent?.trim() !== 'Mehrkosten Prognose') return;
        metric.classList.add('forecast-clickable');
        metric.tabIndex = 0;
        metric.setAttribute('role','button');
        metric.onclick = () => openChart(vehicle.id);
        metric.onkeydown = event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); openChart(vehicle.id);
          }
        };
      });
    });
  }

  ensureUi();
  new MutationObserver(bindCards).observe(document.body, { childList:true, subtree:true });
  bindCards();
})();
