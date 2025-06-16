import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, Trophy, Edit, Users } from "lucide-react"
import Link from "next/link"
import { getMatchByIdAction } from "@/lib/actions"
import { notFound } from "next/navigation"

interface MatchPageProps {
  params: {
    id: string
  }
}

export default async function MatchPage({ params }: MatchPageProps) {
  const matchId = Number.parseInt(params.id)
  const match = await getMatchByIdAction(matchId)

  if (!match) {
    notFound()
  }

  const isCompleted = match.status === "completed"
  const isScheduled = match.status === "scheduled"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/matches">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux matchs
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h1 className="text-xl font-bold">Détails du match</h1>
              </div>
            </div>
            {isScheduled && (
              <Link href={`/matches/${match.id}/edit`}>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le match
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {match.player1?.name} vs {match.player2?.name}
                  </CardTitle>
                  <Badge variant={isCompleted ? "default" : "secondary"} className="text-sm">
                    {isCompleted ? "Terminé" : "Programmé"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informations du match */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(match.match_date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{match.match_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{match.format === "best-of-3" ? "Best of 3" : "Best of 5"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Phase de {match.phase}</span>
                  </div>
                </div>

                {/* Score principal */}
                <div className="flex items-center justify-center gap-8 py-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3">
                      {match.player1?.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{match.player1?.name}</h3>
                    {isCompleted && match.sets && (
                      <div className="text-4xl font-bold text-primary">
                        {match.sets.filter((s) => s.player1_score > s.player2_score).length}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground mb-4">VS</div>
                    {match.winner_id && (
                      <Badge variant="default" className="text-sm">
                        Vainqueur: {match.winner?.name}
                      </Badge>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3">
                      {match.player2?.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{match.player2?.name}</h3>
                    {isCompleted && match.sets && (
                      <div className="text-4xl font-bold text-primary">
                        {match.sets.filter((s) => s.player2_score > s.player1_score).length}
                      </div>
                    )}
                  </div>
                </div>

                {/* Détail des sets */}
                {isCompleted && match.sets && match.sets.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-4">Détail des sets</h4>
                    <div className="space-y-3">
                      {match.sets.map((set, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium">Set {set.set_number}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold">{set.player1_score}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-lg font-bold">{set.player2_score}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {set.player1_score > set.player2_score ? match.player1?.name : match.player2?.name}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isScheduled && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Ce match n'a pas encore été joué</p>
                    <Link href={`/matches/${match.id}/edit`}>
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                        <Edit className="h-4 w-4 mr-2" />
                        Ajouter les scores
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isScheduled && (
                  <Link href={`/matches/${match.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier le match
                    </Button>
                  </Link>
                )}
                <Link href="/matches">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux matchs
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Trophy className="h-4 w-4 mr-2" />
                    Voir le classement
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <strong>Format:</strong>
                  <p className="text-muted-foreground">
                    {match.format === "best-of-3" ? "Best of 3 (2 sets gagnants)" : "Best of 5 (3 sets gagnants)"}
                  </p>
                </div>
                <div className="text-sm">
                  <strong>Phase:</strong>
                  <p className="text-muted-foreground capitalize">{match.phase}</p>
                </div>
                <div className="text-sm">
                  <strong>Créé le:</strong>
                  <p className="text-muted-foreground">{new Date(match.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
