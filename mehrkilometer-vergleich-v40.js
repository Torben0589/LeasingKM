/*
 * Fuhrpark Cockpit
 * Mehrkilometer-Vergleich V4.0
 * Neu aufgebaut, lesbar und ohne Eingriffe in app.js.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'fuhrpark_mehrkilometer_v40';
    const byId = id => document.getElementById(id);

function activeVehicles() {

    try {

        return Array.isArray(vehicles)
            ? vehicles.filter(vehicle => vehicle.is_active !== false)
            : [];

    } catch (error) {

        return [];

    }

}
``

    function vehicleById(id) {
        return activeVehicles().find(vehicle => vehicle.id === id);
    }

    function numberFrom(id) {
        const field = byId(id);
        if (!field) return null;
        if (Number.isFinite(field.valueAsNumber)) return field.valueAsNumber;
        const value = Number(String(field.value).replace(',', '.'));
        return Number.isFinite(value) ? value : null;
    }

    function cent(value) {
        return `${((Number(value) || 0) * 100).toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} Cent/km`;
    }

    function euro(value) {
        return `${(Number(value) || 0).toLocaleString('de-DE', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        })} €/km`;
    }

    function energyCost(side) {
        const consumption = numberFrom(`mkv40-consumption-${side}`);
        const price = numberFrom(`mkv40-price-${side}`);
        if (consumption === null || price === null || consumption < 0 || price < 0) return null;
        return consumption / 100 * price;
    }

    function savedSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function ensureStyles() {
        if (byId('mkv40-styles')) return;
        const style = document.createElement('style');
        style.id = 'mkv40-styles';
        style.textContent = `
            #mkv40-dialog{width:min(96vw,760px);max-height:94vh;padding:0;overflow:auto;border-radius:20px}
            #mkv40-dialog::backdrop{background:rgba(0,0,0,.78)}
            .mkv40-shell{padding:18px}.mkv40-head{display:flex;justify-content:space-between;gap:12px}
            .mkv40-head h2{margin:0}.mkv40-muted{color:var(--muted,#9fb0c5);font-size:11px;line-height:1.45}
            .mkv40-panels{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
            .mkv40-panel{background:var(--panel2,#17283d);padding:12px;border-radius:14px}.mkv40-panel h3{margin:0 0 6px}
            .mkv40-field label{display:block;color:var(--muted,#9fb0c5);font-size:11px;margin:8px 0 4px}
            .mkv40-field input,.mkv40-field select{width:100%;min-width:0}.mkv40-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
            .mkv40-check{display:flex;gap:8px;align-items:flex-start;background:#07111f66;padding:9px;border-radius:10px;margin-top:10px}
            .mkv40-check input{width:auto;margin-top:2px}.mkv40-hidden{display:none!important}
            .mkv40-live{margin-top:8px;color:var(--muted,#9fb0c5);font-size:11px}.mkv40-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
            .mkv40-error{min-height:18px;color:#ff9a9a}.mkv40-result{display:none;background:#07111f77;padding:12px;border-radius:14px}
            .mkv40-result.visible{display:block}.mkv40-winner{background:#22d3b622;color:#7ff2de;padding:10px;border-radius:10px;font-weight:800}
            .mkv40-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-top:10px}
            .mkv40-cost{background:var(--panel2,#17283d);padding:12px;text-align:center;border-radius:11px}.mkv40-cost b{display:block;font-size:18px;margin:4px}
            @media(max-width:650px){#mkv40-dialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;border:0;border-radius:0}.mkv40-shell{padding:12px 9px}.mkv40-panels,.mkv40-vs{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function panel(side, title, description, optionalEnergy) {
        return `
            <section class="mkv40-panel">
                <h3>${title}</h3>
                <div class="mkv40-muted">${description}</div>
                <div class="mkv40-field"><label>Fahrzeug</label><select id="mkv40-vehicle-${side}"></select></div>
                ${optionalEnergy ? `
                    <div id="mkv40-overage-a" class="mkv40-live">Mehrkilometerpreis: –</div>
                    <label class="mkv40-check"><input id="mkv40-include-a" type="checkbox"><span>Energie-/Kraftstoffkosten von Fahrzeug A zusätzlich mitberechnen</span></label>
                    <div id="mkv40-optional-a" class="mkv40-hidden">` : ''}
              <div class="mkv40-field">
  <label>Antriebsart</label>
  <div id="mkv40-drive-${side}" class="mkv40-drive-info"></div>
</div>
                <div class="mkv40-grid">
                    <div class="mkv40-field"><label id="mkv40-consumption-label-${side}">Verbrauch l/100 km</label><input id="mkv40-consumption-${side}" type="number" min="0" step="0.1"></div>
                    <div class="mkv40-field"><label id="mkv40-price-label-${side}">Preis €/Liter</label><input id="mkv40-price-${side}" type="number" min="0" step="0.001"></div>
                </div>
                <div id="mkv40-energy-${side}" class="mkv40-live">Energie-/Kraftstoffkosten: –</div>
                ${optionalEnergy ? '</div>' : ''}
            </section>`;
    }

    function ensureDialog() {
        if (byId('mkv40-dialog')) return;
        const dialog = document.createElement('dialog');
        dialog.id = 'mkv40-dialog';
        dialog.innerHTML = `
            <div class="mkv40-shell">
                <div class="mkv40-head"><div><h2>Mehrkilometer oder anderes Auto?</h2><div class="mkv40-muted">Direkter Vergleich pro Kilometer.</div></div><button id="mkv40-close" class="ghost">Schließen</button></div>
                <div class="mkv40-panels">
                    ${panel('a','A. Mehrkilometer-Fahrzeug','Der vertragliche Mehrkilometerpreis wird immer berücksichtigt.',true)}
                    ${panel('b','B. Alternativfahrzeug','Hier werden reine Energie-/Kraftstoffkosten betrachtet.',false)}
                </div>
                <div class="mkv40-actions"><button id="mkv40-compare">Vergleichen</button><button id="mkv40-swap" class="secondary">Fahrzeuge tauschen</button></div>
                <div id="mkv40-error" class="mkv40-error"></div>
                <section id="mkv40-result" class="mkv40-result">
                    <div id="mkv40-winner" class="mkv40-winner"></div>
                    <div class="mkv40-vs"><div class="mkv40-cost"><small id="mkv40-name-a"></small><b id="mkv40-total-a"></b><small id="mkv40-caption-a"></small></div><strong>vs.</strong><div class="mkv40-cost"><small id="mkv40-name-b"></small><b id="mkv40-total-b"></b><small>reine Energie-/Kraftstoffkosten</small></div></div>
                    <p id="mkv40-difference"></p><p id="mkv40-breakdown" class="mkv40-muted"></p><p id="mkv40-formula" class="mkv40-muted"></p>
                    <p class="mkv40-muted">Nicht berücksichtigt: PV-Überschussladen, Verschleiß, Wartung und Fixkosten.</p>
                </section>
            </div>`;
        document.body.appendChild(dialog);
        byId('mkv40-close').addEventListener('click', () => dialog.close());
        byId('mkv40-compare').addEventListener('click', compare);
        byId('mkv40-swap').addEventListener('click', swap);
        byId('mkv40-vehicle-a').addEventListener('change', () => loadVehicle('a'));
        byId('mkv40-vehicle-b').addEventListener('change', () => loadVehicle('b'));
        byId('mkv40-include-a').addEventListener('change', toggleOptionalA);
        ['a','b'].forEach(side => {
            byId(`mkv40-drive-${side}`).addEventListener('change', () => updateLabels(side));
            byId(`mkv40-consumption-${side}`).addEventListener('input', updateLiveCosts);
            byId(`mkv40-price-${side}`).addEventListener('input', updateLiveCosts);
        });
    }

    function ensureButton() {
        if (byId('mkv40-open')) return;
        const toolbar = document.querySelector('#app .toolbar');
        if (!toolbar) return;
        const button = document.createElement('button');
        button.id = 'mkv40-open';
        button.className = 'secondary';
        button.textContent = 'Mehrkilometer vergleichen';
        button.addEventListener('click', openDialog);
        toolbar.appendChild(button);
    }

    function updateLabels(side) {
        const electric = byId(`mkv40-drive-${side}`).value === 'electric';
        byId(`mkv40-consumption-label-${side}`).textContent = electric ? 'Verbrauch kWh/100 km' : 'Verbrauch l/100 km';
        byId(`mkv40-price-label-${side}`).textContent = electric ? 'Strompreis €/kWh' : 'Kraftstoffpreis €/Liter';
        updateLiveCosts();
    }

    function updateLiveCosts() {
        ['a','b'].forEach(side => {
            const value = energyCost(side);
            byId(`mkv40-energy-${side}`).textContent = value === null ? 'Energie-/Kraftstoffkosten: –' : `Energie-/Kraftstoffkosten: ${cent(value)}`;
        });
    }

    function toggleOptionalA() {
        byId('mkv40-optional-a').classList.toggle('mkv40-hidden', !byId('mkv40-include-a').checked);
        updateLiveCosts();
    }

    function loadVehicle(side) {
        const id = byId(`mkv40-vehicle-${side}`).value;
        const saved = savedSettings()[id] || {};
        const vehicle = vehicleById(id);

byId(`mkv40-drive-${side}`).value =
    vehicle?.drive_type === 'electric'
        ? 'electric'
        : 'fuel';
    
        byId(`mkv40-consumption-${side}`).value = saved.consumption ?? '';
        byId(`mkv40-price-${side}`).value = saved.price ?? '';
        if (side === 'a') {
            byId('mkv40-include-a').checked = Boolean(saved.includeEnergy);
            toggleOptionalA();
            const vehicle = vehicleById(id);
            byId('mkv40-overage-a').textContent = vehicle ? `Mehrkilometerpreis: ${cent(vehicle.overage_eur_km)}` : 'Mehrkilometerpreis: –';
        }
        updateLabels(side);
    }

function selectDefaultVehicles(vehicleList) {
    if (
        !Array.isArray(vehicleList) ||
        vehicleList.length < 2
    ) {
        return {
            vehicleA: null,
            vehicleB: null
        };
    }

    /*
     * Die Prognosewerte werden direkt über die
     * öffentliche Funktion aus app.js abgefragt.
     */
    const evaluatedVehicles = vehicleList.map(vehicle => {
        let calculation = null;

        if (
            typeof window.getFuhrparkCalculation ===
            'function'
        ) {
            calculation =
                window.getFuhrparkCalculation(vehicle.id);
        }

        return {
            vehicle,
            calculation
        };
    });

    /*
     * Fahrzeuge im roten Bereich:
     * kostenpflichtige Mehrkilometer größer als null.
     */
    const vehiclesInRedArea = evaluatedVehicles
        .filter(item => {
            return Number(item.calculation?.over || 0) > 0;
        })
        .sort((first, second) => {
            /*
             * Fahrzeug mit den höchsten prognostizierten
             * Mehrkosten zuerst.
             */
            return (
                Number(second.calculation?.cost || 0) -
                Number(first.calculation?.cost || 0)
            );
        });

    /*
     * Fahrzeug A:
     * das wirtschaftlich kritischste Fahrzeug.
     *
     * Falls kein Fahrzeug im roten Bereich liegt,
     * wird das erste aktive Fahrzeug verwendet.
     */
    const vehicleA =
        vehiclesInRedArea[0]?.vehicle ||
        vehicleList[0];

    /*
     * Fahrzeug B:
     * bevorzugt ein anderes Fahrzeug ohne
     * prognostizierte Mehrkilometer.
     */
    const vehicleB =
        evaluatedVehicles.find(item => {
            const isDifferentVehicle =
                item.vehicle.id !== vehicleA.id;

            const isInFreeArea =
                Number(item.calculation?.over || 0) === 0;

            return (
                isDifferentVehicle &&
                isInFreeArea
            );
        })?.vehicle ||
        vehicleList.find(vehicle => {
            return vehicle.id !== vehicleA.id;
        }) ||
        null;

    return {
        vehicleA,
        vehicleB
    };
}

    /*
     * Für jedes aktive Fahrzeug wird die bereits vorhandene
     * Prognoseberechnung aus app.js verwendet.
     */
    const evaluatedVehicles = vehicleList.map(vehicle => {
        let calculation = null;

        try {
            calculation =
                typeof calc === 'function'
                    ? calc(vehicle)
                    : null;
        } catch (error) {
            console.warn(
                'Prognose konnte für das Fahrzeug nicht berechnet werden:',
                vehicle,
                error
            );
        }

        return {
            vehicle,
            calculation
        };
    });

    /*
     * Roter Bereich:
     * prognostizierte kostenpflichtige Mehrkilometer größer als 0.
     *
     * Bei mehreren betroffenen Fahrzeugen wird nach den
     * höchsten prognostizierten Mehrkosten sortiert.
     */
    const vehiclesInRedArea = evaluatedVehicles
        .filter(item => item.calculation?.over > 0)
        .sort((first, second) => {
            return (
                (second.calculation?.cost || 0) -
                (first.calculation?.cost || 0)
            );
        });

    /*
     * Fahrzeug A:
     * bevorzugt das kritischste Fahrzeug,
     * ansonsten das erste aktive Fahrzeug.
     */
    const vehicleA =
        vehiclesInRedArea[0]?.vehicle ||
        vehicleList[0];

    /*
     * Fahrzeug B:
     * bevorzugt ein anderes Fahrzeug,
     * dessen Prognose noch im kostenfreien Bereich liegt.
     */
    const vehicleB =
        evaluatedVehicles.find(item => {
            return (
                item.vehicle.id !== vehicleA.id &&
                (item.calculation?.over || 0) === 0
            );
        })?.vehicle ||
        vehicleList.find(vehicle => {
            return vehicle.id !== vehicleA.id;
        }) ||
        null;

    return {
        vehicleA,
        vehicleB
    };
}
    
    function openDialog() {
        const list = activeVehicles();
        
        if (list.length < 2) return alert('Mindestens zwei aktive Fahrzeuge werden benötigt.');
        const options = list.map(v => `<option value="${v.id}">${v.short_name || v.name}</option>`).join('');
        byId('mkv40-vehicle-a').innerHTML = options;
        byId('mkv40-vehicle-b').innerHTML = options;
const defaultSelection =
    selectDefaultVehicles(list);

if (defaultSelection.vehicleA) {
    byId('mkv40-vehicle-a').value =
        defaultSelection.vehicleA.id;
}

if (defaultSelection.vehicleB) {
    byId('mkv40-vehicle-b').value =
        defaultSelection.vehicleB.id;
}
        loadVehicle('a');
        loadVehicle('b');
        byId('mkv40-result').classList.remove('visible');
        byId('mkv40-error').textContent = '';
        byId('mkv40-dialog').showModal();
    }

    function compare() {
        const vehicleA = vehicleById(byId('mkv40-vehicle-a').value);
        const vehicleB = vehicleById(byId('mkv40-vehicle-b').value);
        const includeA = byId('mkv40-include-a').checked;
        const energyA = energyCost('a');
        const energyB = energyCost('b');
        const error = byId('mkv40-error');
        error.textContent = '';
        if (!vehicleA || !vehicleB || vehicleA.id === vehicleB.id) return error.textContent = 'Bitte zwei unterschiedliche Fahrzeuge wählen.';
        if (energyB === null) return error.textContent = 'Bitte Verbrauch und Preis für Fahrzeug B vollständig eingeben.';
        if (includeA && energyA === null) return error.textContent = 'Bitte Verbrauch und Preis für Fahrzeug A vollständig eingeben oder die Option deaktivieren.';

        const overage = Number(vehicleA.overage_eur_km || 0);
        const totalA = overage + (includeA ? energyA : 0);
        const totalB = energyB;
        const difference = Math.abs(totalA - totalB);
        const nameA = vehicleA.short_name || vehicleA.name;
        const nameB = vehicleB.short_name || vehicleB.name;

        const settings = savedSettings();
        settings[vehicleA.id] = {drive:byId('mkv40-drive-a').value,consumption:numberFrom('mkv40-consumption-a') ?? '',price:numberFrom('mkv40-price-a') ?? '',includeEnergy:includeA};
        settings[vehicleB.id] = {drive:byId('mkv40-drive-b').value,consumption:numberFrom('mkv40-consumption-b') ?? '',price:numberFrom('mkv40-price-b') ?? ''};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

        byId('mkv40-winner').textContent = totalA <= totalB ? `Der zusätzliche Kilometer mit ${nameA} ist günstiger.` : `Der zusätzliche Kilometer mit ${nameB} ist günstiger.`;
        byId('mkv40-name-a').textContent = nameA;
        byId('mkv40-name-b').textContent = nameB;
        byId('mkv40-total-a').textContent = cent(totalA);
        byId('mkv40-total-b').textContent = cent(totalB);
        byId('mkv40-caption-a').textContent = includeA ? 'Mehrkilometer plus Energie/Kraftstoff' : 'nur Mehrkilometerpreis';
        byId('mkv40-difference').innerHTML = `Differenz: <strong>${cent(difference)}</strong>`;
        byId('mkv40-breakdown').textContent = includeA ? `${nameA}: ${cent(overage)} Mehrkilometer + ${cent(energyA)} Energie/Kraftstoff. ${nameB}: ${cent(energyB)} Energie/Kraftstoff.` : `${nameA}: ${cent(overage)} Mehrkilometerpreis. ${nameB}: ${cent(energyB)} Energie/Kraftstoff.`;
        byId('mkv40-formula').textContent = `${numberFrom('mkv40-consumption-b').toLocaleString('de-DE')} /100 km × ${numberFrom('mkv40-price-b').toLocaleString('de-DE')} € ÷ 100 = ${euro(energyB)} bei ${nameB}.`;
        byId('mkv40-result').classList.add('visible');
    }

    function swap() {
        const a = byId('mkv40-vehicle-a').value;
        byId('mkv40-vehicle-a').value = byId('mkv40-vehicle-b').value;
        byId('mkv40-vehicle-b').value = a;
        loadVehicle('a');
        loadVehicle('b');
    }

    ensureStyles();
    ensureDialog();
    new MutationObserver(ensureButton).observe(document.body, {childList:true,subtree:true});
    ensureButton();
})();
