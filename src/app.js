const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const env = require('./config/env');
const pgPool = require('./lib/pgPool');

const pagesRoutes = require('./routes/pages.routes');
const authRoutes = require('./routes/auth.routes');
const personasRoutes = require('./routes/personas.routes');
const comitesRoutes = require('./routes/comites.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Necesario detras de Traefik/Nginx: sin esto, Express nunca ve la conexion
// como HTTPS (aunque el usuario si entro por HTTPS), y con cookie.secure=true
// eso hace que la cookie de sesion nunca se envie.
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    store: new pgSession({ pool: pgPool, tableName: 'session', createTableIfMissing: true }),
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.use('/', pagesRoutes);
app.use('/auth', authRoutes);
app.use('/personas', personasRoutes);
app.use('/comites', comitesRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
