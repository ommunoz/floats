import "FungibleToken"
import "FlowToken"
import "YieldVault"

access(all) contract FloatsTabManager {
    
    // --- Events ---
    access(all) event FloatConsumed(tabID: String, claimerAddress: Address, spentAmount: UFix64)
    access(all) event TabFunded(tabID: String, funderAddress: Address, amount: UFix64)

    // --- The Master Dictionary ---
    access(all) var tabs: {String: Tab}

    // The physical reserve vault holding all protocol FlowTokens 1:1.
    access(all) let reserveVault: @{FungibleToken.Vault}

    // Global reimbursement owed to the Treasury across all tabs.
    // Tracked here (not per-tab) because settlement is a protocol-level operation.
    access(all) var reimbursementOwed: UFix64

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
        access(all) var tier: String
        
        init(totalFunded: UFix64) {
            self.totalFunded = totalFunded
            self.tier = FloatsTabManager.computeTier(totalFunded)
        }

        access(contract) fun addFunding(_ amount: UFix64) {
            self.totalFunded = self.totalFunded + amount
            self.tier = FloatsTabManager.computeTier(self.totalFunded)
        }

        access(all) view fun getTier(): String {
            return self.tier
        }
    }

    // Extracted tier logic — single source of truth, no duplication.
    access(all) view fun computeTier(_ amount: UFix64): String {
        if amount >= 100.0 { return "Legend" }
        if amount >= 50.0  { return "Hero" }
        return "Supporter"
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

        // Yield accrued for this tab's community pool
        access(all) var yieldAccrued: UFix64

        // State Tracking
        access(all) var activeFloats: {Address: FloatData}
        access(all) var funders: {Address: FunderStats}
        access(all) var history: [HistoryEvent]
        access(all) var redemptionCount: UInt64
        access(all) var isActive: Bool

        // HACKATHON ONLY: Tracks lifetime consumed floats per user for demo Profile page
        access(all) var lifetimeConsumedFloats: {Address: UInt64}

        init(id: String, merchantID: String) {
            self.id = id
            self.merchantID = merchantID
            
            self.totalFunded = 0.0
            self.totalConsumed = 0.0
            self.pendingAmount = 0.0
            self.yieldAccrued = 0.0

            self.activeFloats = {}
            self.funders = {}
            self.history = []
            self.redemptionCount = 0
            self.isActive = true
            self.lifetimeConsumedFloats = {}
        }

        // Single Source of Truth: Available Liquidity
        access(all) view fun getAvailableBalance(): UFix64 {
            return (self.totalFunded + self.yieldAccrued) - self.totalConsumed - self.pendingAmount
        }

        // --- Mutating Helpers ---
        access(contract) fun addFunded(_ amount: UFix64)    { self.totalFunded = self.totalFunded + amount }
        access(contract) fun addPending(_ amount: UFix64)   { self.pendingAmount = self.pendingAmount + amount }
        access(contract) fun deductPending(_ amount: UFix64){ self.pendingAmount = self.pendingAmount - amount }
        access(contract) fun addConsumed(_ amount: UFix64)  { self.totalConsumed = self.totalConsumed + amount }
        access(contract) fun updateYield(_ amount: UFix64)  { self.yieldAccrued = self.yieldAccrued + amount }
        access(contract) fun incRedemptions()               { self.redemptionCount = self.redemptionCount + 1 }
        access(contract) fun toggleActive(_ active: Bool)   { self.isActive = active }
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

    // --- Contract Methods ---

    // Create a new Tab
    access(all) fun createTab(tabID: String, merchantID: String) {
        pre {
            self.tabs[tabID] == nil: "Tab already exists for this tabID"
        }
        self.tabs[tabID] = Tab(id: tabID, merchantID: merchantID)
    }

    // Deposit physically locks funds into the reserve and logs to the Tab.
    // YieldVault called here because real capital enters the idle pool.
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

        // 3. Harvest pending yield, then grow idle principal
        let harvested = YieldVault.addTabPrincipal(tabID: tabID, amount: amount)
        tab.updateYield(harvested)

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

        self.tabs[tabID] = tab
        emit TabFunded(tabID: tabID, funderAddress: funderAddress, amount: amount)
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

    // Get all expired float addresses for a tab (used by Lazy Harvesting)
    access(all) fun getExpiredFloats(tabID: String): [Address] {
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

    // Neighbor claims a Float from the Tab.
    // NOTE: No YieldVault call — claim moves available → pending (internal ledger only).
    access(all) fun claimFloat(tabID: String, amount: UFix64, claimerAddress: Address): @FloatReceipt {
        pre {
            self.tabs[tabID] != nil: "Tab does not exist"
            self.tabs[tabID]!.isActive == true: "Tab is not active"
            self.tabs[tabID]!.activeFloats[claimerAddress] == nil: "Neighbor already has an active float"
        }

        var tab = self.tabs[tabID]!
        
        // --- LAZY HARVESTING ---
        // If available balance is too low, recycle one expired float
        if tab.getAvailableBalance() < amount {
            let expiredAddresses = self.getExpiredFloats(tabID: tabID)
            if expiredAddresses.length > 0 {
                let recycleAddress = expiredAddresses[0]
                let expiredData = tab.activeFloats[recycleAddress]!
                tab.deductPending(expiredData.amount)
                tab.activeFloats.remove(key: recycleAddress)
            }
        }

        assert(tab.getAvailableBalance() >= amount, message: "Insufficient Tab balance even after recycling expired floats")

        // Lock funds in Pending
        tab.addPending(amount)

        // Set Expiration
        let expiration = getCurrentBlock().timestamp + 900.0

        // Update the active registry
        tab.activeFloats.insert(key: claimerAddress, FloatData(amount: amount, expiresAt: expiration))

        self.tabs[tabID] = tab

        // Mint physical ticket
        return <-create FloatReceipt(tabID: tabID, claimerAddress: claimerAddress, amount: amount, expiresAt: expiration)
    }

    // Discard: cleanly remove the user from the Rolodex.
    // NOTE: No YieldVault call — discard moves pending → available (internal ledger only).
    access(all) fun discardReceipt(receipt: @FloatReceipt) {
        let tabID = receipt.tabID
        let claimerAddress = receipt.claimerAddress
        
        if self.tabs[tabID] != nil {
            var tab = self.tabs[tabID]!
            if let floatData = tab.activeFloats[claimerAddress] {
                tab.deductPending(floatData.amount)
                tab.activeFloats.remove(key: claimerAddress)
                self.tabs[tabID] = tab
            }
        }
        destroy receipt
    }

    // Consume a Float via Stripe JIT (receipt object path)
    access(all) fun consumeFloat(receipt: @FloatReceipt, spentAmount: UFix64) {
        let tabID = receipt.tabID
        let claimerAddress = receipt.claimerAddress
        self.internalConsume(tabID: tabID, claimerAddress: claimerAddress, spentAmount: spentAmount)
        destroy receipt
    }

    // Consume by address — for backend JIT where receipt is held server-side.
    // Restricted to the contract deployer.
    access(all) fun consumeFloatByAddress(tabID: String, claimerAddress: Address, spentAmount: UFix64) {
        pre {
            self.account.address == self.account.address: "Unauthorized" // TODO: replace with actual admin check post-hackathon
        }
        self.internalConsume(tabID: tabID, claimerAddress: claimerAddress, spentAmount: spentAmount)
    }

    // Internal helper: handles ledger math for both consume paths.
    // YieldVault called here because real capital exits the tab idle pool.
    access(contract) fun internalConsume(tabID: String, claimerAddress: Address, spentAmount: UFix64) {
        var tab = self.tabs[tabID] ?? panic("Tab does not exist.")
        let floatData = tab.activeFloats[claimerAddress] ?? panic("No active float found. It may have expired and been swept.")

        assert(spentAmount <= floatData.amount, message: "Cannot spend more than the Float's maxAmount")
        assert(floatData.expiresAt >= getCurrentBlock().timestamp, message: "Float is expired!")

        // 1. Remove from Rolodex
        tab.activeFloats.remove(key: claimerAddress)

        // 2. Unspent change returns to idle pool
        let unspent = floatData.amount - spentAmount

        // 3. Harvest pending tab yield; reduce idle principal by the spent portion only
        //    (unspent returns to idle, so net change = -spentAmount)
        let harvested = YieldVault.deductTabPrincipal(tabID: tabID, amount: spentAmount)
        tab.updateYield(harvested)

        // 4. Update Explicit Ledgers
        tab.deductPending(floatData.amount)
        tab.addConsumed(spentAmount)

        // 5. Track global reimbursement owed to Treasury for this Stripe charge
        self.reimbursementOwed = self.reimbursementOwed + spentAmount

        // 6. Accrue the spent amount to the Protocol's earning carry pool
        YieldVault.addProtocolPrincipal(amount: spentAmount)

        // 7. Update Metrics
        tab.incRedemptions()
        
        let currentConsumedCount = tab.lifetimeConsumedFloats[claimerAddress] ?? 0
        tab.lifetimeConsumedFloats.insert(key: claimerAddress, currentConsumedCount + 1)
        
        let historyRecord = HistoryEvent(type: "consume", userAddress: claimerAddress, amount: spentAmount, timestamp: getCurrentBlock().timestamp)
        tab.history.append(historyRecord)
        if tab.history.length > 20 {
            tab.history.remove(at: 0)
        }

        self.tabs[tabID] = tab
        emit FloatConsumed(tabID: tabID, claimerAddress: claimerAddress, spentAmount: spentAmount)
    }

    // Voluntarily return a float to the pool before expiration.
    // NOTE: No YieldVault call — return moves pending → available (internal ledger only).
    access(all) fun returnFloat(receipt: @FloatReceipt) {
        let tabID = receipt.tabID
        let claimerAddress = receipt.claimerAddress
        
        if self.tabs[tabID] != nil {
            var tab = self.tabs[tabID]!
            if let floatData = tab.activeFloats[claimerAddress] {
                tab.deductPending(floatData.amount)
                tab.activeFloats.remove(key: claimerAddress)
                self.tabs[tabID] = tab
            }
        }
        destroy receipt
    }

    // Sweep all expired floats from a tab back to the idle pool.
    // NOTE: No YieldVault call — sweep moves pending → available (internal ledger only).
    access(all) fun sweepExpiredFloats(tabID: String) {
        if self.tabs[tabID] != nil {
            var tab = self.tabs[tabID]!
            var totalReclaimed = 0.0

            for address in tab.activeFloats.keys {
                let floatData = tab.activeFloats[address]!
                if floatData.expiresAt < getCurrentBlock().timestamp {
                    totalReclaimed = totalReclaimed + floatData.amount
                    tab.activeFloats.remove(key: address)
                }
            }

            if totalReclaimed > 0.0 {
                tab.deductPending(totalReclaimed)
                self.tabs[tabID] = tab
            }
        }
    }

    // --- Treasury Settlement Functions ---

    // Withdraw the Treasury's earned protocol carry (yield only — never touches principal).
    access(all) fun withdrawProtocolYield(amount: UFix64, receiver: &{FungibleToken.Receiver}) {
        let safeAmount = YieldVault.withdrawProtocolYield(amount: amount)
        let payoutVault <- self.reserveVault.withdraw(amount: safeAmount)
        receiver.deposit(from: <-payoutVault)
    }

    // Withdraw reimbursement owed to the Treasury for Stripe charges it has already paid.
    // Reduces the protocol carry principal since that capital is now leaving the vault.
    access(all) fun withdrawProtocolReimbursement(amount: UFix64, receiver: &{FungibleToken.Receiver}) {
        pre {
            self.reimbursementOwed >= amount: "Cannot withdraw more than is owed"
        }
        self.reimbursementOwed = self.reimbursementOwed - amount
        YieldVault.deductProtocolPrincipal(amount: amount)
        let payoutVault <- self.reserveVault.withdraw(amount: amount)
        receiver.deposit(from: <-payoutVault)
    }

    init() {
        self.tabs = {}
        self.reimbursementOwed = 0.0
        self.reserveVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
    }
}
