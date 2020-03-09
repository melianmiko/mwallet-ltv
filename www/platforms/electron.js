/*
 * Platform specific code.
 * This is Electron variant
 */

const electron = require('electron');
const fs = electron.remote.require('fs')
const exec = require('child_process').exec;
const remote = require('electron');

var elServerPort = 16324,
	elServerLogin = "leadertv",
	elServerPassword = "leadertv",
	elServerAllowIp = "",
	elServerDatadir = ""
	DAEMON_ARGS = null;

const WIN32_PREBUILD_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind.exe";
const WIN32_PREBUILD_MD5_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind.exe.md5";
const LINUX_PREBUILD_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind-linux";
const LINUX_PREBUILD_MD5_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind-linux.md5";

const APPDATA = require('electron').remote.app.getPath('userData');
const PREBUILD_DIR = APPDATA+
	(process.platform === "win32" ? "\\bin" : "/bin");

// Native wallet settings
mWallet.hasNative = true;
mWallet.platform.launchNative = function() {return new Promise((resolve,reject) => {
	mWallet.platform.loadDaemonArgs().then(() => {
		mWallet.launcherTools.updateState("Проверка цельности файлов...");
		return mWallet.platform.checkFiles();
	}).then((s) => {
		mWallet.launcherTools.updateState("Скачивается демон...");
		if(!s) return mWallet.platform.downloadDaemon();
		else return true;
	}).then((d) => {
		mWallet.launcherTools.updateState("Создание подключения...");
		mWallet.server.isLocal = true;
		mWallet.allowBackup = true;
		mWallet.allowRecovery = false;
		mWallet.server.url = "127.0.0.1";
		mWallet.server.port = elServerPort;
		mWallet.server.login = elServerLogin;
		mWallet.server.passwd = elServerPassword;
		return mWallet.launcherTools.loadWallet("remote::");
	}).then((status) => {
		return mWallet.server.launch();
	}).then((status) => {
		mWallet.launcherTools.updateState("Попытка подключения...");
		return mWallet.platform.tryDaemonConnection();
	}).then((status) => {
		mWallet.launcherTools.updateState("Выпускаем демона...");
		if(!status) return mWallet.platform.startDaemon();
		else return true;
	}).then((status) => {
		mWallet.launcherTools.updateState("Попытка подключения...");
		return mWallet.platform.tryDaemonConnection();
	}).then((status) => {
		mWallet.launcherTools.updateState("Готов к запуску...")

		mWallet.exit = function() {mWallet.sendCmd(["stop"]).then(function() {
			electron.remote.getCurrentWindow().close();
		})}

		resolve(true)
	}).catch((e) => {reject(e);})
})};

mWallet.platform.loadDaemonArgs = function() {return new Promise((resolve, reject) => {
	// Read settings
	if(localStorage.customDaemonPort) elServerPort = localStorage.customDaemonPort;
	if(localStorage.customDaemonLogin) elServerLogin = localStorage.customDaemonLogin;
	if(localStorage.customDaemonPassword) elServerPassword = localStorage.customDaemonPassword;
	if(localStorage.customAllowedIPs) elServerAllowIp = localStorage.customAllowedIPs;

	// Build args
	DAEMON_ARGS = "-rpcport="+elServerPort+" -rpcuser="+elServerLogin+" -rpcpassword="+elServerPassword;
	if(elServerAllowIp) DAEMON_ARGS += " -rpcallowip="+elServerAllowIp;

	// Get data dir
	mWallet.platform.getDataDir().then(() => {
		DAEMON_ARGS +=  " -datadir="+elServerDatadir;
		console.log(DAEMON_ARGS);
		return mWallet.platform.createWallet();
	}).then(() => {
		resolve();
	});
})};

mWallet.platform.createWallet = function(){return new Promise((resolve,reject) => {
	if(fs.existsSync(elServerDatadir+"/wallet.dat")) {
		console.log("wallet exists");
		resolve();
		return;
	}

	console.log("Show first setup dialog...");

	var scr = new Screen();
	scr.onCreate = function() {};
	scr.appendView(new TextView("title", appLocale.electron.setup_title));
	scr.appendView(new TextView("p", appLocale.electron.setup_info));

	var loadPeersCheckbox = new Checkbox()
		.setTitle(appLocale.electron.prop_load_peers)
		.setChecked(true);

	var loadPeers = function() {return new Promise((resolve, reject) => {
		if(!loadPeersCheckbox.isChecked()) {
			console.log("do not load peers");
			resolve();
		} else {
			console.log("load peers...");
			fetch("http://chainz.cryptoid.info/ltv/api.dws?q=nodes").then((r) => {
				return r.json();
			}).then((d) => {
				var out = "";
				for(var set in d)
					for(var node in d[set].nodes)
						out += "addnode="+d[set].nodes[node]+"\n";

				fs.writeFileSync(elServerDatadir+"/leadertvcoin.conf", out, "utf-8");
				resolve();
			}).catch((e) => {
				console.error(e);
			});
		}
	})};

	scr.appendView(new RowView()
		.setTitle(appLocale.electron.action_create)
		.setOnClickListener(() => {
			scr.finish();
			loadPeers().then(() => {
				resolve();
			});
		}));

	scr.appendView(new RowView()
		.setTitle(appLocale.electron.action_restore)
		.setOnClickListener(() => {
			mWallet.openDialog().then((p) => {
				p = p[0];

				const fs = require('fs-extra');
				fs.copySync(p, elServerDatadir+"/wallet.dat");

				scr.finish();
				loadPeers().then(() => {
					resolve();
				})
			})
		}));
	

	scr.appendView(new SubHeader(appLocale.electron.group_cfg));
	scr.appendView(loadPeersCheckbox);
	scr.appendView(new TextView("info", appLocale.electron.prop_load_peers_info));

	scr.appendView(new SubHeader(appLocale.electron.group_etc));
	scr.appendView(new RowView()
		.setTitle(appLocale.electron.action_back)
		.setOnClickListener(() => {
			localStorage.daemonDataDir = "";
			location.reload();
		}));

	scr.start();
})};

mWallet.platform.getDataDir = function(){return new Promise((resolve, reject) => {
	if(localStorage.daemonDataDir) {
		if(fs.existsSync(localStorage.daemonDataDir)) {
			elServerDatadir = localStorage.daemonDataDir;
			resolve(true);
			return;
		}
	}

	// Dynamicly build directory select screen
	var scr = new Screen();
	scr.onCreate = function() {}; // Disable onCreate warning

	scr.appendView(new TextView("title", appLocale.electron.dataSelect_title))
	scr.appendView(new TextView("p", appLocale.electron.dataSelect_info));

	scr.appendView(new RowView()
		.setTitle(appLocale.electron.recomentPath)
		.setSummary(mWallet.platform.getRecomendedDataDir())
		.setOnClickListener(() => {
			localStorage.daemonDataDir = mWallet.platform.getRecomendedDataDir();
			elServerDatadir = localStorage.daemonDataDir;
			scr.finish();
			resolve();
		}));

	scr.appendView(new RowView()
		.setTitle(appLocale.electron.selectPath)
		.setOnClickListener(() => {
			mWallet.openFolderDialog().then((path) => {
				console.log(path);
				if(/[а-яА-ЯЁё]/.test(path)) {
					new Alert().setMessage(appLocale.electron.alert_nolatin_path).show();
				} else {
					localStorage.daemonDataDir = path;
					elServerDatadir = localStorage.daemonDataDir;
					scr.finish();
					resolve();
				}
			})
		}));

	scr.start();
})};

mWallet.platform.getRecomendedDataDir = function() {
	var appdata = electron.remote.app.getPath("appData"),
		slash = (process.platform === "win32" ? "\\" : "/");

	var path = appdata+slash+"LeadERTVCoin";

	if(/[а-яА-ЯЁё]/.test(path)) {
		// If contains cyrilic
		if(process.platform === "win32")
			path = "C:\\LeadERTVCoin";
		else
			path = null;
	}

	if(path !== null) if(!fs.existsSync(path)) fs.mkdirSync(path);
	return path;
};

mWallet.platform.settings = function() {
	var scr = new Screen();
	scr.onCreate = function() {};

	scr.setHomeAsUpAction();
	scr.addMod(new RightSideScreenMod());

	scr.appendView(new Checkbox()
		.setTitle(appLocale.electron.cfg_stopOnExit)
		.setChecked(localStorage.e_stopOnExit === "true")
		.setOnCheckedListener(function() {
			localStorage.e_stopOnExit = (localStorage.e_stopOnExit === "true" ? false : true);
		}));

	scr.appendView(new TextView("info", appLocale.electron.stopOnExit_notice));

	scr.appendView(new SubHeader(appLocale.electron.group_etc));
	scr.appendView(new RowView()
		.setTitle(appLocale.electron.cfg_resetPath)
		.setOnClickListener(() => {
			mWallet.sendCmd(["stop"]).then(() => {
				localStorage.daemonDataDir = "";
				location.reload();
			});
		}));

	scr.start();
}

window.onbeforeunload = function() {
	if(localStorage.e_stopOnExit == "true" && mWallet.server.isLocal) mWallet.sendCmd(["stop"]);
}

mWallet.restoreBackup = function() {
	if(!mWallet.server.isLocal) {
		new Alert().setTitle("Restore is aviable only for local wallet");
		return;
	}

	var bkpFile, destFile;

	mWallet.openDialog().then((path) => {
		bkpFile = path[0];
		destFile = elServerDatadir+"/wallet.dat";
		mWallet.sendCmd(["stop"]);
	}).then((r) => {
		console.log(destFile, bkpFile);
		const fs = require('fs-extra');

		fs.removeSync(destFile+".bak");
		fs.moveSync(destFile, destFile+".bak");
		fs.copySync(bkpFile, destFile);

		location.reload();
	});
};

mWallet.createBackup = function() {
	mWallet.saveDialog().then((path) => {
		console.log(path);
		mWallet.sendCmd(["backupwallet", path]).then((r) => {
			new Alert().setMessage("Backup created!").show();
		})
	})
}

mWallet.recovery = function() {
	new Alert().setMessage("Not implemented now...").show();
};

mWallet.platform.checkFiles = function() {return new Promise((resolve, reject) => {
	if(!fs.existsSync(PREBUILD_DIR)) fs.mkdirSync(PREBUILD_DIR);

	console.log(mWallet.platform.getDaemonMd5Filename());
	console.log(mWallet.platform.getDaemonFilename());

	if(!fs.existsSync(mWallet.platform.getDaemonMd5Filename()) ||
		!fs.existsSync(mWallet.platform.getDaemonFilename())) {
		// One of files is missing
		console.log("files not found");
		resolve(false);
	} else {
		// Check md5
		console.log("files exists, check md5...");
		fs.readFile(mWallet.platform.getDaemonMd5Filename(), (err, validHash) => {
			if(err) {
				console.error("md5 file read error");
				reject();
				return;
			}

			validHash = validHash.toString();

			require('md5-file')(mWallet.platform.getDaemonFilename(), (err, hash) => {
				if(err) {
					reject(err);
					return;
				}

				hash = hash.replace(/(\r\n|\n|\r)/gm, "").replace(" ", "");
				validHash = validHash.replace(/(\r\n|\n|\r)/gm, "").replace(" ", "");
				console.log(hash, validHash);
				if(hash != validHash) {
					console.error("md5 not valid!");
					resolve(false);
				} else {
					console.log("md5 valid!");
					resolve(true);
				}
			});
		})
	}
})}

mWallet.platform.downloadDaemon = function(){return new Promise((resolve, reject) => {
	if(process.platform === "win32") {
		console.log("download md5...");
		mWallet.platform.download(WIN32_PREBUILD_MD5_URL, mWallet.platform.getDaemonMd5Filename())
			.then(() => {
				console.log("download daemon...");
				return mWallet.platform.download(WIN32_PREBUILD_URL, mWallet.platform.getDaemonFilename())
			}).then(() => {
				console.log("downloaded, recheck...");
				return mWallet.platform.checkFiles();
			}).then(() => {
				resolve();
			}).catch((error) => {
				console.error(error);
				reject(error);
			})
	} else if(process.platform === "linux") {
		console.log("download md5...");
		mWallet.platform.download(LINUX_PREBUILD_MD5_URL, mWallet.platform.getDaemonMd5Filename())
			.then(() => {
				console.log("download daemon...");
				return mWallet.platform.download(LINUX_PREBUILD_URL, mWallet.platform.getDaemonFilename())
			}).then(() => {
				console.log("downloaded, recheck...");
				fs.chmodSync(mWallet.platform.getDaemonFilename(), '755');
				return mWallet.platform.checkFiles();
			}).then(() => {
				resolve();
			}).catch((error) => {
				console.error(error);
				reject(error);
			})
	}
})}

mWallet.platform.startDaemon = function() {return new Promise((resolve, reject) => {
	mWallet.platform.runShellCommand(mWallet.platform.getDaemonFilename()+" "+DAEMON_ARGS).then((d) => {
		mWallet.crash(d);
	}).catch((d) => {
		mWallet.crash(d);
	});

	setTimeout(function() {
		resolve();
	}, 1500);
})}

mWallet.platform.tryDaemonConnection = function() {return new Promise((resolve, reject) => {
	mWallet.sendCmd(["getwalletinfo"]).then((r) => {
		resolve(true);
	}).catch((e) => {
		resolve(false);
	})
})}

mWallet.platform.runShellCommand = function(cmd) {return new Promise(function(resolve,reject) {
	exec(cmd, (error, stdout, stderr) => {
		if(error)
			reject(stderr);
		else
			resolve(stdout);
	});
})}

mWallet.platform.getDaemonFilename = function() {
	return PREBUILD_DIR+
		(process.platform === "win32" ? 
			"\\leadertvcoind.exe" : "/leadertvcoind");
}

mWallet.platform.getDaemonMd5Filename = function() {
	return mWallet.platform.getDaemonFilename()+".md5";
}

mWallet.platform.download = function(url, dest) {return new Promise((resolve,reject) => {
	const http = require('https');
	const fs = require('fs');

	const file = fs.createWriteStream(dest);
	const request = http.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			console.log("downloaded", dest);
			file.close(() => {
				resolve();
			});
		});
	});
})}

mWallet.copy = function(text) {
	electron.clipboard.writeText(text, "text");
}

mWallet.openBrowser = function(link) {
	electron.shell.openExternal(link);
}

// TODO: Fix save/open dialogs

mWallet.saveDialog = function() {return new Promise((resolve, reject) => {
	var path = electron.remote.dialog.showSaveDialogSync({});
	resolve(path);
})};

mWallet.openDialog = function() {return new Promise((resolve, reject) => {
	var path = electron.remote.dialog.showOpenDialogSync({});
	resolve(path);
})};

mWallet.openFolderDialog = function() {return new Promise((resolve, reject) => {
	var path = electron.remote.dialog.showOpenDialogSync({
		properties: ['openDirectory']
	});
	resolve(path[0]);
})};

