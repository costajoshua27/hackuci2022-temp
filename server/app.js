const { createServer } = require('http');
const express = require('express');
const cors = require('cors');

const { Server } = require('socket.io');
const language = require('@google-cloud/language');

// SETUP GOOGLE CLOUD NATURAL LANGUAGE API CLIENT
const client = new language.LanguageServiceClient();

// SETUP THE EXPRESS APP
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// CREATE THE SERVER
const server = createServer(app);

// ATTACH THE SOCKET SERVER
const io = new Server(server, {
  path: '/ws-api',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// DEFINE ROUTES
app.get('/', (req, res) => {
  return res.status(200).send('yuh');
});

// DEFINE SOCKET EVENT LISTENERS
io.on('connect', function(socket) {
  socket.on('transcription', async function({ transcription }) {
    console.log(transcription);
    const [result] = await client.analyzeSentiment({ document: {
      content: transcription,
      type: 'PLAIN_TEXT'
    }});
    const sentiment = result.documentSentiment;
    console.log(`Text: ${transcription}`);
    console.log(`Sentiment score: ${sentiment.score}`);
    console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
  });
});

// LISTEN
server.listen(
  3000,
  undefined,
  undefined,
  () => {
    console.log('Running on port 3000')
  }
);