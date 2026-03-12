import "FungibleToken"
import "FlowToken"
import "YieldVault"

access(all) contract FloatsTabManager {
        
    // Dictionary mapping merchantID to their available (locked but unspent) float balance
    access(all) var merchantBalances: {String: UFix64}

    // --- NEW: Option C Protocol-Held Payout Ledgers ---
    // Tracks the fiat value of floats actually consumed at the merchant.
    access(all) var merchantRevenuePayouts: {String: UFix64}
    // Tracks the DeFi yield earned on the merchant's idle capital.
    access(all) var merchantYieldPayouts: {String: UFix64}

    // --- NEW: Option C The Master Vault ---
    // This vault actually holds the physical FlowTokens backing the protocol 1:1.
    access(all) let reserveVault: @{FungibleToken.Vault}
    // Option C: Native Leaderboard Registry
    // Contextual tracking: merchantID -> funderAddress -> FunderStats
    access(all) var tabFunders: {String: {Address: FunderStats}}

    // Lifetime count of floats successfully consumed at each tab (social proof metric)
    access(all) var tabRedemptionCount: {String: UInt64}

    // Chronological log of recent "fund" and "consume" events for the UI feed (capped at 20)
    access(all) var tabHistory: {String: [HistoryEvent]}

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
        // In Cadence 1.0, to allow the outer contract to modify these directly while 
        // still allowing public read access, we use public getter functions or change the access modifier.
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

    // Dictionary mapping merchantID to their active status
    access(all) var activeFlags: {String: Bool}

    // Registry tracking the actual locked funds for claimed floats
    // Structure: activeFloats[merchantID][claimerAddress] = FloatData
    access(all) var activeFloats: {String: {Address: FloatData}}

    // Struct to hold the actual value of a claimed Float inside the contract
    access(all) struct FloatData {
        access(all) let amount: UFix64
        access(all) let expiresAt: UFix64

        init(amount: UFix64, expiresAt: UFix64) {
            self.amount = amount
            self.expiresAt = expiresAt
        }
    }

    // Admin function to create a new Tab for a merchant
    access(all) fun createTab(merchantID: String) {
        pre {
            self.merchantBalances[merchantID] == nil: "Tab already exists for this merchantID"
        }
        // Initialize balances
        self.merchantBalances[merchantID] = 0.0
        self.merchantRevenuePayouts[merchantID] = 0.0
        self.merchantYieldPayouts[merchantID] = 0.0
        
        self.activeFlags[merchantID] = true
        self.activeFloats[merchantID] = {}
        self.tabFunders[merchantID] = {}
        self.tabRedemptionCount[merchantID] = 0
        self.tabHistory[merchantID] = []
    }

    // --- NEW: Option C True DeFi Deposit ---
    // Takes a physical FlowToken.Vault instead of an arbitrary number.
    access(all) fun deposit(merchantID: String, paymentVault: @{FungibleToken.Vault}, funderAddress: Address) {
        pre {
            self.merchantBalances[merchantID] != nil: "Tab does not exist for this merchantID"
            paymentVault.balance > 0.0: "Must deposit more than 0 tokens"
        }
        
        let amount = paymentVault.balance

        // 1. Physically lock the tokens in the Master Reserve Vault
        self.reserveVault.deposit(from: <-paymentVault)

        // 2. Update the internal ledger and secure the yield math
        self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + amount)
        
        // 3. Update the Leaderboard Registry
        if self.tabFunders[merchantID]![funderAddress] == nil {
            self.tabFunders[merchantID]!.insert(key: funderAddress, FunderStats(totalFunded: amount))
        } else {
            let stats = self.tabFunders[merchantID]![funderAddress]!
            stats.addFunding(amount)
            self.tabFunders[merchantID]!.insert(key: funderAddress, stats)
        }

        // 4. Log the chronological history event
        let historyRecord = HistoryEvent(type: "fund", userAddress: funderAddress, amount: amount, timestamp: getCurrentBlock().timestamp)
        self.tabHistory[merchantID]!.append(historyRecord)
        if self.tabHistory[merchantID]!.length > 20 {
            self.tabHistory[merchantID]!.remove(at: 0)
        }
    }

    // Admin function to toggle the active status of a Tab
    access(all) fun toggleActive(merchantID: String, active: Bool) {
        pre {
            self.activeFlags[merchantID] != nil: "Tab does not exist for this merchantID"
        }
        self.activeFlags[merchantID] = active
    }

    // Public read function to get the current unspent balance of a merchant's Tab
    access(all) fun getBalance(merchantID: String): UFix64 {
        if let balance = self.merchantBalances[merchantID] {
            return balance
        }
        return 0.0
    }

    // Public read function to get the merchant's pending revenue payout (Stripe IOU)
    access(all) fun getRevenuePayout(merchantID: String): UFix64 {
        if let revenue = self.merchantRevenuePayouts[merchantID] {
            return revenue
        }
        return 0.0
    }

    // Public read function to get the merchant's pending yield payout (DeFi Income)
    access(all) fun getYieldPayout(merchantID: String): UFix64 {
        if let yield = self.merchantYieldPayouts[merchantID] {
            return yield
        }
        return 0.0
    }

    // Public read function to check if a merchant's Tab is active
    access(all) fun isActive(merchantID: String): Bool {
        if let active = self.activeFlags[merchantID] {
            return active
        }
        return false
    }

    // Helper function to update yield whenever the tab balance changes securely
    access(contract) fun updateTabBalanceAndYield(merchantID: String, newBalance: UFix64) {
        // Calculate accrued yield based on the *old* principal balance
        let accrued = YieldVault.updatePrincipal(merchantID: merchantID, newPrincipal: newBalance)
        
        // Add the newly accrued yield directly into the merchant's Yield Payout ledger
        if self.merchantYieldPayouts[merchantID] != nil {
            self.merchantYieldPayouts[merchantID] = self.merchantYieldPayouts[merchantID]! + accrued
        } else {
            self.merchantYieldPayouts[merchantID] = accrued
        }
        
        // Finally, update the Tab's main available balance ledger
        self.merchantBalances[merchantID] = newBalance
    }

    // The Receipt primitive: A non-valuable token proving the user initiated a claim
    access(all) resource FloatReceipt {
        access(all) let merchantID: String
        access(all) let claimerAddress: Address

        init(merchantID: String, claimerAddress: Address) {
            self.merchantID = merchantID
            self.claimerAddress = claimerAddress
        }
    }

    // Neighbor claims a Float from the Tab
    access(all) fun claimFloat(merchantID: String, amount: UFix64, claimerAddress: Address): @FloatReceipt {
        pre {
            self.activeFlags[merchantID] == true: "Tab is not active"
            self.merchantBalances[merchantID] != nil: "Tab does not exist"
            self.merchantBalances[merchantID]! >= amount: "Insufficient Tab balance"
            self.activeFloats[merchantID]![claimerAddress] == nil: "Neighbor already has an active claim for this merchant"
        }

        // 1. Deduct from the Tab balance (lock the funds out of circulation)
        self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! - amount)

        // 2. Calculate Expiration
        let expiration = getCurrentBlock().timestamp + 900.0

        // 3. Store the actual value in the contract's registry
        let floatData = FloatData(amount: amount, expiresAt: expiration)
        self.activeFloats[merchantID]!.insert(key: claimerAddress, floatData)

        // 4. Mint and return the valueless Receipt resource to the user
        return <-create FloatReceipt(merchantID: merchantID, claimerAddress: claimerAddress)
    }

    // Consume a Float via Stripe JIT, moving funds from "Locked" to "Revenue Payout"
    access(all) fun consumeFloat(receipt: @FloatReceipt, spentAmount: UFix64) {
        let merchantID = receipt.merchantID
        let claimerAddress = receipt.claimerAddress
        
        // Use the internal consumption helper
        self.internalConsume(merchantID: merchantID, claimerAddress: claimerAddress, spentAmount: spentAmount)

        // Destroy the receipt since it was used
        destroy receipt
    }

    // --- NEW: Option C Backend JIT Consumption ---
    // The Protocol Admin calls this when the Stripe Webhook authorizes a Tap to Pay.
    // The admin doesn't have the user's hardware wallet receipt, so they can bypass it.
    access(all) fun adminConsumeFloat(merchantID: String, claimerAddress: Address, spentAmount: UFix64) {
        // Use the internal consumption helper
        self.internalConsume(merchantID: merchantID, claimerAddress: claimerAddress, spentAmount: spentAmount)
    }

    // Internal helper to handle the actual ledger math for both consume methods
    access(contract) fun internalConsume(merchantID: String, claimerAddress: Address, spentAmount: UFix64) {
        let merchantFloats = self.activeFloats[merchantID] 
            ?? panic("Merchant tab does not exist or has no active floats.")

        let floatData = merchantFloats[claimerAddress] 
            ?? panic("No active float found. It may have expired and been swept.")

        assert(spentAmount <= floatData.amount, message: "Cannot spend more than the Float's maxAmount")
        assert(floatData.expiresAt >= getCurrentBlock().timestamp, message: "Float is expired!")

        // Remove from the Active Floats registry
        self.activeFloats[merchantID]!.remove(key: claimerAddress)

        // Add the officially spent amount directly to the Merchant's Revenue Payout ledger.
        self.merchantRevenuePayouts[merchantID] = self.merchantRevenuePayouts[merchantID]! + spentAmount

        // Increment the lifetime redemption counter for social proof
        self.tabRedemptionCount[merchantID] = (self.tabRedemptionCount[merchantID] ?? 0) + 1

        // Return *only* the unspent change back to the main Tab pool
        let unspent = floatData.amount - spentAmount
        self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + unspent)

        // Log the chronological history event
        let historyRecord = HistoryEvent(type: "consume", userAddress: claimerAddress, amount: spentAmount, timestamp: getCurrentBlock().timestamp)
        self.tabHistory[merchantID]!.append(historyRecord)
        if self.tabHistory[merchantID]!.length > 20 {
            self.tabHistory[merchantID]!.remove(at: 0)
        }
    }

    // Specific sweep for a single expired float
    access(all) fun sweepExpiredFloat(merchantID: String, claimerAddress: Address) {
        if let floatData = self.activeFloats[merchantID]![claimerAddress] {
            if floatData.expiresAt < getCurrentBlock().timestamp {
                self.activeFloats[merchantID]!.remove(key: claimerAddress)
                self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + floatData.amount)
            } else {
                panic("Float is not yet expired!")
            }
        }
    }

    // Admin force sweep all (For testing/Hackathon MVP)
    access(all) fun adminForceSweepAll(merchantID: String) {
        if let floats = self.activeFloats[merchantID] {
            for address in floats.keys {
                let amount = floats[address]!.amount
                self.activeFloats[merchantID]!.remove(key: address)
                self.updateTabBalanceAndYield(merchantID: merchantID, newBalance: self.merchantBalances[merchantID]! + amount)
            }
        }
    }

    // --- NEW: Option C Off-Chain Settlement ---
    // The Protocol Admin calls this when they initiate a real-world Stripe bank transfer.
    // This physically extracts the USDC (FlowToken) out of the smart contract's Reserve Vault
    // and deposits it into the Protocol Treasury Wallet, balancing the fiat output exactly.
    access(all) fun adminWithdrawPayout(merchantID: String, amount: UFix64, isYield: Bool, receiver: &{FungibleToken.Receiver}) {
        pre {
            (isYield ? self.merchantYieldPayouts[merchantID]! : self.merchantRevenuePayouts[merchantID]!) >= amount: "Cannot withdraw more than is owed to this merchant"
        }
        
        let currentOwed = isYield ? self.merchantYieldPayouts[merchantID]! : self.merchantRevenuePayouts[merchantID]!

        // Deduct from the appropriate internal ledger
        if isYield {
            self.merchantYieldPayouts[merchantID] = currentOwed - amount
        } else {
            self.merchantRevenuePayouts[merchantID] = currentOwed - amount
        }

        // Physically extract the backed tokens from the Master Reserve Vault
        let payoutVault <- self.reserveVault.withdraw(amount: amount)
        
        // Push the physical tokens out to the Treasury Wallet
        receiver.deposit(from: <-payoutVault)
    }

    init() {
        self.merchantBalances = {}
        self.merchantRevenuePayouts = {}
        self.merchantYieldPayouts = {}
        
        self.activeFlags = {}
        self.activeFloats = {}
        self.tabFunders = {}
        self.tabRedemptionCount = {}
        self.tabHistory = {}

        // Initialize the empty Master Reserve Vault to hold all protocol FlowTokens
        self.reserveVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
    }
}
