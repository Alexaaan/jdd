"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getPlayersAction, createMatchAction } from "@/lib/actions"
import type { Player } from "@/lib/database"

interface Set {
  id: number
  score1: number
  score2: number
}

export default function AddMatchPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [matchDate, setMatchDate] = useState("")
  const [matchTime, setMatchTime] = useState("")
  const [format, setFormat] = useState<"best-of-3" | "best-of-5">("best-of-3")
  const [sets, setSets] = useState<Set[]>([{ id: 1, score1: 0, score2: 0 }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const playersData = await getPlayersAction()
      setPlayers(playersData)
    } catch (error) {
      console.error("Erreur lors du chargement des joueurs:", error)
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
    const maxSets = format === "best-of-3" ? 2 : 3
    let player1Sets = 0
    let player2Sets = 0

    sets.forEach((set) => {
      if (set.score1 > set.score2) player1Sets++
      else if (set.score2 > set.score1) player2Sets++
    })

    if (player1Sets >= maxSets) return { winner: player1, score: `${player1Sets}-${player2Sets}` }
    if (player2Sets >= maxSets) return { winner: player2, score: `${player1Sets}-${player2Sets}` }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const player1Data = players.find((p) => p.name === player1)
      const player2Data = players.find((p) => p.name === player2)

      if (!player1Data || !player2Data) {
        throw new Error("Joueurs non trouvés")
      }

      const matchData = {
        player1_id: player1Data.id,
        player2_id: player2Data.id,
        match_date: matchDate,
        match_time: matchTime,
        format,
        sets: sets.map((set, index) => ({
          set_number: index + 1,
          player1_score: set.score1,
          player2_score: set.score2,
        })),
      }

      await createMatchAction(matchData)
    } catch (error) {
      console.error("Erreur lors de l'ajout du match:", error)
      alert("Erreur lors de l'ajout du match. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const winner = calculateWinner()
  const availablePlayers2 = players.filter((p) => p.name !== player1)

  if (players.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/matches">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Ajouter un match</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Pas assez de joueurs</h3>
              <p className="text-muted-foreground mb-6">
                Vous devez avoir au moins 2 joueurs inscrits pour créer un match
              </p>
              <Link href="/players/add">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des joueurs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/matches">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Ajouter un match</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>Nouveau match</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection des joueurs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player1">Joueur 1</Label>
                  <Select value={player1} onValueChange={setPlayer1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un joueur" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.name}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player2">Joueur 2</Label>
                  <Select value={player2} onValueChange={setPlayer2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un joueur" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlayers2.map((player) => (
                        <SelectItem key={player.id} value={player.name}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Heure</Label>
                  <Input
                    id="time"
                    type="time"
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Format du match */}
              <div className="space-y-2">
                <Label>Format du match</Label>
                <Select value={format} onValueChange={(value: "best-of-3" | "best-of-5") => setFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-of-3">Best of 3 (2 sets gagnants)</SelectItem>
                    <SelectItem value="best-of-5">Best of 5 (3 sets gagnants)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scores des sets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Scores des sets</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSet}
                    disabled={sets.length >= (format === "best-of-3" ? 3 : 5)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un set
                  </Button>
                </div>

                {sets.map((set, index) => (
                  <div key={set.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="font-medium min-w-[60px]">Set {index + 1}</div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="text-sm font-medium min-w-[80px]">{player1 || "Joueur 1"}</div>
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
                      <div className="text-sm font-medium min-w-[80px] text-right">{player2 || "Joueur 2"}</div>
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
                  disabled={!player1 || !player2 || !matchDate || !matchTime || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le match"}
                </Button>
                <Link href="/matches">
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
