import Database from "better-sqlite3"
import { join } from "path"
import type { Player, Match, PlayerStats } from "./supabase"

// Chemin vers votre base de données SQLite
const dbPath = join(process.cwd(), "king-league.db")

// Fonction pour créer une connexion à la base
function getDatabase() {
  try {
    const db = new Database(dbPath)
    return db
  } catch (error) {
    console.error("Erreur de connexion à SQLite:", error)
    return null
  }
}

// Fonctions pour récupérer les données depuis SQLite
export async function getPlayersFromSQLite(): Promise<Player[]> {
  const db = getDatabase()
  if (!db) return []

  try {
    const players = db.prepare("SELECT * FROM players ORDER BY name").all() as Player[]
    db.close()
    return players
  } catch (error) {
    console.error("Erreur getPlayersFromSQLite:", error)
    db?.close()
    return []
  }
}

export async function getPlayerStatsFromSQLite(seasonId = 1): Promise<PlayerStats[]> {
  const db = getDatabase()
  if (!db) return []

  try {
    const query = `
      SELECT 
        ps.*,
        p.name as player_name,
        p.email as player_email,
        p.created_at as player_created_at
      FROM player_stats ps
      JOIN players p ON ps.player_id = p.id
      WHERE ps.season_id = ?
      ORDER BY ps.points DESC, (ps.sets_won - ps.sets_lost) DESC, ps.sets_won DESC
    `

    const rows = db.prepare(query).all(seasonId) as any[]

    const playerStats: PlayerStats[] = rows.map((row) => ({
      id: row.id,
      season_id: row.season_id,
      player_id: row.player_id,
      matches_played: row.matches_played,
      matches_won: row.matches_won,
      matches_lost: row.matches_lost,
      sets_won: row.sets_won,
      sets_lost: row.sets_lost,
      points: row.points,
      player: {
        id: row.player_id,
        name: row.player_name,
        email: row.player_email,
        created_at: row.player_created_at,
      },
    }))

    db.close()
    return playerStats
  } catch (error) {
    console.error("Erreur getPlayerStatsFromSQLite:", error)
    db?.close()
    return []
  }
}

export async function getMatchesFromSQLite(limit?: number): Promise<Match[]> {
  const db = getDatabase()
  if (!db) return []

  try {
    let query = `
      SELECT 
        m.*,
        p1.name as player1_name,
        p1.email as player1_email,
        p1.created_at as player1_created_at,
        p2.name as player2_name,
        p2.email as player2_email,
        p2.created_at as player2_created_at,
        w.name as winner_name,
        w.email as winner_email,
        w.created_at as winner_created_at
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      ORDER BY m.match_date DESC
    `

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    const matchRows = db.prepare(query).all() as any[]

    // Récupérer les sets pour chaque match
    const setsQuery = `
      SELECT * FROM sets 
      WHERE match_id = ? 
      ORDER BY set_number
    `
    const setsStmt = db.prepare(setsQuery)

    const matches: Match[] = matchRows.map((row) => {
      const sets = setsStmt.all(row.id) as any[]

      return {
        id: row.id,
        season_id: row.season_id,
        player1_id: row.player1_id,
        player2_id: row.player2_id,
        match_date: row.match_date,
        match_time: row.match_time,
        format: row.format,
        status: row.status,
        winner_id: row.winner_id,
        phase: row.phase,
        created_at: row.created_at,
        player1: {
          id: row.player1_id,
          name: row.player1_name,
          email: row.player1_email,
          created_at: row.player1_created_at,
        },
        player2: {
          id: row.player2_id,
          name: row.player2_name,
          email: row.player2_email,
          created_at: row.player2_created_at,
        },
        winner: row.winner_id
          ? {
              id: row.winner_id,
              name: row.winner_name,
              email: row.winner_email,
              created_at: row.winner_created_at,
            }
          : undefined,
        sets: sets.map((set) => ({
          id: set.id,
          match_id: set.match_id,
          set_number: set.set_number,
          player1_score: set.player1_score,
          player2_score: set.player2_score,
        })),
      }
    })

    db.close()
    return matches
  } catch (error) {
    console.error("Erreur getMatchesFromSQLite:", error)
    db?.close()
    return []
  }
}

export async function createMatchInSQLite(matchData: {
  player1_id: number
  player2_id: number
  match_date: string
  match_time: string
  format: "best-of-3" | "best-of-5"
  sets: { set_number: number; player1_score: number; player2_score: number }[]
}): Promise<Match | null> {
  const db = getDatabase()
  if (!db) return null

  try {
    // Déterminer le gagnant
    const maxSets = matchData.format === "best-of-3" ? 2 : 3
    let player1Sets = 0
    let player2Sets = 0

    matchData.sets.forEach((set) => {
      if (set.player1_score > set.player2_score) player1Sets++
      else if (set.player2_score > set.player1_score) player2Sets++
    })

    const winner_id =
      player1Sets >= maxSets ? matchData.player1_id : player2Sets >= maxSets ? matchData.player2_id : null

    // Commencer une transaction
    db.exec("BEGIN TRANSACTION")

    // Insérer le match
    const insertMatch = db.prepare(`
      INSERT INTO matches (season_id, player1_id, player2_id, match_date, match_time, format, status, winner_id, phase)
      VALUES (1, ?, ?, ?, ?, ?, 'completed', ?, 'championship')
    `)

    const matchResult = insertMatch.run(
      matchData.player1_id,
      matchData.player2_id,
      matchData.match_date,
      matchData.match_time,
      matchData.format,
      winner_id,
    )

    const matchId = matchResult.lastInsertRowid as number

    // Insérer les sets
    const insertSet = db.prepare(`
      INSERT INTO sets (match_id, set_number, player1_score, player2_score)
      VALUES (?, ?, ?, ?)
    `)

    matchData.sets.forEach((set) => {
      insertSet.run(matchId, set.set_number, set.player1_score, set.player2_score)
    })

    // Mettre à jour les statistiques
    const updateStats = db.prepare(`
      UPDATE player_stats 
      SET 
        matches_played = matches_played + 1,
        matches_won = matches_won + ?,
        matches_lost = matches_lost + ?,
        sets_won = sets_won + ?,
        sets_lost = sets_lost + ?,
        points = points + ?
      WHERE season_id = 1 AND player_id = ?
    `)

    // Stats joueur 1
    const player1Won = winner_id === matchData.player1_id ? 1 : 0
    const player1Lost = winner_id === matchData.player2_id ? 1 : 0
    const player1Points = player1Won * 3
    updateStats.run(player1Won, player1Lost, player1Sets, player2Sets, player1Points, matchData.player1_id)

    // Stats joueur 2
    const player2Won = winner_id === matchData.player2_id ? 1 : 0
    const player2Lost = winner_id === matchData.player1_id ? 1 : 0
    const player2Points = player2Won * 3
    updateStats.run(player2Won, player2Lost, player2Sets, player1Sets, player2Points, matchData.player2_id)

    // Valider la transaction
    db.exec("COMMIT")

    // Récupérer le match créé
    const createdMatch = await getMatchesFromSQLite()
    const newMatch = createdMatch.find((m) => m.id === matchId)

    db.close()
    return newMatch || null
  } catch (error) {
    console.error("Erreur createMatchInSQLite:", error)
    db?.exec("ROLLBACK")
    db?.close()
    return null
  }
}
