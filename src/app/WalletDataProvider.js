class WalletDataProvider {
	constructor() {
		this.setupDefaults();
		this.setupTimers();

		this.updateWalletInfo();
	}

	setupDefaults() {
		this.isBalanceReady = false;
		this.isHistoryReady = false;
		this.isGenerate = false;
		this.balance = 0;
		this.unconfirmed_balance = 0;
		this.immature_balance = 0;
		this.blockcount = 0;
		this.hashrate = 0;
		this.addressReceive = '";'
	}

	setupTimers() {
		var ctx = this;
		setInterval(() => {
			// Update balances
			ctx.updateWalletInfo();
		}, 10000);
	}

	updateWalletInfo() {
		var ctx = this;

		// Get connection status
		mWallet.server.getConnections().then(function(data) {
			ctx.connections = data;
			return mWallet.server.getBlockCount();
		}).then((bc) => {
			ctx.blockcount = bc;
			return fetch(coinConfig.globalBlockCount);
		}).then((r) => {
			return r.text();
		}).then((gbc) => {
			ctx.globalBlockCount = parseInt(gbc);

			if(ctx.connections < 1)
				// Disconnected
				mWallet.connState = 0;
			else if(ctx.blockcount < ctx.globalBlockCount)
				// Syncing
				mWallet.connState = 1;
			else
				// Connected
				mWallet.connState = 2;
		});

		// Get price info
		fetch("https://blockchain.info/ticker").then((r) => {
			return r.json();
		}).then((d) => {
			ctx.btcUsdPrice = d.USD.last;
			return fetch(coinConfig.occeInfoUrl);
		}).then((r) => {
			return r.json();
		}).then((d) => {
			d = d.coinInfo[0];
			ctx.midPrice = (d.lowest24h+d.highest24h)/2;
			ctx.midPrice = Math.round(ctx.midPrice*10000000000)/10000000000;
			ctx.lowest24h = d.lowest24h;
			ctx.highest24h = d.highest24h;
			ctx.highestBuy = d.highestBuy;
			ctx.lowestSell = d.lowestSell;
		});

		// Get difficulty
		fetch(coinConfig.getDifficulty).then((r) => {
			return r.text();
		}).then((d) => {
			ctx.difficulty = d;
		})

		// Get other data
		mWallet.server.getTransactionsLog(10, 0).then(function(data) {
			ctx.isHistoryReady = true;
			ctx.history = data;
		});

		mWallet.server.getMasternodesCount().then(function(data) {
			ctx.masternodes = data;
		});

		mWallet.server.getBalances().then(function(balances) {
			ctx.isBalanceReady = true;
			ctx.balance = balances[0];
			ctx.unconfirmed_balance = balances[1];
			ctx.immature_balance = balances[2];
		});

		mWallet.server.isGenerate().then(function(isGenerate) {
			ctx.isGenerate = isGenerate;
		})

		mWallet.server.getMiningHashrate().then(function(hashrate) {
			ctx.hashrate = hashrate;
		});

		mWallet.server.getNetworkHashrate().then(function(hr) {
			ctx.networkHashrate = hr;
		})

		mWallet.server.getReceiveAddress().then(function(address) {
			ctx.addressReceive = address;
		})
	}
}

