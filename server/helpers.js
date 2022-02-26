module.exports = {
  determineSoundFile(sentimentScore) {
    const soundClips = {
      strongNegative: ['GaspV2.mp3'],
      negative: ['GaspV1.mp3', 'SadAww.mp3'],
      positive:['Impressed_Ooh.mp3', 'LaughV2.mp3'],
      strongPositive: ['Celebrity_Intro.mp3', 'Intrigued_Ooh.mp3']
    };

    let sentiment;
    if (sentimentScore > -0.2 && sentimentScore < 0.2) {
      sentiment = 'neutral';
    }
    else if (sentimentScore >= -0.6 && sentimentScore < -0.2) {
      sentiment = 'negative';
    }
    else if (sentimentScore < -0.6) {
      sentiment = 'strongNegative';
    }
    else if (sentimentScore > 0.2 && sentimentScore <= 0.6) {
      sentiment = 'positive';
    }
    else {
      sentiment = 'strongPositive';
    }

    if (sentiment === 'neutral') {
      return null;
    }
    
    let soundOptions = soundClips[sentiment];
    console.log(sentimentScore);
    console.log(soundOptions);
    let randIndex = Math.floor(Math.random()*soundOptions.length);
    console.log(soundOptions[randIndex]);
    return soundOptions[randIndex];
  },
  async getAudioFileForTranscription(transcription, sessionId, n) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    const client = new textToSpeech.TextToSpeechClient();

    const request = {
      input: { text: transcription },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' }
    };

    const [response] = await client.synthesizeSpeech(request);

    const fs = require('fs');
    const util = require('util');
    const filename = require(`./tmp/${sessionId}-${n}.mp3`);

    const writeFile = util.promisify(fs.writeFile);
    await writeFile(filename, response.audioContent, 'binary');

    return filename;
  },
  async getStockImageForTranscription(transcription) {

  },
  createMasterAudio(transcriptData, sessionId) {
    const audioconcat = require('audioconcat');

    const audioFiles = [];
    for (const data of transcriptData) {
      audioFiles.push(data.audioFile);
      if (data.soundFile) {
        audioFiles.push(data.soundFile);
      }
    }

    return new Promise((resolve, reject) => {
      audioconcat(audioFiles)
        .concat(`./tmp/${sessionId}.mp3`)
        .on('start', function (command) {
          console.log('ffmpeg process started:', command);
        })
        .on('error', function (err) {
          reject(new Error(err));
        })
        .on('end', function (output) {
          console.log('Audio created in:', output);
          resolve();
        });
    });
  }
};