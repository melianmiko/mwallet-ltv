/**
 * Update checker
 * @TODO: Automaticly download and install updates
 */
class Updater {
	static checkAppUpdate() {return new Promise((resolve, reject) => {
		fetch("https://api.github.com/repos/mhbrgn/mWallet-LTV/releases").then((r) => {
			return r.json();
		}).then((d) => {
			var lastTag = d[0].tag_name,
				version = mWallet.version;
			if(lastTag != version) {
				resolve(d[0].html_url);
			} else resolve(false);
		}).catch((e) => {
			reject(e);
		})
	})}
}
