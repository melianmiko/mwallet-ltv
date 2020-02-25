/*
 * Server settings.
 * This is direct connection variant variant
 */

mWallet.server.launch = function() {return new Promise((resolve, reject) => {
	if(mWallet.server.isLocal) {
		// Forcely use saved settings
		resolve(true);
	} else {
		// Recover saved settings and use then
		mWallet.server.loadSaved();
		mWallet.server.try().then((d) => {
			resolve(true);
		}).catch((e) => {
			new RemoteSettingsScreen(false, resolve).start();
		})
	}
})}

mWallet.server.try = function() {
	return mWallet.sendCmd(["getwalletinfo"]);
}

mWallet.server.loadSaved = function() {
	mWallet.server.url = localStorage[mWallet.server.id+"_url"];
	mWallet.server.port = localStorage[mWallet.server.id+"_port"];
	mWallet.server.login = localStorage[mWallet.server.id+"_login"];
	mWallet.server.passwd = localStorage[mWallet.server.id+"_passwd"];
}

class RemoteSettingsScreen extends Screen {
	constructor(openedFromSettings, resolve) {
		super();
		this.openedFromSettings = openedFromSettings;
		this.resolve = resolve;
	}

	onCreate() {
		if(this.openedFromSettings)
			this.setHomeAsUpAction();

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

		if(this.openedFromSettings) this.appendView(new Button().setStyle(Button.STYLE_OUTLINE)
			.setText("Save")
			.setOnClickListener(() => {
				ctx.save();
			}))
		else this.appendView(new Button().setStyle(Button.STYLE_OUTLINE)
			.setText("Connect")
			.setOnClickListener(() => {
				ctx.save();
				mWallet.server.try().then(() => {
					ctx.resolve();
					ctx.finish();
				}).catch(() => {
					new Alert().setMessage("Error").show();
				})
			}))
	}

	save() {
		localStorage[mWallet.server.id+"_url"] = this.formUrl.toString();
		localStorage[mWallet.server.id+"_port"] = this.formPort.toString();
		localStorage[mWallet.server.id+"_login"] = this.formLogin.toString();
		localStorage[mWallet.server.id+"_passwd"] = this.formPasswd.toString();
		mWallet.server.loadSaved();
	}
}

if(!mWallet.server.isLocal) mWallet.server.settings = function() {
	new RemoteSettingsScreen(true).start();
}

mWallet.sendCmd = function(args) {return new Promise(function(resolve,reject) {
	var data = {
		jsonrpc: "1.0", 
		id: "curltest", 
		method: args[0],
		params: (args.length > 1 ? args.slice(1) : [])
	};
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://"+mWallet.server.url+
		":"+mWallet.server.port);
	xhr.setRequestHeader("Authorization", 
		"Basic " + btoa(mWallet.server.login+":"+mWallet.server.passwd));

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
