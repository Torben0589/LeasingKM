/* PV-Ladeeinstellungen fuer die Fahrzeug-Webapp
 * Version 2.0.0
 * Funktion: Netzstrompreis und PV-Anteil dauerhaft speichern,
 * effektiven Strompreis berechnen und in allen Kostenberechnungen bereitstellen.
 *
 * Fehlerbehebung gegenueber Version 1.0.0:
 * - Event-Objekte werden nicht mehr versehentlich als Einstellungen verarbeitet.
 * - Der Regler aktualisiert Prozentwert, Strompreis und Beispielkosten live.
 * - Zahlenwerte werden robust normalisiert und gegen NaN abgesichert.
 * - Event-Handler werden nur einmal beim Erstellen des Dialogs registriert.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'fahrzeugApp.pvEinstellungen.v1';

  const DEFAULTS = Object.freeze({
    gridPriceEurPerKwh: 0.29,
    pvSharePercent: 0
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toFiniteNumber(value, fallback) {
    const normalized = typeof value === 'string'
      ? value.trim().replace(',', '.')
      : value;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeSettings(settings = {}) {
    return {
      gridPriceEurPerKwh: Math.max(
        0,
        toFiniteNumber(
          settings.gridPriceEurPerKwh,
          DEFAULTS.gridPriceEurPerKwh
        )
      ),
      pvSharePercent: clamp(
        toFiniteNumber(
          settings.pvSharePercent,
          DEFAULTS.pvSharePercent
        ),
        0,
        100
      )
    };
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return normalizeSettings({ ...DEFAULTS, ...saved });
    } catch (error) {
      console.warn('PV-Einstellungen konnten nicht geladen werden.', error);
      return { ...DEFAULTS };
    }
  }

  function saveSettings(settings) {
    const normalized = normalizeSettings(settings);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('PV-Einstellungen konnten nicht gespeichert werden.', error);
    }

    window.dispatchEvent(
      new CustomEvent('pv-settings-changed', {
        detail: getSnapshot(normalized)
      })
    );

    return normalized;
  }

  function getEffectivePrice(settings = loadSettings()) {
    const normalized = normalizeSettings(settings);
    return normalized.gridPriceEurPerKwh *
      (1 - normalized.pvSharePercent / 100);
  }

  function getEvCostPer100Km(
    consumptionKwhPer100Km,
    settings = loadSettings()
  ) {
    const consumption = Math.max(
      0,
      toFiniteNumber(consumptionKwhPer100Km, 0)
    );
    return consumption * getEffectivePrice(settings);
  }

  function getSnapshot(settings = loadSettings()) {
    const normalized = normalizeSettings(settings);
    return Object.freeze({
      ...normalized,
      effectivePriceEurPerKwh: getEffectivePrice(normalized)
    });
  }

  function formatEuro(value, digits = 3) {
    const safeValue = toFiniteNumber(value, 0);
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(safeValue);
  }

  function readModalSettings(modal) {
    return normalizeSettings({
      gridPriceEurPerKwh:
        modal.querySelector('#pv-grid-price')?.value,
      pvSharePercent:
        modal.querySelector('#pv-share')?.value
    });
  }

  function createModal() {
    if (document.getElementById('pv-settings-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'pv-settings-modal';
    modal.className = 'pv-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="pv-modal__backdrop" data-pv-close></div>
      <section class="pv-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="pv-settings-title">
        <div class="pv-modal__header">
          <div>
            <p class="pv-eyebrow">Einstellungen</p>
            <h2 id="pv-settings-title">Energie &amp; PV</h2>
          </div>
          <button class="pv-icon-button" type="button" data-pv-close aria-label="Schliessen">&times;</button>
        </div>

        <form id="pv-settings-form">
          <div class="pv-field">
            <label for="pv-grid-price">Netzstrompreis</label>
            <div class="pv-input-with-unit">
              <input id="pv-grid-price" name="gridPrice" type="number" min="0" step="0.001" inputmode="decimal" required>
              <span>EUR/kWh</span>
            </div>
          </div>

          <div class="pv-field">
            <div class="pv-label-row">
              <label for="pv-share">PV-Anteil beim Laden</label>
              <output id="pv-share-output" for="pv-share">0 %</output>
            </div>
            <input id="pv-share" name="pvShare" type="range" min="0" max="100" step="1" value="0">
            <div class="pv-range-labels">
              <span>0 % Netzbezug</span>
              <span>100 % PV</span>
            </div>
          </div>

          <div class="pv-result-card" aria-live="polite">
            <span>Effektiver Strompreis</span>
            <strong id="pv-effective-price">0,290 EUR/kWh</strong>
            <small>PV-Strom wird mit 0,00 EUR/kWh angesetzt.</small>
          </div>

          <div class="pv-example-card">
            <label for="pv-example-consumption">Beispielverbrauch Born</label>
            <div class="pv-input-with-unit">
              <input id="pv-example-consumption" type="number" min="0" step="0.1" value="16" inputmode="decimal">
              <span>kWh/100 km</span>
            </div>
            <p>Aktuelle Energiekosten: <strong id="pv-example-cost">4,64 EUR/100 km</strong></p>
          </div>

          <div class="pv-actions">
            <button class="pv-button pv-button--secondary" type="button" data-pv-close>Abbrechen</button>
            <button class="pv-button pv-button--primary" type="submit">Speichern</button>
          </div>
        </form>
      </section>`;

    document.body.appendChild(modal);

    modal.querySelectorAll('[data-pv-close]').forEach(element => {
      element.addEventListener('click', closeModal);
    });

    modal.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModal();
    });

    // Wichtig: Die Wrapper verhindern, dass das InputEvent als
    // optionalSettings an updatePreview uebergeben wird.
    modal.querySelector('#pv-share')
      .addEventListener('input', () => updatePreview());
    modal.querySelector('#pv-grid-price')
      .addEventListener('input', () => updatePreview());
    modal.querySelector('#pv-example-consumption')
      .addEventListener('input', () => updatePreview());

    modal.querySelector('#pv-settings-form')
      .addEventListener('submit', event => {
        event.preventDefault();
        const settings = saveSettings(readModalSettings(modal));
        updatePreview(settings);
        closeModal();
      });
  }

  function updatePreview(optionalSettings) {
    const modal = document.getElementById('pv-settings-modal');
    if (!modal) return;

    // Nur ein echtes Einstellungsobjekt akzeptieren. Events oder andere
    // versehentlich uebergebene Werte werden ignoriert.
    const hasValidSettingsObject =
      optionalSettings &&
      typeof optionalSettings === 'object' &&
      !('type' in optionalSettings) &&
      (
        'gridPriceEurPerKwh' in optionalSettings ||
        'pvSharePercent' in optionalSettings
      );

    const settings = hasValidSettingsObject
      ? normalizeSettings(optionalSettings)
      : readModalSettings(modal);

    const effective = getEffectivePrice(settings);
    const consumption = Math.max(
      0,
      toFiniteNumber(
        modal.querySelector('#pv-example-consumption')?.value,
        16
      )
    );

    const shareOutput = modal.querySelector('#pv-share-output');
    const effectiveOutput = modal.querySelector('#pv-effective-price');
    const exampleOutput = modal.querySelector('#pv-example-cost');

    if (shareOutput) {
      shareOutput.textContent = `${Math.round(settings.pvSharePercent)} %`;
    }
    if (effectiveOutput) {
      effectiveOutput.textContent = `${formatEuro(effective)} /kWh`;
    }
    if (exampleOutput) {
      exampleOutput.textContent =
        `${formatEuro(consumption * effective, 2)} /100 km`;
    }
  }

  function openModal() {
    createModal();

    const modal = document.getElementById('pv-settings-modal');
    const settings = loadSettings();

    modal.querySelector('#pv-grid-price').value =
      settings.gridPriceEurPerKwh.toFixed(3);
    modal.querySelector('#pv-share').value =
      String(settings.pvSharePercent);

    modal.hidden = false;
    document.body.classList.add('pv-modal-open');
    updatePreview(settings);

    setTimeout(() => {
      modal.querySelector('#pv-share')?.focus();
    }, 0);
  }

  function closeModal() {
    const modal = document.getElementById('pv-settings-modal');
    if (!modal) return;

    modal.hidden = true;
    document.body.classList.remove('pv-modal-open');
  }

  function installMenuEntry() {
    if (document.querySelector('[data-open-pv-settings]')) return;

    const target = document.querySelector(
      '#settings-menu, .settings-menu, [data-settings-menu], #einstellungen-menu, .einstellungen-menu'
    );

    const button = document.createElement('button');
    button.type = 'button';
    button.className = target
      ? 'pv-settings-menu-entry'
      : 'pv-floating-settings-button';
    button.setAttribute('data-open-pv-settings', '');
    button.innerHTML =
      '<span aria-hidden="true">☀️</span><span>Energie &amp; PV</span>';
    button.addEventListener('click', openModal);

    (target || document.body).appendChild(button);
  }

  window.PVEnergy = Object.freeze({
    openSettings: openModal,
    closeSettings: closeModal,
    loadSettings,
    saveSettings,
    getSnapshot,
    getEffectiveElectricityPrice: getEffectivePrice,
    getEvCostPer100Km
  });

  function init() {
    createModal();
    installMenuEntry();
    window.dispatchEvent(
      new CustomEvent('pv-settings-ready', {
        detail: getSnapshot()
      })
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
