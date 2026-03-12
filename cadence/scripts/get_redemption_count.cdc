import "FloatsTabManager"

access(all) fun main(merchantID: String): UInt64 {
    return FloatsTabManager.tabRedemptionCount[merchantID] ?? 0
}
