import Database from "better-sqlite3"
import { join } from "path"
import type { Player, Match, PlayerStats, Season } from "./database"

// Connexion à la base de données (côté serveur uniquement)
function getDatabase() {
  const dbPath = join(process.cwd(), "king-league.db")
  return new Database(dbPath)
}

// Fonctions pour les saisons
export async function getActiveSeason(): Promise<Season | null> {
  const db = getDatabase()
  try {
    const season = db.prepare("SELECT * FROM seasons WHERE status = 'active' ORDER BY created_at DESC LIMIT 1").get() as
      | Season
      | undefined
    return season || null
  } finally {
    db.close()
  }
}

// Fonctions pour les joueurs
export async function getPlayers(): Promise<Player[]> {
  const db = getDatabase()
  try {
    return db.prepare("SELECT * FROM players ORDER BY name").all() as Player[]
  } finally {
    db.close()
  }
}

export async function createPlayer(name: string, email?: string): Promise<Player> {
  const db = getDatabase()
  try {
    const result = db.prepare("INSERT INTO players (name, email) VALUES (?, ?)").run(name, email)
    const player = db.prepare("SELECT * FROM players WHERE id = ?").get(result.lastInsertRowid) as Player

    // Créer les stats pour la saison active
    const season = await getActiveSeason()
    if (season) {
      db.prepare(`
        INSERT OR IGNORE INTO player_stats (season_id, player_id, matches_played, matches_won, matches_lost, sets_won, sets_lost, points)
        VALUES (?, ?, 0, 0, 0, 0, 0, 0)
      `).run(season.id, player.id)
    }

    return player
  } finally {
    db.close()
  }
}

// Fonctions pour les statistiques
export async function getPlayerStats(seasonId?: number): Promise<PlayerStats[]> {
  const db = getDatabase()
  try {
    let query = `
      SELECT 
        ps.*,
        p.name as player_name,
        p.email as player_email,
        p.avatar_url as player_avatar_url,
        p.created_at as player_created_at
      FROM player_stats ps
      JOIN players p ON ps.player_id = p.id
    `

    if (seasonId) {
      query += ` WHERE ps.season_id = ${seasonId}`
    } else {
      const season = await getActiveSeason()
      if (season) {
        query += ` WHERE ps.season_id = ${season.id}`
      }
    }

    query += ` ORDER BY ps.points DESC, (ps.sets_won - ps.sets_lost) DESC, ps.sets_won DESC`

    const rows = db.prepare(query).all() as any[]

    return rows.map((row) => ({
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
        avatar_url: row.player_avatar_url,
        created_at: row.player_created_at,
      },
    }))
  } finally {
    db.close()
  }
}

// Fonctions pour les matchs
export async function getMatches(limit?: number): Promise<Match[]> {
  const db = getDatabase()
  try {
    let query = `
      SELECT 
        m.*,
        p1.name as player1_name, p1.email as player1_email, p1.avatar_url as player1_avatar_url, p1.created_at as player1_created_at,
        p2.name as player2_name, p2.email as player2_email, p2.avatar_url as player2_avatar_url, p2.created_at as player2_created_at,
        w.name as winner_name, w.email as winner_email, w.avatar_url as winner_avatar_url, w.created_at as winner_created_at
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      ORDER BY m.match_date DESC, m.match_time DESC
    `

    if (limit) {
      query += ` LIMIT ${limit}`
    }

    const matchRows = db.prepare(query).all() as any[]

    // Récupérer les sets pour chaque match
    const matches: Match[] = []
    for (const row of matchRows) {
      const sets = db.prepare("SELECT * FROM sets WHERE match_id = ? ORDER BY set_number").all(row.id) as any[]

      matches.push({
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
          avatar_url: row.player1_avatar_url,
          created_at: row.player1_created_at,
        },
        player2: {
          id: row.player2_id,
          name: row.player2_name,
          email: row.player2_email,
          avatar_url: row.player2_avatar_url,
          created_at: row.player2_created_at,
        },
        winner: row.winner_id
          ? {
              id: row.winner_id,
              name: row.winner_name,
              email: row.winner_email,
              avatar_url: row.winner_avatar_url,
              created_at: row.winner_created_at,
            }
          : undefined,
        sets,
      })
    }

    return matches
  } finally {
    db.close()
  }
}

export async function createMatch(matchData: {
  player1_id: number
  player2_id: number
  match_date: string
  match_time: string
  format: "best-of-3" | "best-of-5"
  sets: { set_number: number; player1_score: number; player2_score: number }[]
}): Promise<Match> {
  const db = getDatabase()
  try {
    const season = await getActiveSeason()
    if (!season) throw new Error("Aucune saison active")

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

    // Transaction
    db.exec("BEGIN TRANSACTION")

    try {
      // Insérer le match
      const matchResult = db
        .prepare(`
        INSERT INTO matches (season_id, player1_id, player2_id, match_date, match_time, format, status, winner_id, phase)
        VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, 'championship')
      `)
        .run(
          season.id,
          matchData.player1_id,
          matchData.player2_id,
          matchData.match_date,
          matchData.match_time,
          matchData.format,
          winner_id,
        )

      const matchId = matchResult.lastInsertRowid as number

      // Insérer les sets
      for (const set of matchData.sets) {
        db.prepare(`
          INSERT INTO sets (match_id, set_number, player1_score, player2_score)
          VALUES (?, ?, ?, ?)
        `).run(matchId, set.set_number, set.player1_score, set.player2_score)
      }

      // Mettre à jour les statistiques
      const updateStats = db.prepare(`
        UPDATE player_stats 
        SET 
          matches_played = matches_played + 1,
          matches_won = matches_won + ?,
          matches_lost = matches_lost + ?,
          sets_won = sets_won + ?,
          sets_lost = sets_lost + ?,
          points = points + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE season_id = ? AND player_id = ?
      `)

      // Stats joueur 1
      const player1Won = winner_id === matchData.player1_id ? 1 : 0
      const player1Lost = winner_id === matchData.player2_id ? 1 : 0
      const player1Points = player1Won * 3
      updateStats.run(player1Won, player1Lost, player1Sets, player2Sets, player1Points, season.id, matchData.player1_id)

      // Stats joueur 2
      const player2Won = winner_id === matchData.player2_id ? 1 : 0
      const player2Lost = winner_id === matchData.player1_id ? 1 : 0
      const player2Points = player2Won * 3
      updateStats.run(player2Won, player2Lost, player2Sets, player1Sets, player2Points, season.id, matchData.player2_id)

      db.exec("COMMIT")

      // Récupérer le match créé
      const matches = await getMatches()
      const newMatch = matches.find((m) => m.id === matchId)
      if (!newMatch) throw new Error("Match non trouvé après création")

      return newMatch
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }
  } finally {
    db.close()
  }
}

// Fonction utilitaire pour initialiser la base
export async function initializeDatabase() {
  const db = getDatabase()
  try {
    // Lire et exécuter le script SQL
    const fs = require("fs")
    const path = require("path")
    const sqlScript = fs.readFileSync(path.join(process.cwd(), "scripts", "create-tables.sql"), "utf8")
    db.exec(sqlScript)
    console.log("✅ Base de données initialisée")
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error)
  } finally {
    db.close()
  }
}
