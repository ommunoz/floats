import "FloatsTabManager"

access(all) fun main(merchantID: String): Bool {
    return FloatsTabManager.isActive(merchantID: merchantID)
}
