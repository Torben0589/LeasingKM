-- EINMAL im Supabase SQL Editor ausführen. Vorhandene Fahrzeuge und Ablesungen bleiben erhalten.
alter table public.vehicles add column if not exists is_active boolean not null default true;
alter table public.vehicles add column if not exists archived_at timestamptz;
