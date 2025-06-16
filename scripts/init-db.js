// Mettre à jour le script pour utiliser le bon fichier
const { initializeDatabase } = require("../lib/database-server")

async function init() {
  console.log("🚀 Initialisation de la base de données King League...")
  try {
    await initializeDatabase()
    console.log("✅ Base de données initialisée avec succès!")
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error)
    process.exit(1)
  }
}

init()
