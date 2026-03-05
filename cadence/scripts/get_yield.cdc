import "FloatsTabManager"
import "YieldVault"

// Returns the total yield a merchant has earned
// This includes both the securely "captured" yield from past transactions
// AND the "live" yield accumulating this very second.
access(all) fun main(merchantID: String): UFix64 {
    
    // 1. Get the yield already securely locked into the TabManager's accounting
    let capturedYield = FloatsTabManager.merchantYields[merchantID] ?? 0.0

    // 2. Get the dynamically accumulating yield from the Vault before the next update
    let liveYield = YieldVault.calculateYield(merchantID: merchantID)

    return capturedYield + liveYield
}
