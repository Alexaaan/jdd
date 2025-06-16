import Database from "better-sqlite3"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Créer/ouvrir la base de données
const db = new Database(join(__dirname, "../king-league.db"))

// Fonction pour exécuter une requête et afficher les résultats
function executeQuery(query, description) {
  console.log(`\n=== ${description} ===`)
  try {
    const results = db.prepare(query).all()
    console.table(results)
  } catch (error) {
    console.error("Erreur:", error.message)
  }
}

// Tests des requêtes
console.log("🏓 Test de la base de données King League")

// Afficher tous les joueurs
executeQuery("SELECT * FROM players ORDER BY name", "Tous les joueurs")

// Afficher le classement
executeQuery(
  `
    SELECT 
        ROW_NUMBER() OVER (ORDER BY points DESC, (sets_won - sets_lost) DESC, sets_won DESC) as position,
        p.name,
        ps.points,
        ps.matches_played,
        ps.matches_won,
        ps.matches_lost,
        ps.sets_won,
        ps.sets_lost,
        (ps.sets_won - ps.sets_lost) as diff
    FROM player_stats ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = 1
    ORDER BY ps.points DESC, (ps.sets_won - ps.sets_lost) DESC, ps.sets_won DESC
`,
  "Classement actuel",
)

// Afficher tous les matchs
executeQuery(
  `
    SELECT 
        m.id,
        p1.name as joueur1,
        p2.name as joueur2,
        m.match_date,
        m.status,
        CASE WHEN m.winner_id = m.player1_id THEN p1.name
             WHEN m.winner_id = m.player2_id THEN p2.name
             ELSE 'Pas de vainqueur' END as vainqueur
    FROM matches m
    JOIN players p1 ON m.player1_id = p1.id
    JOIN players p2 ON m.player2_id = p2.id
    ORDER BY m.match_date DESC
`,
  "Tous les matchs",
)

// Fermer la base de données
db.close()
console.log("\n✅ Test terminé !")
