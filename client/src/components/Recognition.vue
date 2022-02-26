<template>
  <div id="recorder">

  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Recognition',
  components: {},
  setup() {
    const store = useStore()

    const myStream = computed(() => store.state.myStream)
    const socket = computed(() => store.state.socket)

    const recognition = ref(null)
    const needToRestart = ref(false)

    const setupMediaDevices = async function() {
      try {
        const stream = await navigator
          .mediaDevices
          .getUserMedia({
            audio: true
          })
        store.commit('setMyStream', stream)
      } catch (err) {
        console.error(err)
      }
    }

    const setupRecognition = function() {
      recognition.value = new webkitSpeechRecognition()
      recognition.value.continuous = true
      recognition.value.lang = 'en-US'
      recognition.value.interimResults = false

      recognition.value.onnomatch = function() {
        needToRestart.value = true
        console.log('No match')
      }

      recognition.value.onerror = function(event) {
        needToRestart.value = true
        console.error(event.error)
      }

      recognition.value.onspeechstart = function() {
        console.log('Starting transcription...')
      }

      recognition.value.onresult = function(event) {
        needToRestart.value = true
        console.log('Got a result!')
        const transcription = event
          .results[event.results.length - 1][0]
          .transcript
        store.state.transcriptions.push(transcription)
        if (socket.value) {
          socket.value.emit('transcription', {
            transcription
          })
        }
      }
    }

    const setupTranscription = function() {
      const startSpeech = function() {
        try {
          setupRecognition()
          recognition.value.start()
        } catch (e) {
          console.error(e)
        }
      }

      const endSpeech = function() {
        if (recognition.value) recognition.value.stop()
      }

      const audioCtx = new AudioContext()
      const audioAnalyser = audioCtx.createAnalyser()
      const myStreamNode = audioCtx.createMediaStreamSource(myStream.value)
      myStreamNode.connect(audioAnalyser)
      audioAnalyser.minDecibels = -80

      const data = new Uint8Array(audioAnalyser.frequencyBinCount)
      let triggered = false

      const checkAudioSilence = function() {
        requestAnimationFrame(checkAudioSilence)
        audioAnalyser.getByteFrequencyData(data)
        if (data.some(v => v)) {
          if (triggered) {
            triggered = false;
            startSpeech()
          }
        }
        if (!triggered && needToRestart.value) {
          endSpeech()
          triggered = true
          needToRestart.value = false
        }
      }

      startSpeech()
      checkAudioSilence()
    }

    onMounted(async () => {
      await setupMediaDevices()
      setupTranscription()
    })
  }
})
</script>

<style>

</style>