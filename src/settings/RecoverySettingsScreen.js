class RecoverySettingsScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new RightSideScreenMod());

		if(mWallet.allowBackup) this.appendView(new RowView()
			.setTitle(appLocale.recoverySettings.createBackup)
			.setOnClickListener(() => {mWallet.platform.createBackup();}))
		if(mWallet.allowBackup) this.appendView(new RowView()
			.setTitle(appLocale.recoverySettings.restoreBackup)
			.setOnClickListener(() => {mWallet.platform.restoreBackup();}))
		if(mWallet.allowRecovery) this.appendView(new RowView()
			.setTitle(appLocale.recoverySettings.recovery)
			.setOnClickListener(() => {mWallet.platform.recovery()}))
	}
}

