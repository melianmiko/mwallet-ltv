/**
 * Update checker
 * @TODO: Automaticly download and install updates
 */
class Updater {
	static checkAppUpdate() {return new Promise((resolve, reject) => {
		fetch("https://gitlab.com/api/v4/projects/melianmiko%2Fmwallet-ltv/repository/tags").then((r) => {
			return r.json();
		}).then((d) => {
			var lastTag = d[0].name,
				version = mWallet.version;
			if(lastTag != version) {
				resolve("https://gitlab.com/mhbrgn/mwallet-ltv/-/tags/"+lastTag);
			} else resolve(false);
		}).catch((e) => {
			reject(e);
		})
	})}
}
