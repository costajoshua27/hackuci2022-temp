<template>
  <ul
    class="w-50 h-25 list-group text-center"
    id="transcriptions"
  >
    <Transcription 
      v-for="(transcription, index) in transcriptions"
      :key="transcription"
      :text="transcription"
      :isLast="index === transcriptions.length - 1"
    />
  </ul>  
</template>

<script>
import { defineComponent, computed } from 'vue'
import Transcription from './Transcription.vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Transcriptions',
  components: {
    Transcription
  },
  setup() {
    const store = useStore()

    const transcriptions = computed(() => store.state.transcriptions)

    return {
      transcriptions
    }
  }
})
</script>

<style scoped>
  #transcriptions {
    overflow-y: auto;
    box-shadow: 5px 5px 9px 5px rgba(0,0,0,0.22);
  }
</style>