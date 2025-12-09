const path = require('path');
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const defaultData = require('./data/app-data.json');
const DataStore = require('./storage/dataStore');
const GoogleAuthService = require('./services/googleAuth');
const buildApiRouter = require('./routes');

async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 5173;

  const dataFile = path.join(__dirname, 'data', 'app-data.json');
  const store = new DataStore(dataFile, defaultData);
  await store.ensureReady();

  const googleAuthService = new GoogleAuthService(store);

  app.use(morgan('dev'));
  app.use(compression());
  // Aceitar payloads grandes (imagens em base64, planilhas etc.)
  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ extended: true, limit: '150mb' }));

  app.use('/public', express.static(path.join(__dirname, '..', 'public')));
  app.use('/api', buildApiRouter(store, googleAuthService));

  const staticRoot = path.join(__dirname, '..', 'src');
  app.use(express.static(staticRoot));

  app.get('/', (req, res) => {
    res.redirect('/app/');
  });

  app.listen(port, () => {
    console.log(`Servidor iniciado em http://127.0.0.1:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});
