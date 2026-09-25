/* Vergleich nutzt Antriebsdaten automatisch aus vehicles. */
(() => {
  const $ = id => document.getElementById(id);
  const cent = v => `${((Number(v)||0)*100).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} Cent/km`;
  const energy = v => (Number(v.default_consumption)||0)*(Number(v.default_energy_price)||0)/100;
  const label = v => v.drive_type === 'electric' ? 'Elektro' : 'Verbrenner';

  function init() {
    if ($('autoCompareDialog')) return;
    const d = document.createElement('dialog');
    d.id = 'autoCompareDialog';
    d.innerHTML = `<div class="panel"><div class="row"><h2>Mehrkilometer oder anderes Auto?</h2><button id="acClose" class="ghost">Schließen</button></div>
      <div class="grid2"><label>Mehrkilometer-Fahrzeug<select id="acA"></select></label><label>Alternativfahrzeug<select id="acB"></select></label></div>
      <label><input id="acInclude" type="checkbox"> Energie-/Kraftstoffkosten von Fahrzeug A zusätzlich mitberechnen</label>
      <div id="acFacts" class="msg"></div><button id="acCalc">Vergleichen</button><div id="acResult" class="msg"></div></div>`;
    document.body.appendChild(d);
    $('acClose').onclick = () => d.close();
    $('acCalc').onclick = compare;
    $('acA').onchange = facts;
    $('acB').onchange = facts;
  }

  function addButton() {
    if ($('acButton')) return;
    const toolbar = document.querySelector('#app .toolbar');
    if (!toolbar) return;
    const b = document.createElement('button');
    b.id = 'acButton'; b.className = 'secondary'; b.textContent = 'Mehrkilometer vergleichen'; b.onclick = open;
    toolbar.appendChild(b);
  }

  function vehicle(side) { return vehicles.find(v => v.id === $(`ac${side}`).value); }
  function facts() {
    const a=vehicle('A'), b=vehicle('B'); if(!a||!b)return;
    $('acFacts').innerHTML = `<b>${a.short_name}</b>: ${label(a)}, ${a.default_consumption||0} je 100 km, ${cent(energy(a))} Energie, ${cent(a.overage_eur_km)} Mehr-km<br><b>${b.short_name}</b>: ${label(b)}, ${b.default_consumption||0} je 100 km, ${cent(energy(b))} Energie`;
  }
  function open() {
    const active=vehicles.filter(v=>v.is_active!==false); if(active.length<2)return alert('Mindestens zwei aktive Fahrzeuge erforderlich.');
    const options=active.map(v=>`<option value="${v.id}">${v.short_name||v.name}</option>`).join('');
    $('acA').innerHTML=options; $('acB').innerHTML=options; $('acA').value=active[0].id; $('acB').value=active[1].id; facts(); $('acResult').textContent=''; $('autoCompareDialog').showModal();
  }
  function compare() {
    const a=vehicle('A'),b=vehicle('B'); if(!a||!b||a.id===b.id)return $('acResult').textContent='Bitte zwei unterschiedliche Fahrzeuge wählen.';
    if(!a.default_consumption||a.default_energy_price==null||!b.default_consumption||b.default_energy_price==null)return $('acResult').textContent='Bitte bei beiden Fahrzeugen Verbrauch und Preis hinterlegen.';
    const totalA=Number(a.overage_eur_km||0)+($('acInclude').checked?energy(a):0), totalB=energy(b), win=totalA<=totalB?a:b;
    $('acResult').innerHTML=`<b>${win.short_name||win.name} ist günstiger.</b><br>${a.short_name}: ${cent(totalA)} (${ $('acInclude').checked?'Mehr-km + Energie':'nur Mehr-km' })<br>${b.short_name}: ${cent(totalB)} Energie/Kraftstoff<br>Differenz: ${cent(Math.abs(totalA-totalB))}`;
  }
  init(); new MutationObserver(addButton).observe(document.body,{childList:true,subtree:true}); addButton();
})();
