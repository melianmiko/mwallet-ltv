/*
 * Platform specific code.
 * This is remote variant
 */

mWallet.remote = {};

class PostLauncherScreem extends Screen {
	constructor(edit) {
		super();
		this.edit = edit;
	}

	onCreate() {
		if(this.edit) {
			this.showEditor();
			this.setHomeAsUpAction();
			return;
		}

		var ctx = this;
		ctx.load();
		ctx.tryConnect().then(() => {
			new WalletHomeScreen().start();
		}).catch(() => {
			ctx.showEditor();
		})
	}

	showEditor() {
		var ctx = this;
		this.setTitle("Настроить подключение");
		this.formUrl = new TextInputView()
			.setTitle("URL");
		this.formPort = new TextInputView()
			.setTitle("Port");
		this.formLogin = new TextInputView()
			.setTitle("Login");
		this.formPasswd = new TextInputView()
			.setTitle("Password");
		this.appendView(this.formUrl);
		this.appendView(this.formPort);
		this.appendView(this.formLogin);
		this.appendView(this.formPasswd);

		if(this.edit) this.appendView(new Button().setStyle(Button.STYLE_OUTLINE)
			.setText("Connect")
			.setOnClickListener(() => {
				ctx.save();
			}))
		else this.appendView(new Button().setStyle(Button.STYLE_OUTLINE)
			.setText("Connect")
			.setOnClickListener(() => {
				ctx.save();
				ctx.load();
				ctx.tryConnect().then(() => {
					new WalletHomeScreen().start();
				}).catch(() => {
					new Alert().setMessage("Error").show();
				})
			}))
	}

	load() {
		mWallet.remote.url = localStorage[wallet_id+"_url"];
		mWallet.remote.port = localStorage[wallet_id+"_port"];
		mWallet.remote.login = localStorage[wallet_id+"_login"];
		mWallet.remote.passwd = localStorage[wallet_id+"_passwd"];
	}

	save() {
		localStorage[wallet_id+"_url"] = this.formUrl.toString();
		localStorage[wallet_id+"_port"] = this.formPort.toString();
		localStorage[wallet_id+"_login"] = this.formLogin.toString();
		localStorage[wallet_id+"_passwd"] = this.formPasswd.toString();
	}

	tryConnect() {return new Promise((resolve, reject) => {
		if(!mWallet.remote.url || !mWallet.remote.port ||
			!mWallet.remote.login || !mWallet.remote.passwd) {
			reject(false);
			return;
		}

		mWallet.sendCmd(["getwalletinfo"]).then(() => {
			resolve(true);
		}).catch(() => {
			reject(false);
		})
	})}
}

class PlatformTools {
	exit() {
		new Alert()
			.setMessage("Это удалённый кошелёк. Просто закройте окно.")
			.show();
	}
}

mWallet.settings = function() {
	new PostLauncherScreem(true).start();
}

mWallet.sendCmd = function(args) {return new Promise(function(resolve,reject) {
	var data = {
		jsonrpc: "1.0", 
		id: "curltest", 
		method: args[0],
		params: (args.length > 1 ? args.slice(1) : [])
	};
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://"+mWallet.remote.url+
		":"+mWallet.remote.port);
	xhr.setRequestHeader("Authorization", 
		"Basic " + btoa(mWallet.remote.login+":"+mWallet.remote.passwd));

	xhr.onload = function() {
		if(xhr.status == 200) {
			try {
				data = JSON.parse(xhr.responseText);
				if(data.error) {
					reject(data.error);
				} else {
					resolve(data.result);
				}
			} catch(e) {
				reject(e);
			}
		} else {
			try {
				data = JSON.parse(xhr.responseText);
				reject(data.error);
			} catch(e) {
				reject(e);
			}
		}
	}
	xhr.onerror = reject;
	xhr.send(JSON.stringify(data));
});}
