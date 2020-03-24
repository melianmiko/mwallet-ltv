class MinerCfgScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.addMod(new RightSideScreenMod());

		this.threads = -1;
		this.setHomeAsUpAction();
		this.setTitle("Майнинг");

		setInterval(function() {
			ctx.update()
		}, 1500);

		this.update();
	}

	update() {
		if(mWallet.dataProvider.blockcount > 10000) 
			this.showPoSUI();
		else
			this.showPoWUI();
	}

	showPoWUI() {
		var ctx = this, hr = this.getHashrate(),
			isGenerate = mWallet.dataProvider.isGenerate;

		this.wipeContents();

		this.appendView(new RowView()
			.setTitle(appLocale.minerSettings.toggle_main)
			.setSummary(appLocale.minerSettings.toggle_main_info)
			.setIcon(isGenerate ? "check_box" : "check_box_outline_blank")
			.setOnClickListener(() => {
				ctx.setGenerate(!isGenerate);
				mWallet.dataProvider.updateWalletInfo();
				ctx.update();
			}));

		this.appendView(new RowView()
			.setTitle(appLocale.minerSettings.pow_threads_title)
			.setIcon("account_tree")
			.setOnClickListener(function() {
				ctx.dialogThreads();
			}));

		this.appendView(new TextView("info", "<b>"+appLocale.minerSettings.pow_hashrate_prefix+" - "+hr+"</b>"));
		if(mWallet.server.isLocal) this.appendView(new TextView("info", appLocale.minerSettings.pow_bgmode_notice));
	}

	getHashrate() {
		var hr = mWallet.dataProvider.hashrate,
			prefix = "";

		if(hr > 500000) {
			hr = hr/1000000;
			prefix = "M";
		} else if(hr > 900) {
			hr = hr/1000;
			prefix = "k";
		}

		return hr+" "+prefix+"H/s";
	}

	setGenerate(isGenerate) {
		mWallet.sendCmd(["setgenerate", isGenerate, this.threads]);
	}

	dialogThreads() {
		var dialog = new Dialog();
		var prompt = new TextInput();
		var ctx = this;
		prompt.setTitle(appLocale.minerSettings.pow_threads_title);
		prompt.setType("number");
		dialog.appendView(prompt);
		dialog.addButton(new Button().setText(appLocale.minerSettings.action_apply).setOnClickListener(function(){
			dialog.hide();
			mWallet.dataProvider.threads = parseInt(prompt.toString());
			ctx.setGenerate(true);
		}));
		dialog.addButton(new Button().setText(appLocale.minerSettings.count_unlimited).setOnClickListener(function(){
			dialog.hide();
			mWallet.dataProvider.threads = -1;
			ctx.setGenerate(true);
		}));
		dialog.addButton(new Button().setText(appLocale.minerSettings.cancel).setOnClickListener(function(){
			dialog.hide();
		}));
		dialog.show();
	}

	showPoSUI() {
		// TODO: PoS mining UI
	}
}

