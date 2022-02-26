<template>
  <div id="home">
    <Recognition/>
    <Transcriptions/>
  </div>
</template>

<script>
import { defineComponent, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
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

    const socket = computed(() => store.state.socket)

    const setupSocket = function() {
      store.commit('setSocket', io('localhost:3000', {
        path: '/ws-api'
      }))
      socket.value.on('connect', function() {
        console.log('Socket connected!')
      })
    }

    onMounted(() => {
      setupSocket()
    })
  }
})
</script>
