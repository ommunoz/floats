import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotesStore = defineStore('notes', () => {
  // Keyed by eventID to uniquely identify ephemeral notes across the on-chain history
  const sessionNotes = ref<Record<string, string>>({})

  function addNote(eventID: string, note: string) {
    sessionNotes.value[eventID] = note
  }

  function getNote(eventID: string): string | undefined {
    return sessionNotes.value[eventID]
  }

  return {
    sessionNotes,
    addNote,
    getNote,
  }
})
