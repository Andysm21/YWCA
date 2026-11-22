-- Uni Camp can now run in summer OR winter seasons (already applied to the live DB; kept so fresh databases match).
UPDATE camp_types SET applicable_season_type = 'both' WHERE name = 'Uni Camp';
