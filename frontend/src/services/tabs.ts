import * as fcl from '@onflow/fcl'
import { CONTRACT_ADDRESS } from '../flow/config'
import getTabBalanceScript from '../flow/scripts/get_tab_balance.cdc?raw'
import getRedemptionCountScript from '../flow/scripts/get_redemption_count.cdc?raw'
import getTabHistoryScript from '../flow/scripts/get_tab_history.cdc?raw'
import getTabLeaderboardScript from '../flow/scripts/get_tab_leaderboard.cdc?raw'
import type { Tab } from '../stores/tabs'

const FLOAT_VALUE = 5

function deriveHealthStatus(floatsAvailable: number): Tab['healthStatus'] {
  if (floatsAvailable > 2) return 'open'
  if (floatsAvailable > 0) return 'low'
  return 'empty'
}

export async function fetchTabBalance(tabId: string): Promise<{
  floatsAvailable: number
  healthStatus: Tab['healthStatus']
}> {
  const result = await fcl.query({
    cadence: getTabBalanceScript.replace('0xFLOATS_TAB_MANAGER', CONTRACT_ADDRESS),
    args: (arg: any, t: any) => [arg(tabId, t.String)],
  })
  const balance = parseFloat(result ?? '0')
  const floatsAvailable = Math.floor(balance / FLOAT_VALUE)
  return { floatsAvailable, healthStatus: deriveHealthStatus(floatsAvailable) }
}

export async function fetchRedemptionCount(tabId: string): Promise<number> {
  const result = await fcl.query({
    cadence: getRedemptionCountScript.replace('0xFLOATS_TAB_MANAGER', CONTRACT_ADDRESS),
    args: (arg: any, t: any) => [arg(tabId, t.String)],
  })
  return parseInt(result ?? '0', 10)
}

export type HistoryEventType = 'fund' | 'consume'

export interface OnChainHistoryEvent {
  eventID: string
  type: HistoryEventType
  userAddress: string
  amount: number
  timestamp: number
}

export async function fetchTabHistory(tabId: string): Promise<OnChainHistoryEvent[]> {
  const result: any[] = await fcl.query({
    cadence: getTabHistoryScript.replace('0xFLOATS_TAB_MANAGER', CONTRACT_ADDRESS),
    args: (arg: any, t: any) => [arg(tabId, t.String)],
  })
  
  if (!result) return []

  // Ensure descending chronological order (newest first)
  return result.map((e: any) => ({
    eventID: e.eventID,
    type: e.type,
    userAddress: e.userAddress,
    amount: parseFloat(e.amount),
    timestamp: parseFloat(e.timestamp),
  })).sort((a, b) => b.timestamp - a.timestamp)
}

export interface FunderStats {
  totalFunded: number
}

export async function fetchTabLeaderboard(tabId: string): Promise<Record<string, FunderStats>> {
  const result = await fcl.query({
    cadence: getTabLeaderboardScript.replace('0xFLOATS_TAB_MANAGER', CONTRACT_ADDRESS),
    args: (arg: any, t: any) => [arg(tabId, t.String)],
  })

  const leaderboard: Record<string, FunderStats> = {}
  if (!result) return leaderboard

  // The Cadence dictionary is keyed by Address with a struct of totalFunded
  for (const address of Object.keys(result)) {
    leaderboard[address] = {
      totalFunded: parseFloat(result[address].totalFunded)
    }
  }

  return leaderboard
}
