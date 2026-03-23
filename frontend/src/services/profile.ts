import * as fcl from '@onflow/fcl'
import getUserStatsScript from '../flow/scripts/get_user_profile_stats.cdc?raw'
import getUserHistoryScript from '../flow/scripts/get_user_history.cdc?raw'

export interface UserStats {
  tabsBacked: number
  floatsGrabbed: number
}

export interface UserHistoryItem {
  id: string
  tabID: string
  type: string
  amount: string
  timestamp: string
}

export async function getUserStats(address: string): Promise<UserStats> {
  const result = await fcl.query({
    cadence: getUserStatsScript,
    args: (arg: any, t: any) => [arg(address, t.Address)]
  })
  
  return {
    tabsBacked: parseInt(result.tabsBacked, 10),
    floatsGrabbed: parseInt(result.floatsGrabbed, 10)
  }
}

export async function getUserHistory(address: string): Promise<UserHistoryItem[]> {
  const result = await fcl.query({
    cadence: getUserHistoryScript,
    args: (arg: any, t: any) => [arg(address, t.Address)]
  })
  
  return result as UserHistoryItem[]
}
