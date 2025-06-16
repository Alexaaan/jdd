import { createClient } from "@supabase/supabase-js"

// Vérifier si les variables d'environnement sont configurées
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Vérifier si Supabase est correctement configuré
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    supabaseUrl.includes(".supabase.co") &&
    supabaseAnonKey.length > 50,
)

// Créer le client Supabase seulement si configuré
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null

// Types pour TypeScript
export interface Player {
  id: number
  name: string
  email?: string
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
  status: "scheduled" | "completed" | "cancelled"
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
