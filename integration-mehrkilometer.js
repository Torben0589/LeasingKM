/* Beispieladapter fuer den Mehrkilometer-Vergleich.
 * Die Funktions- und Feldnamen bei Bedarf an die Haupt-App anpassen.
 */

function berechneEnergiekostenProKm(fahrzeug, eingaben) {
  const verbrauch = Number(eingaben.verbrauch) || 0;
  const antriebsart = String(fahrzeug.driveType || fahrzeug.antriebsart || '').toLowerCase();
  const istElektro = ['electric', 'elektro', 'ev', 'bev'].includes(antriebsart);

  if (istElektro) {
    const effektiverStrompreis = window.PVEnergy.getEffectiveElectricityPrice();
    return (verbrauch / 100) * effektiverStrompreis;
  }

  const kraftstoffpreis = Number(eingaben.kraftstoffpreis) || 0;
  return (verbrauch / 100) * kraftstoffpreis;
}

// Optional: Offenen Vergleich nach einer Aenderung sofort neu berechnen.
window.addEventListener('pv-settings-changed', () => {
  if (typeof window.berechneMehrkilometerVergleich === 'function') {
    window.berechneMehrkilometerVergleich();
  }
});
