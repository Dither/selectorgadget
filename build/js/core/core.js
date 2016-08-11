/*
 The MIT License

 Copyright (c) 2012 Andrew Cantino
 Copyright (c) 2009 Andrew Cantino & Kyle Maxwell

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the 'Software'), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

window.SelectorGadget = SelectorGadget = (function() {
	var gadget;

	function SelectorGadget() {
		gadget = this;
	}
	SelectorGadget.prototype.border_width = 5;
	SelectorGadget.prototype.border_padding = 2;
	SelectorGadget.prototype.b_top = null;
	SelectorGadget.prototype.b_left = null;
	SelectorGadget.prototype.b_right = null;
	SelectorGadget.prototype.b_bottom = null;
	SelectorGadget.prototype.selected = [];
	SelectorGadget.prototype.rejected = [];
	SelectorGadget.prototype.special_mode = null;
	SelectorGadget.prototype.path_output_field = null;
	SelectorGadget.prototype.sg_div = null;
	SelectorGadget.prototype.ignore_class = 'selectorgadget_ignore';
	SelectorGadget.prototype.unbound = false;
	SelectorGadget.prototype.prediction_helper = new DomPredictionHelper();
	SelectorGadget.prototype.restricted_elements = Array.prototype.map.call(['html', 'body', 'head', 'base'], function(selector) {
		return document.querySelector(selector);
	});

	SelectorGadget.prototype.createNode = function (nodename){
		var node = document.createElement(nodename)
		node.css = function(attr, value){
			node.style[attr.toHyphenFormat()] = value;
			return node;
		}

		node.attr = function(attr, value){
			node.setAttribute(attr, value);
			return node;
		}

		node.addClass = function(classname){
			SelectorGadget.prototype.addClass(node, classname);
			return node;
		}

		node.bind = function(name, opts, callback){
			callback.bind(opts['self']);
			node.addEventListener(name, callback, false)
			return node;
		}
		return node;
	}

	SelectorGadget.prototype.addClass = function (node, classname){
		node.classList ? node.classList.add(classname) : node.className += ' ' + classname;
	}

	SelectorGadget.prototype.removeClass = function (node, classname){
		if (node.classList) node.classList.remove(classname);
	}

	SelectorGadget.prototype.hasClass = function (node, classname){
		if (node.classList) return node.classList.contains(classname);
		else false;
	}

		/**
	 * Convert string to to hyphen format
	 * @method toHyphenFormat
	 * @extends String
	 * @param str {String} String to convert
	 * @return {Any} Converted string
	 */
	String.prototype.toHyphenFormat = function(str) {
		function upperToHyphenLower(match) {
			return '-' + match.toLowerCase();
		}
		return (str || this).replace(/[A-Z]/g, upperToHyphenLower);
	};

	this.Element && function(ElementPrototype) {
	    ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
		ElementPrototype.mozMatchesSelector ||
		ElementPrototype.msMatchesSelector ||
		ElementPrototype.oMatchesSelector ||
		ElementPrototype.webkitMatchesSelector ||
		function (selector) {
			var elem = this, elems = (elem.parentNode || elem.document).querySelectorAll(selector), i = -1;
			while (elems[++i] && elems[i] != elem);
			return !!elems[i];
		}
	}(Element.prototype);

	SelectorGadget.prototype.addEventHandlert = function(elem, event, self, callback) {
	    elem.addEventListener(event, callback, false);
	}

	SelectorGadget.prototype.makeBorders = function(orig_elem, makeRed) {
		var elem, height, left, p, path_to_show, top, width;
		this.hideBorders();
		this.setupBorders();

		if (orig_elem.parentNode) {
			path_to_show = orig_elem.parentNode.tagName.toLowerCase() + ' ' + orig_elem.tagName.toLowerCase();
		} else {
			path_to_show = orig_elem.tagName.toLowerCase();
		}

		elem = orig_elem;
		top = elem.offsetTop;
		left = elem.offsetLeft;
		width = elem.clientWidth;
		height = elem.clientHeight;

		this.b_top.style.width = (width + this.border_padding * 2 + this.border_width * 2) + 'px';
		this.b_top.style.top = (top - this.border_width - this.border_padding) + 'px';
		this.b_top.style.left = (left - this.border_padding - this.border_width) + 'px';;

		this.b_bottom.style.width = (width + this.border_padding * 2 + this.border_width * 2 - 5) + 'px';
		this.b_bottom.style.top = (top + height + this.border_padding) + 'px';
		this.b_bottom.style.left = (left - this.border_padding - this.border_width) + 'px';
		this.b_bottom.textContent = path_to_show;

		this.b_left.style.height = (height + this.border_padding * 2) + 'px';
		this.b_left.style.top = (top - this.border_padding) + 'px';
		this.b_left.style.left = (left - this.border_padding - this.border_width) + 'px';;

		this.b_right.style.height = (height + this.border_padding * 2) + 'px';
		this.b_right.style.top = (top - this.border_padding) + 'px';
		this.b_right.style.left = (left + width + this.border_padding) + 'px';;

		this.b_right.target_elem = this.b_left.target_elem = this.b_top.target_elem = this.b_bottom.target_elem = orig_elem;

		if (makeRed || this.hasClass(elem, 'selectorgadget_suggested') || this.hasClass(elem, 'selectorgadget_selected')) {
			this.addClass(this.b_top, 'selectorgadget_border_red');
			this.addClass(this.b_bottom, 'selectorgadget_border_red');
			this.addClass(this.b_left, 'selectorgadget_border_red');
			this.addClass(this.b_right, 'selectorgadget_border_red');
		} else {
			if (this.hasClass(this.b_top, 'selectorgadget_border_red')) {
				this.removeClass(this.b_top, 'selectorgadget_border_red');
				this.removeClass(this.b_bottom, 'selectorgadget_border_red');
				this.removeClass(this.b_left, 'selectorgadget_border_red');
				this.removeClass(this.b_right, 'selectorgadget_border_red');
			}
		}
		this.showBorders();
	};

	SelectorGadget.prototype.showBorders = function() {
		this.b_top.style.display = this.b_bottom.style.display = this.b_left.style.display = this.b_right.style.display = 'block';
	};

	SelectorGadget.prototype.hideBorders = function() {
		if (!this.b_top) return;
		this.b_top.style.display = this.b_bottom.style.display = this.b_left.style.display = this.b_right.style.display = 'none';

	};

	SelectorGadget.prototype.setupBorders = function() {
		var width;
		if (!this.b_top) {
			width = this.border_width + 'px';
			this.b_top = this.createNode('div').addClass('selectorgadget_border').css('height', width);
			this.b_top.addEventListener('mousedown', this.sgMousedown, false);
			this.b_bottom = this.createNode('div').addClass('selectorgadget_border').addClass('selectorgadget_bottom_border').css('height', (this.border_width + 6)+'px');
			this.b_bottom.addEventListener('mousedown', this.sgMousedown, false);
			this.b_left = this.createNode('div').addClass('selectorgadget_border').css('width', width);
			this.b_left.addEventListener('mousedown', this.sgMousedown, false);
			this.b_right = this.createNode('div').addClass('selectorgadget_border').css('width', width);
			this.b_right.addEventListener('mousedown', this.sgMousedown, false);
			this.addBorderToDom();
		}
	};

	SelectorGadget.prototype.addBorderToDom = function() {
		document.body.appendChild(this.b_top);
		document.body.appendChild(this.b_bottom);
		document.body.appendChild(this.b_left);
		document.body.appendChild(this.b_right);
	};

	SelectorGadget.prototype.removeBorderFromDom = function() {
		if (this.b_top) {
			this.b_top.parentNode.removeChild(this.b_top);
			this.b_bottom.parentNode.removeChild(this.b_bottom);
			this.b_left.parentNode.removeChild(this.b_left);
			this.b_right.parentNode.removeChild(this.b_right);
			this.b_top = this.b_bottom = this.b_left = this.b_right = null;
		}
	};

	SelectorGadget.prototype.selectable = function(elem) {
		return !this.css_restriction || (this.css_restriction && elem.matchesSelector(this.css_restriction));
	};

	SelectorGadget.prototype.sgMouseover = function(e) {
		var parent, self = this;
		if (gadget.unbound) {
			return true;
		}
		if (this === document.body || this === document.body.parentNode) {
			return false;
		}
		gadget.unhighlightIframes();
		if (self.matchesSelector('iframe')) {
			gadget.highlightIframe(self, e);
		}
		if (gadget.special_mode !== 'd') {
			parent = gadget.firstSelectedOrSuggestedParent(this);
			if (parent !== null && parent !== this && gadget.selectable(parent)) {
				gadget.makeBorders(parent, true);
			} else {
				if (gadget.selectable(self)) {
					gadget.makeBorders(this);
				}
			}
		} else {
			if (!this.querySelector('.selectorgadget_selected')) {
				if (gadget.selectable(self)) {
					gadget.makeBorders(this);
				}
			}
		}
		return false;
	};

	SelectorGadget.prototype.firstSelectedOrSuggestedParent = function(elem) {
		if (gadget.hasClass(elem, 'selectorgadget_suggested') || gadget.hasClass(elem, 'selectorgadget_selected')) {
			return elem;
		}
		while (elem.parentNode && (elem = elem.parentNode)) {
			if (this.restricted_elements.indexOf(elem) === -1) {
				if (gadget.hasClass(elem, 'selectorgadget_suggested') || gadget.hasClass(elem, 'selectorgadget_selected')) {
					return elem;
				}
			}
		}
		return null;
	};

	SelectorGadget.prototype.sgMouseout = function(e) {
		var elem = this;
		if (gadget.unbound) {
			return true;
		}
		if (this === document.body || this === document.body.parentNode) {
			return false;
		}
		gadget.hideBorders();
		return false;
	};

	SelectorGadget.prototype.highlightIframe = function(elem, click) {
		var self = this;
		var target = click.target;
		var block = this.createNode('div').css('position', 'absolute').css('z-index', '99998').css('width', elem.clientWidth+'px').css('height', elem.clientHeight+'px').css('top', elem.offsetTop+'px').css('left', elem.offsetLeft+'px').css('background-color', '#AAA').css('opacity', '0.6').addClass('selectorgadget_iframe').addClass('selectorgadget_clean');
		var instructions = this.createNode('div').html('<span>This is an iframe.  To select in it, </span>').addClass('selectorgadget_iframe_info').addClass('selectorgadget_iframe').addClass('selectorgadget_clean');
		var s = instructions.style;
		s.width = '200px';
		s.border = '1px solid #888'
		s.padding = '5px';
		s.backgroundColor = 'white';
		s.position = 'absolute';
		s.zIndex = '99999';
		s.top = (elem.offsetTop + (elem.clientHeight / 4.0)) + 'px';
		s.left = (elem.offsetLeft + (elem.clientWidth - 200) / 2.0) + 'px';
		s.height = '150px';
		var src = null;
		try {
			src = elem.location.href;
		} catch (error) {
			src = elem.getAttribute('src');
		}
		instructions.append(this.createNode('a').attr('target','_top').html('click here to open it').attr('href', src));
		instructions.append(this.createNode('span').html(', then relaunch SelectorGadget.'));
		document.body.appendChild(instructions);
		block.click(function() {
			if (self.selectable(target)) {
				return target.mousedown();
			}
		});
		return document.body.appendChild(block);
	};

	SelectorGadget.prototype.unhighlightIframes = function(elem, click) {
		for (var nodes = document.querySelectorAll('.selectorgadget_iframe'), i = nodes.length; i--;)
			nodes[i].parentNode.removeChild(nodes[i]);
	};

	SelectorGadget.prototype.sgMousedown = function(e) {
		var elem, potential_elem, prediction, w_elem;
		if (gadget.unbound) {
			return true;
		}
		elem = this;
		w_elem = elem;
		if (gadget.hasClass(w_elem, 'selectorgadget_border')) {
			elem = elem.target_elem || elem;
			w_elem = elem;
		}
		if (elem === document.body || elem === document.body.parentNode) {
			return;
		}
		if (gadget.special_mode !== 'd') {
			potential_elem = gadget.firstSelectedOrSuggestedParent(elem);
			if (potential_elem !== null && potential_elem !== elem) {
				elem = potential_elem;
				w_elem = elem;
			}
		} else {
			if (this.querySelector('.selectorgadget_selected')) {
				gadget.blockClicksOn(elem);
			}
		}
		if (!gadget.selectable(w_elem)) {
			gadget.hideBorders();
			gadget.blockClicksOn(elem);
			return false;
		}
		if (gadget.hasClass(w_elem, 'selectorgadget_selected')) {
			gadget.removeClass(w_elem, 'selectorgadget_selected');
			gadget.selected.splice(gadget.selected.indexOf(elem), 1);
		} else if (gadget.hasClass(w_elem, 'selectorgadget_rejected')) {
			gadget.removeClass(w_elem, 'selectorgadget_rejected');
			gadget.rejected.splice(gadget.rejected.indexOf(elem), 1);
		} else if (gadget.hasClass(w_elem, 'selectorgadget_suggested')) {
			gadget.addClass(w_elem, 'selectorgadget_rejected');
			gadget.rejected.push(elem);
		} else {
			gadget.addClass(w_elem, 'selectorgadget_selected');
			gadget.selected.push(elem);
		}
		gadget.clearSuggested();
		prediction = gadget.prediction_helper.predictCss(gadget.selected, gadget.rejected.concat(gadget.restricted_elements));
		gadget.suggestPredicted(prediction);
		gadget.setPath(prediction);
		gadget.hideBorders();
		gadget.blockClicksOn(elem);
		var mov = document.createEvent( 'Events' );
        mov.initEvent('mouseover', true, false);
        w_elem.dispatchEvent(mov);
		return false;
	};

	SelectorGadget.prototype.setupEventHandlers = function() {
		for (var all = document.querySelectorAll('*:not(.selectorgadget_ignore)'), i = all.length; i--;) {
			all[i].addEventListener('mouseover', this.sgMouseover, false);
			all[i].addEventListener('mousedown', this.sgMousedown, false)
			all[i].addEventListener('mouseout', this.sgMouseout, false)
		}
		var html = document.querySelector('html');
		html.addEventListener('keydown', this.listenForActionKeys, false);
		html.addEventListener('keyup', this.clearActionKeys, false);
	};

	SelectorGadget.prototype.listenForActionKeys = function(e) {
		if (gadget.unbound) {
			return true;
		}
		if (e.keyCode === 16 || e.keyCode === 68) {
			gadget.special_mode = 'd';
			gadget.hideBorders();
		}
	};

	SelectorGadget.prototype.clearActionKeys = function(e) {
		if (gadget.unbound) {
			return true;
		}
		gadget.hideBorders();
		gadget.special_mode = null;
	};

	SelectorGadget.prototype.blockClicksOn = function(elem) {
		var block = this.createNode('div').css('position', 'absolute').css('z-index', '9999999').css('width', elem.clientWidth + 'px').css('height', elem.clientHeight + 'px').css('top', elem.offsetTop + 'px').css('left', elem.offsetLeft + 'px').css('background-color', '');
		document.body.appendChild(block);
		setTimeout((function() {
			return block.parentNode.removeChild(block);
		}), 400);
		return false;
	};

	SelectorGadget.prototype.setMode = function(mode) {
		if (mode === 'browse') {
			this.removeEventHandlers();
		} else if (mode === 'interactive') {
			this.setupEventHandlers();
		}
		return this.clearSelected();
	};

	SelectorGadget.prototype.suggestPredicted = function(prediction) {
		var count;
		if (prediction && prediction !== '') {
			count = 0;
			for (var nodes = document.querySelectorAll(prediction), i = nodes.length; i--;) {
				count += 1;
				if (gadget.hasClass(nodes[i], 'selectorgadget_selected') && !gadget.hasClass(nodes[i], 'selectorgadget_ignore') && !gadget.hasClass(nodes[i], 'selectorgadget_rejected')) {
					return gadget.addClass(nodes[i], 'selectorgadget_suggested');
				}
			}
			if (gadget.clear_button) {
				if (count > 0) {
					return gadget.clear_button.setAttribute('value', 'Clear (' + count + ')');
				} else {
					return gadget.clear_button.setAttribute('value', 'Clear');
				}
			}
		}
	};

	SelectorGadget.prototype.setPath = function(prediction) {
		if (prediction && prediction.length > 0) {
			return gadget.path_output_field.value = prediction;
		} else {
			return gadget.path_output_field.value = 'No valid path found.';
		}
	};

	SelectorGadget.prototype.refreshFromPath = function(e) {
		var path = gadget.path_output_field.value;
		gadget.clearSelected();
		gadget.suggestPredicted(path);
		gadget.setPath(path);
	};

	SelectorGadget.prototype.showXPath = function(e) {
		var path = gadget.path_output_field.value;
		if (path === 'No valid path found.') {
			return;
		}
		return prompt('The CSS selector ' + path + ' as an XPath is shown below.  Please report any bugs that you find with this converter.', gadget.prediction_helper.cssToXPath(path));
	};

	SelectorGadget.prototype.clearSelected = function(e) {
		gadget.selected = [];
		gadget.rejected = [];
		var nodes = document.querySelector('.selectorgadget_selected');
		nodes && this.removeClass(nodes, 'selectorgadget_selected');
		nodes = document.querySelector('.selectorgadget_rejected')
		nodes && this.removeClass(nodes, 'selectorgadget_rejected');
		gadget.hideBorders();
		gadget.clearSuggested();
	};

	SelectorGadget.prototype.clearEverything = function(e) {
		gadget.clearSelected();
		gadget.resetOutputs();
	};

	SelectorGadget.prototype.resetOutputs = function() {
		gadget.setPath();
	};

	SelectorGadget.prototype.clearSuggested = function() {
		var node = document.querySelector('.selectorgadget_suggested');
		node && gadget.removeClass(node, 'selectorgadget_suggested');
		if (gadget.clear_button) {
			return gadget.clear_button.setAttribute('value', 'Clear');
		}
	};

	SelectorGadget.prototype.showHelp = function() {
		alert('Click on a page element that you would like your selector to match (it will turn green). SelectorGadget will then generate a minimal CSS selector for that element, and will highlight (yellow) everything that is matched by the selector. Now click on a highlighted element to reject it (red), or click on an unhighlighted element to add it (green). Through this process of selection and rejection, SelectorGadget helps you to come up with the perfect CSS selector for your needs.\n\nHolding "shift" while moving the mouse will let you select elements inside of other selected elements.');
	};

	SelectorGadget.prototype.useRemoteInterface = function() {
		return window.sg_options && window.sg_options.remote_interface;
	};

	SelectorGadget.prototype.updateRemoteInterface = function(data_obj) {
		gadget.addScript(gadget.composeRemoteUrl(window.sg_options.remote_interface, data_obj));
	};

	SelectorGadget.prototype.composeRemoteUrl = function(url, data_obj) {
		var key, params;
		params = (url.split('?')[1] && url.split('?')[1].split('&')) || [];
		params.push('t=' + (new Date()).getTime());
		params.push('url=' + encodeURIComponent(window.location.href));
		if (data_obj) {
			for (key in data_obj) {
				params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data_obj[key]));
			}
		}
		if (gadget.remote_data) {
			for (key in gadget.remote_data) {
				params.push(encodeURIComponent('data[' + key + ']') + '=' + encodeURIComponent(gadget.remote_data[key]));
			}
		}
		return url.split('?')[0] + '?' + params.join('&');
	};

	SelectorGadget.prototype.addScript = function(src) {
		var head, s;
		s = document.createElement('script');
		s.setAttribute('type', 'text/javascript');
		s.setAttribute('src', src);
		head = document.getElementsByTagName('head')[0];
		if (head) {
			return head.appendChild(s);
		} else {
			return document.body.appendChild(s);
		}
	};

	SelectorGadget.prototype.makeInterface = function() {
		this.sg_div = this.createNode('div').attr('id', 'selectorgadget_main').addClass('selectorgadget_bottom').addClass('selectorgadget_ignore');
		if (this.useRemoteInterface()) {
			this.path_output_field = {
				value: null
			};
			this.remote_data = {};
			this.updateRemoteInterface();
		} else {
			this.makeStandardInterface();
		}
		return document.querySelector('body').appendChild(this.sg_div);
	};

	SelectorGadget.prototype.makeStandardInterface = function() {
		var path = this.createNode('input').attr('id', 'selectorgadget_path_field').addClass('selectorgadget_ignore').addClass('selectorgadget_input_field');
		path.onkeydown = function(e) {
			if (e.keyCode === 13) {
				return gadget.refreshFromPath(e);
			}
		};
		path.onfocus = function() {
			return this.select();
		};
		this.sg_div.appendChild(path);
		this.clear_button = this.createNode('input').attr('type','button').attr('value','Clear').addClass('selectorgadget_ignore').addClass('selectorgadget_input_field');
		this.clear_button.onclick = this.clearEverything;
		this.sg_div.appendChild(this.clear_button);
		this.sg_div.appendChild(this.createNode('input').attr('type','button').attr('value','Toggle Position').bind('click',{'self': self}, function() {
			if (gadget.hasClass(gadget.sg_div, 'selectorgadget_top')) {
				gadget.removeClass(gadget.sg_div, 'selectorgadget_top')
				gadget.addClass(gadget.sg_div, 'selectorgadget_bottom');
			} else {
				gadget.removeClass(gadget.sg_div, 'selectorgadget_bottom')
				gadget.addClass(gadget.sg_div, 'selectorgadget_top');
			}
		}).addClass('selectorgadget_ignore').addClass('selectorgadget_input_field'));
		this.sg_div.appendChild(this.createNode('input').attr('type','button').attr('value','XPath').bind('click', {
			'self': gadget
		}, this.showXPath).addClass('selectorgadget_ignore').addClass('selectorgadget_input_field'));
		this.sg_div.appendChild(this.createNode('input').attr('type','button').attr('value','?').bind('click', {
			'self': gadget
		}, this.showHelp).addClass('selectorgadget_ignore').addClass('selectorgadget_input_field'));
		this.sg_div.appendChild(this.createNode('input').attr('type','button').attr('value','X').bind('click', {
			'self': gadget
		}, this.unbindAndRemoveInterface).addClass('selectorgadget_ignore').addClass('selectorgadget_input_field'));
		return this.path_output_field = path;
	};

	SelectorGadget.prototype.removeInterface = function(e) {
		this.sg_div.parentNode.removeChild(this.sg_div);
		this.sg_div = null;
	};

	SelectorGadget.prototype.unbind = function(e) {
		gadget.unbound = true;
		gadget.removeBorderFromDom();
		gadget.clearSelected();
	};

	SelectorGadget.prototype.unbindAndRemoveInterface = function(e) {
		gadget.unbind();
		gadget.removeInterface();
	};

	SelectorGadget.prototype.setOutputMode = function(e, output_mode) {
		return gadget.output_mode = (e && e.data && e.data.mode) || output_mode;
	};

	SelectorGadget.prototype.rebind = function() {
		gadget.unbound = false;
		gadget.clearEverything();
		gadget.setupBorders();
	};

	SelectorGadget.prototype.rebindAndMakeInterface = function() {
		gadget.makeInterface();
		gadget.rebind();
	};

	SelectorGadget.prototype.randBetween = function(a, b) {
		return Math.floor(Math.random() * b) + a;
	};

	SelectorGadget.toggle = function(options) {
		if (!window.selector_gadget) {
			window.selector_gadget = new SelectorGadget();
			window.selector_gadget.makeInterface();
			window.selector_gadget.clearEverything();
			window.selector_gadget.setMode('interactive');
			if ((options != null ? options.analytics : void 0) !== false) {
				//window.selector_gadget.analytics();
			}
		} else if (window.selector_gadget.unbound) {
			window.selector_gadget.rebindAndMakeInterface();
		} else {
			window.selector_gadget.unbindAndRemoveInterface();
		}
		var loader = document.querySelector('.selector_gadget_loading');
		loader.parentNode.removeChild(loader);
	};

	/*SelectorGadget.prototype.analytics = function() {
		var cookie, random, referer, today, urchinUrl, uservar, utmac, utmhn, utmn, utmp;
		utmac = 'UA-148948-9';
		utmhn = encodeURIComponent('www.selectorgadget.com');
		utmn = this.randBetween(1000000000, 9999999999);
		cookie = this.randBetween(10000000, 99999999);
		random = this.randBetween(1000000000, 2147483647);
		today = Math.round(new Date().getTime() / 1000.0);
		referer = encodeURIComponent(window.location.href);
		uservar = '-';
		utmp = 'sg';
		urchinUrl = 'http://www.google-analytics.com/__utm.gif?utmwv=1&utmn=' + utmn + '&utmsr=-&utmsc=-&utmul=-&utmje=0&utmfl=-&utmdt=-&utmhn=' + utmhn + '&utmr=' + referer + '&utmp=' + utmp + '&utmac=' + utmac + '&utmcc=__utma%3D' + cookie + '.' + random + '.' + today + '.' + today + '.' + today + '.2%3B%2B__utmb%3D' + cookie + '%3B%2B__utmc%3D' + cookie + '%3B%2B__utmz%3D' + cookie + '.' + today + '.2.2.utmccn%3D(direct)%7Cutmcsr%3D(direct)%7Cutmcmd%3D(none)%3B%2B__utmv%3D' + cookie + '.' + uservar + '%3B';
		return document.body.appendChild(this.createNode('img').attr('src', urchinUrl));
	};*/

	return SelectorGadget;
})();
