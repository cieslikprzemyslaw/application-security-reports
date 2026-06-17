-- Ensure the global Settings singleton exists for databases created
-- before Settings seed data was introduced.

INSERT INTO "Settings" (
    "id",
    "defaultSeverity",
    "theme",
    "dateFormat",
    "allowedBrandingModes",
    "defaultBrandingMode",
    "createdAt",
    "updatedAt"
)
SELECT
    'set_00000000-0000-0000-0000-000000000001',
    'medium',
    'system',
    'YYYY-MM-DD',
    '["issuer","client"]',
    'issuer',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM "Settings"
);
