"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  getPlayers,
  createPlayer,
  getPlayerStats,
  getMatches,
  createMatch,
  updateMatchScores,
} from "./database-server"

// Actions pour les joueurs
export async function getPlayersAction() {
  try {
    return await getPlayers()
  } catch (error) {
    console.error("Erreur getPlayersAction:", error)
    return []
  }
}

export async function createPlayerAction(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  if (!name?.trim()) {
    throw new Error("Le nom est requis")
  }

  console.log("Tentative de création du joueur:", name)

  try {
    await createPlayer(name.trim(), email?.trim() || undefined)
    console.log("Joueur créé avec succès")
  } catch (error) {
    console.error("Erreur détaillée lors de la création du joueur:", error)
    throw new Error(
      `Erreur lors de la création du joueur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    )
  }

  revalidatePath("/players")
  revalidatePath("/")
  redirect("/players")
}

// Actions pour les statistiques
export async function getPlayerStatsAction(seasonId?: number) {
  try {
    return await getPlayerStats(seasonId)
  } catch (error) {
    console.error("Erreur getPlayerStatsAction:", error)
    return []
  }
}

// Actions pour les matchs
export async function getMatchesAction(limit?: number) {
  try {
    return await getMatches(limit)
  } catch (error) {
    console.error("Erreur getMatchesAction:", error)
    return []
  }
}

export async function getMatchByIdAction(id: number) {
  try {
    const matches = await getMatches()
    return matches.find((m) => m.id === id) || null
  } catch (error) {
    console.error("Erreur getMatchByIdAction:", error)
    return null
  }
}

export async function createMatchAction(matchData: {
  player1_id: number
  player2_id: number
  match_date: string
  match_time: string
  format: "best-of-3" | "best-of-5"
  sets: { set_number: number; player1_score: number; player2_score: number }[]
}) {
  console.log("Tentative de création du match:", matchData)

  try {
    await createMatch(matchData)
    console.log("Match créé avec succès")
  } catch (error) {
    console.error("Erreur détaillée lors de la création du match:", error)
    throw new Error(
      `Erreur lors de la création du match: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    )
  }

  revalidatePath("/matches")
  revalidatePath("/")
  redirect("/matches")
}

export async function updateMatchScoresAction(
  matchId: number,
  sets: { set_number: number; player1_score: number; player2_score: number }[]
) {
  console.log("Tentative de mise à jour du match:", matchId, sets)

  try {
    await updateMatchScores(matchId, sets)
    console.log("Match mis à jour avec succès")
  } catch (error) {
    console.error("Erreur détaillée lors de la mise à jour du match:", error)
    throw new Error(
      `Erreur lors de la mise à jour du match: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    )
  }

  revalidatePath("/matches")
  revalidatePath(`/matches/${matchId}`)
  revalidatePath("/")
  redirect("/matches")
}
