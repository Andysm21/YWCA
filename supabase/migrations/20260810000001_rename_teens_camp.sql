-- Rename "Teen Camp" to "Teens Camp" (already applied to the live DB; kept so fresh databases match).
UPDATE camp_types SET name = 'Teens Camp' WHERE name = 'Teen Camp';
UPDATE camps SET slug = 'teens-camp-2026' WHERE slug = 'teen-camp-2026';
