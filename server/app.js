const { createServer } = require('http');
const express = require('express');
const cors = require('cors');

const { Server } = require('socket.io');
const language = require('@google-cloud/language');
const { 
  getAudioFileForTranscription,
  determineSoundFile,
  getAudioTimes,
  createMasterAudio,
  getStockImageForTranscription,
  createVideo,
  deleteFiles,
  resizeAllPhotos
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

app.use(express.static('public'));

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

  try {
    // Array of currData
    const transcriptData = session.get(sessionId);

    // get audio times (should be same lenght as transcriptData)
    const audioTimes = [];
    for (const data of transcriptData) {
      let currTime = 0;
      currTime += getAudioTimes(data.audioFile);
      if (data.soundFile) {
        currTime += getAudioTimes(data.soundFile);
      }
      audioTimes.push(currTime);
    }

    console.log(audioTimes);

    // CREATE THE MASTER AUDIO
    await createMasterAudio(transcriptData, sessionId);
    let masterAudioPath = `./tmp/${sessionId}-master.mp3`;

    // GET THE IMAGES
    const imgFiles = [];
    let fileNum = 1;
    for (const data of transcriptData) {
      const file = await getStockImageForTranscription(data, sessionId, fileNum);
      imgFiles.push(file);
      fileNum++;
    }

    // RESIZE THE PHOTOS TO THE SAME SIZE
    await resizeAllPhotos(imgFiles);

    await createVideo(imgFiles, audioTimes, transcriptData, masterAudioPath, sessionId);

    // CLEANUP
    session.delete(sessionId);
    // DELETE FILES;
    deleteFiles(`./tmp/${sessionId}*`);
    deleteFiles(`./tmp/images/${sessionId}*`);

    // RETURN RESPONSE;
    return res.status(200).json({
      videoLink: `http://localhost:3000/${sessionId}-video.mp4`,
      status: 'success'
    });
  } catch(err) {
    return res.status(400).json({
      status: 'failure',
      reason: 'Failure in creating video'
    });
  }
});

// DEFINE SOCKET EVENT LISTENERS
io.on('connect', function(socket) {
  socket.on('transcription', async function({ sessionId, transcription }) {
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
    const { sentimentCategory, soundFileName } = determineSoundFile(sentimentScore);

    // CLIENT SHOULD PLAY THE SOUND
    socket.emit('playSound', {
      soundFile: soundFileName,
      sentiment: sentimentCategory 
    });

    const transcriptionData = {
      transcription,
      entities,
      audioFile: audioFileName,
      soundFile: soundFileName === null
        ? null 
        : './sound_effects/' + soundFileName
    };

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