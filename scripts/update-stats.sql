-- Procédure pour mettre à jour les statistiques des joueurs après chaque match

-- Fonction pour calculer et mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les stats du joueur 1
    UPDATE player_stats 
    SET 
        matches_played = matches_played + 1,
        matches_won = CASE WHEN NEW.winner_id = NEW.player1_id THEN matches_won + 1 ELSE matches_won END,
        matches_lost = CASE WHEN NEW.winner_id = NEW.player2_id THEN matches_lost + 1 ELSE matches_lost END,
        points = CASE WHEN NEW.winner_id = NEW.player1_id THEN points + 3 ELSE points END
    WHERE season_id = NEW.season_id AND player_id = NEW.player1_id;
    
    -- Mettre à jour les stats du joueur 2
    UPDATE player_stats 
    SET 
        matches_played = matches_played + 1,
        matches_won = CASE WHEN NEW.winner_id = NEW.player2_id THEN matches_won + 1 ELSE matches_won END,
        matches_lost = CASE WHEN NEW.winner_id = NEW.player1_id THEN matches_lost + 1 ELSE matches_lost END,
        points = CASE WHEN NEW.winner_id = NEW.player2_id THEN points + 3 ELSE points END
    WHERE season_id = NEW.season_id AND player_id = NEW.player2_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour automatiquement les stats
DROP TRIGGER IF EXISTS trigger_update_stats ON matches;
CREATE TRIGGER trigger_update_stats
    AFTER UPDATE OF winner_id ON matches
    FOR EACH ROW
    WHEN (OLD.winner_id IS NULL AND NEW.winner_id IS NOT NULL)
    EXECUTE FUNCTION update_player_stats();
