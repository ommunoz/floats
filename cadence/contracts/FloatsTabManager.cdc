import "FungibleToken"
import "FlowToken"
import "YieldVault"

access(all) contract FloatsTabManager {
    
    // --- Events ---
    access(all) event FloatConsumed(tabID: String, claimerAddress: Address, spentAmount: UFix64)

    // --- The Master Dictionary ---
    // Single cohesive state grouping for all active tabs
    access(all) var tabs: {String: Tab}

    // This vault actually holds the physical FlowTokens backing the protocol 1:1.
    access(all) let reserveVault: @{FungibleToken.Vault}

    // --- Core Data Structures ---

    access(all) struct HistoryEvent {
        access(all) let type: String // "fund" or "consume"
        access(all) let userAddress: Address
        access(all) let amount: UFix64
        access(all) let timestamp: UFix64

        init(type: String, userAddress: Address, amount: UFix64, timestamp: UFix64) {
            self.type = type
            self.userAddress = userAddress
            self.amount = amount
            self.timestamp = timestamp
        }
    }

    access(all) struct FunderStats {
        access(all) var totalFunded: UFix64
        
        init(totalFunded: UFix64) {
            self.totalFunded = totalFunded
        }

        access(contract) fun addFunding(_ amount: UFix64) {
            self.totalFunded = self.totalFunded + amount
        }

        access(all) view fun getTier(): String {
            if self.totalFunded >= 100.0 { return "Hero" }
            if self.totalFunded >= 50.0 { return "Champion" }
            return "Supporter"
        }
    }

    // Struct to hold the internal state of a claimed float
    access(all) struct FloatData {
        access(all) let amount: UFix64
        access(all) let expiresAt: UFix64

        init(amount: UFix64, expiresAt: UFix64) {
            self.amount = amount
            self.expiresAt = expiresAt
        }
    }

    // The Master Object-Oriented Accounting Record
    access(all) struct Tab {
        access(all) let id: String
        access(all) let merchantID: String
        
        // Explicit Ledgers
        access(all) var totalFunded: UFix64
        access(all) var totalConsumed: UFix64
        access(all) var pendingAmount: UFix64
        
        // Off-Chain Settlement Tracking for the Merchant
        access(all) var pendingRevenuePayouts: UFix64
        access(all) var yieldAccrued: UFix64

        // State Tracking (The Rolodex)
        access(all) var activeFloats: {Address: FloatData}
        access(all) var funders: {Address: FunderStats}
        access(all) var history: [HistoryEvent]
        access(all) var redemptionCount: UInt64
        access(all) var isActive: Bool

        // HACKATHON ONLY: Tracks lifetime consumed floats per user for the demo Profile page
        // In production, an off-chain indexer would query `FloatConsumed` events instead.
        access(all) var lifetimeConsumedFloats: {Address: UInt64}

        init(id: String, merchantID: String) {
            self.id = id
            self.merchantID = merchantID
            
            self.totalFunded = 0.0
            self.totalConsumed = 0.0
            self.pendingAmount = 0.0
            
            self.pendingRevenuePayouts = 0.0
            self.yieldAccrued = 0.0

            self.activeFloats = {}
            self.funders = {}
            self.history = []
            self.redemptionCount = 0
            self.isActive = true
            self.lifetimeConsumedFloats = {}
        }

        // The single Source of Truth formula for Available Liquidity
        access(all) view fun getAvailableBalance(): UFix64 {
            return self.totalFunded - self.totalConsumed - self.pendingAmount
        }

        // --- Mutating Helpers for Cadence 1.0 Access Strictness ---
        access(contract) fun addFunded(_ amount: UFix64) { self.totalFunded = self.totalFunded + amount }
        access(contract) fun addPending(_ amount: UFix64) { self.pendingAmount = self.pendingAmount + amount }
        access(contract) fun deductPending(_ amount: UFix64) { self.pendingAmount = self.pendingAmount - amount }
        access(contract) fun addConsumed(_ amount: UFix64) { self.totalConsumed = self.totalConsumed + amount }
        access(contract) fun addRevenue(_ amount: UFix64) { self.pendingRevenuePayouts = self.pendingRevenuePayouts + amount }
        access(contract) fun deductRevenue(_ amount: UFix64) { self.pendingRevenuePayouts = self.pendingRevenuePayouts - amount }
        access(contract) fun updateYield(yieldVaultAccrued: UFix64) {
            self.yieldAccrued = self.yieldAccrued + yieldVaultAccrued
        }
        access(contract) fun deductYield(_ amount: UFix64) { self.yieldAccrued = self.yieldAccrued - amount }
        access(contract) fun incRedemptions() { self.redemptionCount = self.redemptionCount + 1 }
        access(contract) fun toggleActive(_ active: Bool) { self.isActive = active }
    }

    // The Physical Ticket primitive (UX Source of Truth)
    access(all) resource interface PublicReceipt {
        access(all) let tabID: String
        access(all) let claimerAddress: Address
        access(all) let amount: UFix64
        access(all) let expiresAt: UFix64
    }

    access(all) resource FloatReceipt: PublicReceipt {
        access(all) let tabID: String
        access(all) let claimerAddress: Address
        access(all) let amount: UFix64
        access(all) let expiresAt: UFix64

        init(tabID: String, claimerAddress: Address, amount: UFix64, expiresAt: UFix64) {
            self.tabID = tabID
            self.claimerAddress = claimerAddress
            self.amount = amount
            self.expiresAt = expiresAt
        }
    }

    // --- Admin & Contract Methods ---

    // Create a new Tab
    access(all) fun createTab(tabID: String, merchantID: String) {
        pre {
            self.tabs[tabID] == nil: "Tab already exists for this tabID"
        }
        self.tabs[tabID] = Tab(id: tabID, merchantID: merchantID)
    }

    // Deposit physically locks funds into the reserve and logs to the Tab
    access(all) fun deposit(tabID: String, paymentVault: @{FungibleToken.Vault}, funderAddress: Address) {
        pre {
            self.tabs[tabID] != nil: "Tab does not exist"
            paymentVault.balance > 0.0: "Must deposit more than 0 tokens"
        }
        
        let amount = paymentVault.balance
        
        // 1. Physically lock tokens
        self.reserveVault.deposit(from: <-paymentVault)

        // 2. Clone tab for modification
        var tab = self.tabs[tabID]!

        // 3. Process Yield on the prior Idle Principal
        let oldIdlePrincipal = tab.getAvailableBalance()
        let accrued = YieldVault.updatePrincipal(merchantID: tab.merchantID, newPrincipal: oldIdlePrincipal + amount)
        tab.updateYield(yieldVaultAccrued: accrued)

        // 4. Update Explicit Ledger
        tab.addFunded(amount)
        
        // 5. Update Funder Stats
        if tab.funders[funderAddress] == nil {
            tab.funders.insert(key: funderAddress, FunderStats(totalFunded: amount))
        } else {
            let stats = tab.funders[funderAddress]!
            stats.addFunding(amount)
            tab.funders.insert(key: funderAddress, stats)
        }

        // 6. Log History
        let historyRecord = HistoryEvent(type: "fund", userAddress: funderAddress, amount: amount, timestamp: getCurrentBlock().timestamp)
        tab.history.append(historyRecord)
        if tab.history.length > 20 {
            tab.history.remove(at: 0)
        }

        // Save tab back
        self.tabs[tabID] = tab
    }

    // Toggle Tab Active Status
    access(all) fun toggleActive(tabID: String, active: Bool) {
        pre {
            self.tabs[tabID] != nil: "Tab does not exist"
        }
        var tab = self.tabs[tabID]!
        tab.toggleActive(active)
        self.tabs[tabID] = tab
    }

    // Helper to get all expired claims for a tab (for Lazy Harvesting)
    access(all) fun getExpiredClaims(tabID: String): [Address] {
        var expired: [Address] = []
        if let tab = self.tabs[tabID] {
            let now = getCurrentBlock().timestamp
            for address in tab.activeFloats.keys {
                if let floatData = tab.activeFloats[address] {
                    if floatData.expiresAt < now {
                        expired.append(address)
                    }
                }
            }
        }
        return expired
    }

    // Neighbor claims a Float from the Tab
    access(all) fun claimFloat(tabID: String, amount: UFix64, claimerAddress: Address): @FloatReceipt {
        pre {
            self.tabs[tabID] != nil: "Tab does not exist"
            self.tabs[tabID]!.isActive == true: "Tab is not active"
            self.tabs[tabID]!.activeFloats[claimerAddress] == nil: "Neighbor already has an active claim for this tab"
        }

        var tab = self.tabs[tabID]!
        
        // --- LAZY HARVESTING ---
        // If exact available is too low, try to harvest one expired float to recycle liquidity
        if tab.getAvailableBalance() < amount {
            let expiredAddresses = self.getExpiredClaims(tabID: tabID)
            if expiredAddresses.length > 0 {
                let recycleAddress = expiredAddresses[0]
                let expiredData = tab.activeFloats[recycleAddress]!
                
                // Process Yield before touching principal
                let oldIdlePrincipal = tab.getAvailableBalance()
                let accrued = YieldVault.updatePrincipal(merchantID: tab.merchantID, newPrincipal: oldIdlePrincipal + expiredData.amount)
                tab.updateYield(yieldVaultAccrued: accrued)

                // Free the pending funds back to the idle pool
                tab.deductPending(expiredData.amount)
                tab.activeFloats.remove(key: recycleAddress)
            }
        }

        assert(tab.getAvailableBalance() >= amount, message: "Insufficient Tab balance even after recycling expired funds")

        // 1. Process Yield before locking principal
        let oldIdlePrincipal = tab.getAvailableBalance()
        let accrued = YieldVault.updatePrincipal(merchantID: tab.merchantID, newPrincipal: oldIdlePrincipal - amount)
        tab.updateYield(yieldVaultAccrued: accrued)

        // 2. Lock Funds inside the explicit Pending ledger
        tab.addPending(amount)

        // 3. Set Expiration
        let expiration = getCurrentBlock().timestamp + 900.0

        // 4. Update the active registry (Rolodex)
        tab.activeFloats.insert(key: claimerAddress, FloatData(amount: amount, expiresAt: expiration))

        // Save tab state
        self.tabs[tabID] = tab

        // 5. Mint physical ticket (stamped with data for UX lock)
        return <-create FloatReceipt(tabID: tabID, claimerAddress: claimerAddress, amount: amount, expiresAt: expiration)
    }

    // The Discard (Cleaning): Allowed to cleanly remove the user from the Rolodex
    access(all) fun discardReceipt(receipt: @FloatReceipt) {
        let tabID = receipt.tabID
        let claimerAddress = receipt.claimerAddress
        
        if self.tabs[tabID] != nil {
            var tab = self.tabs[tabID]!
            if let floatData = tab.activeFloats[claimerAddress] {
                // Return funds to the idle pool
                let oldIdlePrincipal = tab.getAvailableBalance()
                let accrued = YieldVault.updatePrincipal(merchantID: tab.merchantID, newPrincipal: oldIdlePrincipal + floatData.amount)
                tab.updateYield(yieldVaultAccrued: accrued)
                
                tab.deductPending(floatData.amount)
                tab.activeFloats.remove(key: claimerAddress)
                
                self.tabs[tabID] = tab
            }
        }
        destroy receipt
    }

    // Consume a Float via Stripe JIT, moving funds from Pending to Consumed
    access(all) fun consumeFloat(receipt: @FloatReceipt, spentAmount: UFix64) {
        let tabID = receipt.tabID
        let claimerAddress = receipt.claimerAddress
        self.internalConsume(tabID: tabID, claimerAddress: claimerAddress, spentAmount: spentAmount)
        destroy receipt
    }

    access(all) fun adminConsumeFloat(tabID: String, claimerAddress: Address, spentAmount: UFix64) {
        self.internalConsume(tabID: tabID, claimerAddress: claimerAddress, spentAmount: spentAmount)
    }

    // Internal helper to handle the actual ledger math for both consume methods
    access(contract) fun internalConsume(tabID: String, claimerAddress: Address, spentAmount: UFix64) {
        var tab = self.tabs[tabID] ?? panic("Merchant tab does not exist.")
        let floatData = tab.activeFloats[claimerAddress] ?? panic("No active float found. It may have expired and been swept.")

        assert(spentAmount <= floatData.amount, message: "Cannot spend more than the Float's maxAmount")
        assert(floatData.expiresAt >= getCurrentBlock().timestamp, message: "Float is expired!")

        // 1. Remove from Rolodex
        tab.activeFloats.remove(key: claimerAddress)

        // 2. Compute unspent change that returns to the idle pool
        let unspent = floatData.amount - spentAmount

        // 3. Yield Processing: Idle Capital increases by unspent change
        let oldIdlePrincipal = tab.getAvailableBalance()
        let accrued = YieldVault.updatePrincipal(merchantID: tab.merchantID, newPrincipal: oldIdlePrincipal + unspent)
        tab.updateYield(yieldVaultAccrued: accrued)

        // 4. Update Explicit Ledgers
        tab.deductPending(floatData.amount)
        tab.addConsumed(spentAmount)
        tab.addRevenue(spentAmount)

        // 5. Update Metrics
        tab.incRedemptions()
        
        let currentConsumedCount = tab.lifetimeConsumedFloats[claimerAddress] ?? 0
        tab.lifetimeConsumedFloats.insert(key: claimerAddress, currentConsumedCount + 1)
        
        let historyRecord = HistoryEvent(type: "consume", userAddress: claimerAddress, amount: spentAmount, timestamp: getCurrentBlock().timestamp)
        tab.history.append(historyRecord)
        if tab.history.length > 20 {
            tab.history.remove(at: 0)
        }

        self.tabs[tabID] = tab

        // Emit the event so the Frontend can reactively transition to the Success screen
        emit FloatConsumed(tabID: tabID, claimerAddress: claimerAddress, spentAmount: spentAmount)
    }

    // Voluntarily return a float to the pool before expiration
    access(all) fun returnFloat(receipt: @FloatReceipt) {
        let tabID = receipt.tabID
        let claimerAddress = receipt.claimerAddress
        
        if self.tabs[tabID] != nil {
            var tab = self.tabs[tabID]!
            if let floatData = tab.activeFloats[claimerAddress] {
                let oldIdlePrincipal = tab.getAvailableBalance()
                let accrued = YieldVault.updatePrincipal(merchantID: tab.merchantID, newPrincipal: oldIdlePrincipal + floatData.amount)
                tab.updateYield(yieldVaultAccrued: accrued)
                
                tab.deductPending(floatData.amount)
                tab.activeFloats.remove(key: claimerAddress)
                
                self.tabs[tabID] = tab
            }
        }
        destroy receipt
    }

    // Admin force sweep all (For testing/Hackathon MVP)
    access(all) fun adminForceSweepAll(tabID: String) {
        if self.tabs[tabID] != nil {
            var tab = self.tabs[tabID]!
            var totalReclaimed = 0.0

            for address in tab.activeFloats.keys {
                let amount = tab.activeFloats[address]!.amount
                totalReclaimed = totalReclaimed + amount
                tab.activeFloats.remove(key: address)
            }

            if totalReclaimed > 0.0 {
                let oldIdlePrincipal = tab.getAvailableBalance()
                let accrued = YieldVault.updatePrincipal(merchantID: tab.merchantID, newPrincipal: oldIdlePrincipal + totalReclaimed)
                tab.updateYield(yieldVaultAccrued: accrued)
                
                tab.deductPending(totalReclaimed)
                self.tabs[tabID] = tab
            }
        }
    }

    // Off-Chain Settlement
    access(all) fun adminWithdrawPayout(tabID: String, amount: UFix64, isYield: Bool, receiver: &{FungibleToken.Receiver}) {
        pre {
            self.tabs[tabID] != nil: "Tab does not exist"
            (isYield ? self.tabs[tabID]!.yieldAccrued : self.tabs[tabID]!.pendingRevenuePayouts) >= amount: "Cannot withdraw more than is owed"
        }
        
        var updatedTab = self.tabs[tabID]!

        if isYield {
            updatedTab.deductYield(amount)
        } else {
            updatedTab.deductRevenue(amount)
        }

        self.tabs[tabID] = updatedTab

        let payoutVault <- self.reserveVault.withdraw(amount: amount)
        receiver.deposit(from: <-payoutVault)
    }

    init() {
        self.tabs = {}
        // Initialize the empty Master Reserve Vault to hold all protocol FlowTokens
        self.reserveVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
    }
}
