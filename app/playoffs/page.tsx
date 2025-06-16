import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Crown, Medal } from "lucide-react"
import Link from "next/link"
import { getPlayerStats } from "@/lib/database-server"

export default async function PlayoffsPage() {
  const playerStats = await getPlayerStats()
  const qualifiedPlayers = playerStats.slice(0, 4) // Top 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h1 className="text-xl font-bold">Phase finale - Playoffs</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {qualifiedPlayers.length < 4 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Playoffs pas encore disponibles</h3>
              <p className="text-muted-foreground mb-6">
                Il faut au moins 4 joueurs avec des matchs joués pour organiser les playoffs
              </p>
              <Link href="/matches/add">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600">Programmer des matchs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Bracket principal */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle>Tableau des playoffs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Demi-finales */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Medal className="h-5 w-5 text-bronze" />
                        Demi-finales
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Demi-finale 1</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-center flex-1">
                                <div className="font-semibold text-lg">
                                  {qualifiedPlayers[0]?.player?.name || "TBD"}
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  1er
                                </Badge>
                              </div>
                              <div className="px-4 text-muted-foreground font-medium">VS</div>
                              <div className="text-center flex-1">
                                <div className="font-semibold text-lg">
                                  {qualifiedPlayers[3]?.player?.name || "TBD"}
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  4e
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-4 text-center">
                              <Badge variant="secondary">À programmer</Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Demi-finale 2</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-center flex-1">
                                <div className="font-semibold text-lg">
                                  {qualifiedPlayers[1]?.player?.name || "TBD"}
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  2e
                                </Badge>
                              </div>
                              <div className="px-4 text-muted-foreground font-medium">VS</div>
                              <div className="text-center flex-1">
                                <div className="font-semibold text-lg">
                                  {qualifiedPlayers[2]?.player?.name || "TBD"}
                                </div>
                                <Badge variant="outline" className="mt-1">
                                  3e
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-4 text-center">
                              <Badge variant="secondary">À programmer</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Flèche vers la finale */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <div className="w-px h-8 bg-border mx-auto"></div>
                        <div className="text-sm text-muted-foreground">↓</div>
                        <div className="w-px h-8 bg-border mx-auto"></div>
                      </div>
                    </div>

                    {/* Finale */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Finale
                      </h3>
                      <div className="max-w-md mx-auto">
                        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-center flex items-center justify-center gap-2">
                              <Trophy className="h-5 w-5 text-yellow-500" />
                              Grande Finale
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center space-y-4">
                              <div className="text-muted-foreground">En attente des résultats des demi-finales</div>
                              <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
                                    <span className="text-2xl">?</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">Gagnant DF1</div>
                                </div>
                                <div className="text-muted-foreground font-medium">VS</div>
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
                                    <span className="text-2xl">?</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">Gagnant DF2</div>
                                </div>
                              </div>
                              <Badge variant="secondary">En attente</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Joueurs qualifiés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {qualifiedPlayers.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index + 1}
                            {index === 0 ? "er" : "e"}
                          </Badge>
                          <span className="font-medium">{player.player?.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{player.points} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Format des playoffs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <strong>Demi-finales :</strong>
                    <ul className="mt-1 ml-4 space-y-1 text-muted-foreground">
                      <li>• 1er vs 4e</li>
                      <li>• 2e vs 3e</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <strong>Format :</strong>
                    <p className="text-muted-foreground">Best of 5 (3 sets gagnants)</p>
                  </div>
                  <div className="text-sm">
                    <strong>Finale :</strong>
                    <p className="text-muted-foreground">Les 2 gagnants des demi-finales</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
