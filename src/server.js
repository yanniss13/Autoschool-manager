// Point d'entree : charge la configuration puis demarre le serveur HTTP.
// quiet: true evite la baniere d'information de dotenv au demarrage.
require('dotenv').config({ quiet: true });

// Fail-fast : certaines variables DOIVENT etre definies. Plutot que de demarrer
// en silence avec une valeur de repli dangereuse (ex. un secret de session connu,
// qui rendrait les cookies de session forgeables), on s'arrete tout de suite avec
// un message clair. A faire AVANT de charger app.js, qui lit ces variables au require.
const REQUIS = ['SESSION_SECRET'];
const manquants = REQUIS.filter((cle) => !process.env[cle]);
if (manquants.length > 0) {
  console.error(`Variables d'environnement manquantes : ${manquants.join(', ')}`);
  console.error('Copiez .env.example en .env et renseignez-les, puis relancez. Arret.');
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AutoSchool Manager demarre sur http://localhost:${PORT}`);
});
