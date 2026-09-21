/* Fuhrpark Cockpit: fachlich korrekte Chart-Erklärung */
(() => {
  const EXPLANATION = `
    <strong style="color:#ffbd59">Gelb:</strong>
    Historische Mehrkosten-Prognosen zum Zeitpunkt der jeweiligen gespeicherten Kilometerablesung.<br><br>

    <strong style="color:#4da3ff">Blau:</strong>
    Der bei jeder gespeicherten Ablesung prognostizierte Kilometerstand am Vertragsende.<br><br>

    <strong style="color:#48d597">Grün:</strong>
    Aktuelle Hochrechnung für heute auf Basis des zuletzt gespeicherten Kilometerstands und des heutigen Datums.<br><br>

    Die grüne Live-Prognose berücksichtigt keine tatsächlich gefahrenen Kilometer seit der letzten Ablesung,
    solange kein neuer Kilometerstand gespeichert wurde. Sie zeigt ausschließlich, wie sich die zusätzlich
    vergangene Vertragszeit rechnerisch auf die Prognose auswirkt. Für eine genaue Bewertung des aktuellen
    Fahrverhaltens sollte regelmäßig ein neuer Kilometerstand erfasst werden.
  `;

  function updateExplanation() {
    const dialog = document.getElementById('forecastChartDialog');
    if (!dialog) return false;

    const note = dialog.querySelector('.chart-note');
    if (!note) return false;

    note.innerHTML = EXPLANATION;
    note.setAttribute('aria-label', 'Erklärung der Linien im Prognose-Diagramm');
    return true;
  }

  if (!updateExplanation()) {
    const observer = new MutationObserver(() => {
      if (updateExplanation()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
