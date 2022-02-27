function getFilePath(sessionId, n, url) {
  console.log()
  const urlSplit = url.split('.');
  const fileFormatRaw = urlSplit[urlSplit.length - 1];
  const fileFormat = fileFormatRaw.indexOf('?') > 0 ? fileFormatRaw.substring(0, fileFormatRaw.indexOf('?')) : fileFormatRaw;
  console.log(fileFormat);
  return `../../tmp/images/${sessionId}-${n}.${fileFormat}`;
}

function downloadImage(url, filepath) {
  console.log(filepath);
  console.log(url);
  const imageDownloader = require('image-downloader');
  return imageDownloader.image({
    url,
    dest: filepath
  });
}

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
    const filename = `./tmp/${sessionId}-${n}.mp3`;

    const writeFile = util.promisify(fs.writeFile);
    await writeFile(filename, response.audioContent, 'binary');

    return filename;
  },
  async getStockImageForTranscription(entities, sessionId, n) {
    // make sure we get the right stock images
    // store the images in ./tmp/images/${sessionId}.{format}

    //https://www.google.com/search?q=friend&hl=EN&tbm=isch
    entities.sort((a,b) => {
      b.salience - a.salience;
    });
    const axios = require("axios").default;
    const entityNames = entities.map(entity => entity.name).join(' ');

    var options = {
      method: 'GET',
      url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/ImageSearchAPI',
      params: {q: entityNames, pageNumber: '1', pageSize: '10', autoCorrect: 'true'},
      headers: {
        'x-rapidapi-host': 'contextualwebsearch-websearch-v1.p.rapidapi.com',
        'x-rapidapi-key': process.env.CONTEXTUALWEBSEARCHAPI
      }
    };

    axios.request(options).then(function (response) {
      console.log(response.data);

      // get url of first image from results
      const imgURL = response
        .data
        .value[0]
        .url;
      const filepath = getFilePath(sessionId, n, imgURL);

      // download url
      downloadImage(imgURL, filepath);
    }).catch(function (error) {
      console.error(error);
    });
    
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