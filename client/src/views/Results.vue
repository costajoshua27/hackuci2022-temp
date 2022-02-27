<template>
  <div v-if="notValid">
    Not valid
  </div>
  <div v-else-if="loading">Loading...</div>
  <div v-else>

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

    const notValid = ref(false)
    const loading = ref(false)

    onMounted(async () => {
      if (!sessionId) {
        notValid.value = true
        return
      }

      try {
        console.log('hello')
        loading.value = true
        const response = await axios.post('http://localhost:3000/video/create', {
          sessionId: sessionId.value
        })
        console.log(response.data)
        loading.value = false
      } catch (err) {
        console.log(err)
        notValid.value = true
      }

    })

    return {
      notValid,
      loading
    }
  }
})
</script>
