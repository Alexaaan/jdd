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
  initializeDatabase,
} from "./database-server"

// Initialiser la base de données au démarrage
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase()
      dbInitialized = true
      console.log("✅ Base de données initialisée")
    } catch (error) {
      console.error("❌ Erreur initialisation DB:", error)
    }
  }
}

// Actions pour les joueurs
export async function getPlayersAction() {
  try {
    await ensureDbInitialized()
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

  await ensureDbInitialized()

  try {
    console.log("Tentative de création du joueur:", name)
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
    await ensureDbInitialized()
    return await getPlayerStats(seasonId)
  } catch (error) {
    console.error("Erreur getPlayerStatsAction:", error)
    return []
  }
}

// Actions pour les matchs
export async function getMatchesAction(limit?: number) {
  try {
    await ensureDbInitialized()
    return await getMatches(limit)
  } catch (error) {
    console.error("Erreur getMatchesAction:", error)
    return []
  }
}

export async function getMatchByIdAction(id: number) {
  try {
    await ensureDbInitialized()
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
  await ensureDbInitialized()

  try {
    console.log("Tentative de création du match:", matchData)
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
  await ensureDbInitialized()

  try {
    console.log("Tentative de mise à jour du match:", matchId, sets)
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

// Action pour initialiser manuellement la DB
export async function initializeDatabaseAction() {
  try {
    await initializeDatabase()
    revalidatePath("/")
    return { success: true, message: "Base de données initialisée avec succès" }
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error)
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
    }
  }
}
