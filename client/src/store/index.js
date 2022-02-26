import { createStore } from 'vuex'

export default createStore({
  state: {
    transcriptions: [],
    myStream: null,
    socket: null
  },
  getters: {
  },
  mutations: {
    setMyStream(state, stream) {
      state.myStream = stream
    },
    setSocket(state, socket) { 
      state.socket = socket
    }
  },
  actions: {
  },
  modules: {
  }
})
