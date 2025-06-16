// Supprimer tous les imports de better-sqlite3 et remplacer par des Server Actions
// Ce fichier ne contiendra que les types et les fonctions utilitaires

export interface Player {
  id: number
  name: string
  email?: string
  avatar_url?: string
  created_at: string
}

export interface Match {
  id: number
  season_id: number
  player1_id: number
  player2_id: number
  match_date: string
  match_time: string
  format: "best-of-3" | "best-of-5"
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  winner_id?: number
  phase: "championship" | "semifinal" | "final"
  created_at: string
  player1?: Player
  player2?: Player
  winner?: Player
  sets?: Set[]
}

export interface Set {
  id: number
  match_id: number
  set_number: number
  player1_score: number
  player2_score: number
  created_at: string
}

export interface PlayerStats {
  id: number
  season_id: number
  player_id: number
  matches_played: number
  matches_won: number
  matches_lost: number
  sets_won: number
  sets_lost: number
  points: number
  player?: Player
}

export interface Season {
  id: number
  name: string
  start_date: string
  end_date?: string
  status: "active" | "completed" | "paused"
  created_at: string
}
