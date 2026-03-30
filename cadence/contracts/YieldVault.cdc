access(all) contract YieldVault {

    // --- Structs ---
    // Wrapped in structs so future fields can be added without a contract migration.

    access(all) struct TabYieldRecord {
        access(all) var principal: UFix64
        access(all) var lastHarvest: UFix64

        init(principal: UFix64) {
            self.principal = principal
            self.lastHarvest = getCurrentBlock().timestamp
        }
    }

    access(all) struct ProtocolYieldRecord {
        access(all) var principal: UFix64
        access(all) var lastHarvest: UFix64
        access(all) var accruedYield: UFix64

        init() {
            self.principal = 0.0
            self.lastHarvest = getCurrentBlock().timestamp
            self.accruedYield = 0.0
        }

        access(contract) fun addPrincipal(amount: UFix64, pending: UFix64) {
            self.accruedYield = self.accruedYield + pending
            self.lastHarvest = getCurrentBlock().timestamp
            self.principal = self.principal + amount
        }

        access(contract) fun deductPrincipal(amount: UFix64, pending: UFix64) {
            self.accruedYield = self.accruedYield + pending
            self.lastHarvest = getCurrentBlock().timestamp
            let current = self.principal
            self.principal = current > amount ? current - amount : 0.0
        }

        access(contract) fun withdrawYield(amount: UFix64, pending: UFix64): UFix64 {
            self.accruedYield = self.accruedYield + pending
            self.lastHarvest = getCurrentBlock().timestamp
            let safeAmount = amount < self.accruedYield ? amount : self.accruedYield
            self.accruedYield = self.accruedYield - safeAmount
            return safeAmount
        }
    }

    // --- State ---

    // Per-tab idle principal tracking (keyed by tabID, not merchantID)
    access(all) var tabYields: {String: TabYieldRecord}

    // Global protocol carry (consumed capital still physically in the vault)
    access(all) var protocolYield: ProtocolYieldRecord

    // Mock APY multiplier — tunable live for demo purposes
    access(all) var ACCELERATOR_FACTOR: UFix64

    // --- Admin ---

    access(all) fun setAccelerator(newFactor: UFix64) {
        self.ACCELERATOR_FACTOR = newFactor
    }

    // --- Internal helper ---

    access(self) fun ratePerSecond(): UFix64 {
        // Divide first to avoid UFix64 overflow on large principals
        return self.ACCELERATOR_FACTOR / 31536000.0
    }

    // -----------------------------------------------
    // TAB YIELD — per-tab idle principal
    // Returns harvested yield so FloatsTabManager can credit the tab's yieldAccrued field.
    // -----------------------------------------------

    access(all) fun calculateTabYield(tabID: String): UFix64 {
        let now = getCurrentBlock().timestamp
        if let record = self.tabYields[tabID] {
            if now > record.lastHarvest {
                let elapsed = now - record.lastHarvest
                return record.principal * self.ratePerSecond() * elapsed
            }
        }
        return 0.0
    }

    // Capital enters the idle pool (deposit). Returns harvested yield.
    access(all) fun addTabPrincipal(tabID: String, amount: UFix64): UFix64 {
        let harvested = self.calculateTabYield(tabID: tabID)
        let current = self.tabYields[tabID]?.principal ?? 0.0
        self.tabYields[tabID] = TabYieldRecord(principal: current + amount)
        return harvested
    }

    // Capital leaves the idle pool (consume). Returns harvested yield.
    access(all) fun deductTabPrincipal(tabID: String, amount: UFix64): UFix64 {
        let harvested = self.calculateTabYield(tabID: tabID)
        let current = self.tabYields[tabID]?.principal ?? 0.0
        let newPrincipal = current > amount ? current - amount : 0.0
        self.tabYields[tabID] = TabYieldRecord(principal: newPrincipal)
        return harvested
    }

    // -----------------------------------------------
    // PROTOCOL YIELD — global carry on consumed capital
    // -----------------------------------------------

    access(all) fun calculateProtocolYield(): UFix64 {
        let now = getCurrentBlock().timestamp
        let record = self.protocolYield
        if now > record.lastHarvest && record.principal > 0.0 {
            let elapsed = now - record.lastHarvest
            return record.principal * self.ratePerSecond() * elapsed
        }
        return 0.0
    }

    // Called on float consume — spent amount starts earning protocol carry
    access(all) fun addProtocolPrincipal(amount: UFix64) {
        let pending = self.calculateProtocolYield()
        self.protocolYield.addPrincipal(amount: amount, pending: pending)
    }

    // Called on reimbursement withdrawal — capital leaves the carry pool
    access(all) fun deductProtocolPrincipal(amount: UFix64) {
        let pending = self.calculateProtocolYield()
        self.protocolYield.deductPrincipal(amount: amount, pending: pending)
    }

    // Treasury redeems its carry. GUARD: only `accruedYield` is withdrawable, never `principal`.
    access(all) fun withdrawProtocolYield(amount: UFix64): UFix64 {
        let pending = self.calculateProtocolYield()
        return self.protocolYield.withdrawYield(amount: amount, pending: pending)
    }

    init() {
        self.tabYields = {}
        self.protocolYield = ProtocolYieldRecord()
        self.ACCELERATOR_FACTOR = 1.0
    }
}
