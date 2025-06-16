-- Insertion des données initiales pour le championnat King League

-- Insertion de la saison actuelle
INSERT INTO seasons (name, start_date, status) 
VALUES ('King League Saison 1', '2024-01-01', 'active')
ON CONFLICT DO NOTHING;

-- Insertion des joueurs
INSERT INTO players (name) VALUES 
    ('Leo'),
    ('Alexan'),
    ('Lucas'),
    ('Rayan'),
    ('David'),
    ('Romeo')
ON CONFLICT (name) DO NOTHING;

-- Initialisation des statistiques des joueurs pour la saison actuelle
INSERT INTO player_stats (season_id, player_id, matches_played, matches_won, matches_lost, sets_won, sets_lost, points)
SELECT 
    s.id as season_id,
    p.id as player_id,
    0 as matches_played,
    0 as matches_won,
    0 as matches_lost,
    0 as sets_won,
    0 as sets_lost,
    0 as points
FROM seasons s
CROSS JOIN players p
WHERE s.status = 'active'
ON CONFLICT (season_id, player_id) DO NOTHING;

-- Insertion de quelques matchs d'exemple
WITH season_data AS (
    SELECT id as season_id FROM seasons WHERE status = 'active' LIMIT 1
),
player_data AS (
    SELECT name, id FROM players
)
INSERT INTO matches (season_id, player1_id, player2_id, match_date, match_time, format, status, winner_id)
SELECT 
    s.season_id,
    p1.id,
    p2.id,
    '2024-01-15'::date,
    '14:30'::time,
    'best-of-3',
    'completed',
    p1.id
FROM season_data s,
     player_data p1,
     player_data p2
WHERE p1.name = 'Leo' AND p2.name = 'Rayan'

UNION ALL

SELECT 
    s.season_id,
    p1.id,
    p2.id,
    '2024-01-14'::date,
    '16:00'::time,
    'best-of-3',
    'completed',
    p1.id
FROM season_data s,
     player_data p1,
     player_data p2
WHERE p1.name = 'Alexan' AND p2.name = 'Lucas'

UNION ALL

SELECT 
    s.season_id,
    p1.id,
    p2.id,
    '2024-01-13'::date,
    '15:15'::time,
    'best-of-3',
    'completed',
    p1.id
FROM season_data s,
     player_data p1,
     player_data p2
WHERE p1.name = 'David' AND p2.name = 'Romeo';
