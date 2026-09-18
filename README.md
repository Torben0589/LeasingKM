# Fuhrpark Cockpit V2

## Update ohne Datenverlust
1. In Supabase den SQL Editor öffnen.
2. Den Inhalt aus `UPDATE_DATABASE.sql` einfügen und ausführen.
3. In GitHub die bisherigen Dateien `index.html`, `styles.css`, `app.js` und `manifest.webmanifest` durch die Dateien dieses Pakets ersetzen.
4. GitHub Pages veröffentlicht die Änderung. Bestehende Konten, Fahrzeuge und Kilometerstände bleiben in Supabase erhalten.

## Neue Funktionen
- beliebig viele Fahrzeuge hinzufügen
- Fahrzeuge bearbeiten
- Fahrzeuge archivieren und reaktivieren
- getrennte Ansichten „Aktiv“ und „Archiv“
- alte Ablesungen bleiben beim Fahrzeugwechsel erhalten
- responsive iPhone-Darstellung ohne überlappende Datum-/Kilometerfelder
- Supabase-Einrichtung weiterhin nur einmal je Browser/Gerät

## Wichtig
Beim ersten Einsatz dieser Version muss `UPDATE_DATABASE.sql` einmal ausgeführt werden. Fahrzeuge nicht durch Überschreiben ersetzen, sondern archivieren und danach über `+ Fahrzeug` neu anlegen.
