-- Fonction pour mettre à jour les statistiques des joueurs
CREATE OR REPLACE FUNCTION update_player_stats_after_match(
    p_season_id INTEGER,
    p_player_id INTEGER,
    p_is_winner BOOLEAN,
    p_sets_won INTEGER,
    p_sets_lost INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE player_stats 
    SET 
        matches_played = matches_played + 1,
        matches_won = CASE WHEN p_is_winner THEN matches_won + 1 ELSE matches_won END,
        matches_lost = CASE WHEN NOT p_is_winner THEN matches_lost + 1 ELSE matches_lost END,
        sets_won = sets_won + p_sets_won,
        sets_lost = sets_lost + p_sets_lost,
        points = CASE WHEN p_is_winner THEN points + 3 ELSE points END
    WHERE season_id = p_season_id AND player_id = p_player_id;
END;
$$ LANGUAGE plpgsql;
