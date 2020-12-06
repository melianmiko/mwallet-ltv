/*
 * Debug wallet
 */

class Debug {
	launch() {return new Promise((resolve, reject) => {
		if(!localStorage.debugBalance) localStorage.debugBalance = 50;
		if(!localStorage.debugHistory) localStorage.debugHistory = "[]";
		mWallet.server._isGenerate = false;
		setInterval(() => {
			if(!mWallet.server._isGenerate) return;
			mWallet.server.doTransaction("generate", 100);
		}, 20000);
		resolve(true);
	})}

	hasSettings() {
		return true;
	}

	openSettings() {
		var scr = new Screen();
		scr.onCreate = function() {
			this.setHomeAsUpAction();
			this.appendView(new RowView()
				.setTitle("Give me a money!")
				.setOnClickListener(() => {
					mWallet.server.doTransaction("receive", 150);
				}));
		};
		scr.start();
	}

	doTransaction(category, amount) {
		if(category == "send") 
			localStorage.debugBalance = parseFloat(localStorage.debugBalance)-amount;
		else
			localStorage.debugBalance = parseFloat(localStorage.debugBalance)+amount;

		var h = JSON.parse(localStorage.debugHistory);
		h[h.length] = {
			address: "LvXXXXXXXXXXXXXXXXXXXXXXX",
			amount: amount,
			category: category,
			comment: (amount > 250 ? "Oh yeah!" : ""),
			time: Date.now()
		}
		localStorage.debugHistory = JSON.stringify(h);
	}

	sendCmd(cmd) {return new Promise(function(resolve,reject) {
		if(cmd[0] == "getwalletinfo") 
			resolve({
				balance: parseFloat(localStorage.debugBalance),
				unconfirmed_balance: 2.11,
				immature_balance: 10
			})
		else if(cmd[0] == "listtransactions")
			resolve(JSON.parse(localStorage.debugHistory))
		else if(cmd[0] == "getconnectioncount")
			resolve(21);
		else if(cmd[0] == "getblockcount")
			resolve(1234);
		else if(cmd[0] == "getgenerate")
			 resolve(mWallet.server._isGenerate);
		else if(cmd[0] == "gethashespersec")
			resolve(mWallet.server._isGenerate ? 3512987 : 0);
		else if(cmd[0] == "sendtoaddress") {
			mWallet.server.doTransaction("send", cmd[2]);
			resolve(true);
		} else if(cmd[0] == "setgenerate") {
			mWallet.server._isGenerate = cmd[1];
			resolve(true);
		} else if(cmd[0] == "listbanned") {
			resolve([
				"1.2.3.4",
				"5.8.2.228",
				"192.168.43.1",
				"8.8.8.8"
			]);
		} else if(cmd[0] == "getmasternodecount") {
			resolve({
				total: 228
			});
		} else if(cmd[0] == "getnetworkhashps") {
			resolve(1289876758);
		} else if(cmd[0] == "getaccountaddress")
			resolve("LvXXXXXXXXXXXXXXXXXXXXXXX");
		else {
			reject({error: -999999});
			console.warn("Undefined command", cmd);
		}
	})}

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

}
