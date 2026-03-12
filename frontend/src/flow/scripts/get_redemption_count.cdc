import FloatsTabManager from 0xFLOATS_TAB_MANAGER

access(all) fun main(merchantID: String): UInt64 {
    return FloatsTabManager.tabRedemptionCount[merchantID] ?? 0
}
