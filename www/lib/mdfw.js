"use strict";/**
 * Stylesheet generator for current accent color
 * @deprecated 
 */class ColorFix{/**
	 * Re-generate color stylesheet
	 */static execute(){var d=document.getElementById("colorfix");if(d)d.remove();var css=".fw-button.style-flat::before, .fw-button.style-outline::before "+"{background-color: "+Config.mainColor+"}",style=document.createElement("style");if(style.styleSheet){style.styleSheet.cssText=css}else{style.appendChild(document.createTextNode(css))}d=document.createElement("div");d.id="colorfix";d.appendChild(style);document.getElementsByTagName("head")[0].appendChild(d)}}
"use strict";/**
 * Global framework configuration class
 */class Config{/**
	 * Framework version property
	 */static get FW_VERSION(){return"1.0"}/**
	 * Initialize static properties
	 * @returns {void}
	 */static _init(){Config.mainColor="#009999";/**
		 * Toggle boolean for global unfocus service (see UnFocusService class)
		 * @type {boolean}
		 */Config.unfocusEnabled=true}/**
	 * Getter of main accent color from framework skin
	 */static get mainColor(){if(localStorage.fw_main_color)return localStorage.fw_main_color;return Config._mainColor}/**
	 * Get default main color (ignore settings override)
	 */static get defaultColor(){return Config._mainColor}/**
	 * Setter of main accent color from framework skin
	 */static set mainColor(c){Config._mainColor=c;ColorFix.execute()}}
"use strict";/**
 * This service automaticly removes focus after item click to remove click highlight.
 * @deprecated Didn't work. Will be removed!
 */class UnFocusService{/**
	 * Do unFocus on block
	 * @param {HTMLElement} block Block to execute
	 */static _exec(block){if(!Config.unfocusEnabled)return false;block.blur()}/**
	 * Register unFocus listener to element
	 * @param {HTMLElement} block Element to register
	 */static add(block){block.addEventListener("click",function(){UnFocusService._exec(block)})}}
"use strict";/**
 * Alert dialog
 *
 * This class can be used to create simple message alert dialog.
 * Example:
 * ```js
 * new Alert().setMessage("Hello, world!").show();
 * ```
 */class Alert{/**
     * Set message title
     * @param t title string
     * @returns this alert dialog
     */setTitle(t){/**
         * Message title
         */this._title=t;return this}/**
     * Set message content
     * @param m message text
     * @returns this alert dialog
     */setMessage(m){/**
         * Message text
         */this._message=m;return this}/**
     * Set on button click listener
     * @param c function to execute
     * @returns this alert dialog
     */setOnClickListener(c){/**
         * CLick listener
         */this._click=c;return this}/**
     * Set on dismiss listener
     * @param c function to execute
     * @returns this alert dialog
     */setOnCancelListener(c){/**
         * On dismiss listener
         */this._oncancel=c;return this}/**
     * Show this dialog
     */show(){var c=this;var d=new Dialog().setMessage(this._message).setTitle(this._title).setOnCancelListener(this._oncancel).addButton(new Button().setText("Ok").setOnClickListener(function(){d.hide();c._click()})).show()}}
"use strict";class Confirm{constructor(){this.okbtn="Ok";this.cancelbtn="Cancel"}setPositiveButtonText(t){this.okbtn=t;return this}setNegativeButtonText(t){this.cancelbtn=t;return this}setTitle(t){this.title=t;return this}setMessage(m){this.message=m;return this}setOnConfirmListener(c){this.click=c;return this}show(){var c=this;var d=new Dialog().setMessage(this.message).setTitle(this.title).setOnCancelListener(this.oncancel).addButton(new Button().setText(this.cancelbtn).setOnClickListener(function(){d.hide(true)})).addButton(new Button().setText(this.okbtn).setOnClickListener(function(){d.hide();c.click()})).show()}setOnCancelListener(c){this.oncancel=c;return this}}
"use strict";class Dialog{constructor(){this.buttons=[];this.views=[];this.title="";this.message=""}setTitle(t){this.title=t;return this}setMessage(m){this.message=m;return this}addButton(b){if(!b.IS_VIEW)return false;this.buttons[this.buttons.length]=b;return this}appendView(v){if(!v.IS_VIEW)return false;this.views[this.views.length]=v;return this}show(){if(this.shown)return Log.w("FWDialog","Dialog can't be shown repeatedly! Create new instance of class and then show it!");var m=new ModalWindow().setOnCancelListener(this.oncancel),t=Utils.inflate({type:"div",class:"textbox"});m.appendView(t);if(this.title)t.appendView(Utils.inflate({type:"header",class:"title",inner:this.title}));if(this.message)t.appendView(Utils.inflate({type:"div",class:"message",inner:this.message}));for(var a in this.views)m.appendView(this.views[a]);var btns=Utils.inflate({type:"div",class:"buttons"});for(var a in this.buttons)btns.appendChild(this.buttons[a].getBlock());m.appendView(btns);this.shown=true;this.modal=m;m.show();return this}hide(c){this.modal.hide(c)}setOnCancelListener(c){this.oncancel=c;return this}}
"use strict";/**
 * Screen part
 */class Fragment{// Can be used as view
get IS_VIEW(){return true}/**
	 * Default constructor for Fragment
	 * @param {*} data Anything taht you want give for `onCreate` method
	 */constructor(data){var t=this;this.onInit();/**
		 * Constructor data backup
		 */this._bundle=data;/**
		 * Fragment root block
		 * @type {HTMLElement}
		 */this._activity_root=Utils.inflate({type:"div",class:"fragment"});/**
		 * Callback object
		 */this._callback={}}/**
	 * Remove all actions from action bar
	 */wipeActions(){try{this._callback.wipeActions()}catch(e){console.warn("Callback can't wipe actions")}}/**
	 * Add action to activity topbar.
	 * @param {MenuItem} item Item to add
	 */addAction(item){try{this._callback.addAction(item)}catch(e){console.warn("Callback can't add actions")}}/**
	 * Use item as screen home action.
	 * @param {MenuItem} item Item
	 */setHomeAction(item){try{this._callback.setHomeAction(item)}catch(e){console.warn("Callback can't set home action")}}/**
	 * Enable back button as home action.
	 */setHomeAsUpAction(){try{this._callback.setHomeAsUpAction()}catch(e){console.warn("Callback can't set home action as home")}}/**
	 * Set screen title in action bar
	 * @param {string} title Title
	 */setTitle(title){try{this._callback.setTitle(title)}catch(e){console.warn("Callback can't set title")}}/**
	 * Add automatic call to `onUpdate` in interval
	 * 
	 * @todo Remove old timer before install new
	 * @param {number} timer Refresh time in ms
	 */doAutoUpdate(timer){let c=this;c._refresh_timer=setInterval(function(){c.onUpdate()},timer)}/**
	 * Append view to screen.
	 * 
	 * If `view.IS_FIXED_VIEW == true`, view will be added to callback screen
	 * 
	 * @param {View} view View to append
	 */appendView(view){if(!view.IS_VIEW)return false;if(view.IS_FIXED_VIEW)try{this._callback.appendView(view)}catch(e){console.warn("Callback can't add view")}else this._activity_root.appendChild(view.getBlock())}/**
	 * Remove all activity contents, except config and fixed views
	 */wipeContents(){this._activity_root.innerHTML=""}// Events
/**
	 * Event listener, calls on fragment building
	 * @param {*} data User-rpovided data from constructor
	 */onCreate(data){Log.w("Screen","onCreate is not overriden!")}/**
	 * Event listener, calls on fragment refresh or manually
	 */onUpdate(){}/**
	 * Build fragment and return root block
	 */getBlock(){this.onCreate(this._bundle);this.onUpdate();return this._activity_root}}
"use strict";/**
 * Transparent overlay to lock touch (mouse) input.
 */class InputLock{/**
	 * Default contructor
	 */constructor(){this.blk=Utils.inflate({type:"div",class:"fw-inputlock"})}/**
	 * Enable this overlay
	 */enable(){document.body.appendChild(this.blk)}/**
	 * Remove this overlay
	 */disable(){this.blk.remove()}}
"use strict";class ModalWindow{constructor(){var ctx=this;this.blk=Utils.inflate({type:"div",class:"fw-dialog",childs:{container:{type:"div",class:"container"}}});this.blk.onclick=function(){ctx.hide(true);// Cancel dialog!
};this.blk.container.onclick=function(e){e.stopPropagation()}}appendView(v){if(!v.IS_VIEW)return Log.w("ModalWindow","not a view!");this.blk.container.appendChild(v.getBlock())}setOnCancelListener(c){this.oncancel=c;return this}show(){var blk=this.blk;document.body.appendChild(blk);Utils.timer(50).then(function(){blk.style.opacity=1})}hide(cancel){let blk=this.blk;if(cancel&&this.oncancel)this.oncancel();blk.style.opacity=0;Utils.timer(450).then(function(){blk.remove()})}}
"use strict";/**
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
 */class Screen{/**
	 * Root scren mode. This mode will disable open/close animations.
	 * See `Screen.setMode(mode)`.
	 * @deprecated use mods!
	 */static get MODE_ROOT(){return 1}/**
	 * Default screen mode. See `Screen.setMode(mode)`.
	 * @deprecated use mods!
	 */static get MODE_DEFAULT(){return 0}/**
	 * Fade in/out duration
	 * @deprecated Will be moved to Config
	 */static get FADE_DURATION(){return 350}/**
	 * Actionbar scroll mode: hide on scroll.
	 * See `Screen.setScrollMode(mode)`.
	 */static get AB_MODE_HIDE(){return 1}/**
	 * Actionbar scroll mode: do not hide on scroll.
	 * See `Screen.setScrollMode(mode)`.
	 */static get AB_MODE_NONE(){return 0}/**
	 * Basic screen layout
	 */static get LAYOUT(){return{class:"fw-screen",type:"div",childs:{root:{type:"div",class:"fw-root-container",childs:{topbar:{type:"div",class:"fw-topbar",childs:{container:{type:"div",class:"container",childs:{z_home:{type:"div",class:"zone-home"},z_title:{type:"div",class:"zone-title"},z_right:{type:"div",class:"zone-left"}}}}},contents:{type:"div",class:"box-contents",childs:{tbh_fixed:{type:"div",class:"fw-topbar-holder"},holder:{type:"div",class:"holder",childs:{tbh_scroll:{type:"div",class:"fw-topbar-holder"},container:{type:"div",class:"container"}}}}}}}}}}/**
	 * Default constructor for Screen
	 * @param {*} data Anything taht you want give for `onCreate` method
	 */constructor(data){var t=this;this.onInit();/**
		 * Current activity mode. See `Screen.setMode(mode)`.
		 * @type {number}
		 */this._activity_mode=0;/**
		 * SetInterval return code for timer reset
		 */this._refresh_timer=false;/**
		 * Constructor data backup
		 */this._bundle=data;/**
		 * Activity root block
		 * @type {HTMLElement}
		 */this._activity_root=Utils.inflate(Screen.LAYOUT);/**
		 * Activity actionbar root block
		 * @type {HTMLElement}
		 */this._activity_ab_root=this._activity_root.root.topbar;/**
		 * Symlink to activity contents
		 * @type {HTMLElement}
		 */this._activity_contents=this._activity_root.root.contents.holder;/**
		 * Action bar title
		 * @type {string}
		 */this._ab_title="";/**
		 * Right zone action bar items
		 * @type {MenuItem[]}
		 */this._ab_right=[];/**
		 * Current action bar scroll mode.
		 * See `Screen.setScrollMode(mode)`
		 */this._ab_scrollmod=0;/** 
		 * Is screen dismiss allowed?
		 */this._allow_dismiss=true;this._activity_contents.addEventListener("scroll",function(){t._ab_scrolltrg()});this.initScrollMode()}/**
	 * Set action bar behavior on page scroll.
	 * 
	 * Use `Screen.AB_MODE_*` constants to provide mode.
	 * Default mode is `AB_MODE_NONE`.
	 * 
	 * @param {number} m Scrool mode.
	 */setScrollMode(m){this._ab_scrollmod=m;this.initScrollMode()}/**
	 * Initialize selected scroll mode
	 */initScrollMode(){/**
		 * Previout scroll offset
		 * @type {number}
		 */this._ab_scm_prev_scy=this.getScrollerBlock().scrollTop;if(this._ab_scrollmod==Screen.AB_MODE_HIDE){// Use dynamic holder
this._activity_root.root.contents.tbh_fixed.classList.add("hide");this._activity_root.root.contents.holder.tbh_scroll.classList.remove("hide")}else{// Use fixed holder
this._activity_root.root.contents.tbh_fixed.classList.remove("hide");this._activity_root.root.contents.holder.tbh_scroll.classList.add("hide")}this._ab_scrolltrg()}/**
	 * Calls on scroll to provide ActionBar scroll mode
	 */_ab_scrolltrg(){var df=this.getScrollerBlock().scrollTop-this._ab_scm_prev_scy;this._activity_ab_root.className="fw-topbar";if(this.getScrollerBlock().scrollTop>16)this._activity_ab_root.className+=" mode-elevate";if(df>0&&this._ab_scrollmod==Screen.AB_MODE_HIDE){// Down. Hide.
this._activity_ab_root.className+=" hide"}this._ab_scm_prev_scy=this.getScrollerBlock().scrollTop}/**
	 * Remove all actions from action bar
	 */wipeActions(){this._ab_right=[];this._rebuildActionbar()}/**
	 * Add action to activity topbar.
	 * @param {MenuItem} item Item to add
	 */addAction(item){this._ab_right[this._ab_right.length]=item;this._rebuildActionbar()}/**
	 * Use item as screen home action.
	 * @param {MenuItem} item Item
	 */setHomeAction(item){this._activity_ab_root.container.z_home.innerHTML="";if(!item)return;let b=item.inflate();this._activity_ab_root.container.z_home.appendChild(b)}/**
	 * Enable back button as home action.
	 */setHomeAsUpAction(){let c=this;this.setHomeAction(new MenuItem("Back","arrow_back",function(){c.finish()}))}/**
	 * Set screen title in action bar
	 * @param {string} title Title
	 */setTitle(title){this._ab_title=title;this._rebuildActionbar()}/**
	 * Re-generate action bar block contents
	 */_rebuildActionbar(){let root=this._activity_ab_root;// title
root.container.z_title.innerHTML=this._ab_title;// Rightframe
root.container.z_right.innerHTML="";for(var a in this._ab_right)root.container.z_right.appendChild(this._ab_right[a].inflate())}/**
	 * Add automatic call to `onUpdate` in interval
	 * 
	 * @todo Remove old timer before install new
	 * @param {number} timer Refresh time in ms
	 */doAutoUpdate(timer){let c=this;c._refresh_timer=setInterval(function(){c.onUpdate()},timer)}/**
	 * Append view to screen.
	 * 
	 * If `view.IS_FIXED_VIEW == true`, view will be added to relative zone.
	 * 
	 * @param {View} view View to append
	 */appendView(view){if(!view.IS_VIEW)return false;if(view.IS_FIXED_VIEW)this._activity_root.root.appendChild(view.getBlock());else this._activity_contents.container.appendChild(view.getBlock())}/**
	 * Set activity mode.
	 * 
	 * Use `Screen.MODE_*` constants to set mode.
	 * Default mode is `MODE_DEFAULT` (0).
	 * 
	 * @param {number} mode Activity mode ID
	 * @deprecated use markAsRoot() or addMod()
	 */setMode(mode){console.warn("setMode(int mode) is deprecated and will be removed. Use markAsRoot() and addMod() instance of this.");this.markAsRoot()}/**
	 * Install mod to this screen
	 * 
	 * Mods are classes with name `*ScreenMod`. For example:
	 * ```js
	 * this.addMod(new NoAnimationScreenMod());
	 * ```
	 * This will disable screen open/close animations
	 */addMod(mod){mod.install(this)}/**
	 * Mark screen as root.
	 *
	 * Root screen can't be dismissed, don't use animations
	 * and etc.
	 */markAsRoot(){this.addMod(new NoAnimationScreenMod);this.allowDismiss(false)}/**
	 * Allow window close by dismiss events
	 * Examples: outside click
	 */allowDismiss(isAllowed){this._allow_dismiss=isAllowed}/**
	 * Dismiss window, if allowed
	 */dismiss(){if(!this._allow_dismiss)return;this.finish()}/**
	 * Returns scrolling block from activity.
	 * Used to setup onScroll listeners.
	 * 
	 * @returns {HTMLElement}
	 */getScrollerBlock(){return this._activity_contents}/**
	 * Remove all activity contents, except config and fixed views
	 */wipeContents(){this._activity_contents.container.innerHTML=""}// Events
/**
	 * Event listener, calls on screen start
	 * @param {*} data User-rpovided data from constructor
	 */onCreate(data){Log.w("Screen","onCreate is not overriden!")}/**
	 * Event listener, calls on screen refresh or manually
	 */onUpdate(){}/**
	 * Event listener, calls before screen construct
	 */onInit(){}/**
	 * Event listener, calls on screen destroy. Must return a boolean.
	 * 
	 * If returns `false`, screen finish will be cancelled.
	 * 
	 * @returns {boolean} is finish allowed?
	 */onFinish(){// Always allow
return true}// Actions
/**
	 * Do screen destory
	 */finish(){let context=this,il=new InputLock;if(this.onFinish()){// Finish allowed. Breaking...
clearInterval(context._refresh_timer);il.enable();Utils.timer(50).then(function(){context._activity_root.classList.remove("show");return Utils.timer(Screen.FADE_DURATION)}).then(function(){il.disable();context._activity_root.remove()})}}/**
	 * Do activity build and display
	 */start(){let context=this,il=new InputLock;this.onCreate(this._bundle);this.onUpdate();il.enable();document.body.appendChild(this._activity_root);Utils.timer(50).then(function(){context._activity_root.classList.add("show");return Utils.timer(Screen.FADE_DURATION)}).then(function(){il.disable()})}}
"use strict";/**
 * Display loading overlay
 */class WaitScreen{/**
	 * Default contructor
	 */constructor(){/**
		 * Root container
		 * @type {HTMLElement}
		 */this.block=Utils.inflate({type:"div",class:"fw-spinactivity",childs:{spinner:{type:"div",class:"fw-spinner",inner:"Please wait..."}}})}/**
	 * Show this overlay
	 */show(){document.body.appendChild(this.block)}/**
	 * Hide this overlay
	 */hide(){this.block.remove()}}
"use strict";// All other classes are automaticly imported by Babel
/**
 * Framework initialization class. Technique usage only!
 */class FWInit{/**
     * Initialize framework.
     */static init(){if(FWInit.asdzx_init_complete)return Log.w("Init","Secondary init call is blocked!");Config._init();FWInit.cfgInit();FWInit.asdzx_init_complete=true}/**
     * Parse local framework settings
     */static cfgInit(){if(localStorage.fw_cfg_font_size)document.documentElement.style.fontSize=localStorage.fw_cfg_font_size+"rem";localStorage.fw_cfg_nightmode?document.documentElement.classList.add("darktheme"):document.documentElement.classList.remove("darktheme")}}FWInit.init();
"use strict";/**
 * Expandable layout view
 * 
 * This layout contain some columns with width diapasones.
 * If screen width is smaller than sum of minimal widths of all columns,
 * it will be shown as list.
 *
 * Example:
 * Layout with two columns: left menu and main content
 * Menu width is 360px. Minimal content width is
 * 480px. If screen is smaller then 840px (360+480), columns
 * will be collspased. If bigger, will be expanded and shown as columns
 */class ExpandableLayout{get IS_VIEW(){return true}constructor(){/**
		 * Layout root view
		 */this._root=Utils.inflate({type:"div",class:"fw-layout-expandable"});/**
		 * Layout columns array
		 */this._columns=[];/**
		 * Layout clumns min widths array
		 */this._columnMinWidths=[];/**
		 * Layout clumns max widths array
		 */this._columnMaxWidths=[];/**
		 * Is expanded now?
		 */this.isExpanded=false}/**
	 * Remove window resize listener
	 */_unregister(){window.removeEventListener("resize",this._eventListener)}/**
	 * Create and apply window resize listener
	 */_register(){var ctx=this;/**
		 * On resize event listener method. Must be saved for unregister
		 * function
		 */ctx._eventListener=function(){if(!ctx._root.isConnected)ctx._unregister();else ctx._updateWidth()};window.addEventListener("resize",this._eventListener)}/**
	 * Check new window width and update layout
	 */_updateWidth(){var windowWidth=document.body.getBoundingClientRect().width,minExpandWidth=this._getExpandWidth(),maxExpandWidth=this._getMaxExpandWidth();if(windowWidth>=minExpandWidth){// Expand
this._root.classList.add("expanded");if(windowWidth>maxExpandWidth){this._root.style.maxWidth=maxExpandWidth+"px"}for(var a in this._columns){var cv=this._columns[a];cv.style.minWidth=this._columnMinWidths[a]+"px";cv.style.maxWidth=this._columnMaxWidths[a]+"px"}}else{// Collspace
this._root.classList.remove("expanded");this._root.style.maxWidth=null;for(var a in this._columns){var cv=this._columns[a];cv.style.minWidth=null;cv.style.maxWidth=null}}}/**
	 * Calculate minimal expand width
	 * @returns width in px
	 */_getExpandWidth(){var width=0;for(var a in this._columnMinWidths)width+=this._columnMinWidths[a];return width}/**
	 * Calculate maximal expand width
	 * @returns width in px
	 */_getMaxExpandWidth(){var width=0;for(var a in this._columnMaxWidths)width+=this._columnMaxWidths[a];return width}/**
	 * Get root view block
	 */getBlock(){var ctx=this;this._register();ctx._updateWidth();return this._root}/**
	  * Add new column
	  *
	  * @param minWidth minimal column width (integer)
	  * @param maxWidth maximal column width (integer)
	  * @returns new view
	  */addColumn(minWidth,maxWidth){if(!maxWidth)maxWidth=minWidth;if(!minWidth)minWidth=200;var id=this._columns.length,colRoot=Utils.inflate({type:"div"});this._columns[id]=colRoot;this._columnMaxWidths[id]=maxWidth;this._columnMinWidths[id]=minWidth;this._root.appendView(colRoot);this._updateWidth();return colRoot}/**
	   * Get column root by id
	   *
	   * @returns Column view
	   */getColumnRoot(id){return this._columns[id]}}
"use strict";class LeftSideScreenMod{install(screen){console.warn("LeftSideScreenMod is experimental!");screen._activity_root.classList.add("sidescreen-left");// Install event listeners
screen._activity_root.addEventListener("click",function(){screen.dismiss()});screen._activity_root.root.addEventListener("click",function(e){e.preventDefault();e.stopPropagation()})}}
"use strict";class NoAnimationScreenMod{install(screen){screen._activity_root.classList.add("noanim")}}
"use strict";class RightSideScreenMod{install(screen){console.warn("RightSideScreenMod is experimental!");screen._activity_root.classList.add("sidescreen-right");// Install event listeners
screen._activity_root.addEventListener("click",function(){screen.dismiss()});screen._activity_root.root.addEventListener("click",function(e){e.preventDefault();e.stopPropagation()})}}
"use strict";class WideScreenMod{install(screen){screen._activity_root.classList.add("widescreen")}}
"use strict";/**
 * Logs provider class
 */class Log{/**
	 * Send debug log
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */static d(tag,data){Log.journal+="<div>["+tag+"] "+data+"</div>";//		if(!AppConfig.enableDebug) return;
console.log("["+tag+"]",data)}/**
	 * Send info-level log
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */static i(tag,data){Log.journal+="<div style='color:#00a'>["+tag+"] "+data+"</div>";console.info("["+tag+"]",data)}/**
	 * Send warring
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */static w(tag,data){Log.journal+="<div style='color:#aa0'>["+tag+"] "+data+"</div>";console.warn("["+tag+"]",data)}/**
	 * Send error
	 * @param {string} tag Class name or other identifer
	 * @param {*} data Data to logging
	 */static e(tag,data){Log.journal+="<div style='color:#f00'>["+tag+"] "+data+"</div>";console.error("["+tag+"]",data)}}Log.journal="";
"use strict";/**
 * This class provide items for actionbar
 */class MenuItem{/**
	 * Create new MenuItem
	 * 
	 * @param {string} title Accesibility name for icon
	 * @param {string} icon Icon name (from material.io/icons palette)
	 * @param {function} click On click function
	 */constructor(title,icon,click){/**
		 * Item acessibility title.
		 * @type {string}
		 */this.title=title;/**
		 * Item icon, by material.io/icons
		 * @type {string}
		 */this.icon=icon;/**
		 * Item click listener
		 * @type {function}
		 */this.click=click}/**
	 * Built and returns item
	 */inflate(){let i=new IconView(this.icon).getBlock();let b=document.createElement("a");b.className="ab-btn";b.appendChild(i);b.title=this.title;b.onclick=this.click;return b}}
"use strict";/**
 * Framework utilities.
 */class Utils{/**
	 * Generate HTMLElement by user-provide schema
	 * @param {object} data Structure for block generation
	 * @returns {HTMLElement}
	 */static inflate(data){var block=document.createElement(data.type);if(data.class)block.className=data.class;if(data.id)block.id=data.id;if(data.inner)block.innerHTML=data.inner;if(data.height)block.style.height=data.height;if(data.color)block.style.color=data.color;if(data.childs)for(var a in data.childs)block[a]=block.appendChild(Utils.inflate(data.childs[a]));// Block-view hook
block.IS_VIEW=true;block.getBlock=function(){return this};block.appendView=function(v){if(!v.IS_VIEW)Log.w("HTMLInflatorView","Not a view!");this.appendChild(v.getBlock());return this};// Install addons
Utils.addLongTouchEvent(block);return block}/**
	 * Create promise with timeout
	 * @param {number} time Wait time in ms
	 */static timer(time){return new Promise(function(resolve){setTimeout(function(){resolve()},time)})}/**
	 * Add LongTouch listener to block
	 * 
	 * @param {HTMLElement} block Block to use
	 */static addLongTouchEvent(block){var timer=-1;var supportsPassive=false;try{var opts=Object.defineProperty({},"passive",{get:function get(){supportsPassive=true}});window.addEventListener("testPassive",null,opts);window.removeEventListener("testPassive",null,opts)}catch(e){}block.onlongtap=null;block.addEventListener("touchstart",function(e){if(!block.onlongtap)return true;timer=setTimeout(function(e){if(block.onlongtap)block.onlongtap(e)},500);return!block.onlongtap},supportsPassive?{passive:true}:false);block.addEventListener("touchmove",function(){if(timer)clearTimeout(timer)},supportsPassive?{passive:true}:false);block.addEventListener("touchend",function(){if(timer)clearTimeout(timer);return!block.onlongtap});block.oncontextmenu=function(e){if(block.onlongtap)block.onlongtap(e);return!block.onlongtap}}}
"use strict";/**
 * Simple icon widget
 */class IconView{get IS_VIEW(){return true}/**
	 * Constuct new icon view widget
	 * @param {string} icon Icon identifer from material design icon font
	 */constructor(icon){this.iconName=icon}/**
	 * Disable icon coloring. Useful if you need another color.
	 * @returns {IconView} callback
	 */disableColor(){this.nocolor=true;return this}/**
	 * Create and returns IconView block.
	 * @returns {HTMLElement}
	 */getBlock(){let i=document.createElement("i");i.className="material-icons";if(!this.nocolor)i.style.color=Config.mainColor;i.innerHTML=this.iconName;return i}}
"use strict";/**
 * Row widget, great way to provide item in list
 */class RowView{get IS_VIEW(){return true}/**
	 * Constructor :-)
	 */constructor(){this._title="";this._icon="";this._subtitle="";this._click=null;this._longtap=null}/**
	 * Set item title.
	 * 
	 * @param {string} title Title value
	 * @returns {RowView} self-return
	 */setTitle(title){this._title=title;return this}/**
	 * Set item summary, second level information
	 * 
	 * @param {string} title Summary value
	 * @returns {RowView} self-return
	 */setSummary(title){this._subtitle=title;return this}/**
	 * Set item icon.
	 * 
	 * @param {string} icon Icon name from material.io/icons
	 * @returns {RowView} self-return
	 */setIcon(icon){this._icon=icon;return this}/**
	 * Add secondary action.
	 * 
	 * @param {string} title Accesibility name
	 * @param {string} icon Icon name from material.io/icons
	 * @param {function} click On click function
	 * @returns {RowView} self-return
	 */setAction(title,icon,click){this._action={t:title,i:icon,c:click};return this}/**
	 * Set on click function
	 * 
	 * @param {function} c Function
	 * @returns {RowView} self-return
	 */setOnClickListener(c){this._click=c;return this}/**
	 * Set long touch event listner
	 * 
	 * @param {function} c Function
	 * @returns {RowView} self-return
	 */setOnLongTouchListener(c){this._longtap=c;return this}/**
	 * Build and get block!
	 */getBlock(){let b=Utils.inflate({type:"div",class:"fw-rowview",childs:{box_a:{type:"div"},box_b:{type:"div",class:"text"},box_c:{type:"div"}}}),ctx=this;UnFocusService.add(b);b.onclick=this._click;b.onlongtap=this._longtap;if(this._title)b.box_b.appendChild(Utils.inflate({type:"div",class:"title",inner:this._title}));if(this._subtitle){b.classList.add("twoline");b.box_b.appendChild(Utils.inflate({type:"div",class:"summary",inner:this._subtitle}))}if(this._icon){b.box_a.className="icon";b.box_a.appendView(new IconView(this._icon))}if(this._action){b.box_c.className="action";b.box_c.appendView(new IconView(this._action.i).disableColor());b.box_c.onclick=function(event){event.preventDefault();event.stopPropagation();ctx._action.c()};b.box_c.title=this._action.t}return b}}
"use strict";/**
 * Expandable row view.
 */class SpoilerView extends RowView{/**
	 * Default constructor
	 */constructor(){super();var ctx=this;this.contents=Utils.inflate({type:"div"});this.contents.style.display="none";this._icon="keyboard_arrow_down";this._click=function(){ctx.toggle()}}getBlock(){this.row=super.getBlock();var b=Utils.inflate({type:"div"});b.appendChild(this.row);b.appendChild(this.contents);return b}/**
	 * Append view to expandable container
	 * @param {View} v view to append
	 */appendView(v){return this.contents.appendView(v)}/**
	 * Toggle contents visiblilty
	 */toggle(){if(this.contents.style.display=="none"){// Show!
this.contents.style.display="";this._icon="keyboard_arrow_up";var b=super.getBlock();this.row=this.row.replaceWith(b);this.row=b}else{// Hide!
this.contents.style.display="none";this._icon="keyboard_arrow_down";var b=super.getBlock();this.row=this.row.replaceWith(b);this.row=b}}}
"use strict";/**
 * Simple text display widget.
 * 
 * @todo Add configuration methods
 */class TextView{get IS_VIEW(){return true}/**
	 * Build new view
	 * @param {string} style TextView style name
	 * @param {string} value Text to display
	 */constructor(style,value){this.blk=Utils.inflate({type:"div",inner:value,class:"fw-textview-style-"+style})}/**
	 * Returns block
	 */getBlock(){return this.blk}/**
	 * Set new text
	 */setText(text){this.blk.innerHTML=text}}
"use strict";/**
 * Spin animation activity lock view.
 */class WaitlockView{get IS_VIEW(){return true}get IS_FIXED_VIEW(){return true}/**
	 * Default constructor.
	 * @param {Screen} ctx Context screen
	 */constructor(ctx){this.ctx=ctx;this.block=Utils.inflate({type:"div",class:"fw-waitlock-view"});this.block.appendView(new Spinner)}getBlock(){return this.block}/**
	 * Show widget
	 */show(){this.ctx._activity_contents.scrollTop=0;this.block.classList.add("show")}/**
	 * Hide widget
	 */hide(){this.block.classList.remove("show")}}
"use strict";/**
 * Provides simple button widget
 */class Button{get IS_VIEW(){return true}/**
	 * Flat (non-filled) button style id
	 */static get STYLE_FLAT(){return"style-flat"}/**
	 * Contained (filled) button style id
	 */static get STYLE_CONTAINED(){return"style-contained"}/**
	 * Outlined button style id
	 */static get STYLE_OUTLINE(){return"style-outline"}/**
	 * Returns default button style
	 */_getDefaultStyle(){return Button.STYLE_FLAT}/**
	 * Default constructor
	 */constructor(){this.mBlock=Utils.inflate({type:"button",class:"fw-button "+this._getDefaultStyle()});UnFocusService.add(this.mBlock);this.style=this._getDefaultStyle();this._reDecorate()}/**
	 * Re-install style-specific properties
	 */_reDecorate(){if(this.style==Button.STYLE_FLAT||this.style==Button.STYLE_OUTLINE){this.mBlock.style.backgroundColor="";this.mBlock.style.color=Config.mainColor;this.mBlock.style.borderColor=Config.mainColor}else if(this.style==Button.STYLE_CONTAINED){this.mBlock.style.backgroundColor=Config.mainColor;this.mBlock.style.color=null}else{Log.w("Button","Style "+this.style+" isn't defined. Can't provide decoration!")}}/**
	 * Returns button block
	 */getBlock(){return this.mBlock}/**
	 * Set text to display on button.
	 * 
	 * @param {string} value Text to display
	 * @returns {Button} self-return
	 */setText(value){this.mBlock.innerHTML=value;return this}/**
	 * Set on button click function
	 * 
	 * @param {function} fnc On click function
	 * @returns {Button} self-return
	 */setOnClickListener(fnc){this.mBlock.onclick=fnc;return this}/**
	 * Set button style. Use `Button.STYLE_*` constants.
	 * 
	 * @param {string} style Style id
	 * @returns {Button} self-return
	 */setStyle(style){this.mBlock.className="fw-button "+style;this.style=style;this._reDecorate();return this}}
"use strict";/**
 * Checkbox widget.
 *
 * Example:
 * ```js
 * new Checkbox().setTitle("Enable dark theme")
 *     .setChecked(true).setOnCheckedListener((isChecked) => {
 *	       localStorage.darkTheme = isChecked;
 * 	   })
 * ```
 */class Checkbox{get IS_VIEW(){return true}/**
	 * Default constructor
	 */constructor(){var ctx=this;this._root=Utils.inflate({type:"div",class:"fw-checkbox-view",childs:{cbIcon:{type:"i",class:"material-icons"},cbTitle:{type:"span",class:"label"}}});this._root.cbIcon.style.color=Config.mainColor;this._root.onclick=function(){ctx.setChecked(!ctx._isChecked)};this.setChecked(false)}/**
	 * Get view root block
	 */getBlock(){return this._root}/**
	 * Set checkbox checked state
	 * @param status Is checked now?
	 * @return this class
	 */setChecked(status){this._isChecked=status;if(status)this._root.cbIcon.innerHTML="check_box";else this._root.cbIcon.innerHTML="check_box_outline_blank";this._onCheckedStateChanged(this._isChecked);return this}/**
	 * Set checkbox title (label)
	 * @param title Checkbox label
	 * @return this class
	 */setTitle(title){this._root.cbTitle.innerHTML=title;return this}/**
	 * Set on checked state listener function
	 * @param fnc Callback function
	 * @return this class
	 */setOnCheckedListener(fnc){this._onCheckedStateChanged=fnc;return this}/**
	 * Is checkbox checked?
	 * @return true if checked
	 */isChecked(){return this._isChecked}_onCheckedStateChanged(){}}
"use strict";class FloatingActionButton{get IS_VIEW(){return true}get IS_FIXED_VIEW(){return true}static get MODE_DEFAULT(){return"fab-default"}static get MODE_SMALL(){return"fab-small"}static get MODE_EXPAND(){return"fab-expand"}static get MODE_HIDE(){return"fab-default hide"}constructor(){this.button=Utils.inflate({type:"div",class:"fw-fab "+FloatingActionButton.MODE_DEFAULT,childs:{icon:{type:"i",class:"material-icons"},textview:{type:"a",class:"fab-text"}}});this.button.style.backgroundColor=Config.mainColor}setIcon(icon){this.button.icon.innerHTML=icon;return this}setTitle(title){this.button.textview.innerHTML=title;return this}setMode(mode){this.button.className="fw-fab "+mode;return this}setOnClickListener(c){this.button.onclick=c;return this}attachScreen(screen,modea,modeb){var ctx=this,prev=screen._activity_root.scrollTop;ctx.setMode(modea);screen.getScrollerBlock().addEventListener("scroll",function(){var df=prev-this.scrollTop;ctx.setMode(df>0?modea:modeb);prev=this.scrollTop});return this}getBlock(){return this.button}}
"use strict";/**
 * Spin animation view widget
 */class Spinner{get IS_VIEW(){return true}constructor(){}getBlock(){var b=Utils.inflate({type:"div",class:"fw-spinner"});b.style.color=Config.mainColor;return b}}
"use strict";/**
 * SubHeader is view (widget) that provides list separator with title.
 */class SubHeader{get IS_VIEW(){return true}/**
	 * Constructor
	 * @param {string} text Header value
	 */constructor(text){this.text=text}/**
	 * Build and return HTMLElement
	 */getBlock(){var d=Utils.inflate({type:"div",class:"fw-subheader"});d.innerHTML=this.text;d.style.color=Config.mainColor;return d}}
"use strict";/**
 * Text input widget. Based on HTML Input.
 */class TextInput{get IS_VIEW(){return true}/**
	 * Default contructor
	 */constructor(){this.block=Utils.inflate({type:"div",class:"fw-textinput",childs:{titlebx:{type:"div",class:"title"},editor:{type:"input",class:"input"}}})}/**
	 * Mark input as readonly
	 */makeReadonly(){this.block.editor.setAttribute("readonly","true");this.block.classList.add("readonly");return this}/**
	 * Remove readonly mark
	 */unmakeReadonly(){this.block.editor.setAttribute("readonly","false");this.block.classList.remove("readonly");return this}/**
	 * Set placeholder text
	 * 
	 * @param {string} s Placeholder text
	 */setHolder(s){this.block.editor.placeholder=s;return this}/**
	 * Get block.
	 */getBlock(){return this.block}/**
	 * Get value of input
	 * @returns {string} value
	 */toString(){return this.block.editor.value}/**
	 * Set input type.
	 * 
	 * Use any HTML4-5 compitable input type as parameter.
	 * @param {string} type Input type
	 * @returns {TextInput} Callback
	 */setType(type){this.block.editor.type=type;return this}/**
	 * Set value to input
	 * 
	 * @param {string} value Value
	 */fromString(value){this.block.editor.value=value;return this}/**
	 * Set input title
	 * 
	 * @param {string} title Title
	 */setTitle(title){this.block.titlebx.innerHTML=title;return this}/**
	 * Remove block.
	 */remove(){this.block.remove()}}
"use strict";/**
 * Toolbar widget.
 */class Toolbar{get IS_VIEW(){return true}/**
	 * Default constuctor
	 */constructor(){this.block=Utils.inflate({type:"div",class:"fw-toolbar"})}getBlock(){return this.block}/**
	 * Remove all content from toolbar
	 */wipe(){this.block.innerHTML=""}/**
	 * Add new icon to toolbar
	 * 
	 * @param {string} title Title
	 * @param {string} icon Icon name by material.io/icons
	 * @param {function} click onclick function
	 */add(title,icon,click){var i=new IconView(icon).disableColor().getBlock();i.title=title;i.onclick=click;this.block.appendChild(i);return this}/**
	 * Add whitespace to toolbar
	 */addSeparator(){this.block.appendChild(Utils.inflate({type:"a"}));return this}}
"use strict";class BigTextInput extends TextInput{constructor(){super();this.block=Utils.inflate({type:"div",class:"fw-textinput",childs:{titlebx:{type:"div",class:"title"},editor:{type:"textarea",class:"input ta"}}});this.block.editor.onkeyup=function(){this.style.height="25px";this.style.height=this.scrollHeight+"px"}}getBlock(){var b=super.getBlock();Utils.timer(50).then(function(){b.editor.onkeyup()});return b}fromString(value){super.fromString(value);this.block.editor.onkeyup();return this}}
// /**
//  * Screen with bottom navigation on mobile (or left side for desktop)
//  */
// class BottomNavigationScreen extends Screen {
// 	/**
// 	 * Bottom navigation layout
// 	 */
// 	static get BN_LAYOUT() {return {type: "div", class: "fw-bns-root", contains: {
// 		fragmentHost: {type: "div", class: "fragment-host"},
// 		menuHost: {type: "div", class: "extended-menu", contains: {
// 			navTopBox: {type: "div"},
// 			desktopOnlyMenu: {type: "div", class: "fw-nav-menu desktop-menu"},
// 			extendedMenu: {type: "div", class: "fw-nav-menu"},
// 			navBottomBox: {type: "div"}
// 		}},
// 		bottomNav: {type: "div", class: "bottom-nav"}
// 	}}};
// 	/**
// 	 * Default constructor
// 	 */
// 	constructor() {
// 		super();
// 		/**
// 		 * Bottom nav icons limit
// 		 */
// 		this._bn_icons_limit = 4;
// 		/**
// 		 * Is extended menu icon visible?
// 		 */
// 		this._bn_show_extended = true;
// 		/**
// 		 * Current fragment
// 		 */
// 		this._current = -1;
// 		/**
// 		 * Page fragments array
// 		 */
// 		this._pages = [];
// 		/**
// 		 * Page fragment titles array
// 		 */
// 		this._page_titles = [];
// 		/**
// 		 * Page fragment icons array
// 		 */
// 		this._page_icons = [];
// 		/**
// 		 * Host root
// 		 */
// 		this._host = Utils.inflate(BottomNavigationScreen.BN_LAYOUT);
// 	}
// 	/**
// 	 * Do activity build and display
// 	 */
// 	 start() {
// 	 	// Create BottomNavigationScreen
// 	 	this.addMod(new WideScreenMod());
// 	 	// Do default screen creation
// 	 	super.start();
// 	 }
// 	 /**
// 	  * Add fragment to iterator
// 	  */
// 	addFragment(fragment, title, icon) {
// 		var id = this._pages.length;
// 		this._pages[id] = fragment;
// 		this._page_titles[id] = title;
// 		this._page_icons[id] = icon;
// 		if(this._current < 0) openFragment(0);
// 		_rebuildMenus();
// 		return id;
// 	 }
// 	 /**
// 	  * Navigate to fragment with id
// 	  */
// 	 openFragment(id) {
// 	 	this._current = id;
// 	 	this._host.fragmentHost.innerHTML = "";
// 	 	var fragment = new this._pages[id];
// 	 	this._host.fragmentHost.appendView(fragment);
// 	 	this._rebuildMenus();
// 	 }
// 	 /**
// 	  * Rebuild navigation menus
// 	  */
// 	 _rebuildMenus() {
// 	 }
// 	 /**
// 	  * Set bottom navigation icons limit.
// 	  * Default: 4
// 	  */
// 	 setIconsLimit(limit) {
// 	 	this._bn_icons_limit = limit;
// 	 	this._rebuildMenus();
// 	 }
// 	 /**
// 	  * Show extended menu icon in bottom navigation
// 	  * Default: true
// 	  */
// 	 setShowExtendedMenuIcon(bool) {
// 	 	this._bn_show_extended = bool;
// 	 	this._rebuildMenus();
// 	 }
// 	/**
// 	 * Append view to screen.
// 	 * Disabled for this screen type
// 	 */
// 	appendView() {
// 		console.warn("You can't directly append views to BottomNavigationScreen");
// 	}
// }
"use strict";
"use strict";/**
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
 */class FWSettingsScreen extends Screen{/**
     * Localization strings (default, english)
     */static get LOCALE(){return{cancel:"Cancel",ok:"Ok",apply:"Restart and apply",darkTheme:"Dark theme",bigMode:"Interface scale",restartRequired:"Application restart required to apply this changes.",titleColorAccent:"Color"}}/**
     * Colors palette
     */static get COLORS(){return["#0099FF","#0099CC","#FF9900","#DD0000","#FF0099","#FFCC00","#0033FF","#0011CC","#FF00DD","#333333","#555555","#AAAAAA"]}/**
     * OnCreate event override
     * @param {Object} loc Localization override
     */onCreate(loc){var locale=FWSettingsScreen.LOCALE;if(loc)for(var a in loc)locale[a]=loc[a];this.addMod(new RightSideScreenMod);this.setHomeAsUpAction();this.addAction(new MenuItem(locale.apply,"checkbox",()=>{location.reload()}));this.locale=locale;this.appendView(new Checkbox().setTitle(locale.darkTheme).setChecked(localStorage.fw_cfg_nightmode==="true").setOnCheckedListener(isChecked=>{localStorage.fw_cfg_nightmode=isChecked?"true":""}));this.appendView(new Checkbox().setTitle(locale.bigMode).setChecked(localStorage.fw_cfg_font_size==="1.25").setOnCheckedListener(isChecked=>{if(isChecked)localStorage.fw_cfg_font_size="1.25";else localStorage.fw_cfg_font_size=""}));this.appendView(new SubHeader(locale.titleColorAccent));this._palette=Utils.inflate({type:"div",class:"fw-palette"});this.appendView(this._palette);this.updatePalette()}updatePalette(){this._palette.innerHTML="";this.addColor(Config.defaultColor);for(var a in FWSettingsScreen.COLORS){this.addColor(FWSettingsScreen.COLORS[a])}}addColor(color){var ctx=this;var view=Utils.inflate({type:"div",class:"color "+(Config.mainColor==color?"selected":"")});view.onclick=function(){localStorage.fw_main_color=color;ctx.updatePalette()};view.style.backgroundColor=color;this._palette.appendView(view)}/**
     * OnUpdate event override
     */ // onUpdate() {
//     var loc = this.locale, ctx = this;
//     this.wipeContents();
//     this.appendView(new RowView().setTitle(localStorage.fw_cfg_nightmode ? loc.nightmode : loc.daymode)
//         .setIcon("wb_sunny").setSummary(loc.themeSummary).setOnClickListener(function(){
//             if(localStorage.fw_cfg_nightmode == "true") localStorage.fw_cfg_nightmode = "";
//             else localStorage.fw_cfg_nightmode = "true";
//             FWInit.cfgInit();
//         }));
//     if(!localStorage.fw_cfg_font_size) 
//         localStorage.fw_cfg_font_size = 1;
//     this.appendView(new RowView().setTitle(loc.fontSizeTitle)
//         .setIcon("format_size")
//         .setSummary(Math.round(localStorage.fw_cfg_font_size*100)+"% of default")
//         .setOnClickListener(function(){
//             var te = new TextInput().setTitle(loc.fontSizeTitle)
//                 .fromString(Math.round(localStorage.fw_cfg_font_size*100));
//             var d = new Dialog().appendView(te)
//                 .addButton(new Button().setText(loc.cancel).setOnClickListener(function(){
//                     d.hide();
//                 })).addButton(new Button().setText(loc.ok).setOnClickListener(function(){
//                     console.log(te.toString()/100);
//                     localStorage.fw_cfg_font_size = te.toString()/100;
//                     d.hide();
//                     ctx.onUpdate();
//                 })).show();
//         }));
//     this.appendView(new RowView().setTitle(loc.accentColorTitle)
//         .setIcon("palette")
//         .setSummary(localStorage.fw_main_color)
//         .setOnClickListener(function(){
//             var te = new TextInput().setTitle(loc.fontSizeTitle)
//                 .fromString(localStorage.fw_main_color);
//             var d = new Dialog().appendView(te)
//                 .addButton(new Button().setText(loc.cancel).setOnClickListener(function(){
//                     d.hide();
//                 })).addButton(new Button().setText(loc.ok).setOnClickListener(function(){
//                     localStorage.fw_main_color = te.toString();
//                     d.hide();
//                     ctx.onUpdate();
//                 })).show();
//         }));
//         this.appendView(new TextView("info", loc.reloadRequired));
// }
}
"use strict";/**
 * SlidingScreen - screen with multiple slides support.
 */class SlidingScreen extends Screen{/**
     * Default constructor (overrides `super(data)` constructor)
     * @param {*} data Data for onCreate event
     */constructor(data){super(data);/**
         * Root view of pager
         */this._ss_view=Utils.inflate({type:"div",class:"fw-pager-view",childs:{wrapper:{type:"div",class:"fw-pager-wrapper"}}});this._ss_view.IS_FIXED_VIEW=true;/**
         * Is swipe enabled
         * @type {boolean}
         */this._ss_swipeOn=true;/**
         * Pages array
         * @type {SlideView[]}
         */this._ss_pages=[];/**
         * Active screen id
         * @type {number}
         */this._ss_active=0;super.appendView(this._ss_view);this._ss_swipeinit()}/**
     * Append view locker method
     * @param {View} v view
     */appendView(view){if(!view.IS_VIEW)return false;if(view.IS_FIXED_VIEW)this._activity_root.root.appendChild(view.getBlock());else Log.e("SlidingScreen","Use getPage(page).appendView(view) instance of appendView!")}/**
     * Get page ID
     * @param {number} p Page ID
     */getPage(p){return this._ss_pages[p]}/**
     * Remove all pages!
     */wipe(){this._ss_pages=[];this._ss_view.wrapper.innerHTML=""}/**
     * Add new clear page
     */newPage(){var id=this._ss_pages.length,blk=Utils.inflate({type:"div",class:"fw-page",childs:{container:{type:"div",class:"container",childs:{filler:{type:"div",class:"filler"},contents:{type:"div",class:"page-contents"}}}}});blk.style.left=100*id+"%";this._ss_pages[id]=new SlideView(this,blk,id);this._ss_view.wrapper.appendView(blk);this._ss_cfgscroll(this._ss_active);this.initScrollMode();return this._ss_pages[id]}/**
     * Go to page
     * @param {number} p Page ID
     */openPage(p){let wrp=this._ss_view.wrapper,ctx=this;this._ss_active=p;wrp.style.transition="left 0.25s";Utils.timer(2).then(function(){wrp.style.left=-(100*p)+"%";return Utils.timer(240)}).then(function(){wrp.style.transition="";ctx._ss_cfgscroll(p);ctx.initScrollMode()}).catch(function(e){console.error(e)})}/**
     * Reconfigure page-scroll attachment
     * @param {number} p Page ID
     */_ss_cfgscroll(p){if(this.getPage(p))this._ss_scrl_blk=this.getPage(p).getBlock();for(var a in this._ss_pages)this._ss_pages[a].getBlock().scrollTop=0}/**
     * Override getScrollBlock method
     */getScrollerBlock(){if(!this._ss_scrl_blk)return super.getScrollerBlock();return this._ss_scrl_blk}/**
     * Go to page back
     */prevPage(){if(this._ss_active==0)return;this.openPage(this._ss_active-1)}/**
     * Go to page next
     */nextPage(){if(this._ss_active==this._ss_pages.length-1)return;this.openPage(this._ss_active+1)}/**
     * Set swipe mode enabled/disabled.
     * @param {boolean} bool Is swipe enabled?
     */setSwipeEnabled(bool){this._ss_swipeOn=bool}/**
     * Init swipe events
     */_ss_swipeinit(){var wrp=this._ss_view.wrapper,touchData={},context=this;wrp.ontouchstart=function(e){if(!context._ss_swipeOn)return;touchData.direction=null;touchData.startX=e.targetTouches[0].pageX;touchData.startY=e.targetTouches[0].pageY;touchData.startPos=this.getBoundingClientRect().left};wrp.ontouchmove=function(e){if(!context._ss_swipeOn)return;var rx=e.targetTouches[0].pageX-touchData.startX;var ry=e.targetTouches[0].pageY-touchData.startY;if(touchData.direction==null){if(rx>30||rx<-30)touchData.direction="h";else if(ry>30||ry<-30)touchData.direction="v"}if(touchData.direction=="h"){e.stopPropagation();e.preventDefault();this.style.left=touchData.startPos+rx+"px"}};wrp.ontouchend=function(e){if(!context._ss_swipeOn)return;if(touchData.direction!="h")return;console.log(e);var ex=e.changedTouches[0].pageX;var newPage=context._ss_active;if(ex<touchData.startX-75)newPage=context._ss_active+1;else if(ex>touchData.startX+75)newPage=context._ss_active-1;if(newPage==-1)newPage=0;else if(newPage>context._ss_pages.length-1)newPage=context._ss_pages.length-1;context.openPage(newPage)}}}/**
 * Slide view widget
 */class SlideView{get IS_VIEW(){return true}/**
     * Default constructor
     * 
     * @param {SlidingScreen} context Context screen
     * @param {HTMLElement} block Page root block
     * @param {number} id Page ID
     */constructor(context,block,id){this.ctx=context;this.block=block;this.id=id;this.tb=new Toolbar;block.appendView(this.tb);block.addEventListener("scroll",function(){if(context._ss_active==id)context._ab_scrolltrg()});this.tb.add("Back","arrow_back",function(){context.prevPage()});this.tb.add("Next","arrow_forward",function(){context.nextPage()})}/**
     * Append view to page
     * @param {View} v View
     */appendView(v){this.block.container.appendView(v)}/**
     * Return page root block
     */getBlock(){return this.block}/**
     * Return page toolbar (at bottom)
     */getToolbar(){return this.tb}/**
     * Returns page ID
     */getId(){return this.id}/**
     * Go to this page
     */open(){this.ctx.openPage(this.id)}}
"use strict";class TestScreen extends Screen{onCreate(){var wl=new WaitlockView(this),ctx=this;this.setHomeAsUpAction();this.addMod(new WideScreenMod);// Expandable layout
var exp=new ExpandableLayout,c1=exp.addColumn(360,400),c2=exp.addColumn(360,400);this.appendView(exp);// MAIN
c1.appendView(new SubHeader("Tests"));c1.appendView(new RowView().setTitle("Widgets test page").setOnClickListener(function(){new TestScreen2().start()}));c1.appendView(new RowView().setTitle("SlidingScreen demo").setOnClickListener(function(){new TestScreen3().start()}));c1.appendView(new RowView().setTitle("Framework settings screen").setOnClickListener(function(){new FWSettingsScreen().start()}));// FAB
c1.appendView(new SubHeader("Floating action button"));var fab=new FloatingActionButton().setIcon("star").setTitle("Star");c1.appendView(fab);c1.appendView(new RowView().setTitle("Default fab mode").setOnClickListener(function(){fab.setMode(FloatingActionButton.MODE_DEFAULT)}));c1.appendView(new RowView().setTitle("Small fab mode").setOnClickListener(function(){fab.setMode(FloatingActionButton.MODE_SMALL)}));c1.appendView(new RowView().setTitle("Expanded fab mode").setOnClickListener(function(){fab.setMode(FloatingActionButton.MODE_EXPAND)}));c1.appendView(new RowView().setTitle("Scroll listen, expanding").setOnClickListener(function(){fab.attachScreen(ctx,FloatingActionButton.MODE_EXPAND,FloatingActionButton.MODE_DEFAULT)}));c1.appendView(new RowView().setTitle("Scroll listen, hide").setOnClickListener(function(){fab.attachScreen(ctx,FloatingActionButton.MODE_DEFAULT,FloatingActionButton.MODE_HIDE)}));// AB
c2.appendView(new SubHeader("AB tests"));c2.appendView(new RowView().setTitle("AB SM Hide").setOnClickListener(function(){ctx.setScrollMode(Screen.AB_MODE_HIDE)}));c2.appendView(new RowView().setTitle("AB SM None").setOnClickListener(function(){ctx.setScrollMode(Screen.AB_MODE_NONE)}));c2.appendView(new RowView().setTitle("Set a very long title").setOnClickListener(function(){ctx.setTitle("Very very very very very very long title")}));c2.appendView(new RowView().setTitle("Add some actions to AB").setOnClickListener(function(){ctx.addAction(new MenuItem("action","android"));ctx.addAction(new MenuItem("action2","apple"))}));// ETC
c2.appendView(new SubHeader("etc"));c2.appendView(new RowView().setTitle("Wipe page").setOnClickListener(function(){ctx.wipeContents()}));c2.appendView(wl);c2.appendView(new RowView().setTitle("Enable waitlockview for 5 seconds").setOnClickListener(function(){wl.show();Utils.timer(5000).then(function(){console.log("ok");wl.hide()}).catch(function(e){console.warn(e)})}))}}class TestScreen2 extends Screen{onCreate(){var tv=new TextInput().setTitle("Text input demo").setHolder("Empty"),tv2=new TextInput().setTitle("Password input demo").setHolder("Empty").setType("password"),tv3=new BigTextInput().setTitle("Big input demo").setHolder("Empty");this.setHomeAsUpAction();this.setTitle("Widgets test mode!");var tb=new Toolbar;this.appendView(tb);tb.add("android","android",function(){alert(1)});tb.add("check","check",function(){alert(2)});tb.addSeparator();tb.add("undo","undo",function(){alert(3)});var sp=new SpoilerView().setTitle("Spoiler test").setSummary("Tap to open!");sp.appendView(new RowView().setTitle("Hidden row!"));this.appendView(sp);this.appendView(new Checkbox().setTitle("Checkbox!"));this.appendView(new SubHeader("Input tests"));this.appendView(tv);this.appendView(tv2);this.appendView(tv3);this.appendView(new RowView().setTitle("Show value").setOnClickListener(function(){new Alert().setTitle("Text form value:").setMessage(tv.toString()).show()}).setOnLongTouchListener(function(){new Alert().setTitle("Long tap!").show()}));this.appendView(new Spinner);this.appendView(new TextView("info","This is info TextView!"));this.appendView(new Button().setText("Default button"));this.appendView(new Button().setStyle(Button.STYLE_CONTAINED).setText("Contained button"));this.appendView(new Button().setStyle(Button.STYLE_FLAT).setText("Flat button"));this.appendView(new Button().setStyle(Button.STYLE_OUTLINE).setText("Outlined button"));this.appendView(new SubHeader("RowView tests"));this.appendView(new RowView().setTitle("Single-line"));this.appendView(new RowView().setTitle("Single-line with icon").setIcon("android"));this.appendView(new RowView().setTitle("Single-line with icon and action").setIcon("android").setAction("Hello","more_vert",function(){new Alert().setMessage("Hello!").show()}));this.appendView(new RowView().setSummary("Description").setTitle("Two-line"));this.appendView(new RowView().setSummary("Description").setTitle("Two-line with icon").setIcon("android").setOnClickListener(function(){}));this.appendView(new RowView().setSummary("Description").setTitle("Two-line with icon and action").setIcon("android").setAction("Hello","more_vert",function(){new Alert().setTitle("It is menu!").setMessage("Hello, World!").setOnClickListener(function(){console.log(2)}).show()}))}}class TestScreen3 extends SlidingScreen{onCreate(){this.setHomeAsUpAction()}onUpdate(){this.wipe();var a=this.newPage(),b=this.newPage(),ctx=this;a.appendView(new TextView("title","Page 1"));for(var i=0;i<50;i++)a.appendView(new RowView().setTitle("Row A"+i));b.appendView(new TextView("title","Page 2"));for(var i=0;i<50;i++)b.appendView(new RowView().setTitle("Row B"+i).setOnClickListener(function(){ctx.onUpdate()}))}}/*
class TestScreen2 extends Screen {
    onCreate() {
        this.setHomeAsUpAction();
        this.setTitle("Test mode!");
    }
}
*/
