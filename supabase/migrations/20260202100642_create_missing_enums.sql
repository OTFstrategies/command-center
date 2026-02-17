-- Create missing enums for my-product tables
DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('Planning', 'Actief', 'Gepauzeerd', 'Afgerond');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TaakStatus" AS ENUM ('Nieuw', 'Bezig', 'Geblokkeerd', 'Voltooid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TaakEindStatus" AS ENUM ('Voltooid', 'Deels voltooid', 'Geblokkeerd');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ProbleemCategorie" AS ENUM ('Onduidelijke stap', 'Materiaal ontbreekt', 'Anders');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AuditActie" AS ENUM (
    'aangemaakt', 'gewijzigd', 'status_gewijzigd', 'versie_aangemaakt',
    'ingediend_voor_review', 'goedgekeurd', 'afgekeurd', 'stap_afgevinkt',
    'foto_geupload', 'probleem_gemeld', 'taak_toegewezen', 'taak_afgerond'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EntiteitType" AS ENUM ('procedure', 'project', 'taak', 'gebruiker');
EXCEPTION WHEN duplicate_object THEN null; END $$;;
