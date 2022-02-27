import { createStore } from 'vuex'

export default createStore({
  state: {
    transcriptions: [],
    recording: false,
    myStream: null,
    socket: null,
    sessionId: ''
  },
  getters: {
  },
  mutations: {
    setRecording(state, recording) {
      state.recording = recording
    },
    setMyStream(state, stream) {
      state.myStream = stream
    },
    setSocket(state, socket) { 
      state.socket = socket
    },
    setSessionId(state, id) {
      state.sessionId = id
    }
  },
  actions: {
  },
  modules: {
  }
})
