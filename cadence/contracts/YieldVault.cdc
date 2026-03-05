access(all) contract YieldVault {

    // Store the exact timestamp when yield was last calculated for each merchant
    access(all) var depositedAt: {String: UFix64}

    // Store the active principal amount earning yield for each merchant
    access(all) var principals: {String: UFix64}

    // Mock APY multiplier to make yield visible in a demo (default: 50000.0)
    access(all) var ACCELERATOR_FACTOR: UFix64

    // Admin function to tune the demo speed live if it's too fast/slow
    access(all) fun setAccelerator(newFactor: UFix64) {
        self.ACCELERATOR_FACTOR = newFactor
    }

    // A helper to deposit funds (just acts as the first entry point for a Tab)
    access(all) fun depositPrincipal(merchantID: String, amount: UFix64) {
        let now = getCurrentBlock().timestamp
        
        let currentPrincipal = self.principals[merchantID] ?? 0.0
        self.principals[merchantID] = currentPrincipal + amount
        self.depositedAt[merchantID] = now
    }

    // Calculates and returns the accrued yield since the last update
    // This doesn't modify state, just reads it securely
    access(all) fun calculateYield(merchantID: String): UFix64 {
        let now = getCurrentBlock().timestamp
        
        if let principal = self.principals[merchantID] {
            if let lastTime = self.depositedAt[merchantID] {
                if now > lastTime {
                    let elapsedSeconds = now - lastTime
                    return (principal * self.ACCELERATOR_FACTOR * elapsedSeconds) / (365.0 * 24.0 * 3600.0)
                }
            }
        }
        return 0.0
    }

    // Called whenever principal changes (deposits, claims, sweeps).
    // Captures unpaid yield up to exactly 'now', resets timer, sets new balance.
    access(all) fun updatePrincipal(merchantID: String, newPrincipal: UFix64): UFix64 {
        let accruedYield = self.calculateYield(merchantID: merchantID)
        
        self.principals[merchantID] = newPrincipal
        self.depositedAt[merchantID] = getCurrentBlock().timestamp
        
        return accruedYield
    }

    init() {
        self.principals = {}
        self.depositedAt = {}
        self.ACCELERATOR_FACTOR = 50000.0 
    }
}
