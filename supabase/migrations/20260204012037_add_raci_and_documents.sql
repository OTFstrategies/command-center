-- Migration: Add RACI and Document tables for Procedures
-- Date: 2026-02-04
-- Description: Adds support for RACI role assignments and document attachments to procedures

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Create RaciRol enum
CREATE TYPE "RaciRol" AS ENUM ('Responsible', 'Accountable', 'Consulted', 'Informed');

-- Create DocumentType enum
CREATE TYPE "DocumentType" AS ENUM ('Link', 'Upload');

-- =============================================================================
-- TABLES
-- =============================================================================

-- RACI toewijzingen per procedure
-- Meerdere gebruikers kunnen dezelfde rol hebben per procedure
CREATE TABLE "procedure_raci" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "procedure_id" TEXT NOT NULL REFERENCES "procedures"("id") ON DELETE CASCADE,
  "gebruiker_id" TEXT NOT NULL REFERENCES "gebruikers"("id"),
  "raci_rol" "RaciRol" NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have each role once per procedure
  UNIQUE ("procedure_id", "gebruiker_id", "raci_rol")
);

-- Indexes for procedure_raci
CREATE INDEX "idx_procedure_raci_procedure_id" ON "procedure_raci"("procedure_id");
CREATE INDEX "idx_procedure_raci_gebruiker_id" ON "procedure_raci"("gebruiker_id");

-- Gerelateerde documenten bij procedures (links + uploads)
CREATE TABLE "procedure_documenten" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "procedure_id" TEXT NOT NULL REFERENCES "procedures"("id") ON DELETE CASCADE,
  "titel" VARCHAR(255) NOT NULL,
  "type" "DocumentType" NOT NULL,
  "url" TEXT NOT NULL,
  "bestandsnaam" VARCHAR(255),
  "bestandsgrootte" INTEGER,
  "mime_type" VARCHAR(127),
  "beschrijving" TEXT,
  "toegevoegd_door" TEXT NOT NULL REFERENCES "gebruikers"("id"),
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for procedure_documenten
CREATE INDEX "idx_procedure_documenten_procedure_id" ON "procedure_documenten"("procedure_id");

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE "procedure_raci" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "procedure_documenten" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for procedure_raci
CREATE POLICY "Allow authenticated users to view procedure_raci"
  ON "procedure_raci"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert procedure_raci"
  ON "procedure_raci"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete procedure_raci"
  ON "procedure_raci"
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for procedure_documenten
CREATE POLICY "Allow authenticated users to view procedure_documenten"
  ON "procedure_documenten"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert procedure_documenten"
  ON "procedure_documenten"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete procedure_documenten"
  ON "procedure_documenten"
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE "procedure_raci" IS 'RACI matrix assignments for procedures. Multiple users can have the same role.';
COMMENT ON COLUMN "procedure_raci"."raci_rol" IS 'R=Responsible (uitvoerder), A=Accountable (eindverantwoordelijk), C=Consulted (geraadpleegd), I=Informed (geïnformeerd)';

COMMENT ON TABLE "procedure_documenten" IS 'Related documents for procedures - external links or uploaded files';
COMMENT ON COLUMN "procedure_documenten"."type" IS 'Link=external URL, Upload=Supabase Storage file';
COMMENT ON COLUMN "procedure_documenten"."url" IS 'External URL for links, Supabase Storage path for uploads';;
