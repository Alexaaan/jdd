-- Version SQLite des tables King League
-- Exécutez ce script dans un client SQLite

-- Table des saisons
CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des joueurs
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des matchs
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER REFERENCES seasons(id),
    player1_id INTEGER REFERENCES players(id),
    player2_id INTEGER REFERENCES players(id),
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    format TEXT NOT NULL, -- 'best-of-3' ou 'best-of-5'
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    winner_id INTEGER REFERENCES players(id),
    phase TEXT DEFAULT 'championship', -- 'championship', 'semifinal', 'final'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des sets
CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des statistiques des joueurs par saison
CREATE TABLE IF NOT EXISTS player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER REFERENCES seasons(id),
    player_id INTEGER REFERENCES players(id),
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    UNIQUE(season_id, player_id)
);

-- Insertion des données initiales
INSERT OR IGNORE INTO seasons (name, start_date, status) 
VALUES ('King League Saison 1', '2024-01-01', 'active');

-- Insertion des joueurs
INSERT OR IGNORE INTO players (name) VALUES 
    ('Leo'),
    ('Alexan'),
    ('Lucas'),
    ('Rayan'),
    ('David'),
    ('Romeo');

-- Initialisation des statistiques des joueurs
INSERT OR IGNORE INTO player_stats (season_id, player_id, matches_played, matches_won, matches_lost, sets_won, sets_lost, points)
SELECT 
    1 as season_id,
    p.id as player_id,
    0 as matches_played,
    0 as matches_won,
    0 as matches_lost,
    0 as sets_won,
    0 as sets_lost,
    0 as points
FROM players p;

-- Insertion de quelques matchs d'exemple
INSERT OR IGNORE INTO matches (season_id, player1_id, player2_id, match_date, match_time, format, status, winner_id)
VALUES 
    (1, 1, 4, '2024-01-15', '14:30', 'best-of-3', 'completed', 1),
    (1, 2, 3, '2024-01-14', '16:00', 'best-of-3', 'completed', 2),
    (1, 5, 6, '2024-01-13', '15:15', 'best-of-3', 'completed', 5);

-- Insertion des sets pour les matchs
INSERT OR IGNORE INTO sets (match_id, set_number, player1_score, player2_score) VALUES
    -- Match 1: Leo vs Rayan (2-1)
    (1, 1, 11, 8),
    (1, 2, 6, 11),
    (1, 3, 11, 9),
    -- Match 2: Alexan vs Lucas (2-0)
    (2, 1, 11, 7),
    (2, 2, 11, 9),
    -- Match 3: David vs Romeo (2-1)
    (3, 1, 11, 6),
    (3, 2, 9, 11),
    (3, 3, 11, 8);

-- Mise à jour des statistiques manuellement pour les matchs d'exemple
UPDATE player_stats SET 
    matches_played = 1, matches_won = 1, matches_lost = 0, 
    sets_won = 2, sets_lost = 1, points = 3 
WHERE player_id = 1; -- Leo

UPDATE player_stats SET 
    matches_played = 1, matches_won = 1, matches_lost = 0, 
    sets_won = 2, sets_lost = 0, points = 3 
WHERE player_id = 2; -- Alexan

UPDATE player_stats SET 
    matches_played = 1, matches_won = 0, matches_lost = 1, 
    sets_won = 0, sets_lost = 2, points = 0 
WHERE player_id = 3; -- Lucas

UPDATE player_stats SET 
    matches_played = 1, matches_won = 0, matches_lost = 1, 
    sets_won = 1, sets_lost = 2, points = 0 
WHERE player_id = 4; -- Rayan

UPDATE player_stats SET 
    matches_played = 1, matches_won = 1, matches_lost = 0, 
    sets_won = 2, sets_lost = 1, points = 3 
WHERE player_id = 5; -- David

UPDATE player_stats SET 
    matches_played = 1, matches_won = 0, matches_lost = 1, 
    sets_won = 1, sets_lost = 2, points = 0 
WHERE player_id = 6; -- Romeo
