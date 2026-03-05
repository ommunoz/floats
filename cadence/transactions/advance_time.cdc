// Running this transaction forces the local emulator to mint a new block.
// This advances `getCurrentBlock().timestamp` closer to real-world time.

transaction {
    prepare(signer: auth(Storage) &Account) {
        log("Block minted. Time advanced!")
    }
    execute {
    }
}
