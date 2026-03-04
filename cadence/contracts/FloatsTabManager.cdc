access(all) contract FloatsTabManager {
        
    // Dictionary mapping merchantID to their funded balance
    access(all) var merchantBalances: {String: UFix64}
    
    // Dictionary mapping merchantID to their active status
    access(all) var activeFlags: {String: Bool}

    // Admin function to create a new Tab for a merchant
    // (For MVP, using contract level. Real world would use AuthAccount or Admin resource)
    access(all) fun createTab(merchantID: String) {
        pre {
            self.merchantBalances[merchantID] == nil: "Tab already exists for this merchantID"
        }
        // Initialize with 0.0 balance and set to active
        self.merchantBalances[merchantID] = 0.0
        self.activeFlags[merchantID] = true
    }

    // Admin function to deposit funds into a merchant's Tab
    access(all) fun deposit(merchantID: String, amount: UFix64) {
        pre {
            self.merchantBalances[merchantID] != nil: "Tab does not exist for this merchantID"
        }
        // Add the deposited amount to the existing balance
        self.merchantBalances[merchantID] = self.merchantBalances[merchantID]! + amount
    }

    // Admin function to toggle the active status of a Tab
    access(all) fun toggleActive(merchantID: String, active: Bool) {
        pre {
            self.activeFlags[merchantID] != nil: "Tab does not exist for this merchantID"
        }
        self.activeFlags[merchantID] = active
    }

    // Public read function to get the current balance of a merchant's Tab
    access(all) fun getBalance(merchantID: String): UFix64 {
        if let balance = self.merchantBalances[merchantID] {
            return balance
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

    init() {
        self.merchantBalances = {}
        self.activeFlags = {}
    }
}
