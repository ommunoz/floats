import namesData from '../data/names.json'

const names = namesData as Record<string, string>

export function resolveName(address: string): string {
  // Normalize address (ensure 0x prefix)
  const normalized = address.startsWith('0x') ? address : `0x${address}`
  return names[normalized] || address
}

export function formatAddress(address: string): string {
  if (names[address]) return names[address]
  return address.slice(0, 6) + '...' + address.slice(-4)
}
