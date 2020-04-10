const WIN32_PREBUILD_URL = "https://gitlab.com/mhbrgn/mWallet-LTV-prebuild/-/raw/master/leadertvcoind.exe";
const WIN32_PREBUILD_MD5_URL = "https://gitlab.com/mhbrgn/mWallet-LTV-prebuild/-/raw/master/leadertvcoind.exe.md5";
const LINUX_PREBUILD_URL = "https://gitlab.com/mhbrgn/mWallet-LTV-prebuild/-/raw/master/leadertvcoind-linux";
const LINUX_PREBUILD_MD5_URL = "https://gitlab.com/mhbrgn/mWallet-LTV-prebuild/-/raw/master/leadertvcoind-linux.md5";

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

		window.onbeforeunload = function() {
			if(localStorage.e_stopOnExit == "true" && mWallet.server.isLocal) mWallet.sendCmd(["stop"]);
		}
	}

	launchNative() {return new Promise((resolve,reject) => {
		mWallet.platform.loadDaemonArgs().then(() => {
			mWallet.launcherTools.updateState("Проверка цельности файлов...");
			return mWallet.platform.checkFiles();
		}).then((s) => {
			mWallet.launcherTools.updateState("Скачивается демон...");
			if(!s) return mWallet.platform.downloadDaemon();
			else return true;
		}).then((d) => {
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
				mWallet.platform.electron.remote.getCurrentWindow().close();
			})}

			resolve(true)
		}).catch((e) => {reject(e);})
	})}

	loadDaemonArgs() {return new Promise((resolve, reject) => {
		// Read settings
		var elServerPort = mWallet.platform.nativeArgs.elServerPort,
			elServerLogin = mWallet.platform.nativeArgs.elServerLogin,
			elServerPassword = mWallet.platform.nativeArgs.elServerPassword,
			elServerAllowIp = mWallet.platform.nativeArgs.elServerAllowIp;

		if(localStorage.customDaemonPort) elServerPort = localStorage.customDaemonPort;
		if(localStorage.customDaemonLogin) elServerLogin = localStorage.customDaemonLogin;
		if(localStorage.customDaemonPassword) elServerPassword = localStorage.customDaemonPassword;
		if(localStorage.customAllowedIPs) elServerAllowIp = localStorage.customAllowedIPs;

		// Build args
		mWallet.platform.daemonArgs = "-rpcport="+elServerPort+" -rpcuser="+elServerLogin+" -rpcpassword="+elServerPassword;
		if(elServerAllowIp) mWallet.platform.daemonArgs += " -rpcallowip="+elServerAllowIp;

		// Get data dir
		mWallet.platform.getDataDir().then((dataDir) => {
			mWallet.platform.nativeArgs.elServerDatadir = dataDir;
			mWallet.platform.daemonArgs +=  " -datadir="+dataDir;
			console.log(mWallet.platform.daemonArgs);
			return mWallet.platform.createWallet();
		}).then(() => {
			resolve();
		});
	})}

	createWallet() {return new Promise((resolve,reject) => {
		if(mWallet.platform.fs.existsSync(mWallet.platform.nativeArgs.elServerDatadir+"/wallet.dat")) {
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

					mWallet.platform.fs.writeFileSync(mWallet.platform.nativeArgs.elServerDatadir+"/leadertvcoin.conf", out, "utf-8");
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
					fs.copySync(p, mWallet.platform.nativeArgs.elServerDatadir+"/wallet.dat");

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
	})}

	getDataDir() {return new Promise((resolve, reject) => {
		if(localStorage.daemonDataDir) {
			if(mWallet.platform.fs.existsSync(localStorage.daemonDataDir)) {
				resolve(localStorage.daemonDataDir);
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
				scr.finish();
				resolve(localStorage.daemonDataDir);
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
						scr.finish();
						resolve(localStorage.daemonDataDir);
					}
				})
			}));

		scr.start();
	})}

	getRecomendedDataDir() {
		var appdata = mWallet.platform.electron.remote.app.getPath("appData"),
			slash = (process.platform === "win32" ? "\\" : "/");

		var path = appdata+slash+"LeadERTVCoin";

		if(/[а-яА-ЯЁё]/.test(path)) {
			// If contains cyrilic
			if(process.platform === "win32")
				path = "C:\\LeadERTVCoin";
			else
				path = null;
		}

		if(path !== null) if(!mWallet.platform.fs.existsSync(path)) 
			mWallet.platform.fs.mkdirSync(path);
		return path;
	}

	hasSettings() {
		return true;
	}

	openSettings() {
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

	restoreBackup() {
		if(!mWallet.server.isLocal) {
			new Alert().setTitle("Restore is aviable only for local wallet");
			return;
		}

		var bkpFile, destFile;

		mWallet.platform.openDialog().then((path) => {
			bkpFile = path[0];
			destFile = mWallet.platform.nativeArgs.elServerDatadir+"/wallet.dat";
			mWallet.sendCmd(["stop"]);
		}).then((r) => {
			console.log(destFile, bkpFile);
			const fs = require('fs-extra');

			fs.removeSync(destFile+".bak");
			fs.moveSync(destFile, destFile+".bak");
			fs.copySync(bkpFile, destFile);

			location.reload();
		});
	}

	createBackup() {
		mWallet.platform.saveDialog().then((path) => {
			console.log(path);
			mWallet.sendCmd(["backupwallet", path]).then((r) => {
				new Alert().setMessage("Backup created!").show();
			})
		})
	}

	checkFiles() {return new Promise((resolve, reject) => {
		if(!mWallet.platform.fs.existsSync(require('electron').remote.app.getPath('userData')+"/bin")) mWallet.platform.fs.mkdirSync(require('electron').remote.app.getPath('userData')+"/bin");

		console.log(mWallet.platform.getDaemonMd5Filename());
		console.log(mWallet.platform.getDaemonFilename());

		if(!mWallet.platform.fs.existsSync(mWallet.platform.getDaemonMd5Filename()) ||
			!mWallet.platform.fs.existsSync(mWallet.platform.getDaemonFilename())) {
			// One of files is missing
			console.log("files not found");
			resolve(false);
		} else {
			// Check md5
			console.log("files exists, check md5...");
			mWallet.platform.fs.readFile(mWallet.platform.getDaemonMd5Filename(), (err, validHash) => {
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

	downloadDaemon() {return new Promise((resolve, reject) => {
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
					mWallet.platform.fs.chmodSync(mWallet.platform.getDaemonFilename(), '755');
					return mWallet.platform.checkFiles();
				}).then(() => {
					resolve();
				}).catch((error) => {
					console.error(error);
					reject(error);
				})
		}
	})}

	startDaemon() {return new Promise((resolve, reject) => {
		var cmd = mWallet.platform.getDaemonFilename()+" "+mWallet.platform.daemonArgs;
		console.log(cmd);
		mWallet.platform.runShellCommand(cmd).then((d) => {
			mWallet.crash(d);
		}).catch((d) => {
			mWallet.crash(d);
		});

		setTimeout(function() {
			resolve();
		}, 1500);
	})}

	tryDaemonConnection() {return new Promise(function(resolve, reject) {
		mWallet.server.testConnection().then(function() {
			resolve(true);
		}).catch(function() {
			resolve(false);
		});
	})}

	runShellCommand(cmd) {return new Promise(function(resolve,reject) {
		mWallet.platform.exec(cmd, (error, stdout, stderr) => {
			if(error)
				reject(stderr);
			else
				resolve(stdout);
		});
	})}

	getDaemonFilename() {
		return require('electron').remote.app.getPath('userData')+
			(process.platform === "win32" ? 
				"\\bin\\leadertvcoind.exe" : "/bin/leadertvcoind");
	}

	getDaemonMd5Filename() {
		return mWallet.platform.getDaemonFilename()+".md5";
	}

	download() {return new Promise((resolve,reject) => {
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

	copy(text) {
		mWallet.platform.electron.clipboard.writeText(text, "text");
	}

	openBrowser(link) {
		mWallet.platform.electron.shell.openExternal(link);
	}

	saveDialog() {return new Promise((resolve, reject) => {
		var path = mWallet.platform.electron.remote.dialog.showSaveDialogSync({});
		resolve(path);
	})}

	openDialog() {return new Promise((resolve, reject) => {
		var path = mWallet.platform.electron.remote.dialog.showOpenDialogSync({});
		resolve(path);
	})}

	openFolderDialog() {return new Promise((resolve, reject) => {
		var path = mWallet.platform.electron.remote.dialog.showOpenDialogSync({
			properties: ['openDirectory']
		});
		resolve(path[0]);
	})}
}
