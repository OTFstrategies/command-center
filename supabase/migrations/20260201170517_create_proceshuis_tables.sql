
-- Proceshuis enums
CREATE TYPE procedure_niveau AS ENUM ('N1', 'N2', 'N3', 'N4', 'N5');
CREATE TYPE procedure_status AS ENUM ('Backlog', 'Klaar', 'Bezig', 'Gepubliceerd', 'Verouderd');
CREATE TYPE review_status AS ENUM ('Concept', 'In review', 'Goedgekeurd', 'Afgekeurd');
CREATE TYPE gebruiker_rol AS ENUM ('Directie', 'Kwaliteitsmanager', 'Teamleider', 'Voorman', 'Vakman');
CREATE TYPE bronbestand_type AS ENUM ('foto', 'audio', 'document', 'tekst');
CREATE TYPE conversie_stap_status AS ENUM ('niet-gestart', 'bezig', 'voltooid');

-- Afdelingen
CREATE TABLE afdelingen (
  id TEXT PRIMARY KEY,
  naam TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Gebruikers (Proceshuis specific - links to profiles)
CREATE TABLE gebruikers (
  id TEXT PRIMARY KEY,
  naam TEXT NOT NULL,
  email TEXT NOT NULL,
  rol gebruiker_rol NOT NULL,
  avatar_url TEXT,
  actief BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  afdeling_id TEXT REFERENCES afdelingen(id),
  deleted_at TIMESTAMP,
  auth_id UUID UNIQUE REFERENCES auth.users(id)
);

-- Procedures
CREATE TABLE procedures (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  titel TEXT NOT NULL,
  niveau procedure_niveau NOT NULL,
  status procedure_status NOT NULL DEFAULT 'Backlog',
  review_status review_status NOT NULL DEFAULT 'Concept',
  versie TEXT NOT NULL DEFAULT '0.1.0',
  eigenaar_id TEXT NOT NULL REFERENCES gebruikers(id),
  afdeling_id TEXT NOT NULL REFERENCES afdelingen(id),
  parent_id TEXT REFERENCES procedures(id),
  inhoud TEXT DEFAULT '',
  gepubliceerd_op TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Procedure stappen
CREATE TABLE procedure_stappen (
  id TEXT PRIMARY KEY,
  procedure_id TEXT NOT NULL REFERENCES procedures(id),
  volgorde INTEGER NOT NULL,
  titel TEXT NOT NULL,
  beschrijving TEXT NOT NULL,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Procedure versies
CREATE TABLE procedure_versies (
  id TEXT PRIMARY KEY,
  procedure_id TEXT NOT NULL REFERENCES procedures(id),
  versie TEXT NOT NULL,
  wijzigings_notitie TEXT NOT NULL,
  gewijzigd_door TEXT NOT NULL REFERENCES gebruikers(id),
  gewijzigd_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Glossary terms
CREATE TABLE glossary_terms (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  definitie TEXT NOT NULL,
  synoniemen TEXT[] DEFAULT ARRAY[]::TEXT[],
  categorie TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Conversies
CREATE TABLE conversies (
  id TEXT PRIMARY KEY,
  procedure_code TEXT NOT NULL,
  huidige_stap INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Bronbestanden
CREATE TABLE bronbestanden (
  id TEXT PRIMARY KEY,
  conversie_id TEXT NOT NULL REFERENCES conversies(id),
  naam TEXT NOT NULL,
  type bronbestand_type NOT NULL,
  url TEXT,
  inhoud TEXT,
  upload_datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Conversie stappen
CREATE TABLE conversie_stappen (
  id TEXT PRIMARY KEY,
  conversie_id TEXT NOT NULL REFERENCES conversies(id),
  nummer INTEGER NOT NULL,
  titel TEXT NOT NULL,
  prompt TEXT NOT NULL,
  resultaat TEXT,
  status conversie_stap_status NOT NULL DEFAULT 'niet-gestart',
  opgeslagen_op TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Codeer stappen
CREATE TABLE codeer_stappen (
  id TEXT PRIMARY KEY,
  conversie_stap_id TEXT NOT NULL REFERENCES conversie_stappen(id),
  nummer INTEGER NOT NULL,
  titel TEXT NOT NULL,
  prompt TEXT NOT NULL,
  resultaat TEXT,
  status conversie_stap_status NOT NULL DEFAULT 'niet-gestart',
  opgeslagen_op TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Enable RLS on all Proceshuis tables
ALTER TABLE afdelingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE gebruikers ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_stappen ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_versies ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bronbestanden ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversie_stappen ENABLE ROW LEVEL SECURITY;
ALTER TABLE codeer_stappen ENABLE ROW LEVEL SECURITY;
;
