<template>
    <li
      id="transcription"
      ref="transcriptionElement"
      class="list-group-item"
      :class="{
        'text-muted': !isLast,
        'last': isLast
      }"
    >
      {{ text }}
    </li>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'Transcription',
  props: {
    text: {
      type: String,
      required: true
    },
    isLast: {
      type: Boolean,
      required: true
    }
  },
  components: {},
  setup(props) {
    const transcriptionElement = ref()

    onMounted(() => {
      if (props.isLast) {
        if (!transcriptionElement.value) return
        transcriptionElement.value.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        })
      }
    })

    return {
      transcriptionElement
    }
  }
})
</script>

<style scoped>
  .last {
    background-color: #2B2D42;
    color: #F7F7F9;
  }
</style>