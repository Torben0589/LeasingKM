/* Erweitert den vorhandenen Fahrzeugdialog um Antriebsdaten. */
(() => {
  const $ = id => document.getElementById(id);
  let currentVehicleId = null;

  function addFields() {
    const form = $('vehicleForm');
    if (!form || $('vDriveType')) return;
    const actions = form.querySelector('.actions');
    const section = document.createElement('div');
    section.innerHTML = `
      <div class="grid2">
        <label>Antriebsart
          <select id="vDriveType">
            <option value="fuel">Verbrenner</option>
            <option value="electric">Elektro</option>
          </select>
        </label>
        <label><span id="vConsumptionText">Standardverbrauch l/100 km</span>
          <input id="vConsumption" type="number" min="0" step="0.1">
        </label>
      </div>
      <label><span id="vEnergyPriceText">Standard-Kraftstoffpreis EUR/Liter</span>
        <input id="vEnergyPrice" type="number" min="0" step="0.001">
      </label>`;
    form.insertBefore(section, actions);
    $('vDriveType').onchange = updateLabels;
  }

  function updateLabels() {
    const electric = $('vDriveType').value === 'electric';
    $('vConsumptionText').textContent = electric ? 'Standardverbrauch kWh/100 km' : 'Standardverbrauch l/100 km';
    $('vEnergyPriceText').textContent = electric ? 'Standard-Strompreis EUR/kWh' : 'Standard-Kraftstoffpreis EUR/Liter';
  }

  async function fill() {
    addFields();
    currentVehicleId = $('editId')?.value || null;
    const vehicle = vehicles.find(v => v.id === currentVehicleId);
    $('vDriveType').value = vehicle?.drive_type || 'fuel';
    $('vConsumption').value = vehicle?.default_consumption ?? '';
    $('vEnergyPrice').value = vehicle?.default_energy_price ?? '';
    updateLabels();
  }

  async function saveProfile() {
    const id = $('editId')?.value || currentVehicleId;
    if (!id) return;
    await db.from('vehicles').update({
      drive_type: $('vDriveType').value,
      default_consumption: Number($('vConsumption').value) || null,
      default_energy_price: Number($('vEnergyPrice').value) || null
    }).eq('id', id);
  }

  new MutationObserver(() => {
    addFields();
    const dialog = $('vehicleDialog');
    if (dialog?.open) fill();
  }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['open'] });

  document.addEventListener('click', event => {
    if (event.target?.id === 'saveVehicle') setTimeout(saveProfile, 250);
  });

  addFields();
})();
