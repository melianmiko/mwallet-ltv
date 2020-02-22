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

class LauncherScreem extends Screen {
	onCreate() {
		this.setMode(Screen.MODE_ROOT);
		var pTools = new PlatformTools(), ctx = this;

		pTools.checkFiles().then((status) => {
			// After files check
			ctx.setTitle("Загрузка демона...");
			if(!status) return pTools.downloadDaemon();
			else return true;
		}).then((status) => {
			// After download
			return pTools.tryDaemonConnection();
		}).then((status) => {
			// If not started, start
			ctx.setTitle("Выпускаем демона...");
			if(!status) return pTools.startDaemon();
			else return true;
		}).then((status) => {
			// After daemon start
			return pTools.tryDaemonConnection();
		}).then((status) => {
			new WalletHomeScreen().start();
		}).catch((error) => {
			console.error(error);
			var msg = new Dialog()
				.setTitle("Не удалось запуститься...")
				.setMessage("Хз что произошло... Нажми Ctrl-D, открой вкладку \"Console\", заскриншоть и отправь разрабу, пусть разбирается...")
				.addButton(new Button().setText("Ок").setOnClickListener(function(){
					msg.hide();
				})).show();
		})
	}
}

class PlatformTools {
	checkFiles() {var ctx = this;return new Promise((resolve, reject) => {
		if(!fs.existsSync(PREBUILD_DIR)) fs.mkdirSync(PREBUILD_DIR);

		if(!fs.existsSync(ctx.getDaemonMd5Filename()) ||
			!fs.existsSync(ctx.getDaemonFilename())) {
			// One of files is missing
			console.log("files not found");
			resolve(false);
		} else {
			// Check md5
			console.log("files exists, check md5...");
			fs.readFile(ctx.getDaemonMd5Filename(), (err, validHash) => {
				if(err) {
					console.error("md5 file read error");
					reject();
					return;
				}

				validHash = validHash.toString();

				require('md5-file')(ctx.getDaemonFilename(), (err, hash) => {
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

	downloadDaemon() {var ctx = this;return new Promise((resolve, reject) => {
		if(process.platform === "win32") {
			console.log("download md5...");
			ctx.download(WIN32_PREBUILD_MD5_URL, ctx.getDaemonMd5Filename())
				.then(() => {
					console.log("download daemon...");
					return ctx.download(WIN32_PREBUILD_URL, ctx.getDaemonFilename())
				}).then(() => {
					console.log("downloaded, recheck...");
					return ctx.checkFiles();
				}).then(() => {
					resolve();
				}).catch((error) => {
					console.error(error);
					reject(error);
				})
		} else if(process.platform === "linux") {
			console.log("download md5...");
			ctx.download(LINUX_PREBUILD_MD5_URL, ctx.getDaemonMd5Filename())
				.then(() => {
					console.log("download daemon...");
					return ctx.download(LINUX_PREBUILD_URL, ctx.getDaemonFilename())
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

	startDaemon() {var ctx = this;return new Promise((resolve, reject) => {
		ctx.runShellCommand(ctx.getDaemonFilename()+" "+DAEMON_ARGS);
		setTimeout(function() {
			resolve();
		}, 1500);
	})}

	tryDaemonConnection() {return new Promise((resolve, reject) => {
		sendCommand(["getwalletinfo"]).then((r) => {
			resolve(true);
		}).catch((e) => {
			resolve(false);
		})
	})}

	runShellCommand(cmd) {return new Promise(function(resolve,reject) {
		exec(cmd, (error, stdout, stderr) => {
			if(error)
				reject(stderr);
			else
				resolve(stdout);
		});
	})}

	getDaemonFilename() {
		return PREBUILD_DIR+
			(process.platform === "win32" ? "\\leadertvcoind.exe" : "/leadertvcoind");
	}

	getDaemonMd5Filename() {
		return PREBUILD_DIR+
			(process.platform === "win32" ? "\\leadertvcoind.exe.md5" : "/leadertvcoind.md5");
	}

	download(url, dest) {return new Promise((resolve,reject) => {
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
}

function sendCommand(args) {return new Promise(function(resolve,reject) {
	var data = {
		jsonrpc: "1.0", 
		id: "curltest", 
		method: args[0],
		params: (args.length > 1 ? args.slice(1) : [])
	};

	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://127.0.0.1:16314");
	xhr.setRequestHeader("Authorization", "Basic " + btoa("leadertv:leadertv"));
	xhr.onload = function() {
		if(xhr.status == 200) {
			try {
				data = JSON.parse(xhr.responseText);
				if(data.error) {
					reject(data.error);
				} else {
					resolve(data.result);
				}
			} catch(e) {
				reject(e);
			}
		} else {
			try {
				data = JSON.parse(xhr.responseText);
				reject(data.error);
			} catch(e) {
				reject(e);
			}
		}
	}
	xhr.onerror = reject;
	xhr.send(JSON.stringify(data));
});}
