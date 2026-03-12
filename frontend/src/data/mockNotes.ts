// Context-aware mock notes for the chronological feed when it reads on-chain events.
// These flavor texts make the pre-seeded demo history feel alive without storing strings on-chain.

export const FUND_NOTES = [
  "Keep the coffee flowing! ☕",
  "For the neighborhood 🏘️",
  "A little treat for the next neighbor",
  "Supporting our local shops",
  "Small biz support!",
  "Community spirit at its best",
  "Passing on the kindness",
  "Neighborhood love ❤️",
  "Paying it forward!",
  "Happy to support this business",
  "Sharing the vibes",
  "Floating a cup for the next person"
]

export const CLAIM_NOTES = [
  "Thanks for the coffee, neighbor! ❤️",
  "So grateful for this community!",
  "Thank you for the treat! 🍦",
  "Neighborhood kindness at its best, thanks!",
  "Best spot in town, thank you!",
  "Feeling the love today, thanks everyone!",
  "What a great treat! Thanks!",
  "Thank you for the support, neighbors!",
  "Great to be back! Thanks for the float!",
  "Such a cozy spot, thank you!",
  "The best coffee in Brooklyn, thanks!",
  "Thanks for the kindness today! ✨",
  "So thankful for this neighborhood!"
]

export function getRandomMockNote(seedStr: string, type: 'fund' | 'consume'): string {
  const notes = type === 'fund' ? FUND_NOTES : CLAIM_NOTES
  
  // Use a simple hash of the string to deterministically pick a note
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % notes.length
  return notes[index] || ''
}
