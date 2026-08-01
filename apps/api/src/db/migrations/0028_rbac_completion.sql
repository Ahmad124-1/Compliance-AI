-- Sprint 8C: Append new permission keys for completed modules and grant to superadmin.
-- Idempotent: uses ON CONFLICT DO NOTHING.

INSERT INTO permissions (key, resource, action, description)
SELECT 'carbon:' || a, 'carbon', a, 'carbon ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'esg:' || a, 'esg', a, 'esg ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'suppliers:' || a, 'suppliers', a, 'suppliers ' || a
FROM unnest(ARRAY['read','create','update','delete','write']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'compliance:' || a, 'compliance', a, 'compliance ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'policy:' || a, 'policy', a, 'policy ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'document:' || a, 'document', a, 'document ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'water:' || a, 'water', a, 'water ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'waste:' || a, 'waste', a, 'waste ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'air:' || a, 'air', a, 'air ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'chemical:' || a, 'chemical', a, 'chemical ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, resource, action, description)
SELECT 'biodiversity:' || a, 'biodiversity', a, 'biodiversity ' || a
FROM unnest(ARRAY['read','create','update','delete']) AS a
ON CONFLICT (key) DO NOTHING;

-- Grant the new permission keys to the superadmin role (idempotent).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'superadmin'
  AND p.key LIKE ANY (ARRAY[
    'carbon:%', 'esg:%', 'suppliers:%', 'compliance:%',
    'policy:%', 'document:%', 'water:%', 'waste:%',
    'air:%', 'chemical:%', 'biodiversity:%'
  ])
ON CONFLICT DO NOTHING;

