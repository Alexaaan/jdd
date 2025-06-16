import Database from "better-sqlite3"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"
import type { Player, Match, PlayerStats, Season } from "./database"

// Connexion à la base de données (côté serveur uniquement)
function getDatabase() {
  try {
    const dbPath = join(process.cwd(), "king-league.db")
    console.log("Chemin de la base de données:", dbPath)

    // Créer le répertoire si nécessaire
    const dbDir = join(process.cwd())
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    const db = new Database(dbPath)

    // Vérifier si les tables existent, sinon les créer
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    console.log("Tables existantes:", tables)

    if (tables.length === 0) {
      console.log("Aucune table trouvée, initialisation de la base...")
      initializeDatabaseSync(db)
    }

    return db
  } catch (error) {
    console.error("Erreur lors de la connexion à la base de données:", error)
    throw error
  }
}

// Initialisation synchrone de la base
function initializeDatabaseSync(db: Database.Database) {
  try {
    // Créer les tables
    db.exec(`
      -- Table des saisons
      CREATE TABLE IF NOT EXISTS seasons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Table des joueurs
      CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          email TEXT UNIQUE,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Table des matchs
      CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          season_id INTEGER NOT NULL,
          player1_id INTEGER NOT NULL,
          player2_id INTEGER NOT NULL,
          match_date DATE NOT NULL,
          match_time TIME NOT NULL,
          format TEXT NOT NULL CHECK (format IN ('best-of-3', 'best-of-5')),
          status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
          winner_id INTEGER,
          phase TEXT DEFAULT 'championship' CHECK (phase IN ('championship', 'semifinal', 'final')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (season_id) REFERENCES seasons(id),
          FOREIGN KEY (player1_id) REFERENCES players(id),
          FOREIGN KEY (player2_id) REFERENCES players(id),
          FOREIGN KEY (winner_id) REFERENCES players(id)
      );

      -- Table des sets
      CREATE TABLE IF NOT EXISTS sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          match_id INTEGER NOT NULL,
          set_number INTEGER NOT NULL,
          player1_score INTEGER NOT NULL DEFAULT 0,
          player2_score INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      );

      -- Table des statistiques des joueurs par saison
      CREATE TABLE IF NOT EXISTS player_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          season_id INTEGER NOT NULL,
          player_id INTEGER NOT NULL,
          matches_played INTEGER DEFAULT 0,
          matches_won INTEGER DEFAULT 0,
          matches_lost INTEGER DEFAULT 0,
          sets_won INTEGER DEFAULT 0,
          sets_lost INTEGER DEFAULT 0,
          points INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (season_id) REFERENCES seasons(id),
          FOREIGN KEY (player_id) REFERENCES players(id),
          UNIQUE(season_id, player_id)
      );

      -- Insertion de la saison par défaut
      INSERT OR IGNORE INTO seasons (name, start_date, status) 
      VALUES ('King League Saison 1', date('now'), 'active');
    `)

    console.log("Base de données initialisée avec succès")
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base:", error)
    throw error
  }
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
    console.log("Création du joueur dans la base:", name, email)

    // Vérifier si le joueur existe déjà
    const existingPlayer = db.prepare("SELECT * FROM players WHERE name = ?").get(name)
    if (existingPlayer) {
      throw new Error("Un joueur avec ce nom existe déjà")
    }

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

    console.log("Joueur créé avec succès:", player)
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
    console.log("Création du match dans la base:", matchData)

    const season = await getActiveSeason()
    if (!season) {
      // Créer une saison par défaut si aucune n'existe
      db.prepare("INSERT INTO seasons (name, start_date, status) VALUES (?, date('now'), 'active')").run(
        "King League Saison 1",
      )
      const newSeason = await getActiveSeason()
      if (!newSeason) throw new Error("Impossible de créer une saison")
    }

    const activeSeason = await getActiveSeason()
    if (!activeSeason) throw new Error("Aucune saison active")

    // Déterminer le statut et le gagnant
    let status = "scheduled"
    let winner_id = null

    // Si des scores sont fournis, le match est terminé
    if (matchData.sets.some((set) => set.player1_score > 0 || set.player2_score > 0)) {
      status = "completed"

      const maxSets = matchData.format === "best-of-3" ? 2 : 3
      let player1Sets = 0
      let player2Sets = 0

      matchData.sets.forEach((set) => {
        if (set.player1_score > set.player2_score) player1Sets++
        else if (set.player2_score > set.player1_score) player2Sets++
      })

      winner_id = player1Sets >= maxSets ? matchData.player1_id : player2Sets >= maxSets ? matchData.player2_id : null
    }

    // Transaction
    db.exec("BEGIN TRANSACTION")

    try {
      // Insérer le match
      const matchResult = db
        .prepare(`
        INSERT INTO matches (season_id, player1_id, player2_id, match_date, match_time, format, status, winner_id, phase)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'championship')
      `)
        .run(
          activeSeason.id,
          matchData.player1_id,
          matchData.player2_id,
          matchData.match_date,
          matchData.match_time,
          matchData.format,
          status,
          winner_id,
        )

      const matchId = matchResult.lastInsertRowid as number

      // Insérer les sets si fournis
      if (matchData.sets.length > 0) {
        for (const set of matchData.sets) {
          db.prepare(`
            INSERT INTO sets (match_id, set_number, player1_score, player2_score)
            VALUES (?, ?, ?, ?)
          `).run(matchId, set.set_number, set.player1_score, set.player2_score)
        }
      }

      // Mettre à jour les statistiques si le match est terminé
      if (status === "completed" && winner_id) {
        await updatePlayerStatsAfterMatch(db, activeSeason.id, matchData, winner_id)
      }

      db.exec("COMMIT")

      // Récupérer le match créé
      const matches = await getMatches()
      const newMatch = matches.find((m) => m.id === matchId)
      if (!newMatch) throw new Error("Match non trouvé après création")

      console.log("Match créé avec succès:", newMatch)
      return newMatch
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }
  } finally {
    db.close()
  }
}

export async function updateMatchScores(
  matchId: number,
  sets: { set_number: number; player1_score: number; player2_score: number }[],
): Promise<void> {
  const db = getDatabase()
  try {
    console.log("Mise à jour des scores du match:", matchId, sets)

    // Récupérer le match
    const match = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId) as any
    if (!match) throw new Error("Match non trouvé")

    if (match.status === "completed") {
      throw new Error("Ce match est déjà terminé")
    }

    // Déterminer le gagnant
    const maxSets = match.format === "best-of-3" ? 2 : 3
    let player1Sets = 0
    let player2Sets = 0

    sets.forEach((set) => {
      if (set.player1_score > set.player2_score) player1Sets++
      else if (set.player2_score > set.player1_score) player2Sets++
    })

    const winner_id = player1Sets >= maxSets ? match.player1_id : player2Sets >= maxSets ? match.player2_id : null

    // Transaction
    db.exec("BEGIN TRANSACTION")

    try {
      // Supprimer les anciens sets
      db.prepare("DELETE FROM sets WHERE match_id = ?").run(matchId)

      // Insérer les nouveaux sets
      for (const set of sets) {
        db.prepare(`
          INSERT INTO sets (match_id, set_number, player1_score, player2_score)
          VALUES (?, ?, ?, ?)
        `).run(matchId, set.set_number, set.player1_score, set.player2_score)
      }

      // Mettre à jour le match
      db.prepare(`
        UPDATE matches 
        SET status = 'completed', winner_id = ?
        WHERE id = ?
      `).run(winner_id, matchId)

      // Mettre à jour les statistiques
      if (winner_id) {
        const season = await getActiveSeason()
        if (season) {
          const matchData = {
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            sets: sets,
          }
          await updatePlayerStatsAfterMatch(db, season.id, matchData, winner_id)
        }
      }

      db.exec("COMMIT")
      console.log("Match mis à jour avec succès")
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }
  } finally {
    db.close()
  }
}

async function updatePlayerStatsAfterMatch(db: Database.Database, seasonId: number, matchData: any, winnerId: number) {
  // Calculer les sets gagnés par chaque joueur
  let player1Sets = 0
  let player2Sets = 0

  matchData.sets.forEach((set: any) => {
    if (set.player1_score > set.player2_score) player1Sets++
    else if (set.player2_score > set.player1_score) player2Sets++
  })

  // Créer les stats si elles n'existent pas
  db.prepare(`
    INSERT OR IGNORE INTO player_stats (season_id, player_id, matches_played, matches_won, matches_lost, sets_won, sets_lost, points)
    VALUES (?, ?, 0, 0, 0, 0, 0, 0)
  `).run(seasonId, matchData.player1_id)

  db.prepare(`
    INSERT OR IGNORE INTO player_stats (season_id, player_id, matches_played, matches_won, matches_lost, sets_won, sets_lost, points)
    VALUES (?, ?, 0, 0, 0, 0, 0, 0)
  `).run(seasonId, matchData.player2_id)

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
  const player1Won = winnerId === matchData.player1_id ? 1 : 0
  const player1Lost = winnerId === matchData.player2_id ? 1 : 0
  const player1Points = player1Won * 3
  updateStats.run(player1Won, player1Lost, player1Sets, player2Sets, player1Points, seasonId, matchData.player1_id)

  // Stats joueur 2
  const player2Won = winnerId === matchData.player2_id ? 1 : 0
  const player2Lost = winnerId === matchData.player1_id ? 1 : 0
  const player2Points = player2Won * 3
  updateStats.run(player2Won, player2Lost, player2Sets, player1Sets, player2Points, seasonId, matchData.player2_id)
}

// Fonction utilitaire pour initialiser la base
export async function initializeDatabase() {
  const db = getDatabase()
  try {
    initializeDatabaseSync(db)
    console.log("✅ Base de données initialisée")
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error)
    throw error
  } finally {
    db.close()
  }
}
