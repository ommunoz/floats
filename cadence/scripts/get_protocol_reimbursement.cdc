import "FloatsTabManager"

// Returns the total reimbursement owed to the Floats Treasury across all tabs
// for Stripe charges already paid by the Treasury on behalf of the protocol.
access(all) fun main(): UFix64 {
    return FloatsTabManager.reimbursementOwed
}
