window.mWallet = {native: "", settings : false};

mWallet.launch = function() {
	if(navigator.userAgent.indexOf("Electron") > 0) {
		// ELetron mode
        mWallet.native = "native-electron";
		mWallet.platform = "electron";
	} else if(false) {
		// Cordova (non-native)
		mWallet.platform = "cordova";
	} else {
		// Browser mode (non-native)
		mWallet.platform = "browser";
	}
    new LauncherScreen().start();
};

class LauncherScreen extends Screen {
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
		if(mWallet.native && wallets.length < 1 && !this.forceMenu) {
			// No alternative wallets, load native...
			console.log("loading default native wallet...");
			this.loadNativeDefault();
		} else if(!mWallet.native && wallets.length == 1 && !this.forceMenu) {
			// No alternative wallet, one non-native...
			console.log("loading single wallet...");
			this.loadWallet(wallets[0]);
		} else {
			// Show menu
			console.log("loading menu...");
			this.setTitle("Выбор кошелька");
			if(this.forceMenu) this.setHomeAsUpAction();

			if(mWallet.native)
				this.appendView(new RowView()
					.setTitle("Основной кошелёк")
					.setOnClickListener(() => {
						if(!ctx.forceMenu)
							ctx.loadNativeDefault();
					}));

			for(var a in wallets) {
				this.addWalletRow(wallets[a]);
			}

			this.appendView(new SubHeader("Создать новый"));
			// TODO: Name prompt

			this.appendView(new RowView()
				.setTitle("Удалённый кошелеё")
				.setOnClickListener(() => {
					ctx.createWallet("remote", "New remote");
				}))
		}
	}

	addWalletRow(data) {
		console.log(data);
		var ctx = this;
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		this.appendView(new RowView()
			.setTitle(name)
			.setOnClickListener(() => {
				if(ctx.forceMenu) 
					ctx.walletMenu(data);
				else
					ctx.loadWallet(data);
			}));
	}

	loadNativeDefault() {
		window.wallet_id = "";
		mWallet.start(mWallet.native);
	}

	createWallet(type, name) {
		var wallets = JSON.parse(localStorage.myWallets);
		wallets[wallets.length] = type+":"+type+wallets.length+":"+name;
		localStorage.myWallets = JSON.stringify(wallets);
	}

	loadWallet(data) {
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		window.wallet_id = id;
		mWallet.start(type);
	}
}

mWallet.start = function(id) {
	console.log("loading platform "+id);
	var scr = document.createElement("script");
	scr.src = "platforms/"+id+".js";
	scr.onload = function() {
		console.log("launching postlauncher...");
		new PostLauncherScreem().start();
	};
	document.body.appendChild(scr);
};
