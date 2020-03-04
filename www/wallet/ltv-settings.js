class Updater {
	static checkAppUpdate() {return new Promise((resolve, reject) => {
		fetch("https://api.github.com/repos/mhbrgn/mWallet-LTV/releases").then((r) => {
			return r.json();
		}).then((d) => {
			var lastTag = d[0].tag_name;
			if(lastTag != version) {
				resolve(d[0].html_url);
			} else resolve(false);
		}).catch((e) => {
			reject(e);
		})
	})}
}

class ToolsScreen extends Screen {
	isBigScreen() {
		return (document.body.getBoundingClientRect().width > 720);
	}

	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new RightSideScreenMod());

		this.addAction(new MenuItem("Перезапустить", "refresh", () => {
			location.reload();
		}));

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

		this.appendView(new RowView()
			.setIcon("arrow_downward")
			.setTitle(appLocale.toolsScreen.mining)
			.setSummary(appLocale.toolsScreen.mining_info)
			.setOnClickListener(function(){
				new MinerCfgScreen().start();
			}));

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
	}
}

class DonateScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new RightSideScreenMod());

		// TODO: Help with translation

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
		if(globalWalletData.blockcount > 10000) 
			this.showPoSUI();
		else
			this.showPoWUI();
	}

	showPoWUI() {
		var ctx = this, hr = this.getHashrate(),
			isGenerate = globalWalletData.isGenerate;

		this.wipeContents();

		this.appendView(new RowView()
			.setTitle(appLocale.minerSettings.toggle_main)
			.setSummary(appLocale.minerSettings.toggle_main_info)
			.setIcon(isGenerate ? "check_box" : "check_box_outline_blank")
			.setOnClickListener(() => {
				ctx.setGenerate(!isGenerate);
				globalWalletData.updateWalletInfo();
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
		var hr = globalWalletData.hashrate,
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
			globalWalletData.threads = parseInt(prompt.toString());
			ctx.setGenerate(true);
		}));
		dialog.addButton(new Button().setText(appLocale.minerSettings.count_unlimited).setOnClickListener(function(){
			dialog.hide();
			globalWalletData.threads = -1;
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

class RecoverySettingsScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.addMod(new RightSideScreenMod());

		if(mWallet.allowBackup) this.appendView(new RowView()
			.setTitle(appLocale.recoverySettings.createBackup)
			.setOnClickListener(() => {mWallet.createBackup();}))
		if(mWallet.allowBackup) this.appendView(new RowView()
			.setTitle(appLocale.recoverySettings.restoreBackup)
			.setOnClickListener(() => {mWallet.restoreBackup();}))
		if(mWallet.allowRecovery) this.appendView(new RowView()
			.setTitle(appLocale.recoverySettings.recovery)
			.setOnClickListener(() => {mWallet.recovery()}))
	}
}

class ConsoleScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.setHomeAsUpAction();
		this.setTitle("Daemon console");

		this.logbox = Utils.inflate({type: "div", class: "console-log"});
		var inframe = Utils.inflate({type: "div", class: "console-input-frame", childs: {
			input: {type: "input"},
			sendBtn: {type: "i", class: "material-icons", inner: "play_arrow"}
		}})

		this.logIn("Welcome!");
		this.logIn("This is daemon debug shell. It can be used for tests and some specific tricks.");
		this.logErr("WARRNING: Scammers are active! DO NOT USE COMMANDS IF YOU DON'T KNOW WHAT IT DO!!!");
		this.logOut("");
		this.logOut("P. S. Enter button don't work. To be fixed :-)");
		this.logOut("");

		// TODO: Enter button tracker

		this.appendView(this.logbox);
		this.appendView(inframe);
		inframe.input.placeholder = "Input your command here...";

		inframe.sendBtn.onclick = function() {
			var cmd = inframe.input.value.split(" ");
			console.log(cmd);
			inframe.input.value = "";
			ctx.logOut(cmd);
			mWallet.sendCmd(cmd).then(function(res) {
				ctx.logIn(res);
			}).catch(function(e) {
				ctx.logErr(e);
			})
		};
	}

	logOut(text) {
		if(typeof(text) == "object") text = JSON.stringify(text);
		this.logbox.appendView(Utils.inflate({type: "div", class: "out", 
			inner: "> "+text}));
	}

	logIn(text) {
		if(typeof(text) == "object") text = JSON.stringify(text);
		this.logbox.appendView(Utils.inflate({type: "div", class: "in",
			inner: "< "+text}));
	}

	logErr(text) {
		if(typeof(text) == "object") text = JSON.stringify(text);
		this.logbox.appendView(Utils.inflate({type: "div", class: "error",
			inner: "E "+text}));
	}
}
