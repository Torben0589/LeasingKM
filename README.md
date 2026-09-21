# 🚗 Fuhrpark Cockpit

Ein kompaktes, mobil optimiertes Fuhrpark- und Leasing-Cockpit zur Verwaltung von Fahrzeugen, Kilometerständen und Leasingprognosen.

Die Web-App unterstützt dabei, den Kilometerverbrauch mehrerer Leasingfahrzeuge über die gesamte Vertragslaufzeit zu überwachen, Entwicklungen nachvollziehbar zu machen und mögliche Mehrkilometer frühzeitig zu erkennen.

## Inhaltsverzeichnis

- [Funktionsübersicht](#funktionsübersicht)
- [Fahrzeugverwaltung](#fahrzeugverwaltung)
- [Kilometerstände](#kilometerstände)
- [Automatische Berechnungen](#automatische-berechnungen)
- [Prognose-Diagramm](#prognose-diagramm)
- [Archivierung](#archivierung)
- [Benutzerkonten und Datenschutz](#benutzerkonten-und-datenschutz)
- [Geräteübergreifende Nutzung](#geräteübergreifende-nutzung)
- [Installation und Einrichtung](#installation-und-einrichtung)
- [Verwendete Dateien](#verwendete-dateien)
- [Empfohlene Nutzung](#empfohlene-nutzung)
- [Berechnungsgrundlage](#berechnungsgrundlage)
- [Technische Basis](#technische-basis)
- [Hinweise und Einschränkungen](#hinweise-und-einschränkungen)

## Funktionsübersicht

Das Fuhrpark Cockpit bietet aktuell folgende Funktionen:

- Verwaltung mehrerer Leasingfahrzeuge
- Anlegen und Bearbeiten von Fahrzeug- und Vertragsdaten
- Archivieren und Reaktivieren ehemaliger Fahrzeuge
- Erfassen beliebig vieler Kilometerstände
- Optionale Notizen zu jeder Ablesung
- Automatische Soll-Ist-Auswertung
- Hochrechnung des Kilometerstands zum Vertragsende
- Berechnung voraussichtlicher Mehrkilometer
- Berechnung prognostizierter Mehrkosten
- Berechnung einer möglichen Minderkilometer-Erstattung
- Historisches Prognose-Diagramm
- Aktuelle rechnerische Live-Prognose
- Synchronisation über mehrere Geräte
- Anmeldung mit E-Mail-Adresse und Passwort
- Benutzerbezogene Trennung der gespeicherten Daten
- Responsive Darstellung für Smartphone, Tablet und Desktop
- Vorbereitung zur Nutzung als Web-App auf dem Startbildschirm

## Fahrzeugverwaltung

Für jedes Fahrzeug können folgende Daten hinterlegt werden:

- Fahrzeugbezeichnung
- Kurzname
- Vertragsbeginn
- Vertragsende
- Kilometerstand bei Übergabe
- Vereinbarte Gesamtkilometer
- Kostenlose Toleranz in Kilometern
- Preis je Mehrkilometer in Euro
- Erstattung je Minderkilometer in Euro

Über die Schaltfläche **„+ Fahrzeug“** können jederzeit weitere Fahrzeuge ergänzt werden.

### Beispiel

```text
Fahrzeugbezeichnung: Cupra Born
Kurzname: Born
Vertragsbeginn: 16.10.2023
Vertragsende: 16.10.2027
Start-Kilometerstand: 0 km
Gesamtkilometer: 50.000 km
Toleranz: 2.500 km
Mehrkosten: 0,0916 EUR/km
Erstattung: 0,0417 EUR/km
```

## Kilometerstände

Zu jedem aktiven Fahrzeug können beliebig viele Ablesungen gespeichert werden.

Eine Ablesung besteht aus:

- Fahrzeug
- Datum
- Kilometerstand
- optionaler Notiz

Die gespeicherten Ablesungen bilden die Grundlage für die aktuelle Prognose und den zeitlichen Verlauf im Diagramm.

Falsch eingetragene Kilometerstände können aus dem Verlauf wieder gelöscht werden.

## Automatische Berechnungen

Für jedes aktive Fahrzeug zeigt die App mehrere automatisch berechnete Werte an.

### Aktueller Kilometerstand

Der zuletzt gespeicherte Tachostand des Fahrzeugs.

### Soll-Kilometerstand

Der zeitanteilige Kilometerstand, der sich aus Vertragslaufzeit und vereinbarten Gesamtkilometern ergibt.

### Abweichung vom Soll

Vergleich zwischen tatsächlich gefahrenen Kilometern und dem zeitanteiligen Vertrags-Soll.

- Positiver Wert: Es wurden mehr Kilometer gefahren als zeitanteilig vorgesehen.
- Negativer Wert: Es wurden weniger Kilometer gefahren als zeitanteilig vorgesehen.

### Prognostizierter Endstand

Hochrechnung des Kilometerstands zum Vertragsende auf Basis des zuletzt gespeicherten Kilometerstands und der bis dahin vergangenen Vertragszeit.

### Verfügbare Kilometer pro Resttag

Zeigt, wie viele Vertragskilometer ab dem letzten gespeicherten Stand durchschnittlich pro verbleibendem Vertragstag noch zur Verfügung stehen.

### Prognostizierte Mehrkosten

Die App prüft, ob der hochgerechnete Endstand die vereinbarten Gesamtkilometer einschließlich kostenloser Toleranz überschreitet.

```text
Prognostizierte Mehrkilometer
×
Preis je Mehrkilometer
=
Prognostizierte Mehrkosten
```

### Prognostizierte Minderkilometer-Erstattung

Liegt die Endprognose unter den vereinbarten Gesamtkilometern, kann auf Basis des hinterlegten Erstattungssatzes eine mögliche Minderkilometer-Erstattung angezeigt werden.

Die tatsächliche Abrechnung richtet sich immer nach dem jeweiligen Leasingvertrag.

## Prognose-Diagramm

Durch Auswahl des Feldes **„Mehrkosten Prognose“** öffnet sich eine Detailansicht mit dem zeitlichen Verlauf der Prognose.

### Gelbe Linie

Historische Mehrkosten-Prognosen zum Zeitpunkt der jeweiligen gespeicherten Kilometerablesung.

Eine fallende gelbe Linie bedeutet, dass die prognostizierten Mehrkosten im Vergleich zu vorherigen Ablesungen gesunken sind. Eine steigende gelbe Linie bedeutet, dass die prognostizierten Mehrkosten zugenommen haben.

### Blaue Linie

Der bei jeder gespeicherten Ablesung prognostizierte Kilometerstand am Vertragsende.

### Grüne Linie

Aktuelle Hochrechnung für den heutigen Tag auf Basis des zuletzt gespeicherten Kilometerstands und des heutigen Datums.

Die grüne Live-Prognose berücksichtigt keine tatsächlich gefahrenen Kilometer seit der letzten Ablesung, solange kein neuer Kilometerstand gespeichert wurde. Die grüne Live-Prognose zeigt ausschließlich, wie sich die zusätzlich vergangene Vertragszeit rechnerisch auf die Prognose auswirkt.

Für eine genaue Bewertung des aktuellen Fahrverhaltens sollte regelmäßig ein neuer Kilometerstand erfasst werden.

### Kennzahlen unter dem Diagramm

Je nach Version werden unter anderem folgende Werte angezeigt:

- Erste gespeicherte Prognose
- Letzte gespeicherte Prognose
- Aktuelle Live-Prognose
- Veränderung gegenüber der ersten Prognose

## Archivierung

Zurückgegebene oder nicht mehr aktive Fahrzeuge müssen nicht gelöscht werden.

Über **„Archivieren“** wird ein Fahrzeug aus der aktiven Übersicht entfernt und in den Bereich **„Archiv“** verschoben.

Dabei bleiben erhalten:

- Fahrzeugdaten
- Vertragsdaten
- sämtliche Kilometerstände
- Notizen
- historische Prognosen

Archivierte Fahrzeuge können über **„Reaktivieren“** jederzeit wieder in die aktive Übersicht zurückgeholt werden.

Bei einem Fahrzeugwechsel sollte das alte Fahrzeug archiviert und das neue Fahrzeug separat angelegt werden. Das bloße Umbenennen eines alten Fahrzeugs würde dessen bisherige Kilometerhistorie fälschlicherweise dem neuen Fahrzeug zuordnen.

## Benutzerkonten und Datenschutz

Die Anwendung verwendet die Supabase-Authentifizierung mit E-Mail-Adresse und Passwort.

Die Anmeldung ist wichtig, weil Supabase die gespeicherten Daten einer eindeutigen Benutzer-ID zuordnet. Dadurch kann jedes Konto nur auf die eigenen Fahrzeuge und Kilometerstände zugreifen.

Die Daten werden mithilfe von Row Level Security getrennt.

### Mehrere Konten

Wird ein zweites Benutzerkonto mit einer anderen E-Mail-Adresse angelegt, erhält dieses Konto einen eigenen, zunächst leeren Fuhrpark.

Die Fahrzeuge eines Kontos sind für andere Benutzerkonten nicht sichtbar, sofern die vorgesehenen Sicherheitsregeln in Supabase aktiv sind.

### Schlüssel

In der Web-App darf ausschließlich der öffentliche **Publishable Key** beziehungsweise **Anon Key** verwendet werden.

Folgende Schlüssel dürfen niemals im Browser oder in einem öffentlichen GitHub-Repository hinterlegt werden:

- Service Role Key
- Secret Key
- administrative Datenbankschlüssel

## Geräteübergreifende Nutzung

Die Fahrzeug- und Kilometerdaten liegen zentral in Supabase. Dadurch können dieselben Daten auf mehreren Geräten verwendet werden.

Beispiele:

- iPhone
- iPad
- Android-Gerät
- Windows-PC
- Mac
- Linux-PC

Auf jedem neuen Gerät werden Supabase-Projekt-URL und Publishable-/Anon-Key einmalig im Browser hinterlegt. Anschließend erfolgt die Anmeldung mit dem bereits bestehenden Benutzerkonto.

Die Supabase-Verbindungsdaten und die Anmeldesitzung werden lokal im jeweiligen Browser gespeichert. Werden Browserdaten gelöscht oder wird ein privates Browserfenster verwendet, kann eine erneute Einrichtung erforderlich sein.

## Installation und Einrichtung

### 1. Supabase-Projekt erstellen

Es wird ein Supabase-Projekt mit Benutzeranmeldung und den benötigten Tabellen eingerichtet.

Die App benötigt mindestens folgende Tabellen:

```text
vehicles
readings
```

### 2. Datenbankstruktur einrichten

Die benötigten SQL-Anweisungen werden im Supabase SQL Editor ausgeführt.

Für die Fahrzeugarchivierung werden zusätzlich folgende Felder in der Tabelle `vehicles` benötigt:

```text
is_active
archived_at
```

### 3. Dateien veröffentlichen

Die Web-App besteht aus statischen Dateien und kann beispielsweise über GitHub Pages veröffentlicht werden.

Benötigte Hauptdateien:

```text
index.html
styles.css
app.js
manifest.webmanifest
prognose-chart.js
```

Optional kann eine zusätzliche Datei für den Erklärungstext des Diagramms verwendet werden:

```text
prognose-erklaerung.js
```

### 4. Supabase-Verbindung einrichten

Beim ersten Öffnen auf einem Gerät werden eingegeben:

- Supabase-Projekt-URL
- Publishable-/Anon-Key

Die Projekt-URL hat grundsätzlich dieses Format:

```text
https://PROJEKT-ID.supabase.co
```

Der Zusatz `/rest/v1/` gehört nicht in das URL-Feld der App.

### 5. Benutzerkonto anlegen

Nach erfolgreicher Verbindung kann ein Konto mit E-Mail-Adresse und Passwort angelegt werden.

Auf weiteren Geräten wird kein neues Konto benötigt. Dort wird dasselbe bestehende Konto verwendet.

## Verwendete Dateien

### `index.html`

Enthält die grundlegende Struktur und bindet Stylesheets sowie JavaScript-Dateien ein.

### `styles.css`

Enthält das responsive Design für Smartphone, Tablet und Desktop.

### `app.js`

Enthält unter anderem:

- Anmeldung
- Supabase-Verbindung
- Fahrzeugverwaltung
- Archivierung
- Kilometererfassung
- Berechnungen
- Synchronisation

### `prognose-chart.js`

Erstellt das Prognose-Diagramm mit historischen und aktuellen Berechnungen.

### `prognose-erklaerung.js`

Optionaler Ergänzungsbaustein für eine ausführlichere und fachlich präzise Erklärung unter dem Diagramm.

### `manifest.webmanifest`

Enthält Metadaten für die Nutzung als Web-App, beispielsweise Name, Startpfad und Darstellungsmodus.

## Empfohlene Nutzung

Mindestens einmal pro Monat sollte ein aktueller Kilometerstand gespeichert werden.

Je regelmäßiger Kilometerstände erfasst werden, desto aussagekräftiger werden:

- Prognoseverlauf
- Trendanalyse
- Vergleich einzelner Ablesungen
- Erkennung einer Verbesserung oder Verschlechterung

Die aktuelle Endprognose verwendet im Wesentlichen den Vertragsbeginn, den Start-Kilometerstand und die letzte gespeicherte Ablesung. Die älteren Einträge werden vor allem für die historische Darstellung des Prognoseverlaufs benötigt.

## Berechnungsgrundlage

Die Endprognose wird grundsätzlich aus dem durchschnittlichen Kilometerverbrauch seit Vertragsbeginn abgeleitet.

Vereinfacht:

```text
Gefahrene Kilometer seit Vertragsbeginn
÷
Vergangene Vertragstage
×
Gesamte Vertragsdauer
=
Prognostizierte Kilometer bei Vertragsende
```

Anschließend werden vereinbarte Gesamtkilometer und kostenlose Toleranz berücksichtigt.

```text
Prognostizierter Endstand
-
Start-Kilometerstand
-
Vereinbarte Gesamtkilometer
-
Kostenlose Toleranz
=
Prognostizierte kostenpflichtige Mehrkilometer
```

Die Berechnung ist eine Hochrechnung und keine verbindliche Leasingabrechnung.

## Technische Basis

- HTML5
- CSS3
- Vanilla JavaScript
- Supabase
- Chart.js
- GitHub Pages
- Progressive-Web-App-Metadaten

Es wird kein eigener Anwendungsserver benötigt. Datenbank, Authentifizierung und Synchronisation werden über Supabase bereitgestellt.

## Hinweise und Einschränkungen

- Prognosen sind rechnerische Hochrechnungen und können vom späteren tatsächlichen Ergebnis abweichen.
- Die verbindliche Abrechnung richtet sich ausschließlich nach dem jeweiligen Leasingvertrag.
- Die Live-Prognose kennt keine Kilometer, die seit der letzten gespeicherten Ablesung gefahren, aber noch nicht eingetragen wurden.
- Eine regelmäßige Kilometererfassung verbessert vor allem die Aktualität und Aussagekraft des Verlaufs.
- Kilometerstände sollten vor dem Löschen sorgfältig geprüft werden.
- Fahrzeuge sollten bei einem Wechsel archiviert und nicht durch Umbenennen überschrieben werden.
- Der öffentliche Publishable-/Anon-Key ersetzt keine Sicherheitsregeln. Row Level Security muss in Supabase korrekt eingerichtet sein.

## Projektstatus

Das Fuhrpark Cockpit ist als persönliches, browserbasiertes Fuhrpark- und Leasing-Controlling-Werkzeug ausgelegt. Der Schwerpunkt liegt auf einer übersichtlichen Darstellung, einfacher Bedienung und geräteübergreifender Datensynchronisation.
