import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Plus, Mail } from "lucide-react"
import Link from "next/link"
import { getPlayers } from "@/lib/database-server"

export default async function PlayersPage() {
  const players = await getPlayers()

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
                <Users className="h-6 w-6 text-blue-500" />
                <h1 className="text-xl font-bold">Gestion des joueurs</h1>
              </div>
            </div>
            <Link href="/players/add">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un joueur
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des joueurs ({players.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun joueur inscrit</h3>
                <p className="text-muted-foreground mb-6">
                  Commencez par ajouter des joueurs pour organiser des matchs
                </p>
                <Link href="/players/add">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter le premier joueur
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {players.map((player, index) => (
                  <Card key={player.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{player.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            Joueur #{index + 1}
                          </Badge>
                        </div>
                      </div>
                      {player.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {player.email}
                        </div>
                      )}
                      <div className="mt-4 text-xs text-muted-foreground">
                        Inscrit le {new Date(player.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
