class AccountsEditScreen extends Screen {
	onCreate() {
		var ctx = this;
		var wallets = mWallet.launcherTools.getWallets();
		// Show menu
		this.setTitle(appLocale.launcher.editor_title);
		this.addMod(new RightSideScreenMod());
		this.setHomeAsUpAction();
		this.listWallets();
	}

	listWallets() {
		var ctx = this;
		var wallets = JSON.parse(localStorage.myWallets);
		this.wipeContents();

		if(mWallet.hasNative)
			this.appendView(new RowView()
				.setTitle(appLocale.launcher.wallet_native)
				.setIcon("account_balance_wallet")
				.setOnClickListener(() => {
					ctx.reloadDialog();
				}));

		this.appendView(new RowView()
			.setTitle(appLocale.launcher.editor_newWallet)
			.setIcon("add_circle")
			.setOnClickListener(() => {
				ctx.createMenu();
			}));

		this.appendView(new SubHeader(appLocale.launcher.editor_walletsSubtitle));

		for(var a in wallets) {
			this.addWalletRow(wallets[a]);
		}
	}

	createMenu() {
		var dialog = new Dialog(), ctx = this;
		dialog.appendView(new RowView()
			.setTitle(appLocale.launcher.wallet_remote_title)
			.setSummary(appLocale.launcher.wallet_remote_info)
			.setOnClickListener(function() {
				dialog.hide();
				ctx.createWallet("remote", "Remote server")
			}));
		dialog.appendView(new RowView()
			.setTitle(appLocale.launcher.wallet_fictive_title)
			.setSummary(appLocale.launcher.wallet_fictive_info)
			.setOnClickListener(function() {
				dialog.hide();
				ctx.createWallet("debug", "Debug wallet")
			}));

		dialog.show();
	}

	addWalletRow(data) {
		console.log(data);
		var ctx = this;
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		var row = new RowView()
			.setTitle(name)
			.setOnClickListener(() => {
				ctx.reloadDialog();
			});

		row.setAction("options", "more_vert", () => {
			ctx.editWallet(data);
		})

		this.appendView(row);
	}

	editWallet(data) {
		var dialog = new Dialog(), ctx = this;
		dialog.appendView(new RowView()
			.setIcon("edit").setTitle(appLocale.launcher.editor_rename)
			.setOnClickListener(() => {
				dialog.hide();
				ctx.rename(data);
			}));
		dialog.appendView(new RowView()
			.setIcon("delete").setTitle(appLocale.launcher.editor_remove)
			.setOnClickListener(() => {
				dialog.hide();
				ctx.remove(data);
			}));

		dialog.show();
	}

	remove(data) {
		var wallets = JSON.parse(localStorage.myWallets);
		var index = wallets.indexOf(data);
		wallets.splice(index, 1);
		localStorage.myWallets = JSON.stringify(wallets);
		this.listWallets();
	}

	rename(data) {
		var ctx = this;
		var type = data.split(":")[0],
			id = data.split(":")[1],
			name = data.substr(type.length+id.length+2);

		var ti = new TextInput()
			.setTitle(appLocale.launcher.editor_rename_newTitle)
			.fromString(name);

		var dialog = new Dialog()
			.appendView(ti)
			.addButton(new Button().setText(appLocale.launcher.editor_rename_cancel).setOnClickListener(() => {
				dialog.hide();
			}))
			.addButton(new Button().setText(appLocale.launcher.editor_rename_confirm).setOnClickListener(() => {
				dialog.hide();
				name = ti.toString();
				var newdata = type+":"+id+":"+name;
				var wallets = JSON.parse(localStorage.myWallets);
				var index = wallets.indexOf(data);
				wallets[index] = newdata;
				localStorage.myWallets = JSON.stringify(wallets);
				ctx.listWallets();
			})).show();
	}

	createWallet(type, name) {
		var wallets = JSON.parse(localStorage.myWallets);
		var data = type+":"+type+wallets.length+":"+name;
		wallets[wallets.length] = data;
		localStorage.myWallets = JSON.stringify(wallets);
		this.listWallets();
		this.reloadDialog();
	}

	reloadDialog() {
		new Confirm().setMessage(appLocale.launcher.editor_launch_confirm)
		.setOnConfirmListener(() => {
			location.reload();
		}).show();
	}
}
