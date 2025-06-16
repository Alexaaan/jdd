"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getMatchByIdAction, updateMatchScoresAction } from "@/lib/actions"
import type { Match } from "@/lib/database"

interface Set {
  id: number
  score1: number
  score2: number
}

interface EditMatchPageProps {
  params: {
    id: string
  }
}

export default function EditMatchPage({ params }: EditMatchPageProps) {
  const router = useRouter()
  const matchId = Number.parseInt(params.id)
  const [match, setMatch] = useState<Match | null>(null)
  const [sets, setSets] = useState<Set[]>([{ id: 1, score1: 0, score2: 0 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatch()
  }, [matchId])

  const loadMatch = async () => {
    try {
      const matchData = await getMatchByIdAction(matchId)
      if (!matchData) {
        router.push("/matches")
        return
      }
      setMatch(matchData)

      // Si le match a déjà des sets, les charger
      if (matchData.sets && matchData.sets.length > 0) {
        setSets(
          matchData.sets.map((set, index) => ({
            id: index + 1,
            score1: set.player1_score,
            score2: set.player2_score,
          })),
        )
      }
    } catch (error) {
      console.error("Erreur lors du chargement du match:", error)
      router.push("/matches")
    } finally {
      setLoading(false)
    }
  }

  const addSet = () => {
    const newSet: Set = {
      id: sets.length + 1,
      score1: 0,
      score2: 0,
    }
    setSets([...sets, newSet])
  }

  const removeSet = (id: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((set) => set.id !== id))
    }
  }

  const updateSet = (id: number, field: "score1" | "score2", value: number) => {
    setSets(sets.map((set) => (set.id === id ? { ...set, [field]: value } : set)))
  }

  const calculateWinner = () => {
    if (!match) return null

    const maxSets = match.format === "best-of-3" ? 2 : 3
    let player1Sets = 0
    let player2Sets = 0

    sets.forEach((set) => {
      if (set.score1 > set.score2) player1Sets++
      else if (set.score2 > set.score1) player2Sets++
    })

    if (player1Sets >= maxSets) return { winner: match.player1?.name, score: `${player1Sets}-${player2Sets}` }
    if (player2Sets >= maxSets) return { winner: match.player2?.name, score: `${player1Sets}-${player2Sets}` }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!match) return

    setIsSubmitting(true)

    try {
      const setsData = sets.map((set, index) => ({
        set_number: index + 1,
        player1_score: set.score1,
        player2_score: set.score2,
      }))

      await updateMatchScoresAction(matchId, setsData)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du match:", error)
      alert("Erreur lors de la mise à jour du match. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Match non trouvé</h3>
            <Link href="/matches">
              <Button>Retour aux matchs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (match.status === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href={`/matches/${match.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Match déjà terminé</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Ce match est déjà terminé</h3>
              <p className="text-muted-foreground mb-6">Vous ne pouvez plus modifier les scores</p>
              <Link href={`/matches/${match.id}`}>
                <Button>Voir les détails du match</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const winner = calculateWinner()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/matches/${match.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Modifier le match</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>
              {match.player1?.name} vs {match.player2?.name}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {new Date(match.match_date).toLocaleDateString("fr-FR")} à {match.match_time}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Scores des sets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Scores des sets</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSet}
                    disabled={sets.length >= (match.format === "best-of-3" ? 3 : 5)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un set
                  </Button>
                </div>

                {sets.map((set, index) => (
                  <div key={set.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="font-medium min-w-[60px]">Set {index + 1}</div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="text-sm font-medium min-w-[100px]">{match.player1?.name}</div>
                      <Input
                        type="number"
                        min="0"
                        max="21"
                        value={set.score1}
                        onChange={(e) => updateSet(set.id, "score1", Number.parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        min="0"
                        max="21"
                        value={set.score2}
                        onChange={(e) => updateSet(set.id, "score2", Number.parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <div className="text-sm font-medium min-w-[100px] text-right">{match.player2?.name}</div>
                    </div>
                    {sets.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSet(set.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Résultat */}
              {winner && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Vainqueur</Badge>
                    <span className="font-semibold">{winner.winner}</span>
                    <span className="text-muted-foreground">({winner.score})</span>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Enregistrement..." : "Enregistrer les scores"}
                </Button>
                <Link href={`/matches/${match.id}`}>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
