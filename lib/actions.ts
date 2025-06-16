"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getPlayers, createPlayer, getPlayerStats, getMatches, createMatch } from "./database-server"

// Actions pour les joueurs
export async function getPlayersAction() {
  return await getPlayers()
}

export async function createPlayerAction(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  if (!name?.trim()) {
    throw new Error("Le nom est requis")
  }

  try {
    await createPlayer(name.trim(), email?.trim() || undefined)
    revalidatePath("/players")
    redirect("/players")
  } catch (error) {
    throw new Error("Erreur lors de la création du joueur")
  }
}

// Actions pour les statistiques
export async function getPlayerStatsAction(seasonId?: number) {
  return await getPlayerStats(seasonId)
}

// Actions pour les matchs
export async function getMatchesAction(limit?: number) {
  return await getMatches(limit)
}

export async function createMatchAction(matchData: {
  player1_id: number
  player2_id: number
  match_date: string
  match_time: string
  format: "best-of-3" | "best-of-5"
  sets: { set_number: number; player1_score: number; player2_score: number }[]
}) {
  try {
    await createMatch(matchData)
    revalidatePath("/matches")
    revalidatePath("/")
    redirect("/matches")
  } catch (error) {
    throw new Error("Erreur lors de la création du match")
  }
}
