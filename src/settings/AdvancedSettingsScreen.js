class AdvancedSettingsScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new RightSideScreenMod());

		if(mWallet.allowAccountSettings) this.appendView(new RowView()
			.setTitle(appLocale.advancedSettings.myaccounts)
			.setOnClickListener(() => {
				new AccountsEditScreen().start();
			}));

		this.appendView(new RowView()
			.setTitle(appLocale.advancedSettings.console)
			.setOnClickListener(() => {
				new ConsoleScreen().start();
			}))
	}
}
