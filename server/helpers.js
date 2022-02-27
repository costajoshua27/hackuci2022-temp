function getFilePath(sessionId, n, url) {
  const urlSplit = url.split('.');
  const fileFormatRaw = urlSplit[urlSplit.length - 1];
  const fileFormat = fileFormatRaw.indexOf('?') > 0 ? fileFormatRaw.substring(0, fileFormatRaw.indexOf('?')) : fileFormatRaw;
  return `../../tmp/images/${sessionId}-${n}.${fileFormat}`;
}

// function downloadImage(validURLs) {
//   console.log(filepath);
//   console.log(url);
//   const imageDownloader = require('image-downloader');
//   return imageDownloader.image({
//     url,
//     dest: filepath
//   })
//   .then(({ filename }) => {
//     console.log('Saved to', filename)  // saved to /path/to/dest/photo.jpg
//   })
//   .catch((err) => {
//     console.log('here?');
//     console.error(err);
    
//   });
// }

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
      return {
        soundFileName: null,
        sentimentCategory: sentiment
      };
    }
   
    // Play the appropriate sound
    const soundOptions = soundClips[sentiment];
    const randIndex = Math.floor(Math.random() * soundOptions.length);
    return {
      sentimentCategory: sentiment,
      soundFileName: soundOptions[randIndex]
    };
  },
  async getAudioFileForTranscription(transcription, sessionId, n) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    const client = new textToSpeech.TextToSpeechClient();

    const request = {
      input: { text: transcription },
      voice: { languageCode: 'en-AU', name: 'en-AU-Wavenet-B', ssmlGender: 'MALE' },
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
  getAudioTimes(filepath) {
    const getMP3Duration = require('get-mp3-duration');
    const fs = require('fs');
    const buffer = fs.readFileSync(filepath);
    const duration = getMP3Duration(buffer);
    return Math.ceil(duration / 1000);
  },
  getStockImageForTranscription(transcriptData, sessionId, n) {
    return new Promise(async (resolve, reject) => {
      const entities = transcriptData.entities;
      const transcription = transcriptData.transcription;
      let searchContent;

      if (entities.length > 0) {
        entities.sort((a,b) => {
          b.salience - a.salience;
        });
        searchContent = entities.map(entity => entity.name).join(' ');
      } else {
        searchContent = transcription;
      }

      const axios = require("axios").default;

      const options = {
        method: 'GET',
        url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/ImageSearchAPI',
        params: { q: searchContent, pageNumber: '1', pageSize: '10', autoCorrect: 'true' },
        headers: {
          'x-rapidapi-host': 'contextualwebsearch-websearch-v1.p.rapidapi.com',
          'x-rapidapi-key': process.env.CONTEXTUALWEBSEARCHAPI
        }
      };

      try {
        const response = await axios.request(options);

        const path = require('path')

        const validExts = new Set(['.jpg', '.jpeg']);
        const validURLs = [];

        for (const img of response.data.value) {
          const imgURL = img.url;
          const filepath = getFilePath(sessionId, n, imgURL);
          if (filepath && validExts.has(path.extname(filepath))) {
            validURLs.push({'imgURL': imgURL, 'filepath': filepath});
          }
        }

        let filepath;
        const imageDownloader = require('image-downloader');

        for (const validURL of validURLs) {
          const url = validURL['imgURL'];
          filepath = validURL['filepath'];

          try {
            console.log('trying ' + filepath + '(' + url + ')')
            await imageDownloader.image({
              url,
              dest: filepath
            });
            break;
          } catch(err) {
            console.error(err);
            continue;
          } 
        }

        console.log(`Successfully downloaded ${filepath}`);
        resolve(`./tmp/images/${sessionId}-${n}${path.extname(filepath)}`);

      } catch(err) {
        console.log('NOT HERE PLEASE');
        console.error(err);
        reject(new Error(err));        
      }
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
  },
  createVideo(imgFiles, audioTimes, transcriptData, masterAudioPath, sessionId) {
    const videoshow = require('videoshow');

    let videoSlides = [];
    for (let i = 0; i < audioTimes.length; i++) {
      videoSlides.push({
        path: imgFiles[i] + '.jpeg',
        caption: transcriptData[i].transcription,
        loop: audioTimes[i],
        transition: false,
        transitionDuration: 0,
        captionDelay: 0
      });
    }

    return new Promise((resolve, reject) => {
      videoshow(videoSlides, {
        size: '1000x1000',
        captionDelay: 0,
        transition: false
      })
        .audio(masterAudioPath)
        .save(`./public/${sessionId}-video.mp4`)
        .on('start', function (command) {
          console.log('ffmpeg process started:', command)
        })
        .on('error', function (err, stdout, stderr) {
          console.error('Error:', err)
          console.error('ffmpeg stderr:', stderr)
          reject();
        })
        .on('end', function () {
          console.log('done creating videoshow');
          resolve();
        });
    });
  },
  deleteFiles(filepath) {
    const fs = require('fs');
    const glob = require('glob');
    let tmpFiles;
    glob(filepath, (err, res) => {
      if (err) {
        console.log('Error', err);
      } else {
        tmpFiles = res;
  
        if (tmpFiles) {
          tmpFiles.forEach(path => {
            console.log(path);
            console.log(typeof(path));
            try {
              fs.unlinkSync(path);
              console.log(`deleted: ${path}`);
            } catch(err) {
              console.log(err);
            }
          });
        }
      }
    });
  },
  resizeAllPhotos(imgFiles) {
    return new Promise(async (resolve, reject) => {
      const sharp = require('sharp');
      const fs = require('fs');

      try {

        for (const img of imgFiles) {
          console.log(img);
          const data = await sharp(img)
            .resize(1000, 1000)
            .jpeg()
            .toBuffer();
          console.log(data);
          fs.writeFileSync(img + '.jpeg', data);
          console.log('Resized ' + img);
        }

        resolve();

      } catch (err) {
        reject(new Error(err));
      }
    })
  }
};