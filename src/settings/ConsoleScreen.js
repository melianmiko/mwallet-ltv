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
