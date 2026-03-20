let users: Record<string, { name: string, isDemoUser: boolean }> = {}

export function setUsersData(data: Record<string, { name: string, isDemoUser: boolean }>) {
  users = data
}

export function getDisplayName(address: string): string {
  // Normalize address (ensure 0x prefix)
  const normalized = address.startsWith('0x') ? address : `0x${address}`
  return users[normalized]?.name || 'Neighbor'
}
