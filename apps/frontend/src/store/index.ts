import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  const appReady = ref(false)
  const apiBaseUrl = ref(import.meta.env.VITE_API_URL || '/api')

  return { appReady, apiBaseUrl }
})
