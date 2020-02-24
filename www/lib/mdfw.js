/* 
 * Material Design Framework.js
 * by mhb, https://github.com/mhbrgn/MDFWjs
 * 
 * License: GPL v3 https://github.com/mhbrgn/MDFWjs/blob/master/LICENSE 
 */ 
 
// Merge file 00_meta.js 
/**
 * Global framework configuration class
 */
class Config {
	/**
	 * Framework version property
	 */
	static get FW_VERSION() {return "1.0";}
	/**
	 * Initialize static properties
	 * @returns {void}
	 */
	static _init() {
		Config.mainColor = "#009999";

		/**
		 * Toggle boolean for global unfocus service (see UnFocusService class)
		 * @type {boolean}
		 */
		Config.unfocusEnabled = true;
	}

	/**
	 * Getter of main accent color from framework skin
	 */
	static get mainColor() {
		if(localStorage.fw_main_color) return localStorage.fw_main_color;
		return Config._mainColor;
	}

	/**
	 * Setter of main accent color from framework skin
	 */
	static set mainColor(c) {
		Config._mainColor = c;
		ColorFix.execute();
	}
}

/**
 * Framework block schemas. Private class.
 */
class FWBlockSchemas {
	/**
	 * Activty (screen) schema
	 */
	static get ACTIVITY() {
		return {
			class: "fw-screen", type: "div", childs: {
				root: { type: "div", class: "fw-root-container" , childs: {
					topbar: {type: "div", class: "fw-topbar", childs: {
						container: {
							type: "div", class: "container", childs: {
								z_home: { type: "div", class: "zone-home" },
								z_left: { type: "div", class: "zone-left" },
								z_title: { type: "div", class: "zone-title" },
								z_right: { type: "div", class: "zone-left" }
							}
						}
					}},
					contents: {type: "div", class: "box-contents", childs: {
						tbh_fixed: {type: "div", class: "fw-topbar-holder"},
						holder: {type: "div", class: "holder", childs: {
							tbh_scroll: {type: "div", class: "fw-topbar-holder"},
							container: {type: "div", class: "container"}
						}}
					}}
				}}
			}
		};
	}
	/**
	 * Waitscreen block schema
	 */
	static get WAITSCREEN() {
		return {
			type: "div",
			class: "fw-spinactivity", childs: {
				spinner: { type: "div", class: "fw-spinner", inner: "Please wait..." }
			}
		};
	}

	/**
	 * Pager schema
	 */
	static get PAGER_SCHEMA() {
		return {type: "div", class: "fw-pager-view", childs: {
			wrapper: {type: "div", class: "fw-pager-wrapper"}
		}};
	}

	/**
	 * Page schema
	 */
	static get PAGE_SCHEMA() {
		return {type: "div", class: "fw-page", childs: {
			container: {type: "div", class: "container", childs: {
				filler: {type: "div", class: "filler"},
				contents: {type: "div", class: "page-contents"}
			}}
		}};
	}
}
// End of 00_meta.js 
 
// Merge file 01_utils.js 

/**
 * Framework utilities.
 */
class Utils {
	/**
	 * Generate HTMLElement by user-provide schema
	 * @param {object} data Structure for block generation
	 * @returns {HTMLElement}
	 */
	static inflate(data) {
		var block = document.createElement(data.type);
		if (data.class) block.className = data.class;
		if (data.id) block.id = data.id;
		if (data.inner) block.innerHTML = data.inner;
		if (data.height) block.style.height = data.height;
		if (data.color) block.style.color = data.color;

		if (data.childs) for (var a in data.childs)
			block[a] = block.appendChild(Utils.inflate(data.childs[a]));

		// Block-view hook
		block.IS_VIEW = true;
		block.getBlock = function() {return this;}
		block.appendView = function(v) {
			if(!v.IS_VIEW) Log.w("HTMLInflatorView", "Not a view!");
			this.appendChild(v.getBlock());
			return this;
		}

		// Install addons
		Utils.addLongTouchEvent(block);

		return block;
	}

	/**
	 * Create promise with timeout
	 * @param {number} time Wait time in ms
	 */
	static timer(time) {
		return new Promise(function (resolve) {
			setTimeout(function () {
				resolve();
			}, time);
		});
	}

	/**
	 * Add LongTouch listener to block
	 * 
	 * @param {HTMLElement} block Block to use
	 */
	static addLongTouchEvent(block) {
		var timer = -1;

		var supportsPassive = false;
		try {
		  var opts = Object.defineProperty({}, 'passive', {
		    get: function() {
		      supportsPassive = true;
		    }
		  });
		  window.addEventListener("testPassive", null, opts);
		  window.removeEventListener("testPassive", null, opts);
		} catch (e) {}

		block.onlongtap = null;
		block.addEventListener("touchstart",function(e){
			if(!block.onlongtap) return true;
			timer = setTimeout(function(e){
				if(block.onlongtap) block.onlongtap(e);
			}, 500);
			return !block.onlongtap;
		}, supportsPassive ? {passive: true} : false);
		block.addEventListener("touchmove", function(){
			if(timer) clearTimeout(timer);
		}, supportsPassive ? {passive: true} : false);
		block.addEventListener("touchend", function(){
			if(timer) clearTimeout(timer);
			return !block.onlongtap;
		});
		block.oncontextmenu = function(e){
			if(block.onlongtap) block.onlongtap(e);
			return !block.onlongtap;
		}
	}
}

/**
 * Display loading overlay
 */
class WaitScreen {
	/**
	 * Default contructor
	 */
	constructor() {
		/**
		 * Root container
		 * @type {HTMLElement}
		 */
		this.block = Utils.inflate(FWBlockSchemas.WAITSCREEN);
	}

	/**
	 * Show this overlay
	 */
	show() { document.body.appendChild(this.block); }

	/**
	 * Hide this overlay
	 */
	hide() { this.block.remove(); }
}

/**
 * Logs provider class
 */
class Log {
	/**
	 * Send debug log
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */
	static d(tag, data) {
		Log.journal += "<div>[" + tag + "] " + data + "</div>";
		//		if(!AppConfig.enableDebug) return;
		console.log("[" + tag + "]", data);
	}

	/**
	 * Send info-level log
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */
	static i(tag, data) {
		Log.journal += "<div style='color:#00a'>[" + tag + "] " + data + "</div>";
		console.info("[" + tag + "]", data);
	}

	/**
	 * Send warring
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */
	static w(tag, data) {
		Log.journal += "<div style='color:#aa0'>[" + tag + "] " + data + "</div>";
		console.warn("[" + tag + "]", data);
	}

	/**
	 * Send error
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */
	static e(tag, data) {
		Log.journal += "<div style='color:#f00'>[" + tag + "] " + data + "</div>";
		console.error("[" + tag + "]", data);
	}
}

Log.journal = "";

/**
 * This service automaticly removes focus after item click to remove click highlight.
 * @deprecated Didn't work. Will be removed!
 */
class UnFocusService {

	/**
	 * Do unFocus on block
	 * @param {HTMLElement} block Block to execute
	 */
	static _exec(block) {
		if(!Config.unfocusEnabled) return false;
		block.blur();
	}
	
	/**
	 * Register unFocus listener to element
	 * @param {HTMLElement} block Element to register
	 */
	static add(block) {
		block.addEventListener("click", function(){
			UnFocusService._exec(block);
		});
	}
}


/**
 * Stylesheet generator for current accent color
 * @deprecated 
 */
class ColorFix {
	/**
	 * Re-generate color stylesheet
	 */
	static execute() {
		var d = document.getElementById("colorfix");
		if(d) d.remove();

		var css = ".fw-button.style-flat::before, .fw-button.style-outline::before "+
			"{background-color: "+Config.mainColor+"}",
			style = document.createElement("style");

		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}

		d = document.createElement("div");
		d.id = "colorfix";
		d.appendChild(style);

		document.getElementsByTagName('head')[0].appendChild(d);
	}
}
// End of 01_utils.js 
 
// Merge file 02_widgets_base.js 

/**
 * Simple icon widget
 */
class IconView {
	get IS_VIEW() { return true; }

	/**
	 * Constuct new icon view widget
	 * @param {string} icon Icon identifer from material design icon font
	 */
	constructor(icon) {
		this.iconName = icon;
	}

	/**
	 * Disable icon coloring. Useful if you need another color.
	 * @returns {IconView} callback
	 */
	disableColor() {
		this.nocolor = true;
		return this;
	}

	/**
	 * Create and returns IconView block.
	 * @returns {HTMLElement}
	 */
	getBlock() {
		let i = document.createElement("i");
		i.className = "material-icons";
		if(!this.nocolor) i.style.color = Config.mainColor;
		i.innerHTML = this.iconName;
		return i;
	}
}

/**
 * Transparent overlay to lock touch (mouse) input.
 */
class InputLock {
	/**
	 * Default contructor
	 */
	constructor() {
		this.blk = Utils.inflate({ type: "div", class: "fw-inputlock" });
	}

	/**
	 * Enable this overlay
	 */
	enable() { document.body.appendChild(this.blk); }

	/**
	 * Remove this overlay
	 */
	disable() { this.blk.remove(); }
}

/**
 * Simple text display widget.
 * 
 * @todo Add configuration methods
 */
class TextView {
	get IS_VIEW() { return true; }

	/**
	 * Build new view
	 * @param {string} style TextView style name
	 * @param {string} value Text to display
	 */
	constructor(style, value) {
		this.blk = Utils.inflate({ type: "div", inner: value, class: "fw-textview-style-" + style });
	}

	/**
	 * Returns block
	 */
	getBlock() {
		return this.blk;
	}

	/**
	 * Set new text
	 */
	 setText(text) {
	 	this.blk.innerHTML = text;
	 }
}
// End of 02_widgets_base.js 
 
// Merge file 03_base.js 

/**
 * Screen class. This class provides basics of application screen.
 * Do not use directly! Create your own class that extends this and
 * inside him provide manipulations. Example:
 * 
 * ```js
 * class MyGreatScreen extends Screen {
 *   onCreate(data) {
 *     // Do screen filling here!
 *     this.appendView(new TextView("title", "Hello"))
 *   }
 * }
 * ```
 * 
 * To start a screen: `new MyGreatScreen().start()`
 */
class Screen {
	/**
	 * Root scren mode. This mode will disable open/close animations.
	 * See `Screen.setMode(mode)`.
	 */
	static get MODE_ROOT() { return 1; }
	/**
	 * Default screen mode. See `Screen.setMode(mode)`.
	 */
	static get MODE_DEFAULT() { return 0; }
	/**
	 * Fade in/out duration
	 * @deprecated Will be moved to Config
	 */
	static get FADE_DURATION() { return 350; }
	/**
	 * Actionbar scroll mode: hide on scroll.
	 * See `Screen.setScrollMode(mode)`.
	 */
	static get AB_MODE_HIDE() {return 1;}
	/**
	 * Actionbar scroll mode: do not hide on scroll.
	 * See `Screen.setScrollMode(mode)`.
	 */
	static get AB_MODE_NONE() {return 0;}

	/**
	 * Default constructor for Screen
	 * @param {*} data Anything taht you want give for `onCreate` method
	 */
	constructor(data) {
		var t = this;
		this.onInit();
		/**
		 * Current activity mode. See `Screen.setMode(mode)`.
		 * @type {number}
		 */
		this._activity_mode = 0;
		/**
		 * SetInterval return code for timer reset
		 */
		this._refresh_timer = false;
		/**
		 * Constructor data backup
		 */
		this._bundle = data;
		/**
		 * Activity root block
		 * @type {HTMLElement}
		 */
		this._activity_root = Utils.inflate(FWBlockSchemas.ACTIVITY);
		/**
		 * Activity actionbar root block
		 * @type {HTMLElement}
		 */
		this._activity_ab_root = this._activity_root.root.topbar;
		/**
		 * Symlink to activity contents
		 * @type {HTMLElement}
		 */
		this._activity_contents = this._activity_root.root.contents.holder;
		/**
		 * Action bar title
		 * @type {string}
		 */
		this._ab_title = "";
		/**
		 * Left zone action bar items
		 * @type {MenuItem[]}
		 */
		this._ab_left = [];
		/**
		 * Right zone action bar items
		 * @type {MenuItem[]}
		 */
		this._ab_right = [];
		/**
		 * Current action bar scroll mode.
		 * See `Screen.setScrollMode(mode)`
		 */
		this._ab_scrollmod = 0;

		this._activity_contents.addEventListener("scroll", function(){
			t._ab_scrolltrg();
		});
		this.initScrollMode();
	}

	/**
	 * Set action bar behavior on page scroll.
	 * 
	 * Use `Screen.AB_MODE_*` constants to provide mode.
	 * Default mode is `AB_MODE_NONE`.
	 * 
	 * @param {number} m Scrool mode.
	 */
	setScrollMode(m) {
		this._ab_scrollmod = m;
		this.initScrollMode();
	}

	/**
	 * Initialize selected scroll mode
	 */
	initScrollMode() {
		/**
		 * Previout scroll offset
		 * @type {number}
		 */
		this._ab_scm_prev_scy = this.getScrollerBlock().scrollTop;
		if(this._ab_scrollmod == Screen.AB_MODE_HIDE) {
			// Use dynamic holder
			this._activity_root.root.contents.tbh_fixed.classList.add("hide");
			this._activity_root.root.contents.holder.tbh_scroll.classList.remove("hide");
		} else {
			// Use fixed holder
			this._activity_root.root.contents.tbh_fixed.classList.remove("hide");
			this._activity_root.root.contents.holder.tbh_scroll.classList.add("hide");
		}
		this._ab_scrolltrg();
	}

	/**
	 * Calls on scroll to provide ActionBar scroll mode
	 */
	_ab_scrolltrg() {
		var df = this.getScrollerBlock().scrollTop-this._ab_scm_prev_scy;

		this._activity_ab_root.className = "fw-topbar";

		if(this.getScrollerBlock().scrollTop > 16) 
			this._activity_ab_root.className += " mode-elevate";

		if(df > 0 && this._ab_scrollmod == Screen.AB_MODE_HIDE) {
			// Down. Hide.
			this._activity_ab_root.className += " hide";
		}

		this._ab_scm_prev_scy = this.getScrollerBlock().scrollTop;
	}

	/**
	 * Add icon to left action bar zone
	 * @param {MenuItem} item Item to add
	 * @deprecated Left zone will be removed!
	 */
	addLeftIcon(item) {
		this._ab_left[this._ab_left.length] = item;
		this._rebuildActionbar();
	}

	/**
	 * Remove all actions from action bar
	 */
	wipeActions() {
		this._ab_right = [];
		this._rebuildActionbar();
	}

	/**
	 * Add icon to right action bar zone
	 * @param {MenuItem} item Item to add
	 * @deprecated Use addAction instance of this!
	 */
	addRightIcon(item) {
		Log.w("Screen", "addRightIcon is deprecated!");
		this.addAction(item);
	}

	/**
	 * Add action to activity topbar.
	 * @param {MenuItem} item Item to add
	 */
	addAction(item) {
		this._ab_right[this._ab_right.length] = item;
		this._rebuildActionbar();
	}

	/**
	 * Use item as screen home action.
	 * @param {MenuItem} item Item
	 */
	setHomeAction(item) {
		this._activity_ab_root.container.z_home.innerHTML = "";

		if(!item) return;
		let b = item.inflate();
		this._activity_ab_root.container.z_home.appendChild(b);
	}

	/**
	 * Enable back button as home action.
	 */
	setHomeAsUpAction() {
		let c = this;
		this.setHomeAction(new MenuItem("Back", "arrow_back", function () {
			c.finish();
		}));
	}

	/**
	 * Set screen title in action bar
	 * @param {string} title Title
	 */
	setTitle(title) {
		this._ab_title = title;
		this._rebuildActionbar();
	}

	/**
	 * Re-generate action bar block contents
	 */
	_rebuildActionbar() {
		let root = this._activity_ab_root;

		// title
		root.container.z_title.innerHTML = this._ab_title;

		// Leftframe
		root.container.z_left.innerHTML = "";
		for (var a in this._ab_left)
			root.container.z_left.appendChild(this._ab_left[a].inflate());

		// Rightframe
		root.container.z_right.innerHTML = "";
		for (var a in this._ab_right)
			root.container.z_right.appendChild(this._ab_right[a].inflate());
	}

	/**
	 * Add style class to activity.
	 * @deprecated
	 * @param {string} style Style name
	 */
	addStyle(style) {
		this._activity_root.classList.add("activity-style-" + style);
	}

	/**
	 * Add automatic call to `onUpdate` in interval
	 * 
	 * @todo Remove old timer before install new
	 * @param {number} timer Refresh time in ms
	 */
	doAutoUpdate(timer) {
		let c = this;
		c._refresh_timer = setInterval(function () {
			c.onUpdate();
		}, timer);
	}

	/**
	 * Append view to screen.
	 * 
	 * If `view.IS_FIXED_VIEW == true`, view will be added to relative zone.
	 * 
	 * @param {View} view View to append
	 */
	appendView(view) {
		if(!view.IS_VIEW) return false;
		if(view.IS_FIXED_VIEW)
			this._activity_root.root.appendChild(view.getBlock());
		else
			this._activity_contents.container.appendChild(view.getBlock());
	}

	/**
	 * Set activity mode.
	 * 
	 * Use `Screen.MODE_*` constants to set mode.
	 * Default mode is `MODE_DEFAULT` (0).
	 * 
	 * @param {number} mode Activity mode ID
	 */
	setMode(mode) { this._activity_mode = mode; }

	/**
	 * Returns activity contents root block
	 * @deprecated
	 */
	getRootBlock() {
		Log.w("Screen", "getRootBlock method is deprecated and will be removed!")
		return this._activity_contents.container;
	}
	
	/**
	 * Returns scrolling block from activity.
	 * Used to setup onScroll listeners.
	 * 
	 * @returns {HTMLElement}
	 */
	getScrollerBlock() {
		return this._activity_contents;
	}

	/**
	 * Remove all activity contents, except config and fixed views
	 */
	wipeContents() {
		this._activity_contents.container.innerHTML = "";
	}

	// Events
	/**
	 * Event listener, calls on screen start
	 * @param {*} data User-rpovided data from constructor
	 */
	onCreate(data) {
		Log.w("Screen", "onCreate is not overriden!");
	}

	/**
	 * Event listener, calls on screen refresh or manually
	 */
	onUpdate() { }
	/**
	 * Event listener, calls before screen construct
	 */
	onInit() { }
	/**
	 * Event listener, calls on screen destroy. Must return a boolean.
	 * 
	 * If returns `false`, screen finish will be cancelled.
	 * 
	 * @returns {boolean} is finish allowed?
	 */
	onFinish() {
		// Always allow
		return true;
	}

	// Actions
	/**
	 * Do screen destory
	 */
	finish() {
		let context = this, il = new InputLock();
		if (this.onFinish()) {
			// Finish allowed. Breaking...
			clearInterval(context._refresh_timer);
			il.enable();
			Utils.timer(50).then(function () {
				context._activity_root.classList.remove("show");
				return Utils.timer(Screen.FADE_DURATION);
			}).then(function () {
				il.disable();
				context._activity_root.remove();
			});
		}
	}

	/**
	 * Do activity build and display
	 */
	start() {
		let context = this, il = new InputLock;
		this.onCreate(this._bundle);
		this.onUpdate();

		il.enable();
		document.body.appendChild(this._activity_root);
		Utils.timer(50).then(function () {
			context._activity_root.classList.add("show");
			if (context._activity_mode == Screen.MODE_ROOT)
				context._activity_root.classList.add("noanim");
			return Utils.timer(Screen.FADE_DURATION);
		}).then(function () {
			il.disable();
		});
	}
}

/**
 * This class provide items for actionbar
 */
class MenuItem {
	/**
	 * Create new MenuItem
	 * 
	 * @param {string} title Accesibility name for icon
	 * @param {string} icon Icon name (from material.io/icons palette)
	 * @param {function} click On click function
	 */
	constructor(title, icon, click) {
		/**
		 * Item acessibility title.
		 * @type {string}
		 */
		this.title = title;
		/**
		 * Item icon, by material.io/icons
		 * @type {string}
		 */
		this.icon = icon;
		/**
		 * Item click listener
		 * @type {function}
		 */
		this.click = click;
	}

	/**
	 * Built and returns item
	 */
	inflate() {
		let i = (new IconView(this.icon)).getBlock();
		let b = document.createElement("a");
		b.className = "ab-btn";
		b.appendChild(i);
		b.title = this.title;
		b.onclick = this.click;
		return b;
	}
}
// End of 03_base.js 
 
// Merge file 04_widgets.js 
/**
 * Text input widget. Based on HTML Input.
 */
class TextInputView {
	get IS_VIEW() { return true; }
	/**
	 * Default contructor
	 */
    constructor() {
        this.block = Utils.inflate({type: "div", class: "fw-listitem textedit", childs: {
            titlebx: {type: "div", class: "item-title"},
            editor: {type: "input", class: "input"}
        }});
    }

	/**
	 * Mark input as readonly
	 */
	makeReadonly() {
		this.block.editor.setAttribute("readonly", "true");
        this.block.classList.add("readonly");
        return this;
    }
	
	/**
	 * Remove readonly mark
	 */
	unmakeReadonly() {
		this.block.editor.setAttribute("readonly", "false");
		this.block.classList.remove("readonly");
        return this;
    }

	/**
	 * Set placeholder text
	 * 
	 * @param {string} s Placeholder text
	 */
	setHolder(s) {
        this.block.editor.placeholder = s;
        return this;
    }

	/**
	 * Get block.
	 */
    getBlock() {return this.block;}

	/**
	 * Get value of input
	 * @returns {string} value
	 */
    toString() {
        return this.block.editor.value;
	}
	
	/**
	 * Set input type.
	 * 
	 * Use any HTML4-5 compitable input type as parameter.
	 * @param {string} type Input type
	 * @returns {TextInputView} Callback
	 */
	setType(type) {
		this.block.editor.type = type;
		return this;
	}

	/**
	 * Set value to input
	 * 
	 * @param {string} value Value
	 */
    fromString(value) {
        this.block.editor.value = value;
        return this;
    }

	/**
	 * Set input title
	 * 
	 * @param {string} title Title
	 */
    setTitle(title) {
        this.block.titlebx.innerHTML = title;
        return this;
    }

	/**
	 * Remove block.
	 */
    remove() {
        this.block.remove();
    }
}

class BigTextInputView extends TextInputView {
	constructor() {
		super();
        this.block = Utils.inflate({type: "div", class: "fw-listitem textedit", childs: {
            titlebx: {type: "div", class: "item-title"},
            editor: {type: "textarea", class: "input ta"}
		}});
		
        this.block.editor.onkeyup = function() {
            this.style.height = "25px";
            this.style.height = (this.scrollHeight)+"px";
        }
	}

	getBlock() {
		var b = super.getBlock();
		Utils.timer(50).then(function(){
			b.editor.onkeyup();
		});
		return b;
	}

	fromString(value) {
		super.fromString(value);
		this.block.editor.onkeyup();
		return this;
	}
}

/**
 * Row widget, great way to provide item in list
 */
class RowView {
	get IS_VIEW() { return true; }

	/**
	 * Constructor :-)
	 */
	constructor() {
		this._title = "";
		this._icon = "";
		this._subtitle = "";
		this._click = null;
		this._longtap = null;
	}

	/**
	 * Set item title.
	 * 
	 * @param {string} title Title value
	 * @returns {RowView} self-return
	 */
	setTitle(title) {
		this._title = title;
		return this;
	}

	/**
	 * Set item summary, second level information
	 * 
	 * @param {string} title Summary value
	 * @returns {RowView} self-return
	 */
	setSummary(title) {
		this._subtitle = title;
		return this;
	}

	/**
	 * Set item icon.
	 * 
	 * @param {string} icon Icon name from material.io/icons
	 * @returns {RowView} self-return
	 */
	setIcon(icon) {
		this._icon = icon;
		return this;
	}

	/**
	 * Add secondary action.
	 * 
	 * @param {string} title Accesibility name
	 * @param {string} icon Icon name from material.io/icons
	 * @param {function} click On click function
	 * @returns {RowView} self-return
	 */
	setAction(title,icon,click) {
		this._action = {t: title, i: icon, c: click};
		return this;
	}

	/**
	 * Set on click function
	 * 
	 * @param {function} c Function
	 * @returns {RowView} self-return
	 */
	setOnClickListener(c) {
		this._click = c;
		return this;
	}

	/**
	 * Set long touch event listner
	 * 
	 * @param {function} c Function
	 * @returns {RowView} self-return
	 */
	setOnLongTouchListener(c) {
		this._longtap = c;
		return this;
	}

	/**
	 * Build and get block!
	 */
	getBlock() {
		let b = Utils.inflate({ type: "div", class: "fw-rowview", childs: {
			box_a: {type: "div"},
			box_b: {type: "div", class: "text"},
			box_c: {type: "div"}
		} }), ctx = this;

		UnFocusService.add(b);

		b.onclick = this._click;
		b.onlongtap = this._longtap;
		if(this._title) b.box_b.appendChild(Utils.inflate({
			type: "div", class: "title", inner: this._title
		}));

		if(this._subtitle) {
			b.classList.add("twoline");
			b.box_b.appendChild(Utils.inflate({
				type: "div", class: "summary", inner: this._subtitle
			}));
		}

		if(this._icon) {
			b.box_a.className = "icon";
			b.box_a.appendView(new IconView(this._icon));
		}

		if(this._action) {
			b.box_c.className = "action";
			b.box_c.appendView(new IconView(this._action.i).disableColor());
			b.box_c.onclick = function(event){
				event.preventDefault();
				event.stopPropagation();
				ctx._action.c();
			}
			b.box_c.title = this._action.t;
		}

		return b;
	}
}

/**
 * SubHeader is view (widget) that provides list separator with title.
 */
class SubHeader {
	get IS_VIEW() { return true; }
	/**
	 * Constructor
	 * @param {string} text Header value
	 */
	constructor(text) {
		this.text = text;
	}
	/**
	 * Build and return HTMLElement
	 */
	getBlock() {
		var d = Utils.inflate({type: "div", class: "fw-listheader"});
		d.innerHTML = this.text;
		d.style.color = Config.mainColor;
		return d;
	}
}

/**
 * Provides simple button widget
 */
class Button {
	get IS_VIEW() { return true; }
	/**
	 * Flat (non-filled) button style id
	 */
	static get STYLE_FLAT() { return "style-flat"; }
	/**
	 * Contained (filled) button style id
	 */
	static get STYLE_CONTAINED() { return "style-contained"; }
	/**
	 * Outlined button style id
	 */
	static get STYLE_OUTLINE() { return "style-outline"; }

	/**
	 * Returns default button style
	 */
	_getDefaultStyle() {
		return Button.STYLE_FLAT;
	}

	/**
	 * Default constructor
	 */
	constructor() {
		this.mBlock = Utils.inflate({ type: "button", class: "fw-button " + this._getDefaultStyle() });
		UnFocusService.add(this.mBlock);
		this.style = this._getDefaultStyle();
		this._reDecorate();
	}

	/**
	 * Re-install style-specific properties
	 */
	_reDecorate() {
		if(this.style == Button.STYLE_FLAT || 
			this.style == Button.STYLE_OUTLINE) {
			this.mBlock.style.backgroundColor = "";
			this.mBlock.style.color = Config.mainColor;
			this.mBlock.style.borderColor = Config.mainColor;
		} else if(this.style == Button.STYLE_CONTAINED) {
			this.mBlock.style.backgroundColor = Config.mainColor;
			this.mBlock.style.color = null;
		} else {
			Log.w("Button", "Style "+this.style+" isn't defined. Can't provide decoration!");
		}
	}

	/**
	 * Returns button block
	 */
	getBlock() {
		return this.mBlock;
	}

	/**
	 * Set text to display on button.
	 * 
	 * @param {string} value Text to display
	 * @returns {Button} self-return
	 */
	setText(value) {
		this.mBlock.innerHTML = value;
		return this;
	}

	/**
	 * Set on button click function
	 * 
	 * @param {function} fnc On click function
	 * @returns {Button} self-return
	 */
	setOnClickListener(fnc) {
		this.mBlock.onclick = fnc;
		return this;
	}

	/**
	 * Set button style. Use `Button.STYLE_*` constants.
	 * 
	 * @param {string} style Style id
	 * @returns {Button} self-return
	 */
	setStyle(style) {
		this.mBlock.className = "fw-button " + style;
		this.style = style;
		this._reDecorate();
		return this;
	}
}

/**
 * Spin animation view widget
 */
class SpinnerView {
	get IS_VIEW() {return true;}

	constructor() {}

	getBlock() {
		var b = Utils.inflate({type: "div", class: "fw-spinner"});
		b.style.color = Config.mainColor;
		return b;
	}
}

/**
 * Spin animation activity lock view.
 */
class WaitlockView {
	get IS_VIEW() { return true; }
	get IS_FIXED_VIEW() { return true; }

	/**
	 * Default constructor.
	 * @param {Screen} ctx Context screen
	 */
	constructor(ctx) {
		this.ctx = ctx;
		this.block = Utils.inflate({type: "div", class: "fw-waitlock-view"});
		this.block.appendView(new SpinnerView());
	}

	getBlock() {return this.block;}

	/**
	 * Show widget
	 */
	show() {
		this.ctx._activity_contents.scrollTop = 0;
		this.block.classList.add("show");
	}

	/**
	 * Hide widget
	 */
	hide() {
		this.block.classList.remove("show");
	}
}

/**
 * Toolbar widget.
 */
class ToolbarView {
	get IS_VIEW(){return true;}

	/**
	 * Default constuctor
	 */
	constructor() {
		this.block = Utils.inflate({type: "div", class: "fw-toolbar"})
	}

	getBlock() {return this.block;}

	/**
	 * Remove all content from toolbar
	 */
	wipe() {
		this.block.innerHTML = "";
	}

	/**
	 * Add new icon to toolbar
	 * 
	 * @param {string} title Title
	 * @param {string} icon Icon name by material.io/icons
	 * @param {function} click onclick function
	 */
	add(title, icon, click) {
		var i = new IconView(icon).disableColor().getBlock();
		i.title = title;
		i.onclick = click;
		this.block.appendChild(i);
		return this;
	}

	/**
	 * Add whitespace to toolbar
	 */
	addSeparator() {
		this.block.appendChild(Utils.inflate({type: "a"}));
		return this;
	}
}

/**
 * Expandable row view.
 */
class SpoilerView extends RowView {
	/**
	 * Default constructor
	 */
	constructor() {
		super();

		var ctx = this;
		this.contents = Utils.inflate({type: "div"});
		this.contents.style.display = "none";
		this._icon = "keyboard_arrow_down";
		this._click = function() {
			ctx.toggle();
		}
	}

	getBlock() {
		this.row = super.getBlock();
		var b = Utils.inflate({type: "div"});
		b.appendChild(this.row);
		b.appendChild(this.contents);
		return b;
	}

	/**
	 * Append view to expandable container
	 * @param {View} v view to append
	 */
	appendView(v) {
		return this.contents.appendView(v);
	}

	/**
	 * Toggle contents visiblilty
	 */
	toggle() {
		if(this.contents.style.display == "none") {
			// Show!
			this.contents.style.display = "";
			this._icon = "keyboard_arrow_up";

			var b = super.getBlock();
			this.row = this.row.replaceWith(b);
			this.row = b;
		} else {
			// Hide!
			this.contents.style.display = "none";
			this._icon = "keyboard_arrow_down";

			var b = super.getBlock();
			this.row = this.row.replaceWith(b);
			this.row = b;
		}
	}
}

// End of 04_widgets.js 
 
// Merge file 05_dialogs.js 
class Alert {
    setTitle(t) {
        this.title = t;
        return this;
    }
    setMessage(m) {
        this.message = m;
        return this;
    }
    setOnClickListener(c) {
        this.click = c;
        return this;
    }
	setOnCancelListener(c) {
		this.oncancel = c;
		return this;
	}
    show() {
        var c = this;
		var d = new Dialog().setMessage(this.message).setTitle(this.title)
			.setOnCancelListener(this.oncancel)
            .addButton(new Button().setText("Ok").setOnClickListener(function(){
                d.hide();
                c.click();
            })).show();
    }
}

class Confirm {
	constructor() {
		this.okbtn = "Ok";
		this.cancelbtn = "Cancel";
	}
	setPositiveButtonText(t) {
		this.okbtn = t;
		return this;
	}
	setNegativeButtonText(t) {
		this.cancelbtn = t;
		return this;
	}
    setTitle(t) {
        this.title = t;
        return this;
    }
    setMessage(m) {
        this.message = m;
        return this;
    }
    setOnConfirmListener(c) {
        this.click = c;
        return this;
    }
    show() {
        var c = this;
        var d = new Dialog().setMessage(this.message).setTitle(this.title)
			.setOnCancelListener(this.oncancel)
			.addButton(new Button().setText(this.cancelbtn).setOnClickListener(function(){
				d.hide(true);
			})).addButton(new Button().setText(this.okbtn).setOnClickListener(function(){
                d.hide();
                c.click();
            })).show();
    }

	setOnCancelListener(c) {
		this.oncancel = c;
		return this;
	}
}

class Dialog {
	constructor() {
		this.buttons = [];
		this.views = [];
		this.title = "";
		this.message = "";
	}

	setTitle(t) {
		this.title = t;
		return this;
	}

	setMessage(m) {
		this.message = m;
		return this;
	}

	addButton(b) {
		if(!b.IS_VIEW) return false;
		this.buttons[this.buttons.length] = b;
		return this;
	}

	appendView(v) {
		if(!v.IS_VIEW) return false;
		this.views[this.views.length] = v;
		return this;
	}

	show() {
		if(this.shown) return Log.w("FWDialog", "Dialog can't be shown repeatedly! Create new instance of class and then show it!");
		var m = new ModalWindow().setOnCancelListener(this.oncancel),
			t = Utils.inflate({type: "div", class: "textbox"});

		m.appendView(t);

		if(this.title) 
			t.appendView(Utils.inflate({type: "header", class: "title", inner: this.title}));

		if(this.message)
			t.appendView(Utils.inflate({type: "div", class: "message", inner: this.message}));

		for(var a in this.views) m.appendView(this.views[a]);

		var btns = Utils.inflate({type: "div", class: "buttons"});
		for(var a in this.buttons) btns.appendChild(this.buttons[a].getBlock());
		m.appendView(btns);
		
		this.shown = true;
		this.modal = m;

		m.show();
		return this;
	}

	hide(c) {
		this.modal.hide(c);
	}

	setOnCancelListener(c) {
		this.oncancel = c;
		return this;
	}
}

class ModalWindow {
	constructor() {
        var ctx = this;
		this.blk = Utils.inflate({type: "div", class: "fw-dialog", childs: {
            container: {type: "div", class: "container"}
        }});

        this.blk.onclick = function(){
            ctx.hide(true); // Cancel dialog!
        }

        this.blk.container.onclick = function(e){
            e.stopPropagation();
        }
	}

	appendView(v) {
		if(!v.IS_VIEW) return Log.w("ModalWindow", "not a view!");
		this.blk.container.appendChild(v.getBlock());
	}

	setOnCancelListener(c) {
		this.oncancel = c;
		return this;
	}

	show() {
		var blk = this.blk;
		document.body.appendChild(blk);
        Utils.timer(50).then(function(){
            blk.style.opacity = 1;
		});
	}

	hide(cancel) {
		let blk = this.blk;
		if(cancel && this.oncancel) this.oncancel();

        blk.style.opacity = 0;
        Utils.timer(450).then(function(){
            blk.remove();
		});
	}
}
// End of 05_dialogs.js 
 
// Merge file 06_widget_fab.js 
class FloatingActionButton {
	get IS_VIEW() { return true; }
	get IS_FIXED_VIEW() { return true; }
	
	static get MODE_DEFAULT() { return "fab-default"; }
	static get MODE_SMALL() { return "fab-small"; }
	static get MODE_EXPAND() { return "fab-expand"; }
	static get MODE_HIDE() { return "fab-default hide"; }

	constructor() {
		this.button = Utils.inflate({type: "div", class: "fw-fab "+FloatingActionButton.MODE_DEFAULT, childs: {
            icon: {type: "i", class: "material-icons"},
            textview: {type: "a", class: "fab-text"}
        }});
		this.button.style.backgroundColor = Config.mainColor;
	}

	setIcon(icon) {
        this.button.icon.innerHTML = icon;
		return this;
    }
    
    setTitle(title) {
        this.button.textview.innerHTML = title;
        return this;
    }

    setMode(mode) {
        this.button.className = "fw-fab "+mode;
        return this;
	}
	
	setOnClickListener(c) {
		this.button.onclick = c;
		return this;
	}

	attachScreen(screen, modea, modeb) {
		var ctx = this, prev = screen._activity_root.scrollTop;
		
		ctx.setMode(modea);
		screen.getScrollerBlock().addEventListener("scroll",function(){
			var df = prev-this.scrollTop;
			ctx.setMode(df > 0 ? modea : modeb);
			prev = this.scrollTop;
		});
		return this;
	}

	getBlock() {
		return this.button;
	}
}
// End of 06_widget_fab.js 
 
// Merge file 20_paged_screen.js 
/**
 * SlidingScreen - screen with multiple slides support.
 */
class SlidingScreen extends Screen {
    /**
     * Default constructor (overrides `super(data)` constructor)
     * @param {*} data Data for onCreate event
     */
    constructor(data) {
        super(data);

        /**
         * Root view of pager
         */
        this._ss_view = Utils.inflate(FWBlockSchemas.PAGER_SCHEMA);
        this._ss_view.IS_FIXED_VIEW = true;

        /**
         * Is swipe enabled
         * @type {boolean}
         */
        this._ss_swipeOn = true;
        /**
         * Pages array
         * @type {SlideView[]}
         */
        this._ss_pages = [];
        /**
         * Active screen id
         * @type {number}
         */
        this._ss_active = 0;

        super.appendView(this._ss_view);
        this._ss_swipeinit();
    }

    /**
     * Append view locker method
     * @param {View} v view
     */
	appendView(view) {
		if(!view.IS_VIEW) return false;
		if(view.IS_FIXED_VIEW)
			this._activity_root.root.appendChild(view.getBlock());
		else
    		Log.e("SlidingScreen", "Use getPage(page).appendView(view) instance of appendView!");
	}

    /**
     * Get page ID
     * @param {number} p Page ID
     */
    getPage(p) {
        return this._ss_pages[p];
    }

    /**
     * Remove all pages!
     */
    wipe() {
        this._ss_pages = [];
        this._ss_view.wrapper.innerHTML = "";
    }

    /**
     * Add new clear page
     */
    newPage() {
        var id = this._ss_pages.length,
            blk = Utils.inflate(FWBlockSchemas.PAGE_SCHEMA);


        blk.style.left = (100*id)+"%";
        this._ss_pages[id] = new SlideView(this, blk, id);
        this._ss_view.wrapper.appendView(blk);

        this._ss_cfgscroll(this._ss_active);
        this.initScrollMode();
        return this._ss_pages[id];
    }

    /**
     * Go to page
     * @param {number} p Page ID
     */
    openPage(p) {
		let wrp = this._ss_view.wrapper, ctx = this;
		this._ss_active = p;

		wrp.style.transition = "left 0.25s";
		Utils.timer(2).then(function() {
			wrp.style.left = -(100*p)+"%";
			return Utils.timer(240);
		}).then(function(){
            wrp.style.transition = "";
            ctx._ss_cfgscroll(p);
            ctx.initScrollMode();
        }).catch(function(e) {
            console.error(e);
        });
    }

    /**
     * Reconfigure page-scroll attachment
     * @param {number} p Page ID
     */
    _ss_cfgscroll(p) {
        if(this.getPage(p)) this._ss_scrl_blk = this.getPage(p).getBlock();
        for(var a in this._ss_pages)
            this._ss_pages[a].getBlock().scrollTop = 0;
    }

    /**
     * Override getScrollBlock method
     */
    getScrollerBlock() {
        if(!this._ss_scrl_blk) return super.getScrollerBlock();
        return this._ss_scrl_blk;
    }

    /**
     * Go to page back
     */
    prevPage() {
        if(this._ss_active == 0) return;
        this.openPage(this._ss_active-1);
    }

    /**
     * Go to page next
     */
    nextPage() {
        if(this._ss_active == this._ss_pages.length-1) return;
        this.openPage(this._ss_active+1);
    }

    /**
     * Set swipe mode enabled/disabled.
     * @param {boolean} bool Is swipe enabled?
     */
    setSwipeEnabled(bool) {
        this._ss_swipeOn = bool;
    }

    /**
     * Init swipe events
     */
    _ss_swipeinit() {
        var wrp = this._ss_view.wrapper,
            touchData = {}, context = this;
                
        wrp.ontouchstart = function(e) {
            if(!context._ss_swipeOn) return;
            touchData.direction = null;
            touchData.startX = e.targetTouches[0].pageX;
            touchData.startY = e.targetTouches[0].pageY;
            touchData.startPos = this.getBoundingClientRect().left;
        };

        wrp.ontouchmove = function(e) {
            if(!context._ss_swipeOn) return;
            var rx = e.targetTouches[0].pageX-touchData.startX;
            var ry = e.targetTouches[0].pageY-touchData.startY;
            if(touchData.direction == null) {
                if( rx > 30 || rx < -30) touchData.direction = "h";
                else if( ry > 30 || ry < -30) touchData.direction = "v";
            }
            if(touchData.direction == "h") {
                e.stopPropagation();
                e.preventDefault();
                this.style.left = touchData.startPos+rx+"px";
            }
        };

        wrp.ontouchend = function(e) {
            if(!context._ss_swipeOn) return;
            if(touchData.direction != "h") return;
            var ex = e.changedTouches[0].pageX;
            var newPage = context._ss_active;
            if(ex < touchData.startX-75) newPage = context._ss_active+1;
            else if(ex > touchData.startX+75) newPage = context._ss_active-1;

            if(newPage == -1) newPage = 0;
            else if(newPage > context._ss_pages.length-1) newPage = context._ss_pages.length-1;
            context.openPage(newPage);
        }
    }
}

/**
 * Slide view widget
 */
class SlideView {
    get IS_VIEW() {return true;}
    
    /**
     * Default constructor
     * 
     * @param {SlidingScreen} context Context screen
     * @param {HTMLElement} block Page root block
     * @param {number} id Page ID
     */
    constructor(context, block, id) {
        this.ctx = context;
        this.block = block;
        this.id = id;
        this.tb = new ToolbarView();

        block.appendView(this.tb);
        block.addEventListener("scroll", function(){
			if(context._ss_active == id) context._ab_scrolltrg();
		})

        this.tb.add("Back", "arrow_back", function(){
            context.prevPage();
        });
        this.tb.add("Next", "arrow_forward", function(){
            context.nextPage();
        });
    }

    /**
     * Append view to page
     * @param {View} v View
     */
    appendView(v) {
        this.block.container.appendView(v);
    }

    /**
     * Return page root block
     */
    getBlock() {
        return this.block;
    }

    /**
     * Return page toolbar (at bottom)
     */
    getToolbar() {
        return this.tb;
    }

    /**
     * Returns page ID
     */
    getId() {
        return this.id;
    }

    /**
     * Go to this page
     */
    open() {
        this.ctx.openPage(this.id);
    }
}
// End of 20_paged_screen.js 
 
// Merge file 30_settings_screen.js 
/**
 * Framework setings screen.
 * 
 * Usage:
 * ```js
 * new FWSettingsScreen().start();
 * // Or, if you need another localization, override
 * // FWSettingsScreen.LOCALE items:
 * 
 * new FWSettingsScreen({
 *   // Provide your alternative for FWSettingsScreen.LOCALE strings here
 * }).start();
 * ```
 */
class FWSettingsScreen extends Screen {
    /**
     * Localization strings (default, english)
     */
    static get LOCALE() {return {
        fontSizeTitle: "Font size",
        accentColorTitle: "Accent color (HEX, empty to default)",
        reloadRequired: "Restart application to apply changes",
        cancel: "Cancel", ok: "Ok",
        nightmode: "Use black theme", daymode: "Use white theme"
    }};

    /**
     * OnCreate event override
     * @param {Object} loc Localization override
     */
    onCreate(loc) {
        var locale = FWSettingsScreen.LOCALE;
        if(loc) for(var a in loc) locale[a] = loc[a];
        this.setHomeAsUpAction();
        this.locale = locale;
        this.onUpdate();
    }

    /**
     * OnUpdate event override
     */
    onUpdate() {
        var loc = this.locale, ctx = this;
        this.wipeContents();
        
        this.appendView(new RowView().setTitle(localStorage.fw_cfg_nightmode ? loc.nightmode : loc.daymode)
            .setIcon("wb_sunny").setSummary(loc.themeSummary).setOnClickListener(function(){
                if(localStorage.fw_cfg_nightmode == "true") localStorage.fw_cfg_nightmode = "";
                else localStorage.fw_cfg_nightmode = "true";
                FWInit.cfgInit();
            }));

        if(!localStorage.fw_cfg_font_size) 
            localStorage.fw_cfg_font_size = 1;
        
        this.appendView(new RowView().setTitle(loc.fontSizeTitle)
            .setIcon("format_size")
            .setSummary(Math.round(localStorage.fw_cfg_font_size*100)+"% of default")
            .setOnClickListener(function(){
                var te = new TextInputView().setTitle(loc.fontSizeTitle)
                    .fromString(Math.round(localStorage.fw_cfg_font_size*100));
                
                var d = new Dialog().appendView(te)
                    .addButton(new Button().setText(loc.cancel).setOnClickListener(function(){
                        d.hide();
                    })).addButton(new Button().setText(loc.ok).setOnClickListener(function(){
                        console.log(te.toString()/100);
                        localStorage.fw_cfg_font_size = te.toString()/100;
                        d.hide();
                        ctx.onUpdate();
                    })).show();
            }));
        
        this.appendView(new RowView().setTitle(loc.accentColorTitle)
            .setIcon("palette")
            .setSummary(localStorage.fw_main_color)
            .setOnClickListener(function(){
                var te = new TextInputView().setTitle(loc.fontSizeTitle)
                    .fromString(localStorage.fw_main_color);
                
                var d = new Dialog().appendView(te)
                    .addButton(new Button().setText(loc.cancel).setOnClickListener(function(){
                        d.hide();
                    })).addButton(new Button().setText(loc.ok).setOnClickListener(function(){
                        localStorage.fw_main_color = te.toString();
                        d.hide();
                        ctx.onUpdate();
                    })).show();
            }));

            this.appendView(new TextView("info", loc.reloadRequired));
    }
}// End of 30_settings_screen.js 
 
// Merge file 98_Init.js 
/**
 * Framework initialization class. Technique usage only!
 */
class FWInit {
    /**
     * Initialize framework.
     */
    static init() {
        if(FWInit.asdzx_init_complete) return Log.w("Init", "Secondary init call is blocked!");
        Config._init();
        FWInit.cfgInit();

        FWInit.asdzx_init_complete = true;
    }

    /**
     * Parse local framework settings
     */
    static cfgInit() {
        if(localStorage.fw_cfg_font_size)
            document.documentElement.style.fontSize = localStorage.fw_cfg_font_size+"rem";

        localStorage.fw_cfg_nightmode ? document.documentElement.classList.add("fw-bcfg-darkmode") : 
            document.documentElement.classList.remove("fw-bcfg-darkmode");
    }
}

FWInit.init();
// End of 98_Init.js 
 
// Merge file 99_testmod.js 
class TestScreen extends Screen {
    onCreate() {
        var wl = new WaitlockView(this),
            ctx = this;

        this.setHomeAsUpAction();
        this.appendView(new TextView("title", "FW Test!"));

        // MAIN
        this.appendView(new RowView().setTitle("Widgets test page").setOnClickListener(function(){
            new TestScreen2().start();
        }));
        this.appendView(new RowView().setTitle("SlidingScreen demo").setOnClickListener(function(){
            new TestScreen3().start();
        }));
        this.appendView(new RowView().setTitle("Framework settings screen").setOnClickListener(function(){
            new FWSettingsScreen().start();
        }));
        
        this.appendView(new RowView().setTitle("Set color and reopen").setOnClickListener(function(){
            var c = "#";
            c += Math.round(Math.random()*100);
            c += Math.round(Math.random()*100);
            c += Math.round(Math.random()*100);
            Config.mainColor = c;

            ctx.finish();
            new TestScreen().start();
        }));

        // FAB
        this.appendView(new SubHeader("Floating action button"));
        var fab = new FloatingActionButton().setIcon("star").setTitle("Star");
        this.appendView(fab);
        this.appendView(new RowView().setTitle("Default fab mode").setOnClickListener(function(){
            fab.setMode(FloatingActionButton.MODE_DEFAULT);
        }));
        this.appendView(new RowView().setTitle("Small fab mode").setOnClickListener(function(){
            fab.setMode(FloatingActionButton.MODE_SMALL);
        }));
        this.appendView(new RowView().setTitle("Expanded fab mode").setOnClickListener(function(){
            fab.setMode(FloatingActionButton.MODE_EXPAND);
        }));
        this.appendView(new RowView().setTitle("Scroll listen, expanding").setOnClickListener(function(){
            fab.attachScreen(ctx, FloatingActionButton.MODE_EXPAND, FloatingActionButton.MODE_DEFAULT);
        }));
        this.appendView(new RowView().setTitle("Scroll listen, hide").setOnClickListener(function(){
            fab.attachScreen(ctx, FloatingActionButton.MODE_DEFAULT, FloatingActionButton.MODE_HIDE);
        }));

        // AB
        this.appendView(new SubHeader("AB tests"));
        this.appendView(new RowView().setTitle("AB SM Hide").setOnClickListener(function(){
            ctx.setScrollMode(Screen.AB_MODE_HIDE);
        }));
        this.appendView(new RowView().setTitle("AB SM None").setOnClickListener(function(){
            ctx.setScrollMode(Screen.AB_MODE_NONE);
        }));
        this.appendView(new RowView().setTitle("Set a very long title").setOnClickListener(function(){
            ctx.setTitle("Very very very very very very long title")
        }));
        this.appendView(new RowView().setTitle("Add some actions to AB").setOnClickListener(function(){
            ctx.addAction(new MenuItem("action", "android"));
            ctx.addAction(new MenuItem("action2", "apple"));
        }));

        // ETC
        this.appendView(new SubHeader("etc"));
        this.appendView(new RowView().setTitle("Wipe page").setOnClickListener(function(){
            ctx.wipeContents();
        }));
        this.appendView(wl);
        this.appendView(new RowView().setTitle("Enable waitlockview for 5 seconds").setOnClickListener(function(){
            wl.show();
            Utils.timer(5000).then(function(){
                console.log("ok");
                wl.hide();
            }).catch(function(e){
                console.warn(e);
            });
        }));

    }
}

class TestScreen2 extends Screen {
    onCreate() {
        var tv = new TextInputView().setTitle("Text input demo").setHolder("Empty"),
            tv2 = new TextInputView().setTitle("Password input demo").setHolder("Empty").setType("password"),
            tv3 = new BigTextInputView().setTitle("Big input demo").setHolder("Empty");

        this.setHomeAsUpAction();
        this.setTitle("Widgets test mode!");

        var tb = new ToolbarView();
        this.appendView(tb);

        tb.add("android","android", function(){
            alert(1);
        });
        tb.add("check","check", function(){
            alert(2);
        });
        tb.addSeparator();
        tb.add("undo","undo", function(){
            alert(3);
        });

        var sp = new SpoilerView().setTitle("Spoiler test").setSummary("Tap to open!");
        sp.appendView(new RowView().setTitle("Hidden row!"));
        this.appendView(sp);

        this.appendView(new SubHeader("Input tests"));
        this.appendView(tv);
        this.appendView(tv2);
        this.appendView(tv3);
        this.appendView(new RowView().setTitle("Show value").setOnClickListener(function(){
            new Alert().setTitle("Text form value:").setMessage(tv.toString()).show();
        }).setOnLongTouchListener(function(){
            new Alert().setTitle("Long tap!").show();
        }));

        this.appendView(new SpinnerView());

        this.appendView(new TextView("info", "This is info TextView!"));

        this.appendView(new Button().setText("Default button"));
        this.appendView(new Button().setStyle(Button.STYLE_CONTAINED).setText("Contained button"));
        this.appendView(new Button().setStyle(Button.STYLE_FLAT).setText("Flat button"));
        this.appendView(new Button().setStyle(Button.STYLE_OUTLINE).setText("Flat button"));

        this.appendView(new SubHeader("RowView tests"));
        this.appendView(new RowView().setTitle("Single-line"));
        this.appendView(new RowView().setTitle("Single-line with icon").setIcon("android"));
        this.appendView(new RowView().setTitle("Single-line with icon and action").setIcon("android").setAction("Hello", "more_vert", function(){
            new Alert().setMessage("Hello!").show();
        }));
        
        this.appendView(new RowView().setSummary("Description").setTitle("Two-line"));
        this.appendView(new RowView().setSummary("Description").setTitle("Two-line with icon").setIcon("android").setOnClickListener(function(){

        }));
        this.appendView(new RowView().setSummary("Description").setTitle("Two-line with icon and action").setIcon("android").setAction("Hello", "more_vert", function(){
            new Alert().setTitle("It is menu!").setMessage("Hello, World!").setOnClickListener(function(){
                console.log(2);
            }).show();
        }));
    }
}

class TestScreen3 extends SlidingScreen {
    onCreate() {
        this.setHomeAsUpAction();
    }
    onUpdate() {
        this.wipe();

        var a = this.newPage(),
            b = this.newPage(),
            ctx = this;

        a.appendView(new TextView("title", "Page 1"));
        for(var i = 0; i < 50; i++) a.appendView(new RowView().setTitle("Row A"+i));

        b.appendView(new TextView("title", "Page 2"));
        for(var i = 0; i < 50; i++) b.appendView(new RowView()
            .setTitle("Row B"+i).setOnClickListener(function(){
                ctx.onUpdate();
            }));
    }
}

/*
class TestScreen2 extends Screen {
    onCreate() {
        this.setHomeAsUpAction();
        this.setTitle("Test mode!");
    }
}
*/
// End of 99_testmod.js 
 
