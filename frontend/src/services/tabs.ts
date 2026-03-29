import * as fcl from '@onflow/fcl'
import getTabScript from '../flow/scripts/get_tab.cdc?raw'

const FLOAT_VALUE = 5

export interface HistoryEvent {
  type: 'fund' | 'consume'
  userAddress: string
  amount: number
  timestamp: number
}

export interface FunderStats {
  totalFunded: number
  tier: string
}

export interface TabStruct {
  id: string
  merchantID: string
  totalFunded: number
  totalConsumed: number
  pendingAmount: number
  yieldAccrued: number
  activeFloats: Record<string, { amount: number; expiresAt: number }>
  funders: Record<string, FunderStats>
  history: HistoryEvent[]
  redemptionCount: number
  isActive: boolean
}

export function deriveHealthStatus(floatsAvailable: number): 'open' | 'low' | 'empty' {
  if (floatsAvailable > 5) return 'open'
  if (floatsAvailable > 0) return 'low'
  return 'empty'
}

export async function fetchTab(tabId: string): Promise<{ struct: TabStruct, availableBalance: number, floatsAvailable: number, healthStatus: 'open' | 'low' | 'empty' } | null> {
  const result = await fcl.query({
    cadence: getTabScript,
    args: (arg: any, t: any) => [arg(tabId, t.String)],
  })
  
  if (!result) return null

  // Ensure descending chronological order for history
  const history = (result.history || []).map((e: any) => ({
    type: e.type,
    userAddress: e.userAddress,
    amount: parseFloat(e.amount),
    timestamp: parseFloat(e.timestamp),
  })).sort((a: any, b: any) => b.timestamp - a.timestamp)

  const struct: TabStruct = {
    id: result.id,
    merchantID: result.merchantID,
    totalFunded: parseFloat(result.totalFunded),
    totalConsumed: parseFloat(result.totalConsumed),
    pendingAmount: parseFloat(result.pendingAmount),
    yieldAccrued: parseFloat(result.yieldAccrued),
    activeFloats: {},
    funders: {},
    history,
    redemptionCount: parseInt(result.redemptionCount),
    isActive: result.isActive
  }

  // Parse activeFloats logic via Lazy Harvest anticipation
  let expiredFundsToAdd = 0
  const now = Date.now() / 1000

  for (const address of Object.keys(result.activeFloats || {})) {
    const data = result.activeFloats[address]
    const amount = parseFloat(data.amount)
    const expiresAt = parseFloat(data.expiresAt)
    
    struct.activeFloats[address] = { amount, expiresAt }
    
    if (expiresAt < now) {
      expiredFundsToAdd += amount
    }
  }

  for (const address of Object.keys(result.funders || {})) {
    struct.funders[address] = {
      totalFunded: parseFloat(result.funders[address].totalFunded),
      tier: result.funders[address].tier || 'Supporter'
    }
  }

  // UPDATED: Available balance now includes Yield!
  const availableBalance = (struct.totalFunded + struct.yieldAccrued) - struct.totalConsumed - struct.pendingAmount + expiredFundsToAdd
  const floatsAvailable = Math.floor(availableBalance / FLOAT_VALUE)

  return {
    struct,
    availableBalance,
    floatsAvailable,
    healthStatus: deriveHealthStatus(floatsAvailable)
  }
}
