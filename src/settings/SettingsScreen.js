class SettingsScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new RightSideScreenMod());

		this.addAction(new MenuItem("Перезапустить", "refresh", () => {
			location.reload();
		}));

		// TODO: Remove #nonative
		if(mWallet.exit) this.addAction(new MenuItem("Выйти", "exit_to_app", () => {
			mWallet.exit();
		}))

		// =====================================================

		if(mWallet.server.settings) this.appendView(new RowView()
			.setIcon("account_circle")
			.setTitle(appLocale.toolsScreen.account)
			.setSummary(appLocale.toolsScreen.account_info)
			.setOnClickListener(() => {
				mWallet.server.settings();
			}));

		if(mWallet.platform.settings) this.appendView(new RowView()
			.setIcon("dashboard")
			.setTitle(appLocale.toolsScreen.system)
			.setSummary(appLocale.toolsScreen.system_info)
			.setOnClickListener(() => {
				mWallet.platform.settings();
			}));

		this.appendView(new RowView()
			.setIcon("palette")
			.setTitle(appLocale.toolsScreen.ui)
			.setSummary(appLocale.toolsScreen.ui_info)
			.setOnClickListener(() => {
				new FWSettingsScreen(appLocale.fwSettings).start();
			}));

		// TODO: Remove #nonative
		if(mWallet.allowMining) this.appendView(new RowView()
			.setIcon("arrow_downward")
			.setTitle(appLocale.toolsScreen.mining)
			.setSummary(appLocale.toolsScreen.mining_info)
			.setOnClickListener(function(){
				new MinerCfgScreen().start();
			}));

		// TODO: Remove #nonative
		if(mWallet.allowBackup || mWallet.allowRecovery)
			this.appendView(new RowView()
				.setIcon("restore")
				.setTitle(appLocale.toolsScreen.recover)
				.setSummary(appLocale.toolsScreen.recover_info)
				.setOnClickListener(function(){
					new RecoverySettingsScreen().start();
				}));

		this.appendView(new RowView()
			.setIcon("favorite")
			.setTitle(appLocale.toolsScreen.donate)
			.setSummary(appLocale.toolsScreen.donate_info)
			.setOnClickListener(function(){
				new DonateScreen().start();
			}));

		this.appendView(new RowView()
			.setIcon("settings")
			.setTitle(appLocale.toolsScreen.advanced)
			.setSummary(appLocale.toolsScreen.advanced_info)
			.setOnClickListener(() => {
				new AdvancedSettingsScreen().start();
			}));

		this.appendView(new TextView("info", "Версия - "+mWallet.version+" | "+
			"<a href=''https://gitlab.com/mhbrgn/mwallet-ltv'>Исходники</a>"));
	}
}
