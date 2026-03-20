import FloatsTabManager from 0xFLOATS_TAB_MANAGER
import YieldVault from 0xYIELD_VAULT

// Returns the total yield a merchant has earned
// This includes both the securely "captured" yield from past transactions
// AND the "live" yield accumulating this very second.
access(all) fun main(tabID: String): UFix64 {
    if let tab = FloatsTabManager.tabs[tabID] {
        // 1. Get the yield already securely locked into the Tab's accounting
        let capturedYield = tab.yieldAccrued

        // 2. Get the dynamically accumulating yield from the Vault before the next update
        let liveYield = YieldVault.calculateYield(merchantID: tab.merchantID)

        return capturedYield + liveYield
    }
    return 0.0
}
