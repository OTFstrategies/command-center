
-- Create enums for Proceshuis
CREATE TYPE "UserRole" AS ENUM ('Directie', 'Kwaliteitsmanager', 'Teamleider', 'Voorman', 'Vakman');
CREATE TYPE "ProcedureNiveau" AS ENUM ('N1', 'N2', 'N3', 'N4', 'N5');
CREATE TYPE "ProcedureStatus" AS ENUM ('Backlog', 'Klaar', 'Bezig', 'Gepubliceerd', 'Verouderd');
CREATE TYPE "ReviewStatus" AS ENUM ('Concept', 'In review', 'Goedgekeurd', 'Afgekeurd');
CREATE TYPE "ProjectStatus" AS ENUM ('Planning', 'Actief', 'Gepauzeerd', 'Afgerond');
CREATE TYPE "TaakStatus" AS ENUM ('Nieuw', 'Bezig', 'Geblokkeerd', 'Voltooid');
CREATE TYPE "TaakEindStatus" AS ENUM ('Voltooid', 'Deels voltooid', 'Geblokkeerd');
CREATE TYPE "ProbleemCategorie" AS ENUM ('Onduidelijke stap', 'Materiaal ontbreekt', 'Anders');
CREATE TYPE "BronbestandType" AS ENUM ('foto', 'audio', 'document', 'tekst');
CREATE TYPE "ConversieStapStatus" AS ENUM ('niet-gestart', 'bezig', 'voltooid');
CREATE TYPE "AuditActie" AS ENUM ('aangemaakt', 'gewijzigd', 'status_gewijzigd', 'versie_aangemaakt', 'ingediend_voor_review', 'goedgekeurd', 'afgekeurd', 'stap_afgevinkt', 'foto_geupload', 'probleem_gemeld', 'taak_toegewezen', 'taak_afgerond');
CREATE TYPE "EntiteitType" AS ENUM ('procedure', 'project', 'taak', 'gebruiker');
;
