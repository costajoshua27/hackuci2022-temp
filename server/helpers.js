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
  }
};