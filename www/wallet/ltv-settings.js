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
	onCreate() {
		this.setHomeAsUpAction();
		if(this.showDonate()) this.appendView(new RowView()
			.setIcon("pets")
			.setTitle("Задонатить разработчику mWallet LTV")
			.setOnClickListener(function(){
				new SendScreen("LSBBmSdZhEKvDZ6C1yd1ejc6a9h76qXAu2", 
					null, "Спасибо за приложение")
					.start();
			}));

		if(mWallet.settings) this.appendView(new RowView()
			.setIcon("settings")
			.setTitle("Настройки аккаунта")
			.setOnClickListener(() => {
				mWallet.settings();
			}));

		this.appendView(new RowView()
			.setIcon("settings")
			.setTitle("Аккаунты")
			.setOnClickListener(() => {
				new LauncherScreen(true).start();
			}));

		this.appendView(new RowView()
			.setIcon("exit_to_app")
			.setTitle("Завершить приложение")
			.setOnClickListener(function() {
				new PlatformTools().exit();
			}))

		this.appendView(new SubHeader("Настройки кошелька"));
		this.appendView(new RowView()
			.setIcon("arrow_downward")
			.setTitle("Майнинг")
			.setSummary("Настройки генерации криптовалюты")
			.setOnClickListener(function(){
				new MinerCfgScreen().start();
			}));
	}

	showDonate() {
		// TODO: Show donate button after 1 week
		return false
	}
}

class LockScreen extends Screen {
	unlock() {var ctx = this; return new Promise((resolve, reject) => {
		var te = new TextInputView()
			.setTitle("Пароль")
			.setType("password");

		var d = new Dialog()
			.setMessage("Для этой операции нужно раблокировать кошелёк. Введите ваш пароль:")
			.appendView(te)
			.addButton(new Button().setText("Отмена").setOnClickListener(() => {
				d.hide();
			})).addButton(new Button().setText("Разблокировать").setOnClickListener(() => {
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
				new Alert().setMessage("Неверный пароль").show();
			}
			console.error(e);
			reject(e);
		})
	})}
}

class MinerCfgScreen extends Screen {
	onCreate() {
		var ctx = this;

		this.threads = -1;
		this.setHomeAsUpAction();
		this.setTitle("Майнинг");

		setInterval(function() {
			ctx.update()
		}, 5000);

		this.update();
	}

	update() {
		if(globalWalletData.blockcount > 10000) 
			this.showPoSUI();
		else
			this.showPoWUI();
	}

	showPoWUI() {
		var ctx = this;
		this.wipeContents();

		this.appendView(new TextView("hashrate", "Hashrate - "+this.getHashrate()))

		if(globalWalletData.isGenerate)
			this.appendView(new RowView()
				.setTitle("Остановить генерацию")
				.setIcon("stop")
				.setOnClickListener(function() {
					ctx.setGenerate(false);
				}));
		else
			this.appendView(new RowView()
				.setTitle("Запустить генерацию")
				.setIcon("play_arrow")
				.setOnClickListener(function() {
					ctx.setGenerate(true);
				}));

		this.appendView(new RowView()
			.setTitle("Установить количество потоков")
			.setIcon("account_tree")
			.setOnClickListener(function() {
				ctx.dialogThreads();
			}))
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
		var prompt = new TextInputView();
		var ctx = this;
		prompt.setTitle("Количество потоков");
		prompt.setType("number");
		dialog.appendView(prompt);
		dialog.addButton(new Button().setText("Применить").setOnClickListener(function(){
			dialog.hide();
			globalWalletData.threads = parseInt(prompt.toString());
			ctx.setGenerate(true);
		}));
		dialog.addButton(new Button().setText("Неограничено").setOnClickListener(function(){
			dialog.hide();
			globalWalletData.threads = -1;
			ctx.setGenerate(true);
		}));
		dialog.addButton(new Button().setText("Отмена").setOnClickListener(function(){
			dialog.hide();
		}));
		dialog.show();
	}

	showPoSUI() {

	}
}

class ConsoleScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.logbox = Utils.inflate({type: "div"});
		this.appendView(this.logbox);
		this.input = new TextInputView();
	}
}
