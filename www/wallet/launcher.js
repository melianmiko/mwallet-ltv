window.mWallet = {native: "", settings : false};

mWallet.launch = function() {
	if(navigator.userAgent.indexOf("Electron") > 0) {
		// ELetron mode
        mWallet.native = "native-electron";
		mWallet.platform = "electron";
	} else if(typeof(cordova) == "object") {
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
			this.listWallets();
		}
	}

	listWallets() {
		var ctx = this;
		var wallets = JSON.parse(localStorage.myWallets);
		this.wipeContents();

		if(mWallet.native)
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
		mWallet.start(mWallet.native);
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
