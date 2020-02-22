
// Global variables
var globalWalletData = null;
var conState = 0;

// Config
Config.mainColor = "#f09";

class WalletHomeScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.walletData = new WalletDataProvider();
		globalWalletData = this.walletData;

		this.setMode(Screen.MODE_ROOT);

		this.createLayout();
		this.setupTimers();
		this.updateViews();
		this.updateHistory();

		this.addAction(new MenuItem("Обзор блокчейна", "explore", function(){
			new ExplorerScreen().start();
		}));

		this.addAction(new MenuItem("Инструменты", "settings", function() {
			new ToolsScreen().start();
		}));

		setTimeout(() => {ctx.firstStart()}, 1000);
	}

	firstStart() {
		if(!localStorage.isDaemonNotifyShown) {
			new Alert()
				.setTitle("О фоновом режиме")
				.setMessage("Один из компонентов приложения (leadertvcoind) остаётся активным "+
					"даже после закрытия окна приложения. Сделано это для более быстрого запуска, плюс "+
					"это позволяет майнить в фоновом режиме и обновлять данные. Но "+
					"пока он запущен, вы не сможете запустить оригинальное приложение leadertvcoin. "+
					"Для полного закрытия приложения используйте пункт \"Выйти\" в настройках.<br/><br/>"+
					"Это сообщение больше не появится.")
				.show();
			localStorage.isDaemonNotifyShown = true;
		}
	}

	createLayout() {
		var ctx = this;

		this.mainBalanceView = new TextView("balance-main", "-- LTV");
		this.appendView(this.mainBalanceView);
		this.unfonfirmedBalanceView = new TextView("balance-small", "Не подтверждено: 0 LTV");
		this.appendView(this.unfonfirmedBalanceView);
		this.immatureBalanceView = new TextView("balance-small", "Дозревают: 0 LTV");
		this.appendView(this.immatureBalanceView);

		var btns = Utils.inflate({type: "div", class: "buttons-row"});
		this.appendView(btns);

		var recvBtn = new Button()
			.setStyle(Button.STYLE_FLAT)
			.setText("Получить")
			.setOnClickListener(function() {
				ctx.showGetUI();
			});

		btns.appendChild(recvBtn.getBlock());

		var sendBtn = new Button()
			.setStyle(Button.STYLE_FLAT)
			.setText("Отправить")
			.setOnClickListener(function() {
				ctx.showSendUI();
			});

		btns.appendChild(sendBtn.getBlock());

		this.historyBox = Utils.inflate({type: "div", class: "history"});
		this.historyBox.appendView(new TextView("info", "Loading history..."));
		this.appendView(this.historyBox);
	}

	showSendUI() {
		new SendScreen().start();
	}

	showGetUI() {
		new ReceiveScreen().start();
	}

	setupTimers() {
		var ctx = this;
		setInterval(() => {
			// Update balances
			ctx.updateViews();
			// Update history
			ctx.updateHistory();
		}, 5000);
	}

	updateViews() {
		if(this.walletData.isBalanceReady) {
			this.mainBalanceView.setText(this.walletData.balance+" LTV");
			this.unfonfirmedBalanceView.setText("Не подтверждено: "+
				this.walletData.unconfirmed_balance+" LTV");
			this.immatureBalanceView.setText("Дозревают: "+
				this.walletData.immature_balance+" LTV");
		}

		this.setTitle("");
		if(conState == 0) this.setTitle("Подключение...");
	}

	updateHistory() {
		if(this.walletData.isHistoryReady) {
			var box = this.historyBox;
			box.innerHTML = "";
			if(this.walletData.history.length < 1) {
				box.appendView(new TextView("info", "Ваши транзакции появятся тут :-)"));
			} else {
				var history = this.walletData.history;
				for(var a = history.length-1; a >=0; a--)
					box.appendView(this.buildHistoryRow(history[a]));
				box.appendView(new RowView()
					.setTitle("Вся история транзакций")
					.setIcon("history")
					.setOnClickListener(() => {
						new HistoryScreen().start();
					}))
			}
		}
	}

	buildHistoryRow(data) {
		var row = new RowView();
		row.setOnClickListener(function(){
				new TransactionViewScreen(data).start();
			});

		if(data.comment)
			row.setSummary(data.comment);
		
		if(data.category == "receive")
			row.setIcon("call_received")
				.setTitle("+"+data.amount+" LTV <a style='color:#999'>("+moment.unix(data.time).fromNow()+")</a>");

		if(data.category == "generate")
			row.setIcon("add_box")
				.setTitle("+"+data.amount+" LTV <a style='color:#999'>"+moment.unix(data.time).fromNow()+")</a>");

		if(data.category == "send")
			row.setIcon("call_made")
				.setTitle("-"+data.amount+" LTV <a style='color:#999'>"+moment.unix(data.time).fromNow()+")</a>");

		if(data.confirmations < 1)
			row.setIcon("timer");

		return row;
	}
}

// ========================================================================================
class WalletDataProvider {
	constructor() {
		this.setupDefaults();
		this.setupTimers();

		this.updateWalletInfo();
	}

	setupDefaults() {
		this.isBalanceReady = false;
		this.isHistoryReady = false;
		this.isGenerate = false;
		this.balance = 0;
		this.unconfirmed_balance = 0;
		this.immature_balance = 0;
		this.blockcount = 0;
		this.hashrate = 0;
		this.addressReceive = '";'
	}

	setupTimers() {
		var ctx = this;
		setInterval(() => {
			// Update balances
			ctx.updateWalletInfo();
		}, 7500);
	}

	updateWalletInfo() {
		var ctx = this;
		sendCommand(["listtransactions"]).then(function(data) {
			ctx.isHistoryReady = true;
			ctx.history = data;
		});
		sendCommand(["getwalletinfo"]).then(function(data) {
			for(var a in data)
				ctx[a] = data[a];
			ctx.isBalanceReady = true;
		});
		sendCommand(["getconnectioncount"]).then(function(data) {
			if(data > 0)
				conState = 1;
			else
				conState = 0;
		});
		sendCommand(["getblockcount"]).then(function(count) {
			ctx.blockcount = count;
		});
		sendCommand(["getgenerate"]).then(function(isGenerate) {
			ctx.isGenerate = isGenerate;
		})
		sendCommand(["gethashespersec"]).then(function(hashrate) {
			ctx.hashrate = hashrate;
		})
		sendCommand(["getaccountaddress", ""]).then(function(address) {
			ctx.addressReceive = address;
		})
	}
}

// =========================================================================================
class ToolsScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();
		this.appendView(new RowView()
			.setIcon("arrow_downward")
			.setTitle("Майнинг")
			.setSummary("Настройки генерации криптовалюты")
			.setOnClickListener(function(){
				new MinerCfgScreen().start();
			}));
		this.appendView(new RowView()
			.setIcon("pets")
			.setTitle("Задонатить разработчику mWallet LTV")
			.setOnClickListener(function(){
				new SendScreen("LSBBmSdZhEKvDZ6C1yd1ejc6a9h76qXAu2", 
					null, "Спасибо за приложение")
					.start();
			}));
		this.appendView(new RowView()
			.setIcon("exit_to_app")
			.setTitle("Завершить приложение")
			.setSummary("Остановить фоновый сервис и закрыть приложение")
			.setOnClickListener(function() {
				sendCommand(["stop"]).then(function() {
					electron.remote.getCurrentWindow().close();
				})
			}))
	}
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
		sendCommand(["setgenerate", isGenerate, this.threads]);
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

class TransactionViewScreen extends Screen {
	constructor(data) {
		super();
		this.data = data;
	}

	onCreate() {
		this.setHomeAsUpAction();
		this.setTitle("Сведения");

		this.appendView(new RowView()
			.setTitle("Адрес")
			.setSummary("<a style='word-break:break-all'>"+this.data.address+"</a>	"));
		this.appendView(new RowView()
			.setTitle("ID транзакции")
			.setSummary("<a style='word-break:break-all'>"+this.data.txid+"</a>"));
		this.appendView(new RowView()
			.setTitle("Дата транзакции")
			.setSummary(new Date(this.data.time).toString()));
		this.appendView(new RowView()
			.setTitle("Количество подтверждений")
			.setSummary(this.data.confirmations));
		this.appendView(new RowView()
			.setTitle("Коментарий")
			.setSummary(this.data.comment));
	}
}

class ReceiveScreen extends Screen {
	onCreate() {
		var QRCode = require('qrcode'),
			address = globalWalletData.addressReceive,
			url = "leadertvcoin:"+address,
			ctx = this;

		this.setHomeAsUpAction();

		this.qrview = Utils.inflate({type: "img", class: "qrview"});
		this.addrview = new TextView("address", address);

		QRCode.toDataURL(url, (err, url) => {
			if(err) {
				ctx.finish();
			} else {
				ctx.qrview.src = url;
			}
		});

		this.appendView(this.qrview);
		this.appendView(new TextView("address-label", "Ваш адрес:"));
		this.appendView(this.addrview);

		var btn = new Button().setText("Скопировать")
			.setOnClickListener(() => {
				electron.clipboard.writeText(address, "address");
			});
		btn.getBlock().style.display = "block";
		btn.getBlock().style.margin = "8px auto";
		this.appendView(btn);
	}
}

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

		var sumView = Utils.inflate({type: "div", class: "sumEditor", childs: {
			sumInput: {type: "input"},
			posix: {type: "a", inner: "LTV"}
		}});
		sumView.sumInput.placeholder = "0.00";
		sumView.sumInput.value = (this.sum ? this.sum : "");
		sumView.sumInput.type = "number";

		this.appendView(sumView);

		var tiv = new TextInputView()
			.setTitle("Адрес получателя")
			.fromString(this.address ? this.address : "")
			.setHolder("Lxxxxx");

		this.appendView(tiv);

		var civ = new TextInputView()
			.setTitle("Коментарий для получателя")
			.fromString(this.comment ? this.comment : "")
			.setHolder("Не обязательно");

		this.appendView(civ);

		var btn = new Button()
			.setStyle(Button.STYLE_CONTAINED)
			.setText("Отправить")
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
		sendCommand(["sendtoaddress", addr, sum, comment]).then((a) => {
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
					.setMessage("Введите сумму")
					.show();
			} else if(e.code == -5) {
				// Invalid account
				var d = new Alert()
					.setMessage("Указанный вами адрес, не существует")
					.show();
			} else if(e.code == -6) {
				// Insufficient funds
				var d = new Alert()
					.setMessage("Не хватает средств для перевода")
					.show();
			} else {
				// Unknown error
				console.error(e);
			}
		});
	}
}

class ExplorerScreen extends Screen {
	onCreate() {
		this.setHomeAsUpAction();

		this.appendView(new TextView("title", "Обзор"))
		this.appendView(new RowView().setTitle("<b>Колчиество блоков: </b>"+globalWalletData.blockcount))

		this.statusBox = Utils.inflate({type: "div"});
		this.appendView(this.statusBox);
		this.updateStatusBox();

		this.priceBox = Utils.inflate({type: "div"});
		this.appendView(this.priceBox);
		this.updatePriceBox();
	}

	updateStatusBox() {
		var ctx = this;
		this.statusBox.innerHTML = "";
		sendCommand(["listmasternodes"]).then((d) => {
			this.statusBox.appendView(new RowView()
				.setTitle("<b>Количество мастернод: </b>"+d.length));
			return sendCommand(["getconnectioncount"]);
		}).then((d) => {
			this.statusBox.appendView(new RowView()
				.setTitle("<b>Количество подключений: </b>"+d));
			return sendCommand(["listbanned"]);
		}).then((d) => {
			this.statusBox.appendView(new RowView()
				.setOnClickListener(() => {
					sendCommand(["clearbanned"]).then(() => {
						new Alert().setMessage("Список очищен").show();
						ctx.updateStatusBox();
					})
				})
				.setSummary("Нажмите для очистки")
				.setTitle("<b>Количество забаненных: </b>"+d.length));
			return sendCommand(["getnetworkhashps"]);
		}).then((d) => {
			this.statusBox.appendView(new RowView()
				.setTitle("<b>Скорость сети: </b>"+ctx.parseHashrate(d)));
			return fetch("https://chainz.cryptoid.info/ltv/api.dws?q=getdifficulty");
		}).then((r) => {return r.text()}).then((d) => {
			this.statusBox.appendView(new RowView()
				.setTitle("<b>Сложность: </b>"+(Math.round(d*100)/100)));
		});
	}

	parseHashrate(hr) {
		var prefix = "";

		if(hr > 500000) {
			hr = hr/1000000;
			prefix = "M";
		} else if(hr > 900) {
			hr = hr/1000;
			prefix = "k";
		}

		return hr+" "+prefix+"H/s";
	}

	updatePriceBox() {
		var ctx = this;
		fetch("https://blockchain.info/ticker").then((r) => {
			return r.json();
		}).then((d) => {
			ctx.btcUsbPrice = d.USD.last;
			return fetch("https://www.occe.io/api/v2/public/info/ltv_btc");
		}).then((r) => {
			return r.json();
		}).then((d) => {
			d = d.coinInfo[0];
			console.log(d);
			var midPrice = (d.lowest24h+d.highest24h)/2;
			ctx.priceBox.appendView(new TextView("title3", "Цена монеты"));
			ctx.priceBox.appendView(new RowView()
				.setTitle("Средняя цена монеты (на сегодня)")
				.setSummary(ctx.showBtc(midPrice)));
			ctx.priceBox.appendView(new RowView()
				.setTitle("Средняя цена всех ваших монет (примерная)")
				.setSummary(ctx.showBtc(midPrice*globalWalletData.balance)));
			ctx.priceBox.appendView(new RowView()
				.setTitle("Цена за 24 часа (мин/макс)")
				.setSummary(d.lowest24h+"/"+d.highest24h+" BTC"));
			ctx.priceBox.appendView(new RowView()
				.setTitle("Макс цена продажи / Мин цена покупки")
				.setSummary(d.highestBuy+"/"+d.lowestSell+" BTC"));
			ctx.priceBox.appendView(new TextView("info", 
				"Информация с сайта OCCE.io, курс BTC к USD предоставлен blockchain.info."));
		});
	}

	showBtc(btc) {
		return btc+" BTC / "+
			(Math.round(btc*this.btcUsbPrice*100)/100)+"$";
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
		sendCommand(["walletpassphrase", password, 10]).then((r) => {
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

class HistoryScreen extends Screen {
	onCreate() {
		var ctx = this;
		this.offset = 0;
		this.setHomeAsUpAction();
		this.setTitle("История операций")
		this.box = Utils.inflate({type: "div"});
		this.appendView(this.box);
		this.appendView(new RowView()
			.setTitle("Показать ещё")
			.setIcon("history")
			.setOnClickListener(() => {ctx.loadNext()}));
		this.loadNext();
	}

	loadNext() {
		var ctx = this, hs = new WalletHomeScreen();

		sendCommand(["listtransactions", "", 10, ctx.offset]).then((data) => {
			ctx.offset += 10;
			for(var a = data.length-1; a >= 0; a--)
				ctx.box.appendView(hs.buildHistoryRow(data[a]));
		});
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