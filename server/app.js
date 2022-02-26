const { createServer } = require('http');
const express = require('express');
const cors = require('cors');

const { Server } = require('socket.io');
const language = require('@google-cloud/language');
const { getAudioFileForTranscription } = require('./helpers');

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
app.post('/video/create', (req, res) => {
  const data = req.data;

  const images = [];
  
  


  return res.status(200).json({
    videoLink: '',
    status: 'success'
  });
});

// DEFINE SOCKET EVENT LISTENERS
io.on('connect', function(socket) {
  socket.on('transcription', async function({ transcription }) {
    console.log(transcription);
    const [resultEntities] = await client.analyzeEntities({  document: {
      content: transcription,
      type: 'PLAIN_TEXT'
    }});
    const [resultSentiment] = await client.analyzeSentiment({ document: {
      content: transcription,
      type: 'PLAIN_TEXT'
    }});
    /*
    {transcription: string,
    sound?: string,
    sentiment: number,
    entities: Array<entities>}
    */
    // Analyze result (what type of sound byte, entities)
    const sentiment = resultSentiment.documentSentiment;
    const sentimentScore = sentiment.score;
    const soundClip = determineSoundClip(sentimentScore);
    // if we want just the name of the entity
    const entities = resultEntities.entities.map((currEntity) => {
      return {
        name: currEntity.name,
        type: currEntity.type,
        salience: currEntity.salience
      };
    });

    console.log(entities);
    console.log(soundClip);
    console.log(sentimentScore);
    console.log(transcription);

    socket.emit("transcriptionProcessed", {
      transcription: transcription,
      sound: soundClip,
      sentiment: sentimentScore,
      entities: entities
    });
  });
});

// HELPER METHODS
function determineSoundClip(sentimentScore) {
  if (sentimentScore === 0) {
    return 'neutral';
  }
  else if (sentimentScore >= -0.5 && sentimentScore < 0) {
    return 'negative';
  }
  else if (sentimentScore < -0.5) {
    return 'strongNegative';
  }
  else if (sentimentScore > 0 && sentimentScore <= 0.5) {
    return 'positive';
  }
  else {
    return 'strongPositive';
  }
}

// LISTEN
server.listen(
  3000,
  undefined,
  undefined,
  () => {
    console.log('Running on port 3000')
  }
);