access(all) contract YieldVault {

    // --- Tab Yield ---
    // Keyed by tabID (not merchantID — a merchant can have many tabs)

    // Timestamp of the last harvest for each tab's principal
    access(all) var tabDepositedAt: {String: UFix64}

    // The active idle principal earning yield for each tab
    access(all) var tabPrincipals: {String: UFix64}

    // --- Protocol Yield ---
    // Global running accumulator for the protocol's "carry" (consumed but retained capital)

    // Total consumed principal currently in the vault earning protocol yield
    access(all) var protocolPrincipal: UFix64

    // Timestamp of the last time protocol yield was harvested into the accumulator
    access(all) var protocolLastHarvest: UFix64

    // The accumulated protocol yield (safe to withdraw, never touches principal)
    access(all) var protocolAccruedYield: UFix64

    // --- Shared Config ---

    // Mock APY multiplier to make yield visible in a demo
    access(all) var ACCELERATOR_FACTOR: UFix64

    // Admin function to tune the demo speed live if it's too fast/slow
    access(all) fun setAccelerator(newFactor: UFix64) {
        self.ACCELERATOR_FACTOR = newFactor
    }

    // -------------------------------------------
    // TAB YIELD — per-tab idle principal tracking
    // -------------------------------------------

    // Read-only: calculate pending tab yield since the last harvest
    access(all) fun calculateTabYield(tabID: String): UFix64 {
        let now = getCurrentBlock().timestamp
        if let principal = self.tabPrincipals[tabID] {
            if let lastTime = self.tabDepositedAt[tabID] {
                if now > lastTime {
                    let elapsedSeconds = now - lastTime
                    // Divide FIRST to keep intermediate values small and avoid UFix64 overflow
                    let ratePerSecond = self.ACCELERATOR_FACTOR / 31536000.0
                    return principal * ratePerSecond * elapsedSeconds
                }
            }
        }
        return 0.0
    }

    // Called whenever idle principal changes (deposit, claim, discard, sweep).
    // Harvests pending tab yield into the return value, resets timer, sets new principal.
    access(all) fun updatePrincipal(tabID: String, newPrincipal: UFix64): UFix64 {
        let accruedYield = self.calculateTabYield(tabID: tabID)

        self.tabPrincipals[tabID] = newPrincipal
        self.tabDepositedAt[tabID] = getCurrentBlock().timestamp

        return accruedYield
    }

    // -------------------------------------------
    // PROTOCOL YIELD — global carry on consumed capital
    // -------------------------------------------

    // Read-only: calculate pending protocol yield since the last harvest
    access(all) fun calculateProtocolYield(): UFix64 {
        let now = getCurrentBlock().timestamp
        if now > self.protocolLastHarvest && self.protocolPrincipal > 0.0 {
            let elapsedSeconds = now - self.protocolLastHarvest
            let ratePerSecond = self.ACCELERATOR_FACTOR / 31536000.0
            return self.protocolPrincipal * ratePerSecond * elapsedSeconds
        }
        return 0.0
    }

    // Called when a float is consumed — adds to the protocol's earning principal.
    // First harvests pending yield into the accumulator, then adds new principal.
    access(all) fun addProtocolPrincipal(amount: UFix64) {
        // Harvest everything earned so far before changing the principal
        let pending = self.calculateProtocolYield()
        self.protocolAccruedYield = self.protocolAccruedYield + pending
        self.protocolLastHarvest = getCurrentBlock().timestamp

        // Now add the newly consumed amount to the earning base
        self.protocolPrincipal = self.protocolPrincipal + amount
    }

    // Called when the Treasury redeems its carry.
    // GUARD: can only withdraw from protocolAccruedYield, never from principal.
    access(all) fun withdrawProtocolYield(amount: UFix64): UFix64 {
        // First, harvest any pending yield into the accumulator
        let pending = self.calculateProtocolYield()
        self.protocolAccruedYield = self.protocolAccruedYield + pending
        self.protocolLastHarvest = getCurrentBlock().timestamp

        // Guard: cannot withdraw more than what has been earned
        let safeAmount = amount < self.protocolAccruedYield ? amount : self.protocolAccruedYield
        self.protocolAccruedYield = self.protocolAccruedYield - safeAmount
        return safeAmount
    }

    init() {
        self.tabDepositedAt = {}
        self.tabPrincipals = {}

        self.protocolPrincipal = 0.0
        self.protocolLastHarvest = getCurrentBlock().timestamp
        self.protocolAccruedYield = 0.0

        self.ACCELERATOR_FACTOR = 500.0
    }
}
