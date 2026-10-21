CREATE TABLE "store_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "actor_id" UUID,
  "actor_name" VARCHAR(100) NOT NULL,
  "actor_email" VARCHAR(255),
  "action" VARCHAR(80) NOT NULL,
  "target" VARCHAR(120) NOT NULL,
  "details" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "store_audit_logs_created_at_id_idx" ON "store_audit_logs"("created_at", "id");
CREATE INDEX "store_audit_logs_company_id_created_at_idx" ON "store_audit_logs"("company_id", "created_at");
ALTER TABLE "store_audit_logs" ADD CONSTRAINT "store_audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
