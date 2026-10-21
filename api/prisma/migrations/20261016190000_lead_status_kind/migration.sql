ALTER TABLE "lead_status" ADD COLUMN "kind" VARCHAR NOT NULL DEFAULT 'open';

UPDATE "lead_status" SET "kind" = 'lost' WHERE lower("name") = 'perdido';
UPDATE "lead_status" SET "kind" = 'won' WHERE lower("name") IN ('fechado', 'ganho', 'vendido');
