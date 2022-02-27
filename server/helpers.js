module.exports = {
  determineSoundFile(sentimentScore) {
    const soundClips = {
      strongNegative: [
        'strong_negative_1.mp3'
      ],
      negative: [
        'negative_1.mp3',
        'negative_2.mp3'
      ],
      positive:[
        'positive_1.mp3', 
        'positive_2.mp3'
      ],
      strongPositive: [
        'strong_positive_1.mp3', 
        'strong_positive_2.mp3'
      ]
    };

    // Figure out the threshold
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

    // If neutral, don't play a sound
    if (sentiment === 'neutral') {
      return null;
    }
   
    // Play the appropriate sound
    const soundOptions = soundClips[sentiment];
    const randIndex = Math.floor(Math.random() * soundOptions.length);
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
    const filename = `./tmp/${sessionId}-${n}.mp3`;

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

    console.log(audioFiles);

    return new Promise((resolve, reject) => {
      audioconcat(audioFiles)
        .concat(`./tmp/${sessionId}-master.mp3`)
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