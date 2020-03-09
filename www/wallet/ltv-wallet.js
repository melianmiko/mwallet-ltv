var version = "alpha3";

// Global variables
var globalWalletData = null;

// Config
Config.mainColor = "#f09";

class WalletHomeScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.walletData = new WalletDataProvider();
		globalWalletData = this.walletData;

		this.markAsRoot();

		this.createLayout();
		this.setupTimers();
		this.updateViews();
		this.updateHistory();

		this.addAction(new MenuItem(appLocale.walletHome.action_explore, "explore", function(){
			new ExplorerScreen().start();
		}));

		this.addAction(new MenuItem(appLocale.walletHome.action_settings, "settings", function() {
			new ToolsScreen().start();
		}));

		setTimeout(() => {ctx.firstStart()}, 1000);
	}

	firstStart() {
		if(!localStorage.isDaemonNotifyShown && mWallet.server.isLocal) {
			new Alert()
				.setTitle(appLocale.walletHome.bgMode_title)
				.setMessage(appLocale.walletHome.bgMode_message)
				.show();
			localStorage.isDaemonNotifyShown = true;
		}
	}

	createLayout() {
		var ctx = this;
		this.addMod(new WideScreenMod());

		var expandable = new ExpandableLayout(),
			left = expandable.addColumn(360, 360),
			right = expandable.addColumn(400, 540);

		this.appendView(expandable);

		this.mainBalanceView = new TextView("balance-main", "-- LTV");
		left.appendView(this.mainBalanceView);
		this.unfonfirmedBalanceView = new TextView("balance-small", appLocale.walletHome.balance_unconfirmed+": 0 LTV");
		left.appendView(this.unfonfirmedBalanceView);
		this.immatureBalanceView = new TextView("balance-small", appLocale.walletHome.balance_pending+": 0 LTV");
		left.appendView(this.immatureBalanceView);

		var row = Utils.inflate({type: "div", class: "buttons-row"});
		row.appendView(new Button()
			.setStyle(Button.STYLE_OUTLINE)
			.setText(appLocale.walletHome.action_receive).setOnClickListener(() => {
				ctx.showGetUI();
			}));
		row.appendView(new Button()
			.setStyle(Button.STYLE_OUTLINE)
			.setText(appLocale.walletHome.action_send).setOnClickListener(() => {
				ctx.showSendUI();
			}));
		row.appendView(new Button()
			.setStyle(Button.STYLE_OUTLINE)
			.setText(appLocale.walletHome.action_history).setOnClickListener(() => {
				new HistoryScreen().start();
			}));

		left.appendView(row);

		this.updateBox = Utils.inflate({type: "div"});
		left.appendView(this.updateBox);

		Updater.checkAppUpdate().then((r) => {
			if(r !== false) {
				this.updateBox.appendView(new RowView()
					.setTitle(appLocale.walletHome.update_title)
					.setSummary(appLocale.walletHome.update_message)
					.setIcon("system_update_alt")
					.setOnClickListener(() => {
						new PlatformTools().openBrowser(r);
					}));
			}
		})

		right.appendView(new SubHeader(appLocale.walletHome.group_history));

		this.historyBox = Utils.inflate({type: "div", class: "history"});
		this.historyBox.appendView(new TextView("info", appLocale.walletHome.history_loading));
		right.appendView(this.historyBox);
	}

	showSendUI() {
		new SendScreen().start();
	}

	showGetUI() {
		new ReceiveScreen().start();
	}

	setupTimers() {
		var ctx = this;
		setInterval(() => {
			// Update balances
			ctx.updateViews();
			// Update history
			ctx.updateHistory();
		}, 5000);
	}

	updateViews() {
		if(this.walletData.isBalanceReady) {
			this.mainBalanceView.setText(this.walletData.balance+" LTV");
			this.unfonfirmedBalanceView.setText(appLocale.walletHome.balance_unconfirmed+": "+
				this.walletData.unconfirmed_balance+" LTV");
			this.immatureBalanceView.setText(appLocale.walletHome.balance_pending+": "+
				this.walletData.immature_balance+" LTV");
		}

		switch(mWallet.connState) {
			case 2:
				this.setTitle("");
				return;
			case 1:
				this.setTitle(appLocale.walletHome.title_syncing);
				return;
			case 0:
				this.setTitle(appLocale.walletHome.title_connecting);
				return;
		}

	}

	updateHistory() {
		if(this.walletData.isHistoryReady) {
			var box = this.historyBox;
			box.innerHTML = "";
			if(this.walletData.history.length < 1) {
				box.appendView(new TextView("info", appLocale.walletHome.history_empty));
			} else {
				var history = this.walletData.history;
				for(var a = history.length-1; a >=0; a--)
					box.appendView(this.buildHistoryRow(history[a]));
			}
		}
	}

	buildHistoryRow(data) {
		var row = new RowView();
		row.setOnClickListener(function(){
				new TransactionViewScreen(data).start();
			});

		if(data.comment)
			row.setSummary(data.comment);
		
		if(data.category == "receive")
			row.setIcon("call_received")
				.setTitle("+"+data.amount+" LTV <a style='color:#999'>("+moment.unix(data.time).fromNow()+")</a>");

		if(data.category == "generate" || data.category == "immature")
			row.setIcon("add_box")
				.setTitle("+"+data.amount+" LTV <a style='color:#999'>"+moment.unix(data.time).fromNow()+")</a>");

		if(data.category == "send")
			row.setIcon("call_made")
				.setTitle("-"+data.amount+" LTV <a style='color:#999'>"+moment.unix(data.time).fromNow()+")</a>");

		if(data.confirmations < 1)
			row.setIcon("timer");

		return row;
	}
}

// =========================================================================================
class TransactionViewScreen extends Screen {
	constructor(data) {
		super();
		this.data = data;
	}

	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new LeftSideScreenMod());

		if(this.data.category == "send") this.appendView(new RowView()
			.setTitle(appLocale.transactionView.action_repeat)
			.setIcon("refresh")
			.setOnClickListener(() => {
				new SendScreen(this.data.address, this.data.amount, this.data.comment).start();
			}));

		this.appendView(new SubHeader(appLocale.transactionView.group_info));

		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_address)
			.setSummary("<a style='word-break:break-all'>"+this.data.address+"</a>	"));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_id)
			.setSummary("<a style='word-break:break-all'>"+this.data.txid+"</a>"));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_date)
			.setSummary(new Date(this.data.time).toString()));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_confirmations)
			.setSummary(this.data.confirmations));
		this.appendView(new RowView()
			.setTitle(appLocale.transactionView.prop_comment)
			.setSummary(this.data.comment));
	}
}

class ReceiveScreen extends Screen {
	onCreate() {
		var address = globalWalletData.addressReceive,
			url = "leadertvcoin:"+address,
			ctx = this;

		this.addMod(new LeftSideScreenMod());
		this.setHomeAsUpAction();

		this.qrview = Utils.inflate({type: "a", class: "qrview"});
		this.addrview = new TextView("address", address);

		new QRCode(this.qrview, {
			text: url,
			width: 172,
			height: 172
		});

		this.appendView(this.qrview);
		this.appendView(new TextView("address-label", "Ваш адрес:"));
		this.appendView(this.addrview);

		var btn = new Button()
			.setStyle(Button.STYLE_OUTLINE)
			.setText(appLocale.receiveScreen.action_copy)
			.setOnClickListener(() => {
				mWallet.copy(address);
			});
		btn.getBlock().style.display = "block";
		btn.getBlock().style.margin = "8px auto";
		this.appendView(btn);
	}
}

class SendScreen extends Screen {
	constructor(address, sum, comment) {
		super();
		this.address = address;
		this.sum = sum;
		this.comment = comment;
	}

	onCreate() {
		var ctx = this;
		this.setHomeAsUpAction();
		this.addMod(new LeftSideScreenMod());

		var sumView = Utils.inflate({type: "div", class: "sumEditor", childs: {
			sumInput: {type: "input"},
			posix: {type: "a", inner: "LTV"}
		}});
		sumView.sumInput.placeholder = "0.00";
		sumView.sumInput.value = (this.sum ? this.sum : "");
		sumView.sumInput.type = "number";

		this.appendView(sumView);

		var tiv = new TextInput()
			.setTitle(appLocale.receiveScreen.prop_address)
			.fromString(this.address ? this.address : "")
			.setHolder("Lxxxxx");

		this.appendView(tiv);

		var civ = new TextInput()
			.setTitle(appLocale.receiveScreen.prop_comment)
			.fromString(this.comment ? this.comment : "")
			.setHolder(appLocale.receiveScreen.prop_comment_holder);

		this.appendView(civ);

		var btn = new Button()
			.setStyle(Button.STYLE_CONTAINED)
			.setText(appLocale.receiveScreen.action_send)
			.setOnClickListener(function() {
				ctx.sum = sumView.sumInput.value;
				ctx.address = tiv.toString();
				ctx.comment = civ.toString();
				ctx.performSend();
			});
		btn.getBlock().style.margin = "16px";
		this.appendView(btn);
	}

	performSend() {
		var addr = this.address, sum = parseFloat(this.sum), 
			ctx = this, comment = this.comment;

		console.log(addr, sum, comment);
		mWallet.sendCmd(["sendtoaddress", addr, sum, comment]).then((a) => {
			console.log(a);
			ctx.finish();
		}).catch((e) => {
			if(e.code == -13) {
				// Wallet is locked
				new LockScreen().unlock().then(() => {
					ctx.performSend();
				});
			} else if(e.code == -3) {
				// Invalid amount
				var d = new Alert()
					.setMessage(appLocale.receiveScreen.error_noSum)
					.show();
			} else if(e.code == -5) {
				// Invalid account
				var d = new Alert()
					.setMessage(appLocale.receiveScreen.error_invalidAddress)
					.show();
			} else if(e.code == -6) {
				// Insufficient funds
				var d = new Alert()
					.setMessage(appLocale.receiveScreen.error_noMoney)
					.show();
			} else {
				// Unknown error
				console.error(e);
			}
		});
	}
}

class ExplorerScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.setHomeAsUpAction();
		this.setTitle(appLocale.explorer.title);

		this.box_status = Utils.inflate({type: "div"});
		this.box_prices = Utils.inflate({type: "div"});

		this.appendView(new SubHeader(appLocale.explorer.header_state));
		this.appendView(this.box_status);
		this.appendView(new RowView()
			.setTitle(appLocale.explorer.action_clear_banned)
			.setOnClickListener(() => {
				mWallet.sendCmd(["clearbanned"]).then(() => {
					new Alert().setMessage("Complete!").show();
				});
			}));

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
			this.mkInfo(lc.status_blocks, globalWalletData.blockcount+" / "+globalWalletData.globalBlockCount));
		this.box_status.appendView(
			this.mkInfo(lc.status_masternodes, globalWalletData.masternodes.total));
		this.box_status.appendView(
			this.mkInfo(lc.status_connections, globalWalletData.connections));
		this.box_status.appendView(
			this.mkInfo(lc.status_banned, globalWalletData.banned.length));
		this.box_status.appendView(
			this.mkInfo(lc.status_network_speed, this.parseHashrate(globalWalletData.networkHashrate)));
		this.box_status.appendView(
			this.mkInfo(lc.status_difficulty, Math.round(globalWalletData.difficulty*100)/100 ));
		// Price box
		this.box_prices.innerHTML = "";
		this.box_prices.appendView(
			this.mkInfo(lc.price_today, this.showBtc(globalWalletData.midPrice)));
		this.box_prices.appendView(
			this.mkInfo(lc.price_all, this.showBtc(globalWalletData.midPrice*globalWalletData.balance)));
		this.box_prices.appendView(
			this.mkInfo(lc.prices_24h, globalWalletData.lowest24h+"-"+globalWalletData.highest24h+" BTC"));
		this.box_prices.appendView(
			this.mkInfo(lc.prices, globalWalletData.highestBuy+" / "+globalWalletData.lowestSell+" BTC"))
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
			(Math.round(btc*globalWalletData.btcUsdPrice*100)/100)+"$";
	}
}

class HistoryScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.offset = 0;
		this.setHomeAsUpAction();
		this.addMod(new LeftSideScreenMod());
		this.setTitle(appLocale.historyScreen.title)
		this.box = Utils.inflate({type: "div"});
		this.appendView(this.box);
		this.appendView(new RowView()
			.setTitle(appLocale.historyScreen.action_more)
			.setIcon("history")
			.setOnClickListener(() => {ctx.loadNext()}));
		this.loadNext();
	}

	loadNext() {
		var ctx = this, hs = new WalletHomeScreen();

		mWallet.sendCmd(["listtransactions", "", 10, ctx.offset]).then((data) => {
			ctx.offset += 10;
			for(var a = data.length-1; a >= 0; a--)
				ctx.box.appendView(hs.buildHistoryRow(data[a]));
		});
	}
}

