class BootMenu extends Screen {
	onCreate() {
		this.setTitle(appLocale.launcher.wallets_selectScreenTitle);
		this.markAsRoot();
	}

	waitForSelect() {return new Promise((resolve, reject) => {
		var ctx = this, wallets = mWallet.launcherTools.getWallets();
		if(mWallet.platform.hasNative) this.appendView(new RowView()
			.setTitle(appLocale.launcher.wallet_native)
			.setIcon("account_balance_wallet")
			.setOnClickListener(() => {
				resolve("native::");
				ctx.finish();
			}));

		if(mWallet.allowAccountSettings) this.appendView(new RowView()
			.setTitle(appLocale.launcher.wallets_editButton)
			.setIcon("settings")
			.setOnClickListener(() => {
				new AccountsEditScreen().start();
			}))

		this.appendView(new SubHeader(appLocale.launcher.wallets_other));
		for(var a in wallets)
			this.addWalletRow(wallets[a], resolve);
	})}

	addWalletRow(data, resolve) {
		var name = data.split(":")[0],
			id = data.split(":")[1],
			displayName = data.substr(name.length+id.length+2),
			ctx = this;

		this.appendView(new RowView()
			.setTitle(displayName)
			.setOnClickListener(() => {resolve(data); ctx.finish();}));
	}
}

