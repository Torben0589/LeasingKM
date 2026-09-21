/*
  Fuhrpark Cockpit - Zusatzmodul "Restkilometer pro Tag"
  Voraussetzung: app.js und prognose-chart.js sind bereits geladen.
*/
(() => {
  'use strict';

  const DAY_MS = 86400000;
  let lastVehicleId = null;

  const km = value => `${Math.max(0, Number(value) || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })} km/Tag`;

  const integer = value => `${Math.max(0, Math.round(Number(value) || 0)).toLocaleString('de-DE')} Tage`;

  function dateValue(value) {
    return new Date(`${value}T12:00:00`);
  }

  function daysBetween(from, to) {
    return Math.max(0, Math.round((dateValue(to) - dateValue(from)) / DAY_MS));
  }

  function ensureStyles() {
    if (document.getElementById('restKmPerDayStyles')) return;

    const style = document.createElement('style');
    style.id = 'restKmPerDayStyles';
    style.textContent = `
      #forecastChartDialog .fc-evaluations {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      #restKmEvaluation .restkm-status {
        display: inline-flex;
        align-items: center;
        margin-top: 7px;
        padding: 5px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
      }

      #restKmEvaluation .restkm-status.good {
        color: #7ff2de;
        background: rgba(34, 211, 182, .13);
      }

      #restKmEvaluation .restkm-status.warn {
        color: #ffd477;
        background: rgba(255, 189, 89, .14);
      }

      #restKmEvaluation .restkm-status.bad {
        color: #ff9a9a;
        background: rgba(255, 107, 107, .14);
      }

      @media (max-width: 700px) {
        #forecastChartDialog .fc-evaluations {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        #restKmEvaluation .restkm-status {
          font-size: 8px;
          padding: 4px 5px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSection() {
    const evaluations = document.querySelector('#forecastChartDialog .fc-evaluations');
    if (!evaluations || document.getElementById('restKmEvaluation')) return false;

    const section = document.createElement('section');
    section.className = 'fc-eval';
    section.id = 'restKmEvaluation';
    section.innerHTML = `
      <h3>3. Restkilometer pro Tag</h3>
      <div class="fc-kpis">
        <div class="fc-kpi">
          <span>Im Vertrag noch erlaubt</span>
          <b id="restKmContractDay">–</b>
        </div>
        <div class="fc-kpi">
          <span>Inkl. kostenloser Toleranz</span>
          <b id="restKmToleranceDay">–</b>
        </div>
        <div class="fc-kpi">
          <span>Bisheriger Tagesdurchschnitt</span>
          <b id="restKmAverageDay">–</b>
        </div>
        <div class="fc-kpi">
          <span>Verbleibende Vertragszeit</span>
          <b id="restKmDaysLeft">–</b>
        </div>
      </div>
      <span id="restKmStatus" class="restkm-status">–</span>
    `;
    evaluations.appendChild(section);
    return true;
  }

  function findVehicle() {
    const title = document.getElementById('fcTitle')?.textContent || '';
    const displayedName = title.split(':').slice(1).join(':').trim();
    return vehicles.find(vehicle =>
      vehicle.short_name === displayedName || vehicle.name === displayedName
    );
  }

  async function updateSection() {
    ensureStyles();
    if (!ensureSection() && !document.getElementById('restKmEvaluation')) return;

    const vehicle = findVehicle();
    if (!vehicle) return;
    lastVehicleId = vehicle.id;

    const { data, error } = await db
      .from('forecast_snapshots')
      .select('snapshot_date,odometer,created_at')
      .eq('vehicle_id', vehicle.id)
      .order('snapshot_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      document.getElementById('restKmStatus').textContent = error
        ? `Nicht verfügbar: ${error.message}`
        : 'Noch keine gespeicherte Ablesung';
      return;
    }

    const latest = data[0];
    const startOdometer = Number(vehicle.start_odometer || 0);
    const currentOdometer = Number(latest.odometer || 0);
    const totalKm = Number(vehicle.total_km || 0);
    const toleranceKm = Number(vehicle.tolerance_km || 0);

    const elapsedDays = Math.max(1, daysBetween(vehicle.contract_start, latest.snapshot_date));
    const remainingDays = daysBetween(latest.snapshot_date, vehicle.contract_end);
    const drivenKm = Math.max(0, currentOdometer - startOdometer);

    const remainingContractKm = Math.max(0, totalKm - drivenKm);
    const remainingToleranceKm = Math.max(0, totalKm + toleranceKm - drivenKm);

    const contractPerDay = remainingDays > 0 ? remainingContractKm / remainingDays : 0;
    const tolerancePerDay = remainingDays > 0 ? remainingToleranceKm / remainingDays : 0;
    const averagePerDay = drivenKm / elapsedDays;

    document.getElementById('restKmContractDay').textContent = km(contractPerDay);
    document.getElementById('restKmToleranceDay').textContent = km(tolerancePerDay);
    document.getElementById('restKmAverageDay').textContent = km(averagePerDay);
    document.getElementById('restKmDaysLeft').textContent = integer(remainingDays);

    const status = document.getElementById('restKmStatus');
    status.className = 'restkm-status';

    if (remainingDays <= 0) {
      status.classList.add('warn');
      status.textContent = 'Vertragsende erreicht';
    } else if (averagePerDay <= contractPerDay) {
      status.classList.add('good');
      status.textContent = 'Im Vertragsbudget';
    } else if (averagePerDay <= tolerancePerDay) {
      status.classList.add('warn');
      status.textContent = 'Nur noch innerhalb der Toleranz';
    } else {
      status.classList.add('bad');
      status.textContent = 'Fahrleistung liegt über dem kostenfreien Tagesbudget';
    }
  }

  function watchDialog() {
    const observer = new MutationObserver(() => {
      const dialog = document.getElementById('forecastChartDialog');
      if (!dialog) return;

      ensureStyles();
      ensureSection();

      if (dialog.open) {
        const vehicle = findVehicle();
        if (vehicle && vehicle.id !== lastVehicleId) updateSection();
        else if (vehicle) updateSection();
      } else {
        lastVehicleId = null;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open']
    });
  }

  watchDialog();
})();
