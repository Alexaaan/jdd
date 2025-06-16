import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"
// Remplacer l'import par les actions
import { getPlayerStatsAction, getMatchesAction } from "@/lib/actions"

async function RankingTable() {
  const playerStats = await getPlayerStatsAction()

  if (playerStats.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun joueur inscrit</h3>
        <p className="text-muted-foreground mb-4">Commencez par ajouter des joueurs pour voir le classement</p>
        <Link href="/players/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un joueur
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Position</th>
            <th className="text-left p-3 font-semibold">Joueur</th>
            <th className="text-center p-3 font-semibold">Points</th>
            <th className="text-center p-3 font-semibold">MJ</th>
            <th className="text-center p-3 font-semibold">V</th>
            <th className="text-center p-3 font-semibold">D</th>
            <th className="text-center p-3 font-semibold">Sets +/-</th>
          </tr>
        </thead>
        <tbody>
          {playerStats.map((stat, index) => (
            <tr key={stat.id} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{index + 1}</span>
                  {index < 4 && (
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                      {index === 0 ? "👑" : "Q"}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="p-3">
                <div className="font-medium text-lg">{stat.player?.name}</div>
              </td>
              <td className="p-3 text-center">
                <span className="font-bold text-xl text-primary">{stat.points}</span>
              </td>
              <td className="p-3 text-center text-muted-foreground">{stat.matches_played}</td>
              <td className="p-3 text-center">
                <span className="text-green-600 font-medium">{stat.matches_won}</span>
              </td>
              <td className="p-3 text-center">
                <span className="text-red-600 font-medium">{stat.matches_lost}</span>
              </td>
              <td className="p-3 text-center">
                <span
                  className={`font-medium ${stat.sets_won - stat.sets_lost >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.sets_won - stat.sets_lost > 0 ? "+" : ""}
                  {stat.sets_won - stat.sets_lost}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

async function RecentMatches() {
  const matches = await getMatchesAction(5)

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Aucun match joué</p>
        <Link href="/matches/add" className="inline-block mt-3">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un match
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div
          key={match.id}
          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium">
              {match.player1?.name} vs {match.player2?.name}
            </div>
            {match.status === "completed" && match.sets && match.sets.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {match.sets.filter((s) => s.player1_score > s.player2_score).length}-
                {match.sets.filter((s) => s.player2_score > s.player1_score).length}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{new Date(match.match_date).toLocaleDateString("fr-FR")}</div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  King League
                </h1>
                <p className="text-muted-foreground">Championnat de Ping-Pong</p>
              </div>
            </div>
            <nav className="flex items-center gap-3">
              <Link href="/matches">
                <Button variant="ghost" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Matchs
                </Button>
              </Link>
              <Link href="/players">
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Joueurs
                </Button>
              </Link>
              <Link href="/matches/add">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau match
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Classement principal */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                  Classement - Phase de Championnat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  }
                >
                  <RankingTable />
                </Suspense>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>🏆 Qualification :</strong> Les 4 premiers joueurs accèdent aux playoffs
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Users className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                  <Suspense fallback={<div className="text-2xl font-bold">-</div>}>
                    <StatsCard type="players" />
                  </Suspense>
                  <div className="text-sm text-muted-foreground">Joueurs</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-green-500" />
                  <Suspense fallback={<div className="text-2xl font-bold">-</div>}>
                    <StatsCard type="matches" />
                  </Suspense>
                  <div className="text-sm text-muted-foreground">Matchs</div>
                </CardContent>
              </Card>
            </div>

            {/* Matchs récents */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Matchs récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    </div>
                  }
                >
                  <RecentMatches />
                </Suspense>
                <Link href="/matches" className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    Voir tous les matchs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/players/add">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un joueur
                  </Button>
                </Link>
                <Link href="/matches/add">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Programmer un match
                  </Button>
                </Link>
                <Link href="/playoffs">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Trophy className="h-4 w-4 mr-2" />
                    Voir les playoffs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

async function StatsCard({ type }: { type: "players" | "matches" }) {
  if (type === "players") {
    const stats = await getPlayerStatsAction()
    return <div className="text-2xl font-bold text-blue-600">{stats.length}</div>
  } else {
    const matches = await getMatchesAction()
    return <div className="text-2xl font-bold text-green-600">{matches.length}</div>
  }
}
