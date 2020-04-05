"use strict";

window.mWallet = {
  version: "alpha3",
  lang: {},
  defaultLang: "ru",
  connState: 0,
  allowAccountSettings: true,
  allowBackup: false,
  allowRecovery: false,
  allowMining: false,
  showDonate: true,
  launcherTools: {},
  sendCmd: function sendCmd(args) {
    console.warn("SendCmd will be removed!");
    return mWallet.server.sendCmd(args);
  }
};

function getServer(srv) {
  if (srv == "remote") return new RemoteDaemon();
  if (srv == "debug") return new Debug();
  console.warn("Wallet " + srv + " not found!");
}

mWallet.launch = function () {
  Config.mainColor = "#f09"; // Build languages

  mWallet.lang.ru = new Russian().getLang();

  if (!mWallet.launcherTools._stateView) {
    // Create state view screen
    // TODO: Use splash screen!
    var ss = new Screen();
    ss.markAsRoot();
    ss.setTitle("Wait...");
    ss.start();
    mWallet.launcherTools._stateView = ss;
  } // Load language


  var locale = navigator.language;
  if (!!localStorage.appLocale) locale = localStorage.appLocale;
  if (!mWallet.lang[locale]) locale = mWallet.defaultLang;
  console.log("Language", locale);
  window.appLocale = mWallet.lang[locale]; // Load platform

  var platform = "browser";

  if (navigator.userAgent.indexOf("Electron") > 0) {
    // ELetron mode
    platform = "electron";
    mWallet.platform = new ElectronPlatform();
  } else if (!!window.cordova) {
    // Cordova (non-native)
    platform = "cordova";
    mWallet.platform = new CordovaPlatform();
  } else {
    // Browser
    mWallet.platform = new BrowserPlatform();
  }

  console.log("App platform", platform);
  mWallet.launcherTools.updateState(appLocale.launcher.stage_findWallet);
  mWallet.launcherTools.selectWallet().then(wallet => {
    // After wallet selection
    mWallet.launcherTools.updateState(appLocale.launcher.stage_loadWallet);
    return mWallet.launcherTools.loadWallet(wallet);
  }).then(() => {
    // We are ready...
    mWallet.launcherTools._stateView.finish();

    mWallet.launcherTools._stateView = null;
    mWallet.launcherTools.updateState = null;
    new WalletHomeScreen().start();
  }).catch(e => {
    console.error(e);
    new Alert().setMessage(e).show();
  });
};

mWallet.launcherTools.updateState = function (text) {
  console.log(text);

  mWallet.launcherTools._stateView.setTitle(text);
};

mWallet.launcherTools.selectWallet = function () {
  return new Promise((resolve, reject) => {
    if (!!mWallet.server) return reject("Wallet already loaded");
    var wallets = mWallet.launcherTools.getWallets();

    if (mWallet.platform.hasNative && wallets.length == 0) {
      // Load native wallet
      resolve("native::");
    } else if (!mWallet.platform.hasNative && wallets.length == 1) {
      // Load saved wallet
      resolve(wallets[0]);
    } else {
      // Create selector menu and wait for answer
      var slc = new BootMenu();
      slc.waitForSelect().then(w => {
        resolve(w);
      });
      slc.start();
    }
  });
};

mWallet.launcherTools.getWallets = function () {
  if (!localStorage.myWallets) localStorage.myWallets = "[]";
  return JSON.parse(localStorage.myWallets);
};

mWallet.launcherTools.loadWallet = function (data) {
  return new Promise((resolve, reject) => {
    if (!!mWallet.server) return reject("Aleady loaded!");
    var name = data.split(":")[0],
        id = data.split(":")[1],
        displayName = data.substr(name.length + id.length + 2);

    if (name === "native") {
      console.log("loading native wallet...");
      mWallet.platform.launchNative().then(d => {
        resolve(d);
      }).catch(e => {
        reject(e);
      });
      return;
    } // Load wallet script


    console.log("loading wallet " + name);
    mWallet.server = getServer(name);
    mWallet.server.name = name;
    mWallet.server.id = id;
    mWallet.server.launch().then(resolve, reject);
  });
};

mWallet.crash = function (d) {
  var d = new Dialog().setTitle(appLocale.launcher.crash_title).setMessage(d).addButton(new Button().setText(appLocale.launcher.btn_recovery).setOnClickListener(() => {
    d.hide();
    new RecoverySettingsScreen().start();
  })).addButton(new Button().setText(appLocale.launcher.btn_ok).setOnClickListener(() => {
    d.hide();
  })).show();
};
"use strict";

class AccountsEditScreen extends Screen {
  onCreate() {
    var ctx = this;
    var wallets = mWallet.launcherTools.getWallets(); // Show menu

    this.setTitle(appLocale.launcher.editor_title);
    this.addMod(new RightSideScreenMod());
    this.setHomeAsUpAction();
    this.listWallets();
  }

  listWallets() {
    var ctx = this;
    var wallets = JSON.parse(localStorage.myWallets);
    this.wipeContents();
    if (mWallet.hasNative) this.appendView(new RowView().setTitle(appLocale.launcher.wallet_native).setIcon("account_balance_wallet").setOnClickListener(() => {
      ctx.reloadDialog();
    }));
    this.appendView(new RowView().setTitle(appLocale.launcher.editor_newWallet).setIcon("add_circle").setOnClickListener(() => {
      ctx.createMenu();
    }));
    this.appendView(new SubHeader(appLocale.launcher.editor_walletsSubtitle));

    for (var a in wallets) {
      this.addWalletRow(wallets[a]);
    }
  }

  createMenu() {
    var dialog = new Dialog(),
        ctx = this;
    dialog.appendView(new RowView().setTitle(appLocale.launcher.wallet_remote_title).setSummary(appLocale.launcher.wallet_remote_info).setOnClickListener(function () {
      dialog.hide();
      ctx.createWallet("remote", "Remote server");
    }));
    dialog.appendView(new RowView().setTitle(appLocale.launcher.wallet_fictive_title).setSummary(appLocale.launcher.wallet_fictive_info).setOnClickListener(function () {
      dialog.hide();
      ctx.createWallet("debug", "Debug wallet");
    }));
    dialog.show();
  }

  addWalletRow(data) {
    console.log(data);
    var ctx = this;
    var type = data.split(":")[0],
        id = data.split(":")[1],
        name = data.substr(type.length + id.length + 2);
    var row = new RowView().setTitle(name).setOnClickListener(() => {
      ctx.reloadDialog();
    });
    row.setAction("options", "more_vert", () => {
      ctx.editWallet(data);
    });
    this.appendView(row);
  }

  editWallet(data) {
    var dialog = new Dialog(),
        ctx = this;
    dialog.appendView(new RowView().setIcon("edit").setTitle(appLocale.launcher.editor_rename).setOnClickListener(() => {
      dialog.hide();
      ctx.rename(data);
    }));
    dialog.appendView(new RowView().setIcon("delete").setTitle(appLocale.launcher.editor_remove).setOnClickListener(() => {
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
        name = data.substr(type.length + id.length + 2);
    var ti = new TextInput().setTitle(appLocale.launcher.editor_rename_newTitle).fromString(name);
    var dialog = new Dialog().appendView(ti).addButton(new Button().setText(appLocale.launcher.editor_rename_cancel).setOnClickListener(() => {
      dialog.hide();
    })).addButton(new Button().setText(appLocale.launcher.editor_rename_confirm).setOnClickListener(() => {
      dialog.hide();
      name = ti.toString();
      var newdata = type + ":" + id + ":" + name;
      var wallets = JSON.parse(localStorage.myWallets);
      var index = wallets.indexOf(data);
      wallets[index] = newdata;
      localStorage.myWallets = JSON.stringify(wallets);
      ctx.listWallets();
    })).show();
  }

  createWallet(type, name) {
    var wallets = JSON.parse(localStorage.myWallets);
    var data = type + ":" + type + wallets.length + ":" + name;
    wallets[wallets.length] = data;
    localStorage.myWallets = JSON.stringify(wallets);
    this.listWallets();
    this.reloadDialog();
  }

  reloadDialog() {
    new Confirm().setMessage(appLocale.launcher.editor_launch_confirm).setOnConfirmListener(() => {
      location.reload();
    }).show();
  }

}
"use strict";

class BootMenu extends Screen {
  onCreate() {
    this.setTitle(appLocale.launcher.wallets_selectScreenTitle);
    this.markAsRoot();
  }

  waitForSelect() {
    return new Promise((resolve, reject) => {
      var ctx = this,
          wallets = mWallet.launcherTools.getWallets();
      if (mWallet.platform.hasNative) this.appendView(new RowView().setTitle(appLocale.launcher.wallet_native).setIcon("account_balance_wallet").setOnClickListener(() => {
        resolve("native::");
        ctx.finish();
      }));
      if (mWallet.allowAccountSettings) this.appendView(new RowView().setTitle(appLocale.launcher.wallets_editButton).setIcon("settings").setOnClickListener(() => {
        new AccountsEditScreen().start();
      }));
      this.appendView(new SubHeader(appLocale.launcher.wallets_other));

      for (var a in wallets) this.addWalletRow(wallets[a], resolve);
    });
  }

  addWalletRow(data, resolve) {
    var name = data.split(":")[0],
        id = data.split(":")[1],
        displayName = data.substr(name.length + id.length + 2),
        ctx = this;
    this.appendView(new RowView().setTitle(displayName).setOnClickListener(() => {
      resolve(data);
      ctx.finish();
    }));
  }

}
"use strict";

class ExplorerScreen extends Screen {
  onCreate() {
    var ctx = this;
    this.setHomeAsUpAction();
    this.setTitle(appLocale.explorer.title);
    this.box_status = Utils.inflate({
      type: "div"
    });
    this.box_prices = Utils.inflate({
      type: "div"
    });
    this.appendView(new SubHeader(appLocale.explorer.header_state));
    this.appendView(this.box_status);
    this.appendView(new SubHeader(appLocale.explorer.header_price));
    this.appendView(this.box_prices);
    this.updateViews();

    this.interval = function () {
      ctx.updateViews();
    };

    setInterval(this.interval, 5000);
  }

  onFinish() {
    clearInterval(this.interval);
    return true;
  }

  updateViews() {
    var lc = appLocale.explorer; // Status box

    this.box_status.innerHTML = "";
    this.box_status.appendView(this.mkInfo(lc.status_blocks, mWallet.dataProvider.blockcount + " / " + mWallet.dataProvider.globalBlockCount));
    this.box_status.appendView(this.mkInfo(lc.status_masternodes, mWallet.dataProvider.masternodes));
    this.box_status.appendView(this.mkInfo(lc.status_connections, mWallet.dataProvider.connections));
    this.box_status.appendView(this.mkInfo(lc.status_network_speed, this.parseHashrate(mWallet.dataProvider.networkHashrate)));
    this.box_status.appendView(this.mkInfo(lc.status_difficulty, Math.round(mWallet.dataProvider.difficulty * 100) / 100)); // Price box

    this.box_prices.innerHTML = "";
    this.box_prices.appendView(this.mkInfo(lc.price_today, this.showBtc(mWallet.dataProvider.midPrice)));
    this.box_prices.appendView(this.mkInfo(lc.price_all, this.showBtc(mWallet.dataProvider.midPrice * mWallet.dataProvider.balance)));
    this.box_prices.appendView(this.mkInfo(lc.prices_24h, mWallet.dataProvider.lowest24h + "-" + mWallet.dataProvider.highest24h + " BTC"));
    this.box_prices.appendView(this.mkInfo(lc.prices, mWallet.dataProvider.highestBuy + " / " + mWallet.dataProvider.lowestSell + " BTC"));
  }

  mkInfo(title, info) {
    return new TextView("explorer_row", "<b>" + title + ": </b>" + info);
  }

  parseHashrate(hr) {
    var prefix = "";

    if (hr > 500000) {
      hr = hr / 1000000;
      prefix = "M";
    } else if (hr > 900) {
      hr = hr / 1000;
      prefix = "k";
    }

    return hr + " " + prefix + "H/s";
  }

  showBtc(btc) {
    return btc + " BTC / " + Math.round(btc * mWallet.dataProvider.btcUsdPrice * 100) / 100 + "$";
  }

}
"use strict";

class HistoryScreen extends Screen {
  onCreate() {
    var ctx = this;
    this.offset = 0;
    this.setHomeAsUpAction();
    this.addMod(new LeftSideScreenMod());
    this.setTitle(appLocale.historyScreen.title);
    this.box = Utils.inflate({
      type: "div"
    });
    this.appendView(this.box);
    this.appendView(new RowView().setTitle(appLocale.historyScreen.action_more).setIcon("history").setOnClickListener(() => {
      ctx.loadNext();
    }));
    this.loadNext();
  }

  loadNext() {
    var ctx = this,
        hs = new WalletHomeScreen();
    mWallet.sendCmd(["listtransactions", "", 10, ctx.offset]).then(data => {
      ctx.offset += 10;

      for (var a = data.length - 1; a >= 0; a--) ctx.box.appendView(hs.buildHistoryRow(data[a]));
    });
  }

}
"use strict";

class ReceiveScreen extends Screen {
  onCreate() {
    var address = mWallet.dataProvider.addressReceive,
        url = "leadertvcoin:" + address,
        ctx = this;
    this.addMod(new LeftSideScreenMod());
    this.setHomeAsUpAction();
    this.qrview = Utils.inflate({
      type: "a",
      class: "qrview"
    });
    this.addrview = new TextView("address", address);
    new QRCode(this.qrview, {
      text: url,
      width: 172,
      height: 172
    });
    this.appendView(this.qrview);
    this.appendView(new TextView("address-label", "Ваш адрес:"));
    this.appendView(this.addrview);
    if (mWallet.platform.copy) var btn = new Button().setStyle(Button.STYLE_OUTLINE).setText(appLocale.receiveScreen.action_copy).setOnClickListener(() => {
      mWallet.platform.copy(address);
    });
    btn.getBlock().style.display = "block";
    btn.getBlock().style.margin = "8px auto";
    this.appendView(btn);
  }

}
"use strict";

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
    var sumView = Utils.inflate({
      type: "div",
      class: "sumEditor",
      childs: {
        sumInput: {
          type: "input"
        },
        posix: {
          type: "a",
          inner: "LTV"
        }
      }
    });
    sumView.sumInput.placeholder = "0.00";
    if (this.sum < 0) this.sum = -this.sum;
    sumView.sumInput.value = this.sum ? this.sum : "";
    sumView.sumInput.type = "number";
    this.appendView(sumView);
    var tiv = new TextInput().setTitle(appLocale.receiveScreen.prop_address).fromString(this.address ? this.address : "").setHolder("Lxxxxx");
    this.appendView(tiv);
    var civ = new TextInput().setTitle(appLocale.receiveScreen.prop_comment).fromString(this.comment ? this.comment : "").setHolder(appLocale.receiveScreen.prop_comment_holder);
    this.appendView(civ);
    var btn = new Button().setStyle(Button.STYLE_CONTAINED).setText(appLocale.receiveScreen.action_send).setOnClickListener(function () {
      ctx.sum = sumView.sumInput.value;
      ctx.address = tiv.toString();
      ctx.comment = civ.toString();
      ctx.performSend();
    });
    btn.getBlock().style.margin = "16px";
    this.appendView(btn);
  }

  performSend() {
    var addr = this.address,
        sum = parseFloat(this.sum),
        ctx = this,
        comment = this.comment;
    console.log(addr, sum, comment);
    mWallet.server.sendToAddress(addr, sum, comment).then(a => {
      console.log(a);
      ctx.finish();
    }).catch(e => {
      if (e.code == -13) {
        // Wallet is locked
        new LockScreen().unlock().then(() => {
          ctx.performSend();
        });
      } else if (e.code == -3) {
        // Invalid amount
        var d = new Alert().setMessage(appLocale.receiveScreen.error_noSum).show();
      } else if (e.code == -5) {
        // Invalid account
        var d = new Alert().setMessage(appLocale.receiveScreen.error_invalidAddress).show();
      } else if (e.code == -6) {
        // Insufficient funds
        var d = new Alert().setMessage(appLocale.receiveScreen.error_noMoney).show();
      } else {
        // Unknown error
        console.error(e);
      }
    });
  }

}
"use strict";

class TransactionViewScreen extends Screen {
  constructor(data) {
    super();
    this.data = data;
  }

  onCreate() {
    this.setHomeAsUpAction();
    this.addMod(new LeftSideScreenMod());
    if (this.data.category == "send") this.appendView(new RowView().setTitle(appLocale.transactionView.action_repeat).setIcon("refresh").setOnClickListener(() => {
      new SendScreen(this.data.address, this.data.amount, this.data.comment).start();
    }));
    this.appendView(new SubHeader(appLocale.transactionView.group_info));
    this.appendView(new RowView().setTitle(appLocale.transactionView.prop_address).setSummary("<a style='word-break:break-all'>" + this.data.address + "</a>	"));
    this.appendView(new RowView().setTitle(appLocale.transactionView.prop_id).setSummary("<a style='word-break:break-all'>" + this.data.txid + "</a>"));
    this.appendView(new RowView().setTitle(appLocale.transactionView.prop_date).setSummary(new Date(this.data.time).toString()));
    this.appendView(new RowView().setTitle(appLocale.transactionView.prop_confirmations).setSummary(this.data.confirmations));
    this.appendView(new RowView().setTitle(appLocale.transactionView.prop_comment).setSummary(this.data.comment));
  }

}
"use strict";

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
    this.addressReceive = '";';
  }

  setupTimers() {
    var ctx = this;
    setInterval(() => {
      // Update balances
      ctx.updateWalletInfo();
    }, 10000);
  }

  updateWalletInfo() {
    var ctx = this; // Get connection status

    mWallet.server.getConnections().then(function (data) {
      ctx.connections = data;
      return mWallet.server.getBlockCount();
    }).then(bc => {
      ctx.blockcount = bc;
      return fetch(coinConfig.globalBlockCount);
    }).then(r => {
      return r.text();
    }).then(gbc => {
      ctx.globalBlockCount = parseInt(gbc);
      if (ctx.connections < 1) // Disconnected
        mWallet.connState = 0;else if (ctx.blockcount < ctx.globalBlockCount) // Syncing
        mWallet.connState = 1;else // Connected
        mWallet.connState = 2;
    }); // Get price info

    fetch("https://blockchain.info/ticker").then(r => {
      return r.json();
    }).then(d => {
      ctx.btcUsdPrice = d.USD.last;
      return fetch(coinConfig.occeInfoUrl);
    }).then(r => {
      return r.json();
    }).then(d => {
      d = d.coinInfo[0];
      ctx.midPrice = (d.lowest24h + d.highest24h) / 2;
      ctx.midPrice = Math.round(ctx.midPrice * 10000000000) / 10000000000;
      ctx.lowest24h = d.lowest24h;
      ctx.highest24h = d.highest24h;
      ctx.highestBuy = d.highestBuy;
      ctx.lowestSell = d.lowestSell;
    }); // Get difficulty

    fetch(coinConfig.getDifficulty).then(r => {
      return r.text();
    }).then(d => {
      ctx.difficulty = d;
    }); // Get other data

    mWallet.server.getTransactionsLog(10, 0).then(function (data) {
      ctx.isHistoryReady = true;
      ctx.history = data;
    });
    mWallet.server.getMasternodesCount().then(function (data) {
      ctx.masternodes = data;
    });
    mWallet.server.getBalances().then(function (balances) {
      ctx.isBalanceReady = true;
      ctx.balance = balances[0];
      ctx.unconfirmed_balance = balances[1];
      ctx.immature_balance = balances[2];
    });
    mWallet.server.isGenerate().then(function (isGenerate) {
      ctx.isGenerate = isGenerate;
    });
    mWallet.server.getMiningHashrate().then(function (hashrate) {
      ctx.hashrate = hashrate;
    });
    mWallet.server.getNetworkHashrate().then(function (hr) {
      ctx.networkHashrate = hr;
    });
    mWallet.server.getReceiveAddress().then(function (address) {
      ctx.addressReceive = address;
    });
  }

}
"use strict";

class WalletHomeScreen extends Screen {
  onCreate() {
    var ctx = this;
    this.walletData = new WalletDataProvider();
    mWallet.dataProvider = this.walletData;
    this.markAsRoot();
    this.createLayout();
    this.setupTimers();
    this.updateViews();
    this.updateHistory();
    this.addAction(new MenuItem(appLocale.walletHome.action_explore, "explore", function () {
      new ExplorerScreen().start();
    }));
    this.addAction(new MenuItem(appLocale.walletHome.action_settings, "settings", function () {
      new SettingsScreen().start();
    }));
    setTimeout(() => {
      ctx.firstStart();
    }, 1000);
  }

  firstStart() {
    if (!localStorage.isDaemonNotifyShown && mWallet.server.isLocal) {
      new Alert().setTitle(appLocale.walletHome.bgMode_title).setMessage(appLocale.walletHome.bgMode_message).show();
      localStorage.isDaemonNotifyShown = true;
    }
  }

  createLayout() {
    var ctx = this;
    this.addMod(new WideScreenMod());
    var expandable = new ExpandableLayout(),
        left = expandable.addColumn(360, 360),
        right = expandable.addColumn(400, 540);
    this.appendView(expandable);
    this.mainBalanceView = new TextView("balance-main", "-- LTV");
    left.appendView(this.mainBalanceView);
    this.unfonfirmedBalanceView = new TextView("balance-small", appLocale.walletHome.balance_unconfirmed + ": 0 LTV");
    left.appendView(this.unfonfirmedBalanceView);
    this.immatureBalanceView = new TextView("balance-small", appLocale.walletHome.balance_pending + ": 0 LTV");
    left.appendView(this.immatureBalanceView);
    var row = Utils.inflate({
      type: "div",
      class: "buttons-row"
    });
    row.appendView(new Button().setStyle(Button.STYLE_OUTLINE).setText(appLocale.walletHome.action_receive).setOnClickListener(() => {
      ctx.showGetUI();
    }));
    row.appendView(new Button().setStyle(Button.STYLE_OUTLINE).setText(appLocale.walletHome.action_send).setOnClickListener(() => {
      ctx.showSendUI();
    }));
    row.appendView(new Button().setStyle(Button.STYLE_OUTLINE).setText(appLocale.walletHome.action_history).setOnClickListener(() => {
      new HistoryScreen().start();
    }));
    left.appendView(row);
    this.updateBox = Utils.inflate({
      type: "div"
    });
    left.appendView(this.updateBox);
    Updater.checkAppUpdate().then(r => {
      if (r !== false) {
        this.updateBox.appendView(new RowView().setTitle(appLocale.walletHome.update_title).setSummary(appLocale.walletHome.update_message).setIcon("system_update_alt").setOnClickListener(() => {
          new PlatformTools().openBrowser(r);
        }));
      }
    });
    right.appendView(new SubHeader(appLocale.walletHome.group_history));
    this.historyBox = Utils.inflate({
      type: "div",
      class: "history"
    });
    this.historyBox.appendView(new TextView("info", appLocale.walletHome.history_loading));
    right.appendView(this.historyBox);
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
      ctx.updateViews(); // Update history

      ctx.updateHistory();
    }, 5000);
  }

  updateViews() {
    if (this.walletData.isBalanceReady) {
      this.mainBalanceView.setText(this.walletData.balance + " LTV");
      this.unfonfirmedBalanceView.setText(appLocale.walletHome.balance_unconfirmed + ": " + this.walletData.unconfirmed_balance + " LTV");
      this.immatureBalanceView.setText(appLocale.walletHome.balance_pending + ": " + this.walletData.immature_balance + " LTV");
    }

    switch (mWallet.connState) {
      case 2:
        this.setTitle("");
        return;

      case 1:
        this.setTitle(appLocale.walletHome.title_syncing);
        return;

      case 0:
        this.setTitle(appLocale.walletHome.title_connecting);
        return;
    }
  }

  updateHistory() {
    if (this.walletData.isHistoryReady) {
      var box = this.historyBox;
      box.innerHTML = "";

      if (this.walletData.history.length < 1) {
        box.appendView(new TextView("info", appLocale.walletHome.history_empty));
      } else {
        var history = this.walletData.history;

        for (var a = history.length - 1; a >= 0; a--) box.appendView(this.buildHistoryRow(history[a]));
      }
    }
  }

  buildHistoryRow(data) {
    var row = new RowView();
    row.setOnClickListener(function () {
      new TransactionViewScreen(data).start();
    });
    if (data.amount < 0) data.amount = -data.amount;
    if (data.comment) row.setSummary(data.comment);
    if (data.category == "receive") row.setIcon("call_received").setTitle("+" + data.amount + " LTV <a style='color:#999'>(" + moment.unix(data.time).fromNow() + ")</a>");
    if (data.category == "generate" || data.category == "immature") row.setIcon("add_box").setTitle("+" + data.amount + " LTV <a style='color:#999'>" + moment.unix(data.time).fromNow() + ")</a>");
    if (data.category == "send") row.setIcon("call_made").setTitle("-" + data.amount + " LTV <a style='color:#999'>" + moment.unix(data.time).fromNow() + ")</a>");
    if (data.confirmations < 1) row.setIcon("timer");
    return row;
  }

}
"use strict";

window.coinConfig = {
  coinPosix: "LTV",
  donateUrl: "https://money.yandex.ru/to/410018717992862",
  donateWallet: "LSBBmSdZhEKvDZ6C1yd1ejc6a9h76qXAu2",
  occeInfoUrl: "https://www.occe.io/api/v2/public/info/ltv_btc",
  getDifficulty: "https://chainz.cryptoid.info/ltv/api.dws?q=getdifficulty",
  globalBlockCount: "https://chainz.cryptoid.info/ltv/api.dws?q=getblockcount"
};
"use strict";

class Russian {
  getLang() {
    return {
      localeInfo: {
        // Put translators credits here
        author: "Michael B",
        donateLink: null
      },
      fwSettings: {
        apply: "Применить и перезапустить",
        darkTheme: "Тёмная тема",
        bigMode: "Крупный шрифт",
        restartRequired: "Для применения изменений приложение будет перезапущено",
        titleColorAccent: "Цвет оформления",
        customColor: "Свой цвет"
      },
      electron: {
        dataSelect_title: "Где хранить монеты?",
        setup_title: "Создание кошелька",
        action_create: "Создать новый",
        action_restore: "Восстановить из бэкапа",
        action_back: "Выбрать другую папку",
        recomentPath: "Рекомендуемая папка",
        prop_load_peers: "Загрузить список пиров с cryptoid.info?",
        prop_load_peers_info: "Это сделает первый запуск более быстрым",
        selectPath: "Выбрать папку...",
        alert_nolatin_path: "Путь к папке не может содержать русские символы. Выберите другую папку либо используйте рекомендуемую.",
        cfg_resetPath: "Изменить папку кошелька",
        cfg_stopOnExit: "Отключить фоновый режим",
        group_cfg: "Параметры",
        group_etc: "Прочее",
        setup_info: "В указаной папке нет файла wallet.dat, значит в ней нет файлов кошелька. Хотите создать новый кошелёк или восстановить существующий?",
        dataSelect_info: "Выберите папку для хранения данных кошелька. Если вы уже использовали " + "оригинальное приложение, вы можете выбрать его папку данных кошелька. <b>Важно: к одному " + "кошельку не может подключиться два приложения, и для загрузки данных родного кошелька, его" + " приложение нужно закрыть!</b>",
        stopOnExit_notice: "Если эта галочка отмечена, кошелёк будет полностью завершаться при закрытии окна. " + "При этом не будет работать фоновый майнинг и автосинхринизация, а запуск приложения будет занимать больше времени. " + "Однако это значительно снижает риск повреждения кошелька при непредвиденном отключении питания. Если вы используете ноутбук, лучше " + "включите эту опцию."
      },
      launcher: {
        cancel: "Отмена",
        stage_platform: "Запуск...",
        stage_findWallet: "Поиск кошелька...",
        stage_loadWallet: "Запуск кошелька...",
        wallet_native: "Локальный кошелёк",
        wallets_editButton: "Настройки",
        wallets_other: "Другие аккаунты",
        wallets_selectScreenTitle: "Выбор кошелька",
        editor_title: "Управление кошельками",
        editor_newWallet: "Создать кошелёк",
        editor_walletsSubtitle: "Ваши аккаунты",
        editor_rename: "Переименовать",
        editor_remove: "Удалить",
        editor_rename_newTitle: "Новое название",
        editor_rename_cancel: "Отмена",
        editor_rename_confirm: "Переименовать",
        editor_launch_confirm: "Перезапустить приложение для смены аккаунта?",
        wallet_remote_title: "Удалённый кошелёк",
        wallet_remote_info: "Подключиться к серверу leadertvcoind",
        wallet_fictive_title: "Фиктивный кошелёк",
        wallet_fictive_info: "Фальшивый кошелёк для отладки.",
        crash_title: "Критическая ошибка",
        btn_recovery: "Восстановление",
        btn_ok: "Игнорировать"
      },
      walletHome: {
        title_connecting: "Подключение...",
        title_syncing: "Синхринизация...",
        action_explore: "Обзор",
        action_settings: "Параметры",
        action_receive: "Получить",
        action_send: "Отправить",
        action_history: "Журнал",
        balance_unconfirmed: "Не подтверждено",
        balance_pending: "Дозревают",
        update_title: "Доступна новая версия приложения",
        update_message: "Нажмите для обновления",
        group_history: "Недавние операции",
        history_loading: "Загрука...",
        history_empty: "Ваши транзакции появятся тут :-)",
        bgMode_title: "О фоновом режиме",
        bgMode_message: "Один из компонентов приложения (leadertvcoind) остаётся активным " + "даже после закрытия окна приложения. Сделано это для более быстрого запуска, плюс " + "это позволяет майнить в фоновом режиме и обновлять данные. Но " + "пока он запущен, вы не сможете запустить оригинальное приложение leadertvcoin. " + "Для полного закрытия приложения используйте пункт \"Выйти\" в настройках. " + "Вы можете отключить фоновый режим в настройках приложения.<br/><br/>" + "Это сообщение больше не появится."
      },
      explorer: {
        title: "Обзор",
        header_state: "Состояние",
        header_price: "Цены",
        action_clear_banned: "Очистить заблокированные",
        status_blocks: "Блоки",
        status_masternodes: "Мастернод",
        status_connections: "Кол-во подключений",
        status_banned: "Заблокировано",
        status_network_speed: "Скорость",
        status_difficulty: "Сложность",
        price_today: "За 1 монету",
        price_all: "За все ваши",
        prices_24h: "Динамика за сутки",
        prices: "Продажа / Покупка"
      },
      transactionView: {
        action_repeat: "Повторить",
        group_info: "Сведения",
        prop_address: "Адрес",
        prop_id: "ID транзакции",
        prop_date: "Дата операции",
        prop_confirmations: "Количество подтверждений",
        prop_comment: "Коментарий"
      },
      receiveScreen: {
        action_copy: "Скопировать",
        action_send: "Отправить",
        prop_address: "Адрес получателя",
        prop_comment: "Коментарий для получателя",
        prop_comment_holder: "Не обязательно",
        error_noSum: "Введите сумму",
        error_invalidAddress: "Указанный вами адрес, не существует",
        error_noMoney: "Не хватает средств для перевода"
      },
      historyScreen: {
        title: "История операций",
        action_more: "Показать ещё"
      },
      toolsScreen: {
        action_reload: "Перезапустить",
        action_exit: "Выйти из приложения",
        account: "Мой аккаунт",
        account_info: "Логин, пароль, т. п.",
        system: "Системные настройки",
        system_info: "Автозапуск и прочее",
        ui: "Внешний вид (бета)",
        ui_info: "Тема, цвет, размер интерфейса",
        mining: "Настроить майнинг",
        mining_info: "Настройки генерации криптовалюты",
        recover: "Копирование и восстановление",
        recover_info: "Бэкап, решение проблем",
        donate: "Помочь проекту",
        donate_info: "Поддержать разработку mWallet-LTV",
        advanced: "Расширенные настройки",
        advanced_info: "Отладка, консоль, прочее"
      },
      advancedSettings: {
        myaccounts: "Управление аккаунтами",
        console: "Консоль отладки"
      },
      lockScreen: {
        prompt_password: "Пароль",
        alert_unlockRequired: "Для этой операции нужно раблокировать кошелёк. Введите ваш пароль:",
        cancel: "Отмена",
        confirm_unlock: "Разблокировать",
        error_invalidPassword: "Неверный пароль"
      },
      minerSettings: {
        title: "Майнинг (соло)",
        toggle_main: "Запустить майнинг",
        toggle_main_info: "Когда этот параметр включён, компьютер используется для майнинга (генерации) новых монет. Это может повлиять на производительность системы.",
        pow_threads_title: "Настроить количество потоков",
        pow_hashrate_prefix: "Скорость майнинга (хзшрейт)",
        pow_bgmode_notice: "Вы можете закрыть окно приложения, майнинг продолжится в фоновом режиме.",
        action_apply: "Применить",
        count_unlimited: "Неограничено",
        cancel: "Отмена"
      },
      recoverySettings: {
        createBackup: "Создать резервную копию",
        restoreBackup: "Восстановить резервную копию",
        recovery: "Ремонт кошелька"
      },
      donateScreen: {
        donate_ltv: "Задонатить немного LTV монет",
        donate_rub: "Поддержать рублём",
        be_translator: "Стать переводчиком",
        donate_translator: "Поддержать автора русского перевода"
      }
    };
  }

}
"use strict";

/**
 * Update checker
 * @TODO: Automaticly download and install updates
 */
class Updater {
  static checkAppUpdate() {
    return new Promise((resolve, reject) => {
      fetch("https://api.github.com/repos/mhbrgn/mWallet-LTV/releases").then(r => {
        return r.json();
      }).then(d => {
        var lastTag = d[0].tag_name,
            version = mWallet.version;

        if (lastTag != version) {
          resolve(d[0].html_url);
        } else resolve(false);
      }).catch(e => {
        reject(e);
      });
    });
  }

}
// TODO: Create cordova native code!!!
"use strict";
"use strict";

const WIN32_PREBUILD_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind.exe";
const WIN32_PREBUILD_MD5_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind.exe.md5";
const LINUX_PREBUILD_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind-linux";
const LINUX_PREBUILD_MD5_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind-linux.md5";

class ElectronPlatform {
  constructor() {
    this.hasNative = true;
    this.electron = require('electron');
    this.fs = require('electron').remote.require('fs');
    this.exec = require('child_process').exec;
    this.nativeArgs = {
      elServerPort: 16324,
      elServerLogin: "leadertv",
      elServerPassword: "leadertv",
      elServerAllowIp: "",
      elServerDatadir: ""
    };
    this.daemonArgs = null;

    window.onbeforeunload = function () {
      if (localStorage.e_stopOnExit == "true" && mWallet.server.isLocal) mWallet.sendCmd(["stop"]);
    };
  }

  launchNative() {
    return new Promise((resolve, reject) => {
      mWallet.platform.loadDaemonArgs().then(() => {
        mWallet.launcherTools.updateState("Проверка цельности файлов...");
        return mWallet.platform.checkFiles();
      }).then(s => {
        mWallet.launcherTools.updateState("Скачивается демон...");
        if (!s) return mWallet.platform.downloadDaemon();else return true;
      }).then(d => {
        mWallet.launcherTools.updateState("Создание подключения...");
        mWallet.remote = {
          isLocal: true,
          url: "127.0.0.1",
          port: mWallet.platform.nativeArgs.elServerPort,
          login: mWallet.platform.nativeArgs.elServerLogin,
          password: mWallet.platform.nativeArgs.elServerPassword
        };
        mWallet.allowBackup = true;
        mWallet.allowMining = true;
        mWallet.allowRecovery = false;
        return mWallet.launcherTools.loadWallet("remote::");
      }).then(status => {
        return mWallet.server.launch();
      }).then(status => {
        mWallet.launcherTools.updateState("Попытка подключения...");
        return mWallet.platform.tryDaemonConnection();
      }).then(status => {
        mWallet.launcherTools.updateState("Выпускаем демона...");
        if (!status) return mWallet.platform.startDaemon();else return true;
      }).then(status => {
        mWallet.launcherTools.updateState("Попытка подключения...");
        return mWallet.platform.tryDaemonConnection();
      }).then(status => {
        mWallet.launcherTools.updateState("Готов к запуску...");

        mWallet.exit = function () {
          mWallet.sendCmd(["stop"]).then(function () {
            electron.remote.getCurrentWindow().close();
          });
        };

        resolve(true);
      }).catch(e => {
        reject(e);
      });
    });
  }

  loadDaemonArgs() {
    return new Promise((resolve, reject) => {
      // Read settings
      var elServerPort = mWallet.platform.nativeArgs.elServerPort,
          elServerLogin = mWallet.platform.nativeArgs.elServerLogin,
          elServerPassword = mWallet.platform.nativeArgs.elServerPassword,
          elServerAllowIp = mWallet.platform.nativeArgs.elServerAllowIp;
      if (localStorage.customDaemonPort) elServerPort = localStorage.customDaemonPort;
      if (localStorage.customDaemonLogin) elServerLogin = localStorage.customDaemonLogin;
      if (localStorage.customDaemonPassword) elServerPassword = localStorage.customDaemonPassword;
      if (localStorage.customAllowedIPs) elServerAllowIp = localStorage.customAllowedIPs; // Build args

      mWallet.platform.daemonArgs = "-rpcport=" + elServerPort + " -rpcuser=" + elServerLogin + " -rpcpassword=" + elServerPassword;
      if (elServerAllowIp) mWallet.platform.daemonArgs += " -rpcallowip=" + elServerAllowIp; // Get data dir

      mWallet.platform.getDataDir().then(dataDir => {
        mWallet.platform.nativeArgs.elServerDatadir = dataDir;
        mWallet.platform.daemonArgs += " -datadir=" + dataDir;
        console.log(mWallet.platform.daemonArgs);
        return mWallet.platform.createWallet();
      }).then(() => {
        resolve();
      });
    });
  }

  createWallet() {
    return new Promise((resolve, reject) => {
      if (mWallet.platform.fs.existsSync(mWallet.platform.nativeArgs.elServerDatadir + "/wallet.dat")) {
        console.log("wallet exists");
        resolve();
        return;
      }

      console.log("Show first setup dialog...");
      var scr = new Screen();

      scr.onCreate = function () {};

      scr.appendView(new TextView("title", appLocale.electron.setup_title));
      scr.appendView(new TextView("p", appLocale.electron.setup_info));
      var loadPeersCheckbox = new Checkbox().setTitle(appLocale.electron.prop_load_peers).setChecked(true);

      var loadPeers = function loadPeers() {
        return new Promise((resolve, reject) => {
          if (!loadPeersCheckbox.isChecked()) {
            console.log("do not load peers");
            resolve();
          } else {
            console.log("load peers...");
            fetch("http://chainz.cryptoid.info/ltv/api.dws?q=nodes").then(r => {
              return r.json();
            }).then(d => {
              var out = "";

              for (var set in d) for (var node in d[set].nodes) out += "addnode=" + d[set].nodes[node] + "\n";

              mWallet.platform.fs.writeFileSync(mWallet.platform.nativeArgs.elServerDatadir + "/leadertvcoin.conf", out, "utf-8");
              resolve();
            }).catch(e => {
              console.error(e);
            });
          }
        });
      };

      scr.appendView(new RowView().setTitle(appLocale.electron.action_create).setOnClickListener(() => {
        scr.finish();
        loadPeers().then(() => {
          resolve();
        });
      }));
      scr.appendView(new RowView().setTitle(appLocale.electron.action_restore).setOnClickListener(() => {
        mWallet.openDialog().then(p => {
          p = p[0];

          const fs = require('fs-extra');

          fs.copySync(p, mWallet.platform.nativeArgs.elServerDatadir + "/wallet.dat");
          scr.finish();
          loadPeers().then(() => {
            resolve();
          });
        });
      }));
      scr.appendView(new SubHeader(appLocale.electron.group_cfg));
      scr.appendView(loadPeersCheckbox);
      scr.appendView(new TextView("info", appLocale.electron.prop_load_peers_info));
      scr.appendView(new SubHeader(appLocale.electron.group_etc));
      scr.appendView(new RowView().setTitle(appLocale.electron.action_back).setOnClickListener(() => {
        localStorage.daemonDataDir = "";
        location.reload();
      }));
      scr.start();
    });
  }

  getDataDir() {
    return new Promise((resolve, reject) => {
      if (localStorage.daemonDataDir) {
        if (mWallet.platform.fs.existsSync(localStorage.daemonDataDir)) {
          resolve(localStorage.daemonDataDir);
          return;
        }
      } // Dynamicly build directory select screen


      var scr = new Screen();

      scr.onCreate = function () {}; // Disable onCreate warning


      scr.appendView(new TextView("title", appLocale.electron.dataSelect_title));
      scr.appendView(new TextView("p", appLocale.electron.dataSelect_info));
      scr.appendView(new RowView().setTitle(appLocale.electron.recomentPath).setSummary(mWallet.platform.getRecomendedDataDir()).setOnClickListener(() => {
        localStorage.daemonDataDir = mWallet.platform.getRecomendedDataDir();
        scr.finish();
        resolve(localStorage.daemonDataDir);
      }));
      scr.appendView(new RowView().setTitle(appLocale.electron.selectPath).setOnClickListener(() => {
        mWallet.openFolderDialog().then(path => {
          console.log(path);

          if (/[а-яА-ЯЁё]/.test(path)) {
            new Alert().setMessage(appLocale.electron.alert_nolatin_path).show();
          } else {
            localStorage.daemonDataDir = path;
            scr.finish();
            resolve(localStorage.daemonDataDir);
          }
        });
      }));
      scr.start();
    });
  }

  getRecomendedDataDir() {
    var appdata = mWallet.platform.electron.remote.app.getPath("appData"),
        slash = process.platform === "win32" ? "\\" : "/";
    var path = appdata + slash + "LeadERTVCoin";

    if (/[а-яА-ЯЁё]/.test(path)) {
      // If contains cyrilic
      if (process.platform === "win32") path = "C:\\LeadERTVCoin";else path = null;
    }

    if (path !== null) if (!mWallet.platform.fs.existsSync(path)) mWallet.platform.fs.mkdirSync(path);
    return path;
  }

  hasSettings() {
    return true;
  }

  openSettings() {
    var scr = new Screen();

    scr.onCreate = function () {};

    scr.setHomeAsUpAction();
    scr.addMod(new RightSideScreenMod());
    scr.appendView(new Checkbox().setTitle(appLocale.electron.cfg_stopOnExit).setChecked(localStorage.e_stopOnExit === "true").setOnCheckedListener(function () {
      localStorage.e_stopOnExit = localStorage.e_stopOnExit === "true" ? false : true;
    }));
    scr.appendView(new TextView("info", appLocale.electron.stopOnExit_notice));
    scr.appendView(new SubHeader(appLocale.electron.group_etc));
    scr.appendView(new RowView().setTitle(appLocale.electron.cfg_resetPath).setOnClickListener(() => {
      mWallet.sendCmd(["stop"]).then(() => {
        localStorage.daemonDataDir = "";
        location.reload();
      });
    }));
    scr.start();
  }

  restoreBackup() {
    if (!mWallet.server.isLocal) {
      new Alert().setTitle("Restore is aviable only for local wallet");
      return;
    }

    var bkpFile, destFile;
    mWallet.platform.openDialog().then(path => {
      bkpFile = path[0];
      destFile = mWallet.platform.nativeArgs.elServerDatadir + "/wallet.dat";
      mWallet.sendCmd(["stop"]);
    }).then(r => {
      console.log(destFile, bkpFile);

      const fs = require('fs-extra');

      fs.removeSync(destFile + ".bak");
      fs.moveSync(destFile, destFile + ".bak");
      fs.copySync(bkpFile, destFile);
      location.reload();
    });
  }

  createBackup() {
    mWallet.platform.saveDialog().then(path => {
      console.log(path);
      mWallet.sendCmd(["backupwallet", path]).then(r => {
        new Alert().setMessage("Backup created!").show();
      });
    });
  }

  checkFiles() {
    return new Promise((resolve, reject) => {
      if (!mWallet.platform.fs.existsSync(require('electron').remote.app.getPath('userData') + "/bin")) mWallet.platform.fs.mkdirSync(require('electron').remote.app.getPath('userData') + "/bin");
      console.log(mWallet.platform.getDaemonMd5Filename());
      console.log(mWallet.platform.getDaemonFilename());

      if (!mWallet.platform.fs.existsSync(mWallet.platform.getDaemonMd5Filename()) || !mWallet.platform.fs.existsSync(mWallet.platform.getDaemonFilename())) {
        // One of files is missing
        console.log("files not found");
        resolve(false);
      } else {
        // Check md5
        console.log("files exists, check md5...");
        mWallet.platform.fs.readFile(mWallet.platform.getDaemonMd5Filename(), (err, validHash) => {
          if (err) {
            console.error("md5 file read error");
            reject();
            return;
          }

          validHash = validHash.toString();

          require('md5-file')(mWallet.platform.getDaemonFilename(), (err, hash) => {
            if (err) {
              reject(err);
              return;
            }

            hash = hash.replace(/(\r\n|\n|\r)/gm, "").replace(" ", "");
            validHash = validHash.replace(/(\r\n|\n|\r)/gm, "").replace(" ", "");
            console.log(hash, validHash);

            if (hash != validHash) {
              console.error("md5 not valid!");
              resolve(false);
            } else {
              console.log("md5 valid!");
              resolve(true);
            }
          });
        });
      }
    });
  }

  downloadDaemon() {
    return new Promise((resolve, reject) => {
      if (process.platform === "win32") {
        console.log("download md5...");
        mWallet.platform.download(WIN32_PREBUILD_MD5_URL, mWallet.platform.getDaemonMd5Filename()).then(() => {
          console.log("download daemon...");
          return mWallet.platform.download(WIN32_PREBUILD_URL, mWallet.platform.getDaemonFilename());
        }).then(() => {
          console.log("downloaded, recheck...");
          return mWallet.platform.checkFiles();
        }).then(() => {
          resolve();
        }).catch(error => {
          console.error(error);
          reject(error);
        });
      } else if (process.platform === "linux") {
        console.log("download md5...");
        mWallet.platform.download(LINUX_PREBUILD_MD5_URL, mWallet.platform.getDaemonMd5Filename()).then(() => {
          console.log("download daemon...");
          return mWallet.platform.download(LINUX_PREBUILD_URL, mWallet.platform.getDaemonFilename());
        }).then(() => {
          console.log("downloaded, recheck...");
          mWallet.platform.fs.chmodSync(mWallet.platform.getDaemonFilename(), '755');
          return mWallet.platform.checkFiles();
        }).then(() => {
          resolve();
        }).catch(error => {
          console.error(error);
          reject(error);
        });
      }
    });
  }

  startDaemon() {
    return new Promise((resolve, reject) => {
      var cmd = mWallet.platform.getDaemonFilename() + " " + mWallet.platform.daemonArgs;
      console.log(cmd);
      mWallet.platform.runShellCommand(cmd).then(d => {
        mWallet.crash(d);
      }).catch(d => {
        mWallet.crash(d);
      });
      setTimeout(function () {
        resolve();
      }, 1500);
    });
  }

  tryDaemonConnection() {
    return mWallet.server.testConnection();
  }

  runShellCommand(cmd) {
    return new Promise(function (resolve, reject) {
      mWallet.platform.exec(cmd, (error, stdout, stderr) => {
        if (error) reject(stderr);else resolve(stdout);
      });
    });
  }

  getDaemonFilename() {
    return require('electron').remote.app.getPath('userData') + (process.platform === "win32" ? "\\bin\\leadertvcoind.exe" : "/bin/leadertvcoind");
  }

  getDaemonMd5Filename() {
    return mWallet.platform.getDaemonFilename() + ".md5";
  }

  download() {
    return new Promise((resolve, reject) => {
      const http = require('https');

      const fs = require('fs');

      const file = fs.createWriteStream(dest);
      const request = http.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
          console.log("downloaded", dest);
          file.close(() => {
            resolve();
          });
        });
      });
    });
  }

  copy(text) {
    mWallet.platform.electron.clipboard.writeText(text, "text");
  }

  openBrowser(link) {
    mWallet.platform.electron.shell.openExternal(link);
  }

  saveDialog() {
    return new Promise((resolve, reject) => {
      var path = mWallet.platform.electron.remote.dialog.showSaveDialogSync({});
      resolve(path);
    });
  }

  openDialog() {
    return new Promise((resolve, reject) => {
      var path = mWallet.platform.electron.remote.dialog.showOpenDialogSync({});
      resolve(path);
    });
  }

  openFolderDialog() {
    return new Promise((resolve, reject) => {
      var path = mWallet.platform.electron.remote.dialog.showOpenDialogSync({
        properties: ['openDirectory']
      });
      resolve(path[0]);
    });
  }

}
"use strict";

/*
 * Debug wallet
 */
class Debug {
  launch() {
    return new Promise((resolve, reject) => {
      if (!localStorage.debugBalance) localStorage.debugBalance = 50;
      if (!localStorage.debugHistory) localStorage.debugHistory = "[]";
      mWallet.server.isGenerate = false;
      setInterval(() => {
        if (!mWallet.server.isGenerate) return;
        mWallet.server.doTransaction("generate", 100);
      }, 20000);
      resolve(true);
    });
  }

  hasSettings() {
    return true;
  }

  openSettings() {
    var scr = new Screen();

    scr.onCreate = function () {
      this.setHomeAsUpAction();
      this.appendView(new RowView().setTitle("Give me a money!").setOnClickListener(() => {
        mWallet.server.doTransaction("receive", 150);
      }));
    };

    scr.start();
  }

  doTransaction(category, amount) {
    if (category == "send") localStorage.debugBalance = parseFloat(localStorage.debugBalance) - amount;else localStorage.debugBalance = parseFloat(localStorage.debugBalance) + amount;
    var h = JSON.parse(localStorage.debugHistory);
    h[h.length] = {
      address: "LvXXXXXXXXXXXXXXXXXXXXXXX",
      amount: amount,
      category: category,
      comment: amount > 250 ? "Oh yeah!" : "",
      time: Date.now()
    };
    localStorage.debugHistory = JSON.stringify(h);
  }

  sendCmd(cmd) {
    return new Promise(function (resolve, reject) {
      if (cmd[0] == "getwalletinfo") resolve({
        balance: parseFloat(localStorage.debugBalance),
        unconfirmed_balance: 2.11,
        immature_balance: 10
      });else if (cmd[0] == "listtransactions") resolve(JSON.parse(localStorage.debugHistory));else if (cmd[0] == "getconnectioncount") resolve(21);else if (cmd[0] == "getblockcount") resolve(1234);else if (cmd[0] == "getgenerate") resolve(mWallet.server.isGenerate);else if (cmd[0] == "gethashespersec") resolve(mWallet.server.isGenerate ? 3512987 : 0);else if (cmd[0] == "sendtoaddress") {
        mWallet.server.doTransaction("send", cmd[2]);
        resolve(true);
      } else if (cmd[0] == "setgenerate") {
        mWallet.server.isGenerate = cmd[1];
        resolve(true);
      } else if (cmd[0] == "listbanned") {
        resolve(["1.2.3.4", "5.8.2.228", "192.168.43.1", "8.8.8.8"]);
      } else if (cmd[0] == "getmasternodecount") {
        resolve({
          total: 228
        });
      } else if (cmd[0] == "getnetworkhashps") {
        resolve(1289876758);
      } else if (cmd[0] == "getaccountaddress") resolve("LvXXXXXXXXXXXXXXXXXXXXXXX");else {
        reject({
          error: -999999
        });
        console.warn("Undefined command", cmd);
      }
    });
  }

}
"use strict";

/*
 * Server settings.
 * This is direct connection variant variant
 */
class RemoteDaemon {
  launch() {
    return new Promise((resolve, reject) => {
      if (!mWallet.remote) mWallet.remote = {};

      if (mWallet.remote.isLocal) {
        // Forcely use saved settings
        resolve(true);
      } else {
        // Recover saved settings and use then
        mWallet.server.loadSaved();
        mWallet.server.testConnection().then(d => {
          resolve(true);
        }).catch(e => {
          new RemoteDaemonCfgScreen(false, resolve).start();
        });
      }
    });
  }

  hasSettings() {
    return !mWallet.remote.isLocal;
  }

  openSettings() {
    new RemoteDaemonCfgScreen(true).start();
  }

  testConnection() {
    return this.getBalances();
  }

  loadSaved() {
    mWallet.remote.url = localStorage[mWallet.server.id + "_url"];
    mWallet.remote.port = localStorage[mWallet.server.id + "_port"];
    mWallet.remote.login = localStorage[mWallet.server.id + "_login"];
    mWallet.remote.passwd = localStorage[mWallet.server.id + "_passwd"];
  }

  getBalances() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["getwalletinfo"]).then(function (d) {
        resolve([d.balance, d.unconfirmed_balance, d.immature_balance]);
      }).catch(function (e) {
        reject(e);
      });
    });
  }

  sendToAddress(a, s, c) {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["sendtoaddress", a, s, c]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  }

  getReceiveAddress() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["getaccountaddress", ""]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  }

  getTransactionsLog(count, offset) {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["listtransactions", "", count, offset]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  }

  getMasternodesCount() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["listmasternodes"]).then(function (d) {
        resolve(d.length);
      }).catch(function (e) {
        reject(e);
      });
    });
  }

  getBlockCount() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["getblockcount"]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  }

  getNetworkHashrate() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["getnetworkhashps"]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  } // #nonative


  getConnections() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["getconnectioncount"]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  } // #nonative


  isGenerate() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["getgenerate"]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  } // #nonative


  getMiningHashrate() {
    return new Promise(function (resolve, reject) {
      mWallet.server.sendCmd(["gethashespersec"]).then(function (d) {
        resolve(d);
      }).catch(function (e) {
        reject(e);
      });
    });
  }

  sendCmd(args) {
    return new Promise(function (resolve, reject) {
      var data = {
        jsonrpc: "1.0",
        id: "curltest",
        method: args[0],
        params: args.length > 1 ? args.slice(1) : []
      };
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "http://" + mWallet.remote.url + ":" + mWallet.remote.port);
      xhr.setRequestHeader("Authorization", "Basic " + btoa(mWallet.remote.login + ":" + mWallet.remote.password));

      xhr.onload = function () {
        if (xhr.status == 200) {
          try {
            data = JSON.parse(xhr.responseText);

            if (data.error) {
              reject(data.error);
            } else {
              resolve(data.result);
            }
          } catch (e) {
            reject(e);
          }
        } else {
          try {
            data = JSON.parse(xhr.responseText);
            reject(data.error);
          } catch (e) {
            reject(e);
          }
        }
      };

      xhr.onerror = reject;
      xhr.send(JSON.stringify(data));
    });
  }

}

class RemoteDaemonCfgScreen extends Screen {
  constructor(openedFromSettings, resolve) {
    super();
    this.openedFromSettings = openedFromSettings;
    this.resolve = resolve;
  }

  onCreate() {
    if (this.openedFromSettings) this.setHomeAsUpAction();
    var ctx = this;
    this.setTitle("Настроить подключение");
    this.formUrl = new TextInput().setTitle("URL");
    this.formPort = new TextInput().setTitle("Port");
    this.formLogin = new TextInput().setTitle("Login");
    this.formPasswd = new TextInput().setTitle("Password");
    this.appendView(this.formUrl);
    this.appendView(this.formPort);
    this.appendView(this.formLogin);
    this.appendView(this.formPasswd);
    if (this.openedFromSettings) this.appendView(new Button().setStyle(Button.STYLE_OUTLINE).setText("Save").setOnClickListener(() => {
      ctx.save();
    }));else this.appendView(new Button().setStyle(Button.STYLE_OUTLINE).setText("Connect").setOnClickListener(() => {
      ctx.save();
      mWallet.server.testConnection().then(() => {
        ctx.resolve();
        ctx.finish();
      }).catch(() => {
        new Alert().setMessage("Error").show();
      });
    }));
  }

  save() {
    localStorage[mWallet.server.id + "_url"] = this.formUrl.toString();
    localStorage[mWallet.server.id + "_port"] = this.formPort.toString();
    localStorage[mWallet.server.id + "_login"] = this.formLogin.toString();
    localStorage[mWallet.server.id + "_passwd"] = this.formPasswd.toString();
    mWallet.server.loadSaved();
  }

}
"use strict";

class Server {
  launch() {
    console.error("Not overriden!");
  }

  hasSettings() {
    console.error("Not overriden!");
  }

  openSettings() {
    console.error("Not overriden!");
  }

  testConnection() {
    console.error("Not overriden!");
  }

  sendCmd() {
    console.error("Not overriden!");
  }

  getBalances() {
    console.error("Not overriden!");
  }

  getReceiveAddress() {
    console.error("Not overriden!");
  }

  getTransactionsLog(count, offset) {
    console.error("Not overriden!");
  }

  sendToAddress(address, amount, comment) {
    console.error("Not overriden!");
    /* Throwable error codes
    -13: Wallet is locked (to be removed #nonative)
    -3: Invalid amount
    -5: Invalid account
    -6: Insufficient funds
    */
  }

  getMasternodesCount() {
    console.error("Not overriden!");
  }

  getBlockCount() {
    console.error("Not overriden!");
  }

  getNetworkHashrate() {
    console.error("Not overriden!");
  } // Native-only features (to be removed)	#nonative


  getConnections() {
    console.error("Not overriden!");
  }

  isGenerate() {
    console.error("Not overriden!");
  }

  getMiningHashrate() {
    console.error("Not overriden!");
  }

}
"use strict";

class AdvancedSettingsScreen extends Screen {
  onCreate() {
    this.setHomeAsUpAction();
    this.addMod(new RightSideScreenMod());
    if (mWallet.allowAccountSettings) this.appendView(new RowView().setTitle(appLocale.advancedSettings.myaccounts).setOnClickListener(() => {
      new AccountsEditScreen().start();
    }));
    this.appendView(new RowView().setTitle(appLocale.advancedSettings.console).setOnClickListener(() => {
      new ConsoleScreen().start();
    }));
  }

}
"use strict";

class ConsoleScreen extends Screen {
  onCreate() {
    var ctx = this;
    this.setHomeAsUpAction();
    this.setTitle("Daemon console");
    this.logbox = Utils.inflate({
      type: "div",
      class: "console-log"
    });
    var inframe = Utils.inflate({
      type: "div",
      class: "console-input-frame",
      childs: {
        input: {
          type: "input"
        },
        sendBtn: {
          type: "i",
          class: "material-icons",
          inner: "play_arrow"
        }
      }
    });
    this.logIn("Welcome!");
    this.logIn("This is daemon debug shell. It can be used for tests and some specific tricks.");
    this.logErr("WARRNING: Scammers are active! DO NOT USE COMMANDS IF YOU DON'T KNOW WHAT IT DO!!!");
    this.logOut("");
    this.logOut("P. S. Enter button don't work. To be fixed :-)");
    this.logOut(""); // TODO: Enter button tracker

    this.appendView(this.logbox);
    this.appendView(inframe);
    inframe.input.placeholder = "Input your command here...";

    inframe.sendBtn.onclick = function () {
      var cmd = inframe.input.value.split(" ");
      console.log(cmd);
      inframe.input.value = "";
      ctx.logOut(cmd);
      mWallet.sendCmd(cmd).then(function (res) {
        ctx.logIn(res);
      }).catch(function (e) {
        ctx.logErr(e);
      });
    };
  }

  logOut(text) {
    if (typeof text == "object") text = JSON.stringify(text);
    this.logbox.appendView(Utils.inflate({
      type: "div",
      class: "out",
      inner: "> " + text
    }));
  }

  logIn(text) {
    if (typeof text == "object") text = JSON.stringify(text);
    this.logbox.appendView(Utils.inflate({
      type: "div",
      class: "in",
      inner: "< " + text
    }));
  }

  logErr(text) {
    if (typeof text == "object") text = JSON.stringify(text);
    this.logbox.appendView(Utils.inflate({
      type: "div",
      class: "error",
      inner: "E " + text
    }));
  }

}
"use strict";

class DonateScreen extends Screen {
  onCreate() {
    this.setHomeAsUpAction();
    this.addMod(new RightSideScreenMod());
    this.appendView(new RowView().setTitle(appLocale.donateScreen.be_translator).setOnClickListener(() => {
      // TODO: Help with translation
      new Alert().setMessage("Увы, приложение пока не готово к принятию языков, отличных от русского. Эта функция будет доделана в скором времени.").show();
    }));
    this.appendView(new RowView().setTitle(appLocale.donateScreen.donate_ltv).setOnClickListener(() => {
      new SendScreen(coinConfig.donateWallet, null, "Good work :-)").start();
    }));
    this.appendView(new RowView().setTitle(appLocale.donateScreen.donate_rub).setOnClickListener(() => {
      mWallet.openBrowser(coinConfig.donateUrl);
    }));
    if (appLocale.localeInfo.donateLink) this.appendView(new RowView().setTitle(appLocale.donateScreen.donate_translator).setOnClickListener(() => {
      mWallet.openBrowser(appLocale.localeInfo.donateLink);
    }));
  }

}
"use strict";

class LockScreen extends Screen {
  // TODO: Lock settings screen
  unlock() {
    var ctx = this;
    return new Promise((resolve, reject) => {
      var te = new TextInput().setTitle(appLocale.lockScreen.prompt_password).setType("password");
      var d = new Dialog().setMessage(appLocale.lockScreen.alertUnlockRequired).appendView(te).addButton(new Button().setText(appLocale.lockScreen.cancel).setOnClickListener(() => {
        d.hide();
      })).addButton(new Button().setText(appLocale.lockScreen.confirm_unlock).setOnClickListener(() => {
        d.hide();
        ctx.doUnlock(te.toString()).then(() => {
          resolve();
        });
      })).show();
    });
  }

  doUnlock(password) {
    return new Promise((resolve, reject) => {
      mWallet.sendCmd(["walletpassphrase", password, 10]).then(r => {
        resolve();
      }).catch(e => {
        if (e.code == -14) {
          // Invalid password
          new Alert().setMessage(appLocale.lockScreen.error_invalidPassword).show();
        }

        console.error(e);
        reject(e);
      });
    });
  }

}
"use strict";

class MinerCfgScreen extends Screen {
  onCreate() {
    var ctx = this;
    this.addMod(new RightSideScreenMod());
    this.threads = -1;
    this.setHomeAsUpAction();
    this.setTitle("Майнинг");
    setInterval(function () {
      ctx.update();
    }, 1500);
    this.update();
  }

  update() {
    if (mWallet.dataProvider.blockcount > 10000) this.showPoSUI();else this.showPoWUI();
  }

  showPoWUI() {
    var ctx = this,
        hr = this.getHashrate(),
        isGenerate = mWallet.dataProvider.isGenerate;
    this.wipeContents();
    this.appendView(new RowView().setTitle(appLocale.minerSettings.toggle_main).setSummary(appLocale.minerSettings.toggle_main_info).setIcon(isGenerate ? "check_box" : "check_box_outline_blank").setOnClickListener(() => {
      ctx.setGenerate(!isGenerate);
      mWallet.dataProvider.updateWalletInfo();
      ctx.update();
    }));
    this.appendView(new RowView().setTitle(appLocale.minerSettings.pow_threads_title).setIcon("account_tree").setOnClickListener(function () {
      ctx.dialogThreads();
    }));
    this.appendView(new TextView("info", "<b>" + appLocale.minerSettings.pow_hashrate_prefix + " - " + hr + "</b>"));
    if (mWallet.server.isLocal) this.appendView(new TextView("info", appLocale.minerSettings.pow_bgmode_notice));
  }

  getHashrate() {
    var hr = mWallet.dataProvider.hashrate,
        prefix = "";

    if (hr > 500000) {
      hr = hr / 1000000;
      prefix = "M";
    } else if (hr > 900) {
      hr = hr / 1000;
      prefix = "k";
    }

    return hr + " " + prefix + "H/s";
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
    dialog.addButton(new Button().setText(appLocale.minerSettings.action_apply).setOnClickListener(function () {
      dialog.hide();
      mWallet.dataProvider.threads = parseInt(prompt.toString());
      ctx.setGenerate(true);
    }));
    dialog.addButton(new Button().setText(appLocale.minerSettings.count_unlimited).setOnClickListener(function () {
      dialog.hide();
      mWallet.dataProvider.threads = -1;
      ctx.setGenerate(true);
    }));
    dialog.addButton(new Button().setText(appLocale.minerSettings.cancel).setOnClickListener(function () {
      dialog.hide();
    }));
    dialog.show();
  }

  showPoSUI() {// TODO: PoS mining UI
  }

}
"use strict";

class RecoverySettingsScreen extends Screen {
  onCreate() {
    this.setHomeAsUpAction();
    this.addMod(new RightSideScreenMod());
    if (mWallet.allowBackup) this.appendView(new RowView().setTitle(appLocale.recoverySettings.createBackup).setOnClickListener(() => {
      mWallet.platform.createBackup();
    }));
    if (mWallet.allowBackup) this.appendView(new RowView().setTitle(appLocale.recoverySettings.restoreBackup).setOnClickListener(() => {
      mWallet.platform.restoreBackup();
    }));
    if (mWallet.allowRecovery) this.appendView(new RowView().setTitle(appLocale.recoverySettings.recovery).setOnClickListener(() => {
      mWallet.platform.recovery();
    }));
  }

}
"use strict";

class SettingsScreen extends Screen {
  onCreate() {
    this.setHomeAsUpAction();
    this.addMod(new RightSideScreenMod());
    this.addAction(new MenuItem("Перезапустить", "refresh", () => {
      location.reload();
    })); // TODO: Remove #nonative

    if (mWallet.exit) this.addAction(new MenuItem("Выйти", "exit_to_app", () => {
      mWallet.exit();
    })); // =====================================================

    if (mWallet.server.settings) this.appendView(new RowView().setIcon("account_circle").setTitle(appLocale.toolsScreen.account).setSummary(appLocale.toolsScreen.account_info).setOnClickListener(() => {
      mWallet.server.settings();
    }));
    if (mWallet.platform.settings) this.appendView(new RowView().setIcon("dashboard").setTitle(appLocale.toolsScreen.system).setSummary(appLocale.toolsScreen.system_info).setOnClickListener(() => {
      mWallet.platform.settings();
    }));
    this.appendView(new RowView().setIcon("palette").setTitle(appLocale.toolsScreen.ui).setSummary(appLocale.toolsScreen.ui_info).setOnClickListener(() => {
      new FWSettingsScreen(appLocale.fwSettings).start();
    })); // TODO: Remove #nonative

    if (mWallet.allowMining) this.appendView(new RowView().setIcon("arrow_downward").setTitle(appLocale.toolsScreen.mining).setSummary(appLocale.toolsScreen.mining_info).setOnClickListener(function () {
      new MinerCfgScreen().start();
    })); // TODO: Remove #nonative

    if (mWallet.allowBackup || mWallet.allowRecovery) this.appendView(new RowView().setIcon("restore").setTitle(appLocale.toolsScreen.recover).setSummary(appLocale.toolsScreen.recover_info).setOnClickListener(function () {
      new RecoverySettingsScreen().start();
    }));
    this.appendView(new RowView().setIcon("favorite").setTitle(appLocale.toolsScreen.donate).setSummary(appLocale.toolsScreen.donate_info).setOnClickListener(function () {
      new DonateScreen().start();
    }));
    this.appendView(new RowView().setIcon("settings").setTitle(appLocale.toolsScreen.advanced).setSummary(appLocale.toolsScreen.advanced_info).setOnClickListener(() => {
      new AdvancedSettingsScreen().start();
    }));
  }

}
