window.mWallet = {
	version: "v0.1.4",
	lang: {},
	defaultLang: "ru",
	connState: 0,
	allowAccountSettings: true,
	allowBackup: false,
	allowRecovery: false,
	allowMining: false,
	showDonate: true,
	launcherTools: {},
	sendCmd: function(args) {
		console.warn("SendCmd will be removed!");
		return mWallet.server.sendCmd(args);
	}
};

function getServer(srv) {
	if(srv == "remote") return new RemoteDaemon();
	if(srv == "debug") return new Debug();
	console.warn("Wallet "+srv+" not found!");
}

mWallet.launch = function() {
	Config.mainColor = "#f09";

	// Build languages
	mWallet.lang.ru = new Russian().getLang();

	if(!mWallet.launcherTools._stateView) {
		// Create state view screen
		// TODO: Use splash screen!
		var ss = new Screen();
		ss.markAsRoot();
		ss.setTitle("Wait...");
		ss.start();
		mWallet.launcherTools._stateView = ss;
	}

	// Load language
	var locale = navigator.language;
	if(!!localStorage.appLocale) locale = localStorage.appLocale;
	if(!mWallet.lang[locale]) locale = mWallet.defaultLang;
	console.log("Language", locale);
	window.appLocale = mWallet.lang[locale];

	// Load platform
	var platform = "browser";
	if(navigator.userAgent.indexOf("Electron") > 0) {
		// ELetron mode
		platform = "electron";
		mWallet.platform = new ElectronPlatform();
	} else if(!!window.cordova) {
		// Cordova (non-native)
		platform = "cordova";
		mWallet.platform = new CordovaPlatform();
	} else {
		// Browser
		mWallet.platform = new BrowserPlatform();
	}
	console.log("App platform", platform);

	mWallet.launcherTools.updateState(appLocale.launcher.stage_findWallet);

	mWallet.launcherTools.selectWallet().then((wallet) => {
		// After wallet selection
		mWallet.launcherTools.updateState(appLocale.launcher.stage_loadWallet);
		return mWallet.launcherTools.loadWallet(wallet);
	}).then(() => {
		// We are ready...
		mWallet.launcherTools._stateView.finish();
		mWallet.launcherTools._stateView = null;
		mWallet.launcherTools.updateState = null;
		new WalletHomeScreen().start();
	}).catch((e) => {
		console.error(e);
		new Alert().setMessage(e).show();
	})
}

mWallet.launcherTools.updateState = function(text) {
	console.log(text);
	mWallet.launcherTools._stateView.setTitle(text);
}

mWallet.launcherTools.selectWallet = function(){return new Promise((resolve, reject) => {
	if(!!mWallet.server) return reject("Wallet already loaded");
	var wallets = mWallet.launcherTools.getWallets();

	if(mWallet.platform.hasNative && wallets.length == 0) {
		// Load native wallet
		resolve("native::");
	} else if(!mWallet.platform.hasNative && wallets.length == 1) {
		// Load saved wallet
		resolve(wallets[0]);
	} else {
		// Create selector menu and wait for answer
		var slc = new BootMenu();
		slc.waitForSelect().then((w) => {
			resolve(w);
		});
		slc.start();
	}
})};

mWallet.launcherTools.getWallets = function() {
	if(!localStorage.myWallets) localStorage.myWallets = "[]";
	return JSON.parse(localStorage.myWallets);
}

mWallet.launcherTools.loadWallet = function(data) {return new Promise((resolve, reject) => {
	if(!!mWallet.server) return reject("Aleady loaded!");
	var name = data.split(":")[0],
		id = data.split(":")[1],
		displayName = data.substr(name.length+id.length+2);

	if(name === "native") {
		console.log("loading native wallet...");
		mWallet.platform.launchNative()
			.then((d) => { resolve(d);  })
			.catch((e) => { reject(e); })
		return;
	}

	// Load wallet script
	console.log("loading wallet "+name);
	mWallet.server = getServer(name);
	mWallet.server.name = name;
	mWallet.server.id = id;

	mWallet.server.launch().then(resolve, reject);
})};

mWallet.crash = function(d) {
	var d = new Dialog()
		.setTitle(appLocale.launcher.crash_title)
		.setMessage(d)
		.addButton(new Button().setText(appLocale.launcher.btn_recovery).setOnClickListener(() => {
			d.hide();
			new RecoverySettingsScreen().start();
		}))
		.addButton(new Button().setText(appLocale.launcher.btn_ok).setOnClickListener(() => {
			d.hide();
		}))
		.show();
}
