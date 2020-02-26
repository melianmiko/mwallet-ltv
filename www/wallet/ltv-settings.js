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

		// =====================================================

		if(mWallet.server.settings) this.appendView(new RowView()
			.setIcon("account_circle")
			.setTitle("Аккаунт")
			.setSummary("Логин, пароль, т. п.")
			.setOnClickListener(() => {
				mWallet.server.settings();
			}));

		this.appendView(new RowView()
			.setIcon("arrow_downward")
			.setTitle("Майнинг")
			.setSummary("Настройки генерации криптовалюты")
			.setOnClickListener(function(){
				new MinerCfgScreen().start();
			}));

		// =========================================================

		this.appendView(new SubHeader("Дополнительно"));
		if(mWallet.platform.settings) this.appendView(new RowView()
			.setIcon("dashboard")
			.setTitle("Общие настройки")
			.setOnClickListener(() => {
				mWallet.platform.settings();
			}));

		if(mWallet.allowAccountSettings) this.appendView(new RowView()
			.setIcon("account_box")
			.setTitle("Мои аккаунты")
			.setOnClickListener(() => {
				new AccountsEditScreen().start();
			}));

		this.appendView(new RowView()
			.setIcon("build")
			.setTitle("Консоль отладки")
			.setOnClickListener(() => {
				new ConsoleScreen().start();
			}));

		if(this.showDonate()) this.appendView(new RowView()
			.setIcon("favorite")
			.setTitle("Поддержать разработчика приложения")
			.setOnClickListener(function(){
				new SendScreen("LSBBmSdZhEKvDZ6C1yd1ejc6a9h76qXAu2", 
					null, "Спасибо за приложение")
					.start();
			}));

		if(mWallet.exit) this.appendView(new RowView()
			.setIcon("exit_to_app")
			.setTitle("Выйти")
			.setOnClickListener(function() {
				mWallet.exit();
			}))
	}

	showDonate() {
		return globalWalletData.balance > 250;
	}
}

class LockScreen extends Screen {
	unlock() {var ctx = this; return new Promise((resolve, reject) => {
		var te = new TextInput()
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
		this.addMod(new RightSideScreenMod());

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
		var prompt = new TextInput();
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
		var ctx = this;
		this.setHomeAsUpAction();
		this.setTitle("Daemon console");

		this.logbox = Utils.inflate({type: "div", class: "console-log"});
		var inframe = Utils.inflate({type: "div", class: "console-input-frame", childs: {
			input: {type: "input"},
			sendBtn: {type: "i", class: "material-icons", inner: "play_arrow"}
		}})

		this.logIn("Добро пожаловать!");
		this.logIn("Это - консоль отладки. Она используется для тестирования приложения и управления функциями, которых нет в обычных меню");
		this.logErr("Никогда не набирайте и не вставляйте сюда команды, предназначение которых вам не известно. Этим часто пользуются мошенники!");
		this.logOut("");
		this.logOut("P. S. Кнопка Enter на клавиатуре не работает. Разработчик уже знает, ждите фикса.");
		this.logOut("");

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
