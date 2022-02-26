module.exports = {
  async getAudioFileForTranscription(transcription) {
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

    const writeFile = util.promisify(fs.writeFile);
    await writeFile('output.mp3', response.audioContent, 'binary');
  },
  determineSoundClip(sentimentScore) {
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
  }
};