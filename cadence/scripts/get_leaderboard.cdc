import FloatsTabManager from 0xf8d6e0586b0a20c7

access(all) fun main(merchantID: String): &{Address: FloatsTabManager.SponsorStats} {
    return FloatsTabManager.merchantSponsors[merchantID]!
}
