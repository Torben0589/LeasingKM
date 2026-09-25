/* Fuhrpark Cockpit - sichere Antriebsart-Erweiterung V2 */
(() => {
  'use strict';

  const FIELD_ID = 'editDriveTypeV2';
  const OPTIONS = ['electric','petrol','diesel','hybrid','other'];
  const $id = id => document.getElementById(id);
  const normalize = value => OPTIONS.includes(value) ? value : 'other';

  function list() {
    try { return Array.isArray(vehicles) ? vehicles : []; }
    catch { return []; }
  }

  function injectField() {
    if ($id(FIELD_ID)) return true;
    const form = $id('vehicleForm');
    const actions = form?.querySelector('.actions');
    if (!form || !actions) return false;

    const block = document.createElement('div');
    block.id = 'driveTypeV2Field';
    block.innerHTML = `
      <label for="${FIELD_ID}">Antriebsart
        <select id="${FIELD_ID}" required>
          <option value="electric">Elektro</option>
          <option value="petrol">Benzin</option>
          <option value="diesel">Diesel</option>
          <option value="hybrid">Hybrid</option>
          <option value="other">Sonstige / nicht festgelegt</option>
        </select>
      </label>`;
    form.insertBefore(block, actions);
    return true;
  }

  function patchOpenVehicle() {
    if (typeof openVehicle !== 'function' || openVehicle.driveTypeV2) return;
    const original = openVehicle;
    const wrapped = function(vehicleId = null) {
      const vehicle = list().find(item => item.id === vehicleId);
      if (injectField()) $id(FIELD_ID).value = normalize(vehicle?.drive_type);
      return original(vehicleId);
    };
    wrapped.driveTypeV2 = true;
    openVehicle = wrapped;
  }

  function patchSubmit() {
    const form = $id('vehicleForm');
    if (!form || typeof form.onsubmit !== 'function' || form.onsubmit.driveTypeV2) return;
    const original = form.onsubmit;

    const wrapped = async function(event) {
      const existingId = $id('editId')?.value || '';
      const driveType = normalize($id(FIELD_ID)?.value);
      const snapshot = {
        name: $id('editName')?.value.trim() || '',
        short: $id('editShort')?.value.trim() || '',
        start: $id('editStart')?.value || '',
        end: $id('editEnd')?.value || ''
      };

      await original.call(this, event);

      try {
        let vehicleId = existingId;
        if (!vehicleId) {
          const created = list().filter(item =>
            item.name === snapshot.name &&
            item.short_name === snapshot.short &&
            item.contract_start === snapshot.start &&
            item.contract_end === snapshot.end
          ).at(-1);
          vehicleId = created?.id || '';
        }
        if (!vehicleId) throw new Error('Fahrzeug konnte nach dem Speichern nicht gefunden werden.');

        const result = await db.from('vehicles').update({drive_type: driveType}).eq('id', vehicleId);
        if (result.error) throw result.error;
        if (typeof load === 'function') await load();
      } catch (error) {
        console.error('[Antriebsart V2]', error);
        alert(`Fahrzeug gespeichert, Antriebsart aber nicht: ${error.message}`);
      }
    };

    wrapped.driveTypeV2 = true;
    form.onsubmit = wrapped;
  }

  function install() {
    if (!injectField()) {
      console.warn('[Antriebsart V2] Fahrzeugformular nicht gefunden.');
      return;
    }
    patchOpenVehicle();
    patchSubmit();
    console.info('[Antriebsart V2] sicher installiert.');
  }

  install();
})();
