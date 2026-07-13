const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`MIPRM escuchando en ${env.appBaseUrl} (puerto ${env.port})`);
});
