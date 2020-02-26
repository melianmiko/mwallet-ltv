/*
 * Debug wallet
 */

mWallet.server.launch = function() {return new Promise((resolve, reject) => {
	if(!localStorage.debugBalance) localStorage.debugBalance = 50;
	if(!localStorage.debugHistory) localStorage.debugHistory = "[]";
	mWallet.server.isGenerate = false;
	setInterval(() => {
		if(!mWallet.server.isGenerate) return;
		mWallet.server.doTransaction("generate", 100);
	}, 20000);
	resolve(true);
})};

mWallet.server.doTransaction = function(category, amount) {
	if(category == "send") 
		localStorage.debugBalance = parseFloat(localStorage.debugBalance)-amount;
	else
		localStorage.debugBalance = parseFloat(localStorage.debugBalance)+amount;

	var h = JSON.parse(localStorage.debugHistory);
	h[h.length] = {
		address: "LvXXXXXXXXXXXXXXXXXXXXXXX",
		amount: amount,
		category: category,
		comment: (amount > 100 ? "Oh yeah!" : ""),
		time: Date.now()
	}
	localStorage.debugHistory = JSON.stringify(h);
};

mWallet.sendCmd = function(cmd) {return new Promise(function(resolve,reject) {
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
		 resolve(mWallet.server.isGenerate);
	else if(cmd[0] == "gethashespersec")
		resolve(mWallet.server.isGenerate ? 3512987 : 0);
	else if(cmd[0] == "sendtoaddress") {
		mWallet.server.doTransaction("send", cmd[2]);
		resolve(true);
	} else if(cmd[0] == "setgenerate") {
		mWallet.server.isGenerate = cmd[1];
		resolve(true);
	} else if(cmd[0] == "getaccountaddress")
		resolve("LvXXXXXXXXXXXXXXXXXXXXXXX");
	else {
		reject({error: -999999});
		console.warn("Undefined command", cmd);
	}

})}
