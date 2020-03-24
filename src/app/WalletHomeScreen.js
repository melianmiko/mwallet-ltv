class WalletHomeScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.walletData = new WalletDataProvider();
		mWallet.dataProvider = this.walletData;

		this.markAsRoot();

		this.createLayout();
		this.setupTimers();
		this.updateViews();
		this.updateHistory();

		this.addAction(new MenuItem(appLocale.walletHome.action_explore, "explore", function(){
			new ExplorerScreen().start();
		}));

		this.addAction(new MenuItem(appLocale.walletHome.action_settings, "settings", function() {
			new SettingsScreen().start();
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

		if(data.amount < 0) data.amount = -data.amount;

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
