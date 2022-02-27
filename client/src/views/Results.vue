<template>
  <div class="h-100 w-100 d-flex justify-content-center align-items-center" v-if="notValid">
    Not a valid session
  </div>
  <div class="h-100 w-100 d-flex flex-column justify-content-center align-items-center" v-else-if="loading">
    <h6>tell-a-vizing it...</h6>
    <div class="spinner-border" role="status">
      <span class="sr-only"></span>
    </div>
  </div>
  <div class="h-100 w-100 d-flex flex-column justify-content-center align-items-center" v-else>
    <img id="logo" src="@/assets/dark_logo.png">
    <h6 class="text-center">Here's your result!</h6>
    <video class="w-50 h-50" ref="videoElement" controls :src="videoSrc" type="video/mp4"></video>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  name: 'Results',
  components: {},
  setup() {
    const store = useStore()

    const sessionId = computed(() => store.state.sessionId)

    const videoElement = ref()
    const videoSrc = ref('')
    const notValid = ref(false)
    const loading = ref(false)

    onMounted(async () => {
      if (!sessionId) {
        notValid.value = true
        return
      }

      console.log(videoElement.value)

      try {
        loading.value = true
        const response = await axios.post('http://localhost:3000/video/create', {
          sessionId: sessionId.value
        })
        videoSrc.value = response.data.videoLink
        console.log(videoElement.value, videoSrc.value)
        loading.value = false
      } catch (err) {
        console.log(err)
        notValid.value = true
      }

      videoElement.value.play()
    })

    return {
      videoElement,
      videoSrc,
      notValid,
      loading
    }
  }
})
</script>
