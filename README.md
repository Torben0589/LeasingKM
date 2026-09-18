# Leasing-Kilometer Web-App

Mobile, statische HTML-App mit Supabase-Login und Cloud-Datenbank. Dieselbe Anmeldung auf mehreren Geräten zeigt denselben Datenbestand.

## Einrichtung
1. Kostenloses Supabase-Projekt erstellen.
2. Im Supabase SQL Editor den kompletten Inhalt aus `supabase.sql` ausführen.
3. Unter Authentication > Providers sicherstellen, dass E-Mail aktiviert ist. Optional E-Mail-Bestätigung deaktivieren, wenn du sofort testen möchtest.
4. Den kompletten Ordner auf einen HTTPS-Webhost laden, z. B. GitHub Pages, Cloudflare Pages oder Netlify.
5. App öffnen, Supabase Project URL und Publishable/Anon Key eintragen. Niemals Secret- oder Service-Role-Key verwenden.
6. Konto anlegen. Beim ersten Login werden Ateca, Born und die vorhandenen Kilometerstände automatisch angelegt.
7. Auf weiteren Geräten dieselbe Webadresse öffnen und dasselbe Konto verwenden.

## Datenschutz und Zugriff
Die SQL-Datei aktiviert Row Level Security. Ein angemeldetes Konto kann ausschließlich seine eigenen Fahrzeuge und Ablesungen lesen und ändern. URL und Publishable/Anon Key dürfen im Browser verwendet werden. Ein Secret-Key gehört niemals in diese App.

## Lokaler Test
Da Browser lokale `file://`-Seiten unterschiedlich behandeln, den Ordner besser über einen lokalen Webserver oder direkt über einen HTTPS-Host öffnen.
