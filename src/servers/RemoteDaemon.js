/*
 * Server settings.
 * This is direct connection variant variant
 */

class RemoteDaemon {
	launch() {return new Promise((resolve, reject) => {
		if(mWallet.remote.isLocal) {
			// Forcely use saved settings
			resolve(true);
		} else {
			// Recover saved settings and use then
			if(!mWallet.remote) mWallet.remote = {};
			mWallet.server.loadSaved();
			mWallet.server.testConnection().then((d) => {
				resolve(true);
			}).catch((e) => {
				new RemoteDaemonCfgScreen(false, resolve).start();
			})
		}
	})}

	hasSettings() {
		return !mWallet.remote.isLocal;
	}

	openSettings() {
		new RemoteDaemonCfgScreen(true).start()
	}

	testConnection() {
		return this.getBalances();
	}

	loadSaved() {
		mWallet.remote.url = localStorage[mWallet.server.id+"_url"];
		mWallet.remote.port = localStorage[mWallet.server.id+"_port"];
		mWallet.remote.login = localStorage[mWallet.server.id+"_login"];
		mWallet.remote.passwd = localStorage[mWallet.server.id+"_passwd"];
	}

	getBalances() {return new Promise(function(resolve,reject) {
		mWallet.server.sendCmd(["getwalletinfo"]).then(function(d) {
			resolve([d.balance, d.unconfirmed_balance, d.immature_balance]);
		}).catch(function(e) {
			reject(e);
		});
	})}

	sendToAddress(a, s, c) {return new Promise(function(resolve, reject) {
		mWallet.server.sendCmd(["sendtoaddress", a, s, c]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	getReceiveAddress() {return new Promise(function(resolve,reject) {
		mWallet.server.sendCmd(["getaccountaddress", ""]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	getTransactionsLog(count, offset) {return new Promise(function(resolve,reject) {
		mWallet.server.sendCmd(["listtransactions", "", count, offset]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	getMasternodesCount() {return new Promise(function(resolve,reject) {
		mWallet.server.sendCmd(["listmasternodes"]).then(function(d) {
			resolve(d.length);
		}).catch(function(e) {
			reject(e);
		});
	})}

	getBlockCount() {return new Promise(function(resolve,reject) {
		mWallet.server.sendCmd(["getblockcount"]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	getNetworkHashrate() {return new Promise(function(resolve,reject) {
		mWallet.server.sendCmd(["getnetworkhashps"]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	// #nonative
	getConnections() {return new Promise(function(resolve, reject) {
		mWallet.server.sendCmd(["getconnectioncount"]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	// #nonative
	isGenerate() {return new Promise(function(resolve, reject) {
		mWallet.server.sendCmd(["getgenerate"]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	// #nonative
	getMiningHashrate() {return new Promise(function(resolve, reject) {
		mWallet.server.sendCmd(["gethashespersec"]).then(function(d) {
			resolve(d);
		}).catch(function(e) {
			reject(e);
		});
	})}

	sendCmd(args) {return new Promise(function(resolve,reject) {
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
			"Basic " + btoa(mWallet.remote.login+":"+mWallet.remote.password));

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
}

class RemoteDaemonCfgScreen extends Screen {
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
