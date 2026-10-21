-- Promote the first legacy administrator in each company to owner.
WITH first_admin AS (
  SELECT DISTINCT ON (u.company_id) u.id
  FROM users u
  WHERE u.role = 'ADMIN'
    AND NOT EXISTS (
      SELECT 1 FROM users owner_user
      WHERE owner_user.company_id = u.company_id AND owner_user.role = 'OWNER'
    )
  ORDER BY u.company_id, u.created_at, u.id
)
UPDATE users SET role = 'OWNER'
WHERE id IN (SELECT id FROM first_admin);
