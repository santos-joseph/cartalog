CREATE TABLE "demo_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(30) NOT NULL,
  "company_name" VARCHAR(100) NOT NULL,
  "message" TEXT,
  "email_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "emailed_at" TIMESTAMP(3),
  CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "demo_requests_created_at_idx" ON "demo_requests"("created_at");
