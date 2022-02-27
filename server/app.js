const { createServer } = require('http');
const express = require('express');
const cors = require('cors');

const { Server } = require('socket.io');
const language = require('@google-cloud/language');
const { 
  getAudioFileForTranscription,
  determineSoundFile,
  createMasterAudio,
  getStockImageForTranscription
} = require('./helpers');

// SETUP SESSION MAP
const session = new Map();

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
app.post('/video/create', async (req, res) => {
  const {
    sessionId
  } = req.body;

  if (!session.get(sessionId)) {
    return res.status(400).json({
      status: 'failure',
      reason: 'Session does not exist'
    });
  }

  const transcriptData = session.get(sessionId);

  // get images
  await getStockImageForTranscription(transcription);


  // get audio times

  await createMasterAudio(transcriptData, sessionId);

  // CLEANUP
  session.delete(sessionId);
  // delete files

  return res.status(200).json({
    videoLink: '',
    status: 'success'
  });
});

// DEFINE SOCKET EVENT LISTENERS
io.on('connect', function(socket) {
  socket.on('transcription', async function({ sessionId, transcription }) {
    sessionId = 'DUMMYSESSION';
    console.log(`Session id: ${sessionId}`);
    console.log(`Getting information about:\n${transcription}...`);

    const document = {
      content: transcription,
      type: 'PLAIN_TEXT'
    };

    const [resultEntities] = await client.analyzeEntities({ document });
    const [resultSentiment] = await client.analyzeSentiment({ document });

    const sentiment = resultSentiment.documentSentiment;
    const sentimentScore = sentiment.score;

    const entities = resultEntities.entities.map(currEntity => {
      return {
        name: currEntity.name,
        type: currEntity.type,
        salience: currEntity.salience
      };
    });

    // INITIALIZE THE SESSION IF IT HASN'T YET
    if (!session.get(sessionId)) { 
      session.set(sessionId, []);
    }

    const currSession = session.get(sessionId);
    const audioFileName = await getAudioFileForTranscription(transcription, sessionId, currSession.length + 1);
    const soundFileName = determineSoundFile(sentimentScore);

    // CLIENT SHOULD PLAY THE SOUND
    socket.emit('playSound', {
      soundFile: soundFileName 
    });

    const transcriptionData = {
      transcription,
      audioFile: audioFileName,
      soundFile: soundFileName === null
        ? null 
        : './sound_effects/' + soundFileName
    };

    await getStockImageForTranscription(entities, sessionId, currSession.length + 1);

    currSession.push(transcriptionData);
  });
});

// HELPER METHODS

// LISTEN
server.listen(
  3000,
  undefined,
  undefined,
  () => {
    console.log('Running on port 3000')
  }
);