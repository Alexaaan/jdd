import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, Trophy, Plus } from "lucide-react"
import Link from "next/link"
import { getMatches } from "@/lib/database-server"

function MatchCard({ match }: { match: any }) {
  const isCompleted = match.status === "completed"

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date(match.match_date).toLocaleDateString("fr-FR")}
            </span>
            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
            <span className="text-sm text-muted-foreground">{match.match_time}</span>
          </div>
          <Badge variant={isCompleted ? "default" : "secondary"}>{isCompleted ? "Terminé" : "Programmé"}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="font-semibold text-lg">{match.player1?.name}</div>
              {isCompleted && match.sets && (
                <div className="text-2xl font-bold text-primary mt-1">
                  {match.sets.filter((s: any) => s.player1_score > s.player2_score).length}
                </div>
              )}
            </div>

            <div className="text-muted-foreground font-medium text-lg">VS</div>

            <div className="text-center">
              <div className="font-semibold text-lg">{match.player2?.name}</div>
              {isCompleted && match.sets && (
                <div className="text-2xl font-bold text-primary mt-1">
                  {match.sets.filter((s: any) => s.player2_score > s.player1_score).length}
                </div>
              )}
            </div>
          </div>

          {isCompleted && match.sets && match.sets.length > 0 && (
            <div className="text-right">
              <div className="space-y-1">
                {match.sets.map((set: any, index: number) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    Set {set.set_number}: {set.player1_score}-{set.player2_score}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function MatchesPage() {
  const allMatches = await getMatches()
  const completedMatches = allMatches.filter((m) => m.status === "completed")
  const scheduledMatches = allMatches.filter((m) => m.status === "scheduled")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h1 className="text-xl font-bold">Tous les matchs</h1>
              </div>
            </div>
            <Link href="/matches/add">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau match
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {allMatches.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun match programmé</h3>
              <p className="text-muted-foreground mb-6">Commencez par programmer votre premier match</p>
              <Link href="/matches/add">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Programmer un match
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Matchs programmés */}
            <div>
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Matchs à venir ({scheduledMatches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scheduledMatches.length > 0 ? (
                    scheduledMatches.map((match) => <MatchCard key={match.id} match={match} />)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucun match programmé</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Matchs terminés */}
            <div>
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-500" />
                    Matchs terminés ({completedMatches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completedMatches.length > 0 ? (
                    completedMatches.map((match) => <MatchCard key={match.id} match={match} />)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Aucun match terminé</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
