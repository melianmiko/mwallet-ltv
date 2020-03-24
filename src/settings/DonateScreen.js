class DonateScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new RightSideScreenMod());

		this.appendView(new RowView()
			.setTitle(appLocale.donateScreen.be_translator)
			.setOnClickListener(() => {
				// TODO: Help with translation
				new Alert().setMessage("Увы, приложение пока не готово к принятию языков, отличных от русского. Эта функция будет доделана в скором времени.").show();
			}));

		this.appendView(new RowView()
			.setTitle(appLocale.donateScreen.donate_ltv)
			.setOnClickListener(() => {
				new SendScreen(coinConfig.donateWallet, 
					null, "Good work :-)")
					.start();
			}));

		this.appendView(new RowView()
			.setTitle(appLocale.donateScreen.donate_rub)
			.setOnClickListener(() => {
				mWallet.openBrowser(coinConfig.donateUrl);
			}));

		if(appLocale.localeInfo.donateLink) this.appendView(new RowView()
			.setTitle(appLocale.donateScreen.donate_translator)
			.setOnClickListener(() => {
				mWallet.openBrowser(appLocale.localeInfo.donateLink);
			}));
	}
}
