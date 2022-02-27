<template>
  <div id="home">
    <Recognition/>
    <Transcriptions/>
    <button @click="toggleRecording">
      {{ recording ? 'Finish' : 'Start' }}
    </button>
  </div>
</template>

<script>
import { defineComponent, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { v4 } from 'uuid'
import io from 'socket.io-client'

import Recognition from '../components/Recognition.vue'
import Transcriptions from '../components/Transcriptions.vue'

export default defineComponent({
  name: 'Home',
  components: {
    Recognition,
    Transcriptions
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    const recording = computed(() => store.state.recording)
    const socket = computed(() => store.state.socket)

    const toggleRecording = function() {
      store.commit('setRecording', !recording.value)
      if (recording.value) {
        store.commit('setSessionId', v4())
      } else {
        router.push({ name: 'Results' })
      }
    }

    const setupSocket = function() {
      store.commit('setSocket', io('localhost:3000', {
        path: '/ws-api'
      }))
      socket.value.on('connect', function() {
        console.log('Socket connected!')
      })
      socket.value.on('playSound', function({ soundFile }) {
        if (!soundFile) {
          return 
        }
        const audio = new Audio(require(`../assets/${soundFile}`))
        audio.play()
      })
    }

    onMounted(() => {
      setupSocket()
    })

    return {
      recording,
      toggleRecording
    }
  }
})
</script>
