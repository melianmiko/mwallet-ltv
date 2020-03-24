class Server {
	launch() {console.error("Not overriden!");}
	hasSettings() {console.error("Not overriden!");}
	openSettings() {console.error("Not overriden!");}
	testConnection() {console.error("Not overriden!");}
	sendCmd() {console.error("Not overriden!");}

	getBalances() {console.error("Not overriden!");}
	getReceiveAddress() {console.error("Not overriden!");}
	getTransactionsLog(count, offset) {console.error("Not overriden!");}

	sendToAddress(address, amount, comment) {
		console.error("Not overriden!");
		/* Throwable error codes
		-13: Wallet is locked (to be removed #nonative)
		-3: Invalid amount
		-5: Invalid account
		-6: Insufficient funds
		*/
	}

	getMasternodesCount() {console.error("Not overriden!")}
	getBlockCount() {console.error("Not overriden!")}
	getNetworkHashrate() {console.error("Not overriden!")}
	
	// Native-only features (to be removed)	#nonative
	getConnections() {console.error("Not overriden!")}
	isGenerate() {console.error("Not overriden!")}
	getMiningHashrate() {console.error("Not overriden!")}
}
