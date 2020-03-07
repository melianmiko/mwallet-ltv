window.mWallet = {
	locales: ["ru"],
	hasNative: false,
	connState: 0,
	server: {},
	platform: {},
	allowAccountSettings: true,
	allowBackup: false,
	allowRecovery: false,
	showDonate: true,
	launcherTools: {}
};

mWallet.launch = function() {
	if(!mWallet.launcherTools._stateView) {
		// Create state view screen
		// TODO: Use splash screen!
		var ss = new Screen();
		ss.markAsRoot();
		ss.setTitle("Wait...");
		ss.start();
		mWallet.launcherTools._stateView = ss;
	}

	mWallet.launcherTools.loadLocale().then(() => {
		mWallet.launcherTools.updateState(appLocale.launcher.stage_platform);
		return mWallet.launcherTools.launchPlatform();
	}).then(() => {
		// After platform load
		mWallet.launcherTools.updateState(appLocale.launcher.stage_findWallet);
		return mWallet.launcherTools.selectWallet();
	}).then((wallet) => {
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

mWallet.launcherTools.loadLocale = function() {
	var locale = navigator.language;
	if(!!localStorage.appLocale) locale = localStorage.appLocale;
	if(mWallet.locales.indexOf(locale) < 0) locale = mWallet.locales[0];

	return new Promise((resolve, reject) => {
		console.log("Loading locale "+locale+"...");
		var scr = document.createElement("script");
		scr.src = "locale/"+locale+".js";
		scr.onload = function() {
			console.log("Localed loaded!");
			resolve(true);
		};
		scr.onerror = function() {
			reject("Locale file load error");
		}
		document.body.appendChild(scr);
	});
}

mWallet.launcherTools.updateState = function(text) {
	console.log(text);
	mWallet.launcherTools._stateView.setTitle(text);
}

mWallet.launcherTools.launchPlatform = function() {return new Promise((resolve,reject) => {
	if(!!mWallet.platform.name) return resolve(true);

	// Detech platform
	if(navigator.userAgent.indexOf("Electron") > 0) {
		// ELetron mode
		mWallet.platform.name = "electron";
	} else if(typeof(cordova) == "object") {
		// Cordova (non-native)
		mWallet.platform.name = "cordova";
	} else {
		// Browser mode (non-native)
		mWallet.platform.name = "browser";
	}

	// Load platform patch
	console.log("loading platform "+mWallet.platform.name);
	var scr = document.createElement("script");
	scr.src = "platforms/"+mWallet.platform.name+".js";
	scr.onload = function() {
		resolve(true);
	};
	scr.onerror = function() {
		reject("Platform file load error");
	}
	document.body.appendChild(scr);
})};

mWallet.launcherTools.selectWallet = function(){return new Promise((resolve, reject) => {
	if(!!mWallet.server.name) return reject("Wallet already loaded");
	var wallets = mWallet.launcherTools.getWallets();

	if(mWallet.hasNative && wallets.length == 0) {
		// Load native wallet
		resolve("native::");
	} else if(!mWallet.hasNative && wallets.length == 1) {
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
	if(mWallet.server.name) return reject("Aleady loaded!");
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

	mWallet.server.name = name;
	mWallet.server.id = id;

	// Load wallet script
	console.log("loading wallet "+name);
	var scr = document.createElement("script");
	scr.src = "servers/"+name+".js";
	scr.onload = function() {
		console.log("wallet loaded");
		mWallet.server.launch()
			.then((d) => {resolve(d); })
			.catch((e) => {reject(e); });
	};
	document.body.appendChild(scr);
})};

class BootMenu extends Screen {
	onCreate() {
		this.setTitle(appLocale.launcher.wallets_selectScreenTitle);
		this.markAsRoot();
	}

	waitForSelect() {return new Promise((resolve, reject) => {
		var ctx = this, wallets = mWallet.launcherTools.getWallets();
		if(mWallet.hasNative) this.appendView(new RowView()
			.setTitle(appLocale.launcher.wallet_native)
			.setIcon("account_balance_wallet")
			.setOnClickListener(() => {
				resolve("native::");
				ctx.finish();
			}));

		if(mWallet.allowAccountSettings) this.appendView(new RowView()
			.setTitle(appLocale.launcher.wallets_editButton)
			.setIcon("settings")
			.setOnClickListener(() => {
				new AccountsEditScreen().start();
			}))

		this.appendView(new SubHeader(appLocale.launcher.wallets_other));
		for(var a in wallets)
			this.addWalletRow(wallets[a], resolve);
	})}

	addWalletRow(data, resolve) {
		var name = data.split(":")[0],
			id = data.split(":")[1],
			displayName = data.substr(name.length+id.length+2),
			ctx = this;

		this.appendView(new RowView()
			.setTitle(displayName)
			.setOnClickListener(() => {resolve(data); ctx.finish();}));
	}
}

class AccountsEditScreen extends Screen {
	onCreate() {
		var ctx = this;
		var wallets = mWallet.launcherTools.getWallets();
		// Show menu
		this.setTitle(appLocale.launcher.editor_title);
		this.addMod(new RightSideScreenMod());
		this.setHomeAsUpAction();
		this.listWallets();
	}

	listWallets() {
		var ctx = this;
		var wallets = JSON.parse(localStorage.myWallets);
		this.wipeContents();

		if(mWallet.hasNative)
			this.appendView(new RowView()
				.setTitle(appLocale.launcher.wallet_native)
				.setIcon("account_balance_wallet")
				.setOnClickListener(() => {
					ctx.reloadDialog();
				}));

		this.appendView(new RowView()
			.setTitle(appLocale.launcher.editor_newWallet)
			.setIcon("add_circle")
			.setOnClickListener(() => {
				ctx.createMenu();
			}));

		this.appendView(new SubHeader(appLocale.launcher.editor_walletsSubtitle));

		for(var a in wallets) {
			this.addWalletRow(wallets[a]);
		}
	}

	createMenu() {
		var dialog = new Dialog(), ctx = this;
		dialog.appendView(new RowView()
			.setTitle(appLocale.launcher.wallet_remote_title)
			.setSummary(appLocale.launcher.wallet_remote_info)
			.setOnClickListener(function() {
				dialog.hide();
				ctx.createWallet("remote", "Remote server")
			}));
		dialog.appendView(new RowView()
			.setTitle(appLocale.launcher.wallet_fictive_title)
			.setSummary(appLocale.launcher.wallet_fictive_info)
			.setOnClickListener(function() {
				dialog.hide();
				ctx.createWallet("debug", "Debug wallet")
			}));

		dialog.show();
	}

	addWalletRow(data) {
		console.log(data);
		var ctx = this;
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		var row = new RowView()
			.setTitle(name)
			.setOnClickListener(() => {
				ctx.reloadDialog();
			});

		row.setAction("options", "more_vert", () => {
			ctx.editWallet(data);
		})

		this.appendView(row);
	}

	editWallet(data) {
		var dialog = new Dialog(), ctx = this;
		dialog.appendView(new RowView()
			.setIcon("edit").setTitle(appLocale.launcher.editor_rename)
			.setOnClickListener(() => {
				dialog.hide();
				ctx.rename(data);
			}));
		dialog.appendView(new RowView()
			.setIcon("delete").setTitle(appLocale.launcher.editor_remove)
			.setOnClickListener(() => {
				dialog.hide();
				ctx.remove(data);
			}));

		dialog.show();
	}

	remove(data) {
		var wallets = JSON.parse(localStorage.myWallets);
		var index = wallets.indexOf(data);
		wallets.splice(index, 1);
		localStorage.myWallets = JSON.stringify(wallets);
		this.listWallets();
	}

	rename(data) {
		var ctx = this;
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		var ti = new TextInput()
			.setTitle(appLocale.launcher.editor_rename_newTitle)
			.fromString(name);

		var dialog = new Dialog()
			.appendView(ti)
			.addButton(new Button().setText(appLocale.launcher.editor_rename_cancel).setOnClickListener(() => {
				dialog.hide();
			}))
			.addButton(new Button().setText(appLocale.launcher.editor_rename_confirm).setOnClickListener(() => {
				dialog.hide();
				name = ti.toString();
				var newdata = type+":"+id+":"+name;
				var wallets = JSON.parse(localStorage.myWallets);
				var index = wallets.indexOf(data);
				wallets[index] = newdata;
				localStorage.myWallets = JSON.stringify(wallets);
				ctx.listWallets();
			})).show();
	}

	createWallet(type, name) {
		var wallets = JSON.parse(localStorage.myWallets);
		var data = type+":"+type+wallets.length+":"+name;
		wallets[wallets.length] = data;
		localStorage.myWallets = JSON.stringify(wallets);
		this.listWallets();
		this.reloadDialog();
	}

	reloadDialog() {
		new Confirm().setMessage(appLocale.launcher.editor_launch_confirm)
		.setOnConfirmListener(() => {
			location.reload();
		}).show();
	}
}

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
