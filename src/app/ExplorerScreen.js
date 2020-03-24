class ExplorerScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.setHomeAsUpAction();
		this.setTitle(appLocale.explorer.title);

		this.box_status = Utils.inflate({type: "div"});
		this.box_prices = Utils.inflate({type: "div"});

		this.appendView(new SubHeader(appLocale.explorer.header_state));
		this.appendView(this.box_status);

		this.appendView(new SubHeader(appLocale.explorer.header_price));
		this.appendView(this.box_prices);

		this.updateViews();

		this.interval = function() {
			ctx.updateViews();
		};

		setInterval(this.interval, 5000);
	}

	onFinish() {
		clearInterval(this.interval);
		return true;
	}

	updateViews() {
		var lc = appLocale.explorer;
		// Status box
		this.box_status.innerHTML = "";
		this.box_status.appendView(
			this.mkInfo(lc.status_blocks, mWallet.dataProvider.blockcount+" / "+mWallet.dataProvider.globalBlockCount));
		this.box_status.appendView(
			this.mkInfo(lc.status_masternodes, mWallet.dataProvider.masternodes));
		this.box_status.appendView(
			this.mkInfo(lc.status_connections, mWallet.dataProvider.connections));
		this.box_status.appendView(
			this.mkInfo(lc.status_network_speed, this.parseHashrate(mWallet.dataProvider.networkHashrate)));
		this.box_status.appendView(
			this.mkInfo(lc.status_difficulty, Math.round(mWallet.dataProvider.difficulty*100)/100 ));
		// Price box
		this.box_prices.innerHTML = "";
		this.box_prices.appendView(
			this.mkInfo(lc.price_today, this.showBtc(mWallet.dataProvider.midPrice)));
		this.box_prices.appendView(
			this.mkInfo(lc.price_all, this.showBtc(mWallet.dataProvider.midPrice*mWallet.dataProvider.balance)));
		this.box_prices.appendView(
			this.mkInfo(lc.prices_24h, mWallet.dataProvider.lowest24h+"-"+mWallet.dataProvider.highest24h+" BTC"));
		this.box_prices.appendView(
			this.mkInfo(lc.prices, mWallet.dataProvider.highestBuy+" / "+mWallet.dataProvider.lowestSell+" BTC"))
	}

	mkInfo(title, info) {
		return new TextView("explorer_row", "<b>"+title+": </b>"+info);
	}

	parseHashrate(hr) {
		var prefix = "";

		if(hr > 500000) {
			hr = hr/1000000;
			prefix = "M";
		} else if(hr > 900) {
			hr = hr/1000;
			prefix = "k";
		}

		return hr+" "+prefix+"H/s";
	}

	showBtc(btc) {
		return btc+" BTC / "+
			(Math.round(btc*mWallet.dataProvider.btcUsdPrice*100)/100)+"$";
	}
}

