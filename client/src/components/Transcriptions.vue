<template>
  <div>
    {{ transcriptions }}
  </div>  
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Transcriptions',
  components: {},
  setup() {
    const store = useStore();

    const transcriptions = computed(() => store.state.transcriptions)

    return {
      transcriptions
    }
  }
})
</script>

<style>

</style>