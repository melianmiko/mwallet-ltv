window.mWallet = {
	hasNative: false,
	server: {},
	platform: {},
	settings : false,
	launcherTools: {}
};

mWallet.launch = function() {
	if(!mWallet.launcherTools._stateView) {
		// Create state view screen
		var ss = new Screen();
		ss.setMode(Screen.MODE_ROOT);
		ss.setTitle("Подождите...");
		ss.start();
		mWallet.launcherTools._stateView = ss;
	}

	mWallet.launcherTools.updateState("Запуск...");
	mWallet.launcherTools.launchPlatform().then(() => {
		// After platform load
		mWallet.launcherTools.updateState("Поиск кошелька...");
		return mWallet.launcherTools.selectWallet();
	}).then((wallet) => {
		// After wallet selection
		mWallet.launcherTools.updateState("Запуск кошелька...");
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
		this.setTitle("Выберите кошелёк");
		this.setMode(Screen.MODE_ROOT);
	}

	waitForSelect() {return new Promise((resolve, reject) => {
		var ctx = this, wallets = mWallet.launcherTools.getWallets();
		if(mWallet.hasNative) {
			this.appendView(new RowView()
				.setTitle("Локальный кошелёк")
				.setIcon("account_balance_wallet")
				.setOnClickListener(() => {
					resolve("native::");
					ctx.finish();
				}));
			this.appendView(new SubHeader("Другие аккаунты"));
		}

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

/*class LauncherScreen extends Screen {
	constructor(forceMenu) {
		super();
		this.forceMenu = forceMenu;
	}

	onCreate() {
		console.log("launching...")
		this.setMode(Screen.MODE_ROOT);
		var ctx = this;
		if(!localStorage.myWallets) localStorage.myWallets = "[]";
		var wallets = JSON.parse(localStorage.myWallets);
		if(mWallet.hasNative && wallets.length < 1 && !this.forceMenu) {
			// No alternative wallets, load native...
			console.log("loading default native wallet...");
			this.loadNativeDefault();
		} else if(!mWallet.hasNative && wallets.length == 1 && !this.forceMenu) {
			// No native wallet, one non-native...
			console.log("loading single wallet...");
			this.loadWallet(wallets[0]);
		} else {
			// Show menu
			console.log("loading menu...");
			this.setTitle("Выбор кошелька");
			if(this.forceMenu) this.setHomeAsUpAction();
			this.listWallets();
		}
	}

	listWallets() {
		var ctx = this;
		var wallets = JSON.parse(localStorage.myWallets);
		this.wipeContents();

		if(mWallet.hasNative)
			this.appendView(new RowView()
				.setTitle("Локальный кошелёк")
				.setIcon("account_balance_wallet")
				.setOnClickListener(() => {
					ctx.loadNativeDefault();
				}));

		this.appendView(new RowView()
			.setTitle("Новый кошелёк")
			.setIcon("add_circle")
			.setOnClickListener(() => {
				ctx.createMenu();
			}));

		this.appendView(new SubHeader("Аккаунты"));

		for(var a in wallets) {
			this.addWalletRow(wallets[a]);
		}
	}

	createMenu() {
		var dialog = new Dialog(), ctx = this;
		dialog.appendView(new RowView()
			.setTitle("Удалённый кошелёк")
			.setSummary("Подключиться к серверу leadertvcoind")
			.setOnClickListener(function() {
				dialog.hide();
				ctx.createWallet("remote", "New remote server")
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
				ctx.loadWallet(data);
			});

		row.setAction("изменить", "more_vert", () => {
			ctx.editWallet(data);
		})

		this.appendView(row);
	}

	editWallet(data) {
		var dialog = new Dialog(), ctx = this;
		dialog.appendView(new RowView()
			.setIcon("edit").setTitle("Переименовать")
			.setOnClickListener(() => {
				dialog.hide();
				ctx.rename(data);
			}));
		dialog.appendView(new RowView()
			.setIcon("delete").setTitle("Удалить")
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
		var ctx = this;``
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		var ti = new TextInputView()
			.setTitle("Новое название")
			.fromString(name);

		var dialog = new Dialog()
			.appendView(ti)
			.addButton(new Button().setText("Отмена").setOnClickListener(() => {
				dialog.hide();
			}))
			.addButton(new Button().setText("Переименовать").setOnClickListener(() => {
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

	loadNativeDefault() {
		window.wallet_id = "";
		mWallet.launchNative();
	}

	createWallet(type, name) {
		var wallets = JSON.parse(localStorage.myWallets);
		var data = type+":"+type+wallets.length+":"+name;
		wallets[wallets.length] = data;
		localStorage.myWallets = JSON.stringify(wallets);
		this.listWallets();
		this.loadWallet(data);
	}

	loadWallet(data) {
		if(this.forceMenu) {
			location.reload();
			return;
		}
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		mWallet.server.id = id;
		mWallet.launchWallet(type).then(() => {
			console.log("we are ready...");
			new PostLauncherScreem().start();
		});
	}
}*/
