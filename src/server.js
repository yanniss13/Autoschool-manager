// Point d'entree : charge la configuration puis demarre le serveur HTTP.
// quiet: true evite la baniere d'information de dotenv au demarrage.
require('dotenv').config({ quiet: true });

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AutoSchool Manager demarre sur http://localhost:${PORT}`);
});
