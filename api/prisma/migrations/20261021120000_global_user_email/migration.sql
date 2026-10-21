-- E-mail identifica uma conta de loja independentemente do endereço público da empresa.
UPDATE "users" SET "email" = LOWER(TRIM("email"));

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
