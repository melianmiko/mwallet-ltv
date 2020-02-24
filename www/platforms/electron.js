/*
 * Platform specific code.
 * This is Electron variant
 */

const electron = require('electron');
const fs = electron.remote.require('fs')
const exec = require('child_process').exec;
const remote = require('electron');

const WIN32_PREBUILD_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind.exe";
const WIN32_PREBUILD_MD5_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind.exe.md5";
const LINUX_PREBUILD_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind-linux";
const LINUX_PREBUILD_MD5_URL = "https://raw.githubusercontent.com/mhbrgn/mWallet-LTV-prebuild/master/leadertvcoind-linux.md5";
const DAEMON_ARGS = "-rpcport=16314 -rpcuser=leadertv -rpcpassword=leadertv";

const PREBUILD_DIR = require('electron').remote.app.getPath('userData')+
	(process.platform === "win32" ? "\\bin" : "/bin");

// Native wallet settings
mWallet.hasNative = true;
mWallet.platform.launchNative = function() {return new Promise((resolve,reject) => {
	mWallet.platform.checkFiles().then((s) => {
		mWallet.launcherTools.updateState("Скачивается демон...");
		if(!s) return mWallet.platform.downloadDaemon();
		else return true;
	}).then((d) => {
		mWallet.launcherTools.updateState("Создание подключения...");
		mWallet.server.isLocal = true;;
		mWallet.server.url = "127.0.0.1";
		mWallet.server.port = 16314;
		mWallet.server.login = "leadertv";
		mWallet.server.passwd = "leadertv";
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
		ctx.download(LINUX_PREBUILD_MD5_URL, mWallet.platform.getDaemonMd5Filename())
			.then(() => {
				console.log("download daemon...");
				return ctx.download(LINUX_PREBUILD_URL, mWallet.platform.getDaemonFilename())
			}).then(() => {
				console.log("downloaded, recheck...");
				return ctx.checkFiles();
			}).then(() => {
				resolve();
			}).catch((error) => {
				console.error(error);
				reject(error);
			})
	}
})}

mWallet.platform.startDaemon = function() {return new Promise((resolve, reject) => {
	mWallet.platform.runShellCommand(
		mWallet.platform.getDaemonFilename()+" "+DAEMON_ARGS);

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
	var dialog = electron.remote.dialog,
		win = electron.remote.getCurrentWindow();

	dialog.showSaveDialog(win, {}, (fn) => {
		console.log(fn);
		resolve(fn);
	})
})};

mWallet.openDialog = function() {return new Promise((resolve, reject) => {
	var dialog = electron.remote.dialog,
		win = electron.remote.getCurrentWindow();

	dialog.showSaveDialog(win, {}, (fn) => {
		console.log(fn);
		resolve(fn);
	})
})};
