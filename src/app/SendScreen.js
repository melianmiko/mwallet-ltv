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
		if(this.sum < 0) this.sum = -this.sum;
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
		mWallet.server.sendToAddress(addr, sum, comment).then((a) => {
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
