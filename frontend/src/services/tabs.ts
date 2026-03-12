import * as fcl from '@onflow/fcl'
import { CONTRACT_ADDRESS } from '../flow/config'
import getTabBalanceScript from '../flow/scripts/get_tab_balance.cdc?raw'
import getRedemptionCountScript from '../flow/scripts/get_redemption_count.cdc?raw'
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
