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
