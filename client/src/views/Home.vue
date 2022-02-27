<template>
  <div 
    class="d-flex flex-column justify-content-center align-items-center"
    id="home"
  >
    <img id="logo" src="@/assets/dark_logo.png">
    <Recognition/>
    <Transcriptions/>
    <button id="toggle" class="mt-4" @click="toggleRecording" :class="{ recording, notRecording: !recording }">
      <BIconPlayFill v-if="!recording" />
      <BIconStopFill v-else />
    </button>
    <div 
      id="animationBackground"
      ref="animationBackground"
    ></div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onUnmounted, computed, ref } from 'vue'
import { BIconPlayFill, BIconStopFill } from 'bootstrap-icons-vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { v4 } from 'uuid'
import io from 'socket.io-client'
import gsap from 'gsap'

import Recognition from '../components/Recognition.vue'
import Transcriptions from '../components/Transcriptions.vue'

export default defineComponent({
  name: 'Home',
  components: {
    Recognition,
    Transcriptions,

    BIconPlayFill,
    BIconStopFill
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    const recording = computed(() => store.state.recording)
    const socket = computed(() => store.state.socket)

    const animationBackground = ref()

    const positiveEmojis = ref([])
    const strongPositiveEmojis = ref([])
    const negativeEmojis = ref([])
    const strongNegativeEmojis = ref([])

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
      socket.value.on('playSound', function({ soundFile, sentiment }) {
        console.log(soundFile, sentiment)
        if (sentiment !== 'neutral') {
          doAnimation(sentiment)
          const audio = new Audio(require(`../assets/${soundFile}`))
          audio.play()
        }
      })
    }

    const setupAnimation = function() {
      if (!animationBackground.value) return

      const count = 30
      let emoji;

      const positiveSet = [
        '😃',
        '😊',
        '😇',
        '😎',
        '😚'
      ]
      
      for (let i = 0; i < count; ++i) {
        emoji = document.createElement('div')
        emoji.className = 'emoji'
        emoji.innerText = positiveSet[Math.floor(Math.random() * positiveSet.length)]
        animationBackground.value.appendChild(emoji)
        positiveEmojis.value.push(emoji)
        gsap.set(emoji, {
          opacity: 0
        })
      }

      const strongPositiveSet = [
        '😂',
        '🥳',
        '🤪',
        '😋',
        '💗',
        '💯'
      ]
      
      for (let i = 0; i < count; ++i) {
        emoji = document.createElement('div')
        emoji.className = 'emoji'
        emoji.innerText = strongPositiveSet[Math.floor(Math.random() * strongPositiveSet.length)]
        animationBackground.value.appendChild(emoji)
        strongPositiveEmojis.value.push(emoji)
        gsap.set(emoji, {
          opacity: 0
        })
      }

      const negativeSet = [
        '🙃',
        '🧐',
        '🤐',
        '😑',
        '😬',
        '👎',
        '👀'
      ]
      
      for (let i = 0; i < count; ++i) {
        emoji = document.createElement('div')
        emoji.className = 'emoji'
        emoji.innerText = negativeSet[Math.floor(Math.random() * negativeSet.length)]
        animationBackground.value.appendChild(emoji)
        negativeEmojis.value.push(emoji)
        gsap.set(emoji, {
          opacity: 0
        })
      }

      const strongNegativeSet = [
        '🤮',
        '🤯',
        '😳',
        '😡',
        '🤬',
        '💀'
      ]
      
      for (let i = 0; i < count; ++i) {
        emoji = document.createElement('div')
        emoji.className = 'emoji'
        emoji.innerText = strongNegativeSet[Math.floor(Math.random() * strongNegativeSet.length)]
        animationBackground.value.appendChild(emoji)
        strongNegativeEmojis.value.push(emoji)
        gsap.set(emoji, {
          opacity: 0
        })
      }
    }

    const doAnimation = function(sentiment) {
      if (!animationBackground.value) return

      const width = animationBackground.value.offsetWidth
      const height = animationBackground.value.offsetHeight

      const animateEmoji = function(emoji) {
        const duration = gsap.utils.random(1.5, 2.5)
        gsap.to(emoji, {
          duration,
          y: height,
          ease: 'none',
        })
        gsap.to(emoji, {
          duration,
          x: '+=50', 
          ease: 'power1.inOut'
        })
        gsap.to(emoji, {
          duration,
          opacity: 0.2
        })
      }

      const chooseEmojiSet = function(sentiment) {
        if (sentiment === 'positive') {
          return positiveEmojis.value
        } else if (sentiment === 'strongPositive') {
          return strongPositiveEmojis.value
        } else if (sentiment === 'negative') {
          return negativeEmojis.value
        } else {
          return strongNegativeEmojis.value
        }
      }

      const emojis = chooseEmojiSet(sentiment)

      for (const emoji of emojis) {
        gsap.set(emoji, {
          x: gsap.utils.random(0, width),
          y: gsap.utils.random(0, height),
          scale: gsap.utils.random(0.5, 1),
          opacity: 1
        })
        animateEmoji(emoji)
      }
    }


    onMounted(() => {
      setupSocket()
      setupAnimation()
    })

    onUnmounted(() => {
      store.commit('setTranscriptions', [])
    })

    return {
      recording,
      animationBackground,

      toggleRecording
    }
  }
})
</script>

<style>
  #home {
    position: relative;
    height: 100%;
    width: 100%;
  }

  #logo {
    height: 250px;
  }

  #animationBackground {
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: -1;
  }

  #toggle {
    border-radius: 50%;
    background-color: #F7F7F9;
    padding: 5px;
    z-index: 1;
  }

  .notRecording svg {
    color: #41E2BA;
  }

  .notRecording {
    border: 5px solid #41E2BA;
  }

  .recording {
    border: 5px solid #E86A92;
  }

  .recording svg {
    color: #E86A92;
  }

  .emoji {
    position: absolute;
    font-size: 3.0rem;
    z-index: 2;
  }
</style>
