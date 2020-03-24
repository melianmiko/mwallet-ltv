class LockScreen extends Screen {
	// TODO: Lock settings screen
	unlock() {var ctx = this; return new Promise((resolve, reject) => {
		var te = new TextInput()
			.setTitle(appLocale.lockScreen.prompt_password)
			.setType("password");

		var d = new Dialog()
			.setMessage(appLocale.lockScreen.alertUnlockRequired)
			.appendView(te)
			.addButton(new Button().setText(appLocale.lockScreen.cancel).setOnClickListener(() => {
				d.hide();
			})).addButton(new Button().setText(appLocale.lockScreen.confirm_unlock).setOnClickListener(() => {
				d.hide();
				ctx.doUnlock(te.toString()).then(() => {
					resolve();
				})
			})).show();
	})}

	doUnlock(password) {return new Promise((resolve, reject) => {
		mWallet.sendCmd(["walletpassphrase", password, 10]).then((r) => {
			resolve();
		}).catch((e) => {
			if(e.code == -14) {
				// Invalid password
				new Alert().setMessage(appLocale.lockScreen.error_invalidPassword).show();
			}
			console.error(e);
			reject(e);
		})
	})}
}
