class ReceiveScreen extends Screen {
	onCreate() {
		var address = mWallet.dataProvider.addressReceive,
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

		if(mWallet.platform.copy) var btn = new Button()
			.setStyle(Button.STYLE_OUTLINE)
			.setText(appLocale.receiveScreen.action_copy)
			.setOnClickListener(() => {
				mWallet.platform.copy(address);
			});
		btn.getBlock().style.display = "block";
		btn.getBlock().style.margin = "8px auto";
		this.appendView(btn);
	}
}
