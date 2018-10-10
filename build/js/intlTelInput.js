"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * International Telephone Input v12.1.0
 * https://github.com/jackocnr/intl-tel-input.git
 * Licensed under the MIT license
 */

// wrap in UMD - see https://github.com/umdjs/umd/blob/master/jqueryPluginCommonjs.js
(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], function ($) {
            factory($, window, document);
        });
    } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && module.exports) {
        module.exports = factory(require("jquery"), window, document);
    } else {
        factory(jQuery, window, document);
    }
})(function ($, window, document, undefined) {
    "use strict";
    // these vars persist through all instances of the plugin

    var pluginName = "intlTelInput",
        id = 1,
        // give each instance it's own id for namespaced event handling
    defaults = {
        // whether or not to allow the dropdown
        allowDropdown: true,
        // if there is just a dial code in the input: remove it on blur, and re-add it on focus
        autoHideDialCode: true,
        // add a placeholder in the input with an example number for the selected country
        autoPlaceholder: "polite",
        // modify the auto placeholder
        customPlaceholder: null,
        // append menu to a specific element
        dropdownContainer: "",
        // don't display these countries
        excludeCountries: [],
        // format the input value during initialisation and on setNumber
        formatOnDisplay: true,
        // geoIp lookup function
        geoIpLookup: null,
        // inject a hidden input with this name, and on submit, populate it with the result of getNumber
        hiddenInput: "",
        // initial country
        initialCountry: "",
        // don't insert international dial codes
        nationalMode: true,
        // display only these countries
        onlyCountries: [],
        // number type to use for placeholders
        placeholderNumberType: "MOBILE",
        // the countries at the top of the list. defaults to united states and united kingdom
        preferredCountries: ["us", "gb"],
        // display the country dial code next to the selected flag so it's not part of the typed number
        separateDialCode: false,
        // specify the path to the libphonenumber script to enable validation/formatting
        utilsScript: ""
    },
        keys = {
        UP: 38,
        DOWN: 40,
        ENTER: 13,
        ESC: 27,
        PLUS: 43,
        A: 65,
        Z: 90,
        SPACE: 32,
        TAB: 9
    },
        // https://en.wikipedia.org/wiki/List_of_North_American_Numbering_Plan_area_codes#Non-geographic_area_codes
    regionlessNanpNumbers = ["800", "822", "833", "844", "855", "866", "877", "880", "881", "882", "883", "884", "885", "886", "887", "888", "889"];
    // keep track of if the window.load event has fired as impossible to check after the fact
    $(window).on("load", function () {
        // UPDATE: use a public static field so we can fudge it in the tests
        $.fn[pluginName].windowLoaded = true;
    });
    function Plugin(element, options) {
        this.telInput = $(element);
        this.options = $.extend({}, defaults, options);
        // event namespace
        this.ns = "." + pluginName + id++;
        // Chrome, FF, Safari, IE9+
        this.isGoodBrowser = Boolean(element.setSelectionRange);
        this.hadInitialPlaceholder = Boolean($(element).attr("placeholder"));
    }
    Plugin.prototype = {
        _init: function _init() {
            // if in nationalMode, disable options relating to dial codes
            if (this.options.nationalMode) {
                this.options.autoHideDialCode = false;
            }
            // if separateDialCode then doesn't make sense to A) insert dial code into input (autoHideDialCode), and B) display national numbers (because we're displaying the country dial code next to them)
            if (this.options.separateDialCode) {
                this.options.autoHideDialCode = this.options.nationalMode = false;
            }
            // we cannot just test screen size as some smartphones/website meta tags will report desktop resolutions
            // Note: for some reason jasmine breaks if you put this in the main Plugin function with the rest of these declarations
            // Note: to target Android Mobiles (and not Tablets), we must find "Android" and "Mobile"
            this.isMobile = /Android.+Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (this.isMobile) {
                // trigger the mobile dropdown css
                $("body").addClass("iti-mobile");
                // on mobile, we want a full screen dropdown, so we must append it to the body
                if (!this.options.dropdownContainer) {
                    this.options.dropdownContainer = "body";
                }
            }
            // we return these deferred objects from the _init() call so they can be watched, and then we resolve them when each specific request returns
            // Note: again, jasmine breaks when I put these in the Plugin function
            this.autoCountryDeferred = new $.Deferred();
            this.utilsScriptDeferred = new $.Deferred();
            // in various situations there could be no country selected initially, but we need to be able to assume this variable exists
            this.selectedCountryData = {};
            // process all the data: onlyCountries, excludeCountries, preferredCountries etc
            this._processCountryData();
            // generate the markup
            this._generateMarkup();
            // set the initial state of the input value and the selected flag
            this._setInitialState();
            // start all of the event listeners: autoHideDialCode, input keydown, selectedFlag click
            this._initListeners();
            // utils script, and auto country
            this._initRequests();
            // return the deferreds
            return [this.autoCountryDeferred, this.utilsScriptDeferred];
        },
        /********************
        *  PRIVATE METHODS
        ********************/
        // prepare all of the country data, including onlyCountries, excludeCountries and preferredCountries options
        _processCountryData: function _processCountryData() {
            // process onlyCountries or excludeCountries array if present
            this._processAllCountries();
            // process the countryCodes map
            this._processCountryCodes();
            // process the preferredCountries
            this._processPreferredCountries();
        },
        // add a country code to this.countryCodes
        _addCountryCode: function _addCountryCode(iso2, dialCode, priority) {
            if (!(dialCode in this.countryCodes)) {
                this.countryCodes[dialCode] = [];
            }
            var index = priority || 0;
            this.countryCodes[dialCode][index] = iso2;
        },
        // process onlyCountries or excludeCountries array if present
        _processAllCountries: function _processAllCountries() {
            if (this.options.onlyCountries.length) {
                var lowerCaseOnlyCountries = this.options.onlyCountries.map(function (country) {
                    return country.toLowerCase();
                });
                this.countries = allCountries.filter(function (country) {
                    return lowerCaseOnlyCountries.indexOf(country.iso2) > -1;
                });
            } else if (this.options.excludeCountries.length) {
                var lowerCaseExcludeCountries = this.options.excludeCountries.map(function (country) {
                    return country.toLowerCase();
                });
                this.countries = allCountries.filter(function (country) {
                    return lowerCaseExcludeCountries.indexOf(country.iso2) === -1;
                });
            } else {
                this.countries = allCountries;
            }
        },
        // process the countryCodes map
        _processCountryCodes: function _processCountryCodes() {
            this.countryCodes = {};
            for (var i = 0; i < this.countries.length; i++) {
                var c = this.countries[i];
                this._addCountryCode(c.iso2, c.dialCode, c.priority);
                // area codes
                if (c.areaCodes) {
                    for (var j = 0; j < c.areaCodes.length; j++) {
                        // full dial code is country code + dial code
                        this._addCountryCode(c.iso2, c.dialCode + c.areaCodes[j]);
                    }
                }
            }
        },
        // process preferred countries - iterate through the preferences, fetching the country data for each one
        _processPreferredCountries: function _processPreferredCountries() {
            this.preferredCountries = [];
            for (var i = 0; i < this.options.preferredCountries.length; i++) {
                var countryCode = this.options.preferredCountries[i].toLowerCase(),
                    countryData = this._getCountryData(countryCode, false, true);
                if (countryData) {
                    this.preferredCountries.push(countryData);
                }
            }
        },
        // generate all of the markup for the plugin: the selected flag overlay, and the dropdown
        _generateMarkup: function _generateMarkup() {
            // prevent autocomplete as there's no safe, cross-browser event we can react to, so it can easily put the plugin in an inconsistent state e.g. the wrong flag selected for the autocompleted number, which on submit could mean the wrong number is saved (esp in nationalMode)
            this.telInput.attr("autocomplete", "off");
            // containers (mostly for positioning)
            var parentClass = "intl-tel-input";
            if (this.options.allowDropdown) {
                parentClass += " allow-dropdown";
            }
            if (this.options.separateDialCode) {
                parentClass += " separate-dial-code";
            }
            this.telInput.wrap($("<div>", {
                "class": parentClass
            }));
            this.flagsContainer = $("<div>", {
                "class": "flag-container"
            }).insertBefore(this.telInput);
            // currently selected flag (displayed to left of input)
            var selectedFlag = $("<div>", {
                "class": "selected-flag"
            });
            selectedFlag.appendTo(this.flagsContainer);
            this.selectedFlagInner = $("<div>", {
                "class": "iti-flag"
            }).appendTo(selectedFlag);
            if (this.options.separateDialCode) {
                this.selectedDialCode = $("<div>", {
                    "class": "selected-dial-code"
                }).appendTo(selectedFlag);
            }
            if (this.options.allowDropdown) {
                // make element focusable and tab naviagable
                selectedFlag.attr("tabindex", "0");
                // CSS triangle
                $("<div>", {
                    "class": "iti-arrow"
                }).appendTo(selectedFlag);
                // country dropdown: preferred countries, then divider, then all countries
                this.countryList = $("<ul>", {
                    "class": "country-list hide"
                });
                if (this.preferredCountries.length) {
                    this._appendListItems(this.preferredCountries, "preferred");
                    $("<li>", {
                        "class": "divider"
                    }).appendTo(this.countryList);
                }
                this._appendListItems(this.countries, "");
                // this is useful in lots of places
                this.countryListItems = this.countryList.children(".country");
                // create dropdownContainer markup
                if (this.options.dropdownContainer) {
                    this.dropdown = $("<div>", {
                        "class": "intl-tel-input iti-container"
                    }).append(this.countryList);
                } else {
                    this.countryList.appendTo(this.flagsContainer);
                }
            } else {
                // a little hack so we don't break anything
                this.countryListItems = $();
            }
            if (this.options.hiddenInput) {
                this.hiddenInput = $("<input>", {
                    type: "hidden",
                    name: this.options.hiddenInput
                }).insertBefore(this.telInput);
            }
        },
        // add a country <li> to the countryList <ul> container
        _appendListItems: function _appendListItems(countries, className) {
            // we create so many DOM elements, it is faster to build a temp string
            // and then add everything to the DOM in one go at the end
            var tmp = "";
            // for each country
            for (var i = 0; i < countries.length; i++) {
                var c = countries[i];
                // open the list item
                tmp += "<li class='country " + className + "' data-dial-code='" + c.dialCode + "' data-country-code='" + c.iso2 + "'>";
                // add the flag
                tmp += "<div class='flag-box'><div class='iti-flag " + c.iso2 + "'></div></div>";
                // and the country name and dial code
                tmp += "<span class='country-name'>" + c.name + "</span>";
                tmp += "<span class='dial-code'>+" + c.dialCode + "</span>";
                // close the list item
                tmp += "</li>";
            }
            this.countryList.append(tmp);
        },
        // set the initial state of the input value and the selected flag by:
        // 1. extracting a dial code from the given number
        // 2. using explicit initialCountry
        // 3. picking the first preferred country
        // 4. picking the first country
        _setInitialState: function _setInitialState() {
            var val = this.telInput.val();
            // if we already have a dial code, and it's not a regionlessNanp, we can go ahead and set the flag, else fall back to the default country
            // UPDATE: actually we do want to set the flag for a regionlessNanp in one situation: if we're in nationalMode and there's no initialCountry - otherwise we lose the +1 and we're left with an invalid number
            if (this._getDialCode(val) && (!this._isRegionlessNanp(val) || this.options.nationalMode && !this.options.initialCountry)) {
                this._updateFlagFromNumber(val);
            } else if (this.options.initialCountry !== "auto") {
                // see if we should select a flag
                if (this.options.initialCountry) {
                    this._setFlag(this.options.initialCountry.toLowerCase());
                } else {
                    // no dial code and no initialCountry, so default to first in list
                    this.defaultCountry = this.preferredCountries.length ? this.preferredCountries[0].iso2 : this.countries[0].iso2;
                    if (!val) {
                        this._setFlag(this.defaultCountry);
                    }
                }
                // if empty and no nationalMode and no autoHideDialCode then insert the default dial code
                if (!val && !this.options.nationalMode && !this.options.autoHideDialCode && !this.options.separateDialCode) {
                    this.telInput.val("+" + this.selectedCountryData.dialCode);
                }
            }
            // NOTE: if initialCountry is set to auto, that will be handled separately
            // format
            if (val) {
                // this wont be run after _updateDialCode as that's only called if no val
                this._updateValFromNumber(val);
            }
        },
        // initialise the main event listeners: input keyup, and click selected flag
        _initListeners: function _initListeners() {
            this._initKeyListeners();
            if (this.options.autoHideDialCode) {
                this._initFocusListeners();
            }
            if (this.options.allowDropdown) {
                this._initDropdownListeners();
            }
            if (this.hiddenInput) {
                this._initHiddenInputListener();
            }
        },
        // update hidden input on form submit
        _initHiddenInputListener: function _initHiddenInputListener() {
            var that = this;
            var form = this.telInput.closest("form");
            if (form.length) {
                form.submit(function () {
                    that.hiddenInput.val(that.getNumber());
                });
            }
        },
        // initialise the dropdown listeners
        _initDropdownListeners: function _initDropdownListeners() {
            var that = this;
            // hack for input nested inside label: clicking the selected-flag to open the dropdown would then automatically trigger a 2nd click on the input which would close it again
            var label = this.telInput.closest("label");
            if (label.length) {
                label.on("click" + this.ns, function (e) {
                    // if the dropdown is closed, then focus the input, else ignore the click
                    if (that.countryList.hasClass("hide")) {
                        that.telInput.focus();
                    } else {
                        e.preventDefault();
                    }
                });
            }
            // toggle country dropdown on click
            var selectedFlag = this.selectedFlagInner.parent();
            selectedFlag.on("click" + this.ns, function (e) {
                // only intercept this event if we're opening the dropdown
                // else let it bubble up to the top ("click-off-to-close" listener)
                // we cannot just stopPropagation as it may be needed to close another instance
                if (that.countryList.hasClass("hide") && !that.telInput.prop("disabled") && !that.telInput.prop("readonly")) {
                    that._showDropdown();
                }
            });
            // open dropdown list if currently focused
            this.flagsContainer.on("keydown" + that.ns, function (e) {
                var isDropdownHidden = that.countryList.hasClass("hide");
                if (isDropdownHidden && (e.which == keys.UP || e.which == keys.DOWN || e.which == keys.SPACE || e.which == keys.ENTER)) {
                    // prevent form from being submitted if "ENTER" was pressed
                    e.preventDefault();
                    // prevent event from being handled again by document
                    e.stopPropagation();
                    that._showDropdown();
                }
                // allow navigation from dropdown to input on TAB
                if (e.which == keys.TAB) {
                    that._closeDropdown();
                }
            });
        },
        // init many requests: utils script / geo ip lookup
        _initRequests: function _initRequests() {
            var that = this;
            // if the user has specified the path to the utils script, fetch it on window.load, else resolve
            if (this.options.utilsScript) {
                // if the plugin is being initialised after the window.load event has already been fired
                if ($.fn[pluginName].windowLoaded) {
                    $.fn[pluginName].loadUtils(this.options.utilsScript, this.utilsScriptDeferred);
                } else {
                    // wait until the load event so we don't block any other requests e.g. the flags image
                    $(window).on("load", function () {
                        $.fn[pluginName].loadUtils(that.options.utilsScript, that.utilsScriptDeferred);
                    });
                }
            } else {
                this.utilsScriptDeferred.resolve();
            }
            if (this.options.initialCountry === "auto") {
                this._loadAutoCountry();
            } else {
                this.autoCountryDeferred.resolve();
            }
        },
        // perform the geo ip lookup
        _loadAutoCountry: function _loadAutoCountry() {
            var that = this;
            // 3 options:
            // 1) already loaded (we're done)
            // 2) not already started loading (start)
            // 3) already started loading (do nothing - just wait for loading callback to fire)
            if ($.fn[pluginName].autoCountry) {
                this.handleAutoCountry();
            } else if (!$.fn[pluginName].startedLoadingAutoCountry) {
                // don't do this twice!
                $.fn[pluginName].startedLoadingAutoCountry = true;
                if (typeof this.options.geoIpLookup === "function") {
                    this.options.geoIpLookup(function (countryCode) {
                        $.fn[pluginName].autoCountry = countryCode.toLowerCase();
                        // tell all instances the auto country is ready
                        // TODO: this should just be the current instances
                        // UPDATE: use setTimeout in case their geoIpLookup function calls this callback straight away (e.g. if they have already done the geo ip lookup somewhere else). Using setTimeout means that the current thread of execution will finish before executing this, which allows the plugin to finish initialising.
                        setTimeout(function () {
                            $(".intl-tel-input input").intlTelInput("handleAutoCountry");
                        });
                    });
                }
            }
        },
        // initialize any key listeners
        _initKeyListeners: function _initKeyListeners() {
            var that = this;
            // update flag on keyup
            // (keep this listener separate otherwise the setTimeout breaks all the tests)
            this.telInput.on("keyup" + this.ns, function () {
                if (that._updateFlagFromNumber(that.telInput.val())) {
                    that._triggerCountryChange();
                }
            });
            // update flag on cut/paste events (now supported in all major browsers)
            this.telInput.on("cut" + this.ns + " paste" + this.ns, function () {
                // hack because "paste" event is fired before input is updated
                setTimeout(function () {
                    if (that._updateFlagFromNumber(that.telInput.val())) {
                        that._triggerCountryChange();
                    }
                });
            });
        },
        // adhere to the input's maxlength attr
        _cap: function _cap(number) {
            var max = this.telInput.attr("maxlength");
            return max && number.length > max ? number.substr(0, max) : number;
        },
        // listen for mousedown, focus and blur
        _initFocusListeners: function _initFocusListeners() {
            var that = this;
            // mousedown decides where the cursor goes, so if we're focusing we must preventDefault as we'll be inserting the dial code, and we want the cursor to be at the end no matter where they click
            this.telInput.on("mousedown" + this.ns, function (e) {
                if (!that.telInput.is(":focus") && !that.telInput.val()) {
                    e.preventDefault();
                    // but this also cancels the focus, so we must trigger that manually
                    that.telInput.focus();
                }
            });
            // on focus: if empty, insert the dial code for the currently selected flag
            this.telInput.on("focus" + this.ns, function (e) {
                if (!that.telInput.val() && !that.telInput.prop("readonly") && that.selectedCountryData.dialCode) {
                    // insert the dial code
                    that.telInput.val("+" + that.selectedCountryData.dialCode);
                    // after auto-inserting a dial code, if the first key they hit is '+' then assume they are entering a new number, so remove the dial code. use keypress instead of keydown because keydown gets triggered for the shift key (required to hit the + key), and instead of keyup because that shows the new '+' before removing the old one
                    that.telInput.one("keypress.plus" + that.ns, function (e) {
                        if (e.which == keys.PLUS) {
                            that.telInput.val("");
                        }
                    });
                    // after tabbing in, make sure the cursor is at the end we must use setTimeout to get outside of the focus handler as it seems the selection happens after that
                    setTimeout(function () {
                        var input = that.telInput[0];
                        if (that.isGoodBrowser) {
                            var len = that.telInput.val().length;
                            input.setSelectionRange(len, len);
                        }
                    });
                }
            });
            // on blur or form submit: if just a dial code then remove it
            var form = this.telInput.prop("form");
            if (form) {
                $(form).on("submit" + this.ns, function () {
                    that._removeEmptyDialCode();
                });
            }
            this.telInput.on("blur" + this.ns, function () {
                that._removeEmptyDialCode();
            });
        },
        _removeEmptyDialCode: function _removeEmptyDialCode() {
            var value = this.telInput.val(),
                startsPlus = value.charAt(0) == "+";
            if (startsPlus) {
                var numeric = this._getNumeric(value);
                // if just a plus, or if just a dial code
                if (!numeric || this.selectedCountryData.dialCode == numeric) {
                    this.telInput.val("");
                }
            }
            // remove the keypress listener we added on focus
            this.telInput.off("keypress.plus" + this.ns);
        },
        // extract the numeric digits from the given string
        _getNumeric: function _getNumeric(s) {
            return s.replace(/\D/g, "");
        },
        // show the dropdown
        _showDropdown: function _showDropdown() {
            this._setDropdownPosition();
            // update highlighting and scroll to active list item
            var activeListItem = this.countryList.children(".active");
            if (activeListItem.length) {
                this._highlightListItem(activeListItem);
                this._scrollTo(activeListItem);
            }
            // bind all the dropdown-related listeners: mouseover, click, click-off, keydown
            this._bindDropdownListeners();
            // update the arrow
            this.selectedFlagInner.children(".iti-arrow").addClass("up");
            this.telInput.trigger("open:countrydropdown");
        },
        // decide where to position dropdown (depends on position within viewport, and scroll)
        _setDropdownPosition: function _setDropdownPosition() {
            var that = this;
            if (this.options.dropdownContainer) {
                this.dropdown.appendTo(this.options.dropdownContainer);
            }
            // show the menu and grab the dropdown height
            this.dropdownHeight = this.countryList.removeClass("hide").outerHeight();
            if (!this.isMobile) {
                var pos = this.telInput.offset(),
                    inputTop = pos.top,
                    windowTop = $(window).scrollTop(),
                    // dropdownFitsBelow = (dropdownBottom < windowBottom)
                dropdownFitsBelow = inputTop + this.telInput.outerHeight() + this.dropdownHeight < windowTop + $(window).height(),
                    dropdownFitsAbove = inputTop - this.dropdownHeight > windowTop;
                // by default, the dropdown will be below the input. If we want to position it above the input, we add the dropup class.
                this.countryList.toggleClass("dropup", !dropdownFitsBelow && dropdownFitsAbove);
                // if dropdownContainer is enabled, calculate postion
                if (this.options.dropdownContainer) {
                    // by default the dropdown will be directly over the input because it's not in the flow. If we want to position it below, we need to add some extra top value.
                    var extraTop = !dropdownFitsBelow && dropdownFitsAbove ? 0 : this.telInput.innerHeight();
                    // calculate placement
                    this.dropdown.css({
                        top: inputTop + extraTop,
                        left: pos.left
                    });
                    // close menu on window scroll
                    $(window).on("scroll" + this.ns, function () {
                        that._closeDropdown();
                    });
                }
            }
        },
        // we only bind dropdown listeners when the dropdown is open
        _bindDropdownListeners: function _bindDropdownListeners() {
            var that = this;
            // when mouse over a list item, just highlight that one
            // we add the class "highlight", so if they hit "enter" we know which one to select
            this.countryList.on("mouseover" + this.ns, ".country", function (e) {
                that._highlightListItem($(this));
            });
            // listen for country selection
            this.countryList.on("click" + this.ns, ".country", function (e) {
                that._selectListItem($(this));
            });
            // click off to close
            // (except when this initial opening click is bubbling up)
            // we cannot just stopPropagation as it may be needed to close another instance
            var isOpening = true;
            $("html").on("click" + this.ns, function (e) {
                if (!isOpening) {
                    that._closeDropdown();
                }
                isOpening = false;
            });
            // listen for up/down scrolling, enter to select, or letters to jump to country name.
            // use keydown as keypress doesn't fire for non-char keys and we want to catch if they
            // just hit down and hold it to scroll down (no keyup event).
            // listen on the document because that's where key events are triggered if no input has focus
            var query = "",
                queryTimer = null;
            $(document).on("keydown" + this.ns, function (e) {
                // prevent down key from scrolling the whole page,
                // and enter key from submitting a form etc
                e.preventDefault();
                if (e.which == keys.UP || e.which == keys.DOWN) {
                    // up and down to navigate
                    that._handleUpDownKey(e.which);
                } else if (e.which == keys.ENTER) {
                    // enter to select
                    that._handleEnterKey();
                } else if (e.which == keys.ESC) {
                    // esc to close
                    that._closeDropdown();
                } else if (e.which >= keys.A && e.which <= keys.Z || e.which == keys.SPACE) {
                    // upper case letters (note: keyup/keydown only return upper case letters)
                    // jump to countries that start with the query string
                    if (queryTimer) {
                        clearTimeout(queryTimer);
                    }
                    query += String.fromCharCode(e.which);
                    that._searchForCountry(query);
                    // if the timer hits 1 second, reset the query
                    queryTimer = setTimeout(function () {
                        query = "";
                    }, 1e3);
                }
            });
        },
        // highlight the next/prev item in the list (and ensure it is visible)
        _handleUpDownKey: function _handleUpDownKey(key) {
            var current = this.countryList.children(".highlight").first();
            var next = key == keys.UP ? current.prev() : current.next();
            if (next.length) {
                // skip the divider
                if (next.hasClass("divider")) {
                    next = key == keys.UP ? next.prev() : next.next();
                }
                this._highlightListItem(next);
                this._scrollTo(next);
            }
        },
        // select the currently highlighted item
        _handleEnterKey: function _handleEnterKey() {
            var currentCountry = this.countryList.children(".highlight").first();
            if (currentCountry.length) {
                this._selectListItem(currentCountry);
            }
        },
        // find the first list item whose name starts with the query string
        _searchForCountry: function _searchForCountry(query) {
            for (var i = 0; i < this.countries.length; i++) {
                if (this._startsWith(this.countries[i].name, query)) {
                    var listItem = this.countryList.children("[data-country-code=" + this.countries[i].iso2 + "]").not(".preferred");
                    // update highlighting and scroll
                    this._highlightListItem(listItem);
                    this._scrollTo(listItem, true);
                    break;
                }
            }
        },
        // check if (uppercase) string a starts with string b
        _startsWith: function _startsWith(a, b) {
            return a.substr(0, b.length).toUpperCase() == b;
        },
        // update the input's value to the given val (format first if possible)
        // NOTE: this is called from _setInitialState, handleUtils and setNumber
        _updateValFromNumber: function _updateValFromNumber(number) {
            if (this.options.formatOnDisplay && window.intlTelInputUtils && this.selectedCountryData) {
                var format = !this.options.separateDialCode && (this.options.nationalMode || number.charAt(0) != "+") ? intlTelInputUtils.numberFormat.NATIONAL : intlTelInputUtils.numberFormat.INTERNATIONAL;
                number = intlTelInputUtils.formatNumber(number, this.selectedCountryData.iso2, format);
            }
            number = this._beforeSetNumber(number);
            this.telInput.val(number);
        },
        // check if need to select a new flag based on the given number
        // Note: called from _setInitialState, keyup handler, setNumber
        _updateFlagFromNumber: function _updateFlagFromNumber(number) {
            // if we're in nationalMode and we already have US/Canada selected, make sure the number starts with a +1 so _getDialCode will be able to extract the area code
            // update: if we dont yet have selectedCountryData, but we're here (trying to update the flag from the number), that means we're initialising the plugin with a number that already has a dial code, so fine to ignore this bit
            if (number && this.options.nationalMode && this.selectedCountryData.dialCode == "1" && number.charAt(0) != "+") {
                if (number.charAt(0) != "1") {
                    number = "1" + number;
                }
                number = "+" + number;
            }
            // try and extract valid dial code from input
            var dialCode = this._getDialCode(number),
                countryCode = null,
                numeric = this._getNumeric(number);
            if (dialCode) {
                // check if one of the matching countries is already selected
                var countryCodes = this.countryCodes[this._getNumeric(dialCode)],
                    alreadySelected = $.inArray(this.selectedCountryData.iso2, countryCodes) > -1,
                    // check if the given number contains a NANP area code i.e. the only dialCode that could be extracted was +1 (instead of say +1204) and the actual number's length is >=4
                isNanpAreaCode = dialCode == "+1" && numeric.length >= 4,
                    nanpSelected = this.selectedCountryData.dialCode == "1";
                // only update the flag if:
                // A) NOT (we currently have a NANP flag selected, and the number is a regionlessNanp)
                // AND
                // B) either a matching country is not already selected OR the number contains a NANP area code (ensure the flag is set to the first matching country)
                if (!(nanpSelected && this._isRegionlessNanp(numeric)) && (!alreadySelected || isNanpAreaCode)) {
                    // if using onlyCountries option, countryCodes[0] may be empty, so we must find the first non-empty index
                    for (var j = 0; j < countryCodes.length; j++) {
                        if (countryCodes[j]) {
                            countryCode = countryCodes[j];
                            break;
                        }
                    }
                }
            } else if (number.charAt(0) == "+" && numeric.length) {
                // invalid dial code, so empty
                // Note: use getNumeric here because the number has not been formatted yet, so could contain bad chars
                countryCode = "";
            } else if (!number || number == "+") {
                // empty, or just a plus, so default
                countryCode = this.defaultCountry;
            }
            if (countryCode !== null) {
                return this._setFlag(countryCode);
            }
            return false;
        },
        // check if the given number is a regionless NANP number (expects the number to contain an international dial code)
        _isRegionlessNanp: function _isRegionlessNanp(number) {
            var numeric = this._getNumeric(number);
            if (numeric.charAt(0) == "1") {
                var areaCode = numeric.substr(1, 3);
                return $.inArray(areaCode, regionlessNanpNumbers) > -1;
            }
            return false;
        },
        // remove highlighting from other list items and highlight the given item
        _highlightListItem: function _highlightListItem(listItem) {
            this.countryListItems.removeClass("highlight");
            listItem.addClass("highlight");
        },
        // find the country data for the given country code
        // the ignoreOnlyCountriesOption is only used during init() while parsing the onlyCountries array
        _getCountryData: function _getCountryData(countryCode, ignoreOnlyCountriesOption, allowFail) {
            var countryList = ignoreOnlyCountriesOption ? allCountries : this.countries;
            for (var i = 0; i < countryList.length; i++) {
                if (countryList[i].iso2 == countryCode) {
                    return countryList[i];
                }
            }
            if (allowFail) {
                return null;
            } else {
                throw new Error("No country data for '" + countryCode + "'");
            }
        },
        // select the given flag, update the placeholder and the active list item
        // Note: called from _setInitialState, _updateFlagFromNumber, _selectListItem, setCountry
        _setFlag: function _setFlag(countryCode) {
            var prevCountry = this.selectedCountryData.iso2 ? this.selectedCountryData : {};
            // do this first as it will throw an error and stop if countryCode is invalid
            this.selectedCountryData = countryCode ? this._getCountryData(countryCode, false, false) : {};
            // update the defaultCountry - we only need the iso2 from now on, so just store that
            if (this.selectedCountryData.iso2) {
                this.defaultCountry = this.selectedCountryData.iso2;
            }
            this.selectedFlagInner.attr("class", "iti-flag " + countryCode);
            // update the selected country's title attribute
            var title = countryCode ? this.selectedCountryData.name + ": +" + this.selectedCountryData.dialCode : "Unknown";
            this.selectedFlagInner.parent().attr("title", title);
            if (this.options.separateDialCode) {
                var dialCode = this.selectedCountryData.dialCode ? "+" + this.selectedCountryData.dialCode : "",
                    parent = this.telInput.parent();
                if (prevCountry.dialCode) {
                    parent.removeClass("iti-sdc-" + (prevCountry.dialCode.length + 1));
                }
                if (dialCode) {
                    parent.addClass("iti-sdc-" + dialCode.length);
                }
                this.selectedDialCode.text(dialCode);
            }
            // and the input's placeholder
            this._updatePlaceholder();
            // update the active list item
            this.countryListItems.removeClass("active");
            if (countryCode) {
                this.countryListItems.find(".iti-flag." + countryCode).first().closest(".country").addClass("active");
            }
            // return if the flag has changed or not
            return prevCountry.iso2 !== countryCode;
        },
        // update the input placeholder to an example number from the currently selected country
        _updatePlaceholder: function _updatePlaceholder() {
            var shouldSetPlaceholder = this.options.autoPlaceholder === "aggressive" || !this.hadInitialPlaceholder && (this.options.autoPlaceholder === true || this.options.autoPlaceholder === "polite");
            if (window.intlTelInputUtils && shouldSetPlaceholder) {
                var numberType = intlTelInputUtils.numberType[this.options.placeholderNumberType],
                    placeholder = this.selectedCountryData.iso2 ? intlTelInputUtils.getExampleNumber(this.selectedCountryData.iso2, this.options.nationalMode, numberType) : "";
                placeholder = this._beforeSetNumber(placeholder);
                if (typeof this.options.customPlaceholder === "function") {
                    placeholder = this.options.customPlaceholder(placeholder, this.selectedCountryData);
                }
                this.telInput.attr("placeholder", placeholder);
            }
        },
        // called when the user selects a list item from the dropdown
        _selectListItem: function _selectListItem(listItem) {
            // update selected flag and active list item
            var flagChanged = this._setFlag(listItem.attr("data-country-code"));
            this._closeDropdown();
            this._updateDialCode(listItem.attr("data-dial-code"), true);
            // focus the input
            this.telInput.focus();
            // put cursor at end - this fix is required for FF and IE11 (with nationalMode=false i.e. auto inserting dial code), who try to put the cursor at the beginning the first time
            if (this.isGoodBrowser) {
                var len = this.telInput.val().length;
                this.telInput[0].setSelectionRange(len, len);
            }
            if (flagChanged) {
                this._triggerCountryChange();
            }
        },
        // close the dropdown and unbind any listeners
        _closeDropdown: function _closeDropdown() {
            this.countryList.addClass("hide");
            // update the arrow
            this.selectedFlagInner.children(".iti-arrow").removeClass("up");
            // unbind key events
            $(document).off(this.ns);
            // unbind click-off-to-close
            $("html").off(this.ns);
            // unbind hover and click listeners
            this.countryList.off(this.ns);
            // remove menu from container
            if (this.options.dropdownContainer) {
                if (!this.isMobile) {
                    $(window).off("scroll" + this.ns);
                }
                this.dropdown.detach();
            }
            this.telInput.trigger("close:countrydropdown");
        },
        // check if an element is visible within it's container, else scroll until it is
        _scrollTo: function _scrollTo(element, middle) {
            var container = this.countryList,
                containerHeight = container.height(),
                containerTop = container.offset().top,
                containerBottom = containerTop + containerHeight,
                elementHeight = element.outerHeight(),
                elementTop = element.offset().top,
                elementBottom = elementTop + elementHeight,
                newScrollTop = elementTop - containerTop + container.scrollTop(),
                middleOffset = containerHeight / 2 - elementHeight / 2;
            if (elementTop < containerTop) {
                // scroll up
                if (middle) {
                    newScrollTop -= middleOffset;
                }
                container.scrollTop(newScrollTop);
            } else if (elementBottom > containerBottom) {
                // scroll down
                if (middle) {
                    newScrollTop += middleOffset;
                }
                var heightDifference = containerHeight - elementHeight;
                container.scrollTop(newScrollTop - heightDifference);
            }
        },
        // replace any existing dial code with the new one
        // Note: called from _selectListItem and setCountry
        _updateDialCode: function _updateDialCode(newDialCode, hasSelectedListItem) {
            var inputVal = this.telInput.val(),
                newNumber;
            // save having to pass this every time
            newDialCode = "+" + newDialCode;
            if (inputVal.charAt(0) == "+") {
                // there's a plus so we're dealing with a replacement (doesn't matter if nationalMode or not)
                var prevDialCode = this._getDialCode(inputVal);
                if (prevDialCode) {
                    // current number contains a valid dial code, so replace it
                    newNumber = inputVal.replace(prevDialCode, newDialCode);
                } else {
                    // current number contains an invalid dial code, so ditch it
                    // (no way to determine where the invalid dial code ends and the rest of the number begins)
                    newNumber = newDialCode;
                }
            } else if (this.options.nationalMode || this.options.separateDialCode) {
                // don't do anything
                return;
            } else {
                // nationalMode is disabled
                if (inputVal) {
                    // there is an existing value with no dial code: prefix the new dial code
                    newNumber = newDialCode + inputVal;
                } else if (hasSelectedListItem || !this.options.autoHideDialCode) {
                    // no existing value and either they've just selected a list item, or autoHideDialCode is disabled: insert new dial code
                    newNumber = newDialCode;
                } else {
                    return;
                }
            }
            this.telInput.val(newNumber);
        },
        // try and extract a valid international dial code from a full telephone number
        // Note: returns the raw string inc plus character and any whitespace/dots etc
        _getDialCode: function _getDialCode(number) {
            var dialCode = "";
            // only interested in international numbers (starting with a plus)
            if (number.charAt(0) == "+") {
                var numericChars = "";
                // iterate over chars
                for (var i = 0; i < number.length; i++) {
                    var c = number.charAt(i);
                    // if char is number
                    if ($.isNumeric(c)) {
                        numericChars += c;
                        // if current numericChars make a valid dial code
                        if (this.countryCodes[numericChars]) {
                            // store the actual raw string (useful for matching later)
                            dialCode = number.substr(0, i + 1);
                        }
                        // longest dial code is 4 chars
                        if (numericChars.length == 4) {
                            break;
                        }
                    }
                }
            }
            return dialCode;
        },
        // get the input val, adding the dial code if separateDialCode is enabled
        _getFullNumber: function _getFullNumber() {
            var val = $.trim(this.telInput.val()),
                dialCode = this.selectedCountryData.dialCode,
                prefix,
                numericVal = this._getNumeric(val),
                // normalized means ensure starts with a 1, so we can match against the full dial code
            normalizedVal = numericVal.charAt(0) == "1" ? numericVal : "1" + numericVal;
            if (this.options.separateDialCode) {
                prefix = "+" + dialCode;
            } else if (val.charAt(0) != "+" && val.charAt(0) != "1" && dialCode && dialCode.charAt(0) == "1" && dialCode.length == 4 && dialCode != normalizedVal.substr(0, 4)) {
                // if the user has entered a national NANP number, then ensure it includes the full dial code / area code
                prefix = dialCode.substr(1);
            } else {
                prefix = "";
            }
            return prefix + val;
        },
        // remove the dial code if separateDialCode is enabled
        _beforeSetNumber: function _beforeSetNumber(number) {
            if (this.options.separateDialCode) {
                var dialCode = this._getDialCode(number);
                if (dialCode) {
                    // US dialCode is "+1", which is what we want
                    // CA dialCode is "+1 123", which is wrong - should be "+1" (as it has multiple area codes)
                    // AS dialCode is "+1 684", which is what we want
                    // Solution: if the country has area codes, then revert to just the dial code
                    if (this.selectedCountryData.areaCodes !== null) {
                        dialCode = "+" + this.selectedCountryData.dialCode;
                    }
                    // a lot of numbers will have a space separating the dial code and the main number, and some NANP numbers will have a hyphen e.g. +1 684-733-1234 - in both cases we want to get rid of it
                    // NOTE: don't just trim all non-numerics as may want to preserve an open parenthesis etc
                    var start = number[dialCode.length] === " " || number[dialCode.length] === "-" ? dialCode.length + 1 : dialCode.length;
                    number = number.substr(start);
                }
            }
            return this._cap(number);
        },
        // trigger the 'countrychange' event
        _triggerCountryChange: function _triggerCountryChange() {
            this.telInput.trigger("countrychange", this.selectedCountryData);
        },
        /**************************
        *  SECRET PUBLIC METHODS
        **************************/
        // this is called when the geoip call returns
        handleAutoCountry: function handleAutoCountry() {
            if (this.options.initialCountry === "auto") {
                // we must set this even if there is an initial val in the input: in case the initial val is invalid and they delete it - they should see their auto country
                this.defaultCountry = $.fn[pluginName].autoCountry;
                // if there's no initial value in the input, then update the flag
                if (!this.telInput.val()) {
                    this.setCountry(this.defaultCountry);
                }
                this.autoCountryDeferred.resolve();
            }
        },
        // this is called when the utils request completes
        handleUtils: function handleUtils() {
            // if the request was successful
            if (window.intlTelInputUtils) {
                // if there's an initial value in the input, then format it
                if (this.telInput.val()) {
                    this._updateValFromNumber(this.telInput.val());
                }
                this._updatePlaceholder();
            }
            this.utilsScriptDeferred.resolve();
        },
        /********************
        *  PUBLIC METHODS
        ********************/
        // remove plugin
        destroy: function destroy() {
            if (this.allowDropdown) {
                // make sure the dropdown is closed (and unbind listeners)
                this._closeDropdown();
                // click event to open dropdown
                this.selectedFlagInner.parent().off(this.ns);
                // label click hack
                this.telInput.closest("label").off(this.ns);
            }
            // unbind submit event handler on form
            if (this.options.autoHideDialCode) {
                var form = this.telInput.prop("form");
                if (form) {
                    $(form).off(this.ns);
                }
            }
            // unbind all events: key events, and focus/blur events if autoHideDialCode=true
            this.telInput.off(this.ns);
            // remove markup (but leave the original input)
            var container = this.telInput.parent();
            container.before(this.telInput).remove();
        },
        // get the extension from the current number
        getExtension: function getExtension() {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.getExtension(this._getFullNumber(), this.selectedCountryData.iso2);
            }
            return "";
        },
        // format the number to the given format
        getNumber: function getNumber(format) {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.formatNumber(this._getFullNumber(), this.selectedCountryData.iso2, format);
            }
            return "";
        },
        // get the type of the entered number e.g. landline/mobile
        getNumberType: function getNumberType() {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.getNumberType(this._getFullNumber(), this.selectedCountryData.iso2);
            }
            return -99;
        },
        // get the country data for the currently selected flag
        getSelectedCountryData: function getSelectedCountryData() {
            return this.selectedCountryData;
        },
        // get the validation error
        getValidationError: function getValidationError() {
            if (window.intlTelInputUtils) {
                return intlTelInputUtils.getValidationError(this._getFullNumber(), this.selectedCountryData.iso2);
            }
            return -99;
        },
        // validate the input val - assumes the global function isValidNumber (from utilsScript)
        isValidNumber: function isValidNumber() {
            var val = $.trim(this._getFullNumber()),
                countryCode = this.options.nationalMode ? this.selectedCountryData.iso2 : "";
            return window.intlTelInputUtils ? intlTelInputUtils.isValidNumber(val, countryCode) : null;
        },
        // update the selected flag, and update the input val accordingly
        setCountry: function setCountry(countryCode) {
            countryCode = countryCode.toLowerCase();
            // check if already selected
            if (!this.selectedFlagInner.hasClass(countryCode)) {
                this._setFlag(countryCode);
                this._updateDialCode(this.selectedCountryData.dialCode, false);
                this._triggerCountryChange();
            }
        },
        // set the input value and update the flag
        setNumber: function setNumber(number) {
            // we must update the flag first, which updates this.selectedCountryData, which is used for formatting the number before displaying it
            var flagChanged = this._updateFlagFromNumber(number);
            this._updateValFromNumber(number);
            if (flagChanged) {
                this._triggerCountryChange();
            }
        },
        // set the placeholder number typ
        setPlaceholderNumberType: function setPlaceholderNumberType(type) {
            this.options.placeholderNumberType = type;
            this._updatePlaceholder();
        }
    };
    // using https://github.com/jquery-boilerplate/jquery-boilerplate/wiki/Extending-jQuery-Boilerplate
    // (adapted to allow public functions)
    $.fn[pluginName] = function (options) {
        var args = arguments;
        // Is the first parameter an object (options), or was omitted,
        // instantiate a new instance of the plugin.
        if (options === undefined || (typeof options === "undefined" ? "undefined" : _typeof(options)) === "object") {
            // collect all of the deferred objects for all instances created with this selector
            var deferreds = [];
            this.each(function () {
                if (!$.data(this, "plugin_" + pluginName)) {
                    var instance = new Plugin(this, options);
                    var instanceDeferreds = instance._init();
                    // we now have 2 deffereds: 1 for auto country, 1 for utils script
                    deferreds.push(instanceDeferreds[0]);
                    deferreds.push(instanceDeferreds[1]);
                    $.data(this, "plugin_" + pluginName, instance);
                }
            });
            // return the promise from the "master" deferred object that tracks all the others
            return $.when.apply(null, deferreds);
        } else if (typeof options === "string" && options[0] !== "_") {
            // If the first parameter is a string and it doesn't start
            // with an underscore or "contains" the `init`-function,
            // treat this as a call to a public method.
            // Cache the method call to make it possible to return a value
            var returns;
            this.each(function () {
                var instance = $.data(this, "plugin_" + pluginName);
                // Tests that there's already a plugin-instance
                // and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === "function") {
                    // Call the method of our plugin instance,
                    // and pass it the supplied arguments.
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }
                // Allow instances to be destroyed via the 'destroy' method
                if (options === "destroy") {
                    $.data(this, "plugin_" + pluginName, null);
                }
            });
            // If the earlier cached method gives a value back return the value,
            // otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    };
    /********************
    *  STATIC METHODS
    ********************/
    // get the country data object
    $.fn[pluginName].getCountryData = function () {
        return allCountries;
    };
    // load the utils script
    $.fn[pluginName].loadUtils = function (path, utilsScriptDeferred) {
        if (!$.fn[pluginName].loadedUtilsScript) {
            // don't do this twice! (dont just check if window.intlTelInputUtils exists as if init plugin multiple times in quick succession, it may not have finished loading yet)
            $.fn[pluginName].loadedUtilsScript = true;
            // dont use $.getScript as it prevents caching
            $.ajax({
                type: "GET",
                url: path,
                complete: function complete() {
                    // tell all instances that the utils request is complete
                    $(".intl-tel-input input").intlTelInput("handleUtils");
                },
                dataType: "script",
                cache: true
            });
        } else if (utilsScriptDeferred) {
            utilsScriptDeferred.resolve();
        }
    };
    // default options
    $.fn[pluginName].defaults = defaults;
    // version
    $.fn[pluginName].version = "12.1.0";
    // Array of country objects for the flag dropdown.
    // Here is the criteria for the plugin to support a given country/territory
    // - It has an iso2 code: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
    // - It has it's own country calling code (it is not a sub-region of another country): https://en.wikipedia.org/wiki/List_of_country_calling_codes
    // - It has a flag in the region-flags project: https://github.com/behdad/region-flags/tree/gh-pages/png
    // - It is supported by libphonenumber (it must be listed on this page): https://github.com/googlei18n/libphonenumber/blob/master/resources/ShortNumberMetadata.xml
    // Each country array has the following information:
    // [
    //    Country name,
    //    iso2 code,
    //    International dial code,
    //    Order (if >1 country with same dial code),
    //    Area codes
    // ]
    var allCountries = [["Afghanistan (‫افغانستان‬‎)", "af", "93"], ["Albania (Shqipëri)", "al", "355"], ["Algeria (‫الجزائر‬‎)", "dz", "213"], ["American Samoa", "as", "1684"], ["Andorra", "ad", "376"], ["Angola", "ao", "244"], ["Anguilla", "ai", "1264"], ["Antigua and Barbuda", "ag", "1268"], ["Argentina", "ar", "54"], ["Armenia (Հայաստան)", "am", "374"], ["Aruba", "aw", "297"], ["Australia", "au", "61", 0], ["Austria (Österreich)", "at", "43"], ["Azerbaijan (Azərbaycan)", "az", "994"], ["Bahamas", "bs", "1242"], ["Bahrain (‫البحرين‬‎)", "bh", "973"], ["Bangladesh (বাংলাদেশ)", "bd", "880"], ["Barbados", "bb", "1246"], ["Belarus (Беларусь)", "by", "375"], ["Belgium (België)", "be", "32"], ["Belize", "bz", "501"], ["Benin (Bénin)", "bj", "229"], ["Bermuda", "bm", "1441"], ["Bhutan (འབྲུག)", "bt", "975"], ["Bolivia", "bo", "591"], ["Bosnia and Herzegovina (Босна и Херцеговина)", "ba", "387"], ["Botswana", "bw", "267"], ["Brazil (Brasil)", "br", "55"], ["British Indian Ocean Territory", "io", "246"], ["British Virgin Islands", "vg", "1284"], ["Brunei", "bn", "673"], ["Bulgaria (България)", "bg", "359"], ["Burkina Faso", "bf", "226"], ["Burundi (Uburundi)", "bi", "257"], ["Cambodia (កម្ពុជា)", "kh", "855"], ["Cameroon (Cameroun)", "cm", "237"], ["Canada", "ca", "1", 1, ["204", "226", "236", "249", "250", "289", "306", "343", "365", "387", "403", "416", "418", "431", "437", "438", "450", "506", "514", "519", "548", "579", "581", "587", "604", "613", "639", "647", "672", "705", "709", "742", "778", "780", "782", "807", "819", "825", "867", "873", "902", "905"]], ["Cape Verde (Kabu Verdi)", "cv", "238"], ["Caribbean Netherlands", "bq", "599", 1], ["Cayman Islands", "ky", "1345"], ["Central African Republic (République centrafricaine)", "cf", "236"], ["Chad (Tchad)", "td", "235"], ["Chile", "cl", "56"], ["China (中国)", "cn", "86"], ["Christmas Island", "cx", "61", 2], ["Cocos (Keeling) Islands", "cc", "61", 1], ["Colombia", "co", "57"], ["Comoros (‫جزر القمر‬‎)", "km", "269"], ["Congo (DRC) (Jamhuri ya Kidemokrasia ya Kongo)", "cd", "243"], ["Congo (Republic) (Congo-Brazzaville)", "cg", "242"], ["Cook Islands", "ck", "682"], ["Costa Rica", "cr", "506"], ["Côte d’Ivoire", "ci", "225"], ["Croatia (Hrvatska)", "hr", "385"], ["Cuba", "cu", "53"], ["Curaçao", "cw", "599", 0], ["Cyprus (Κύπρος)", "cy", "357"], ["Czech Republic (Česká republika)", "cz", "420"], ["Denmark (Danmark)", "dk", "45"], ["Djibouti", "dj", "253"], ["Dominica", "dm", "1767"], ["Dominican Republic (República Dominicana)", "do", "1", 2, ["809", "829", "849"]], ["Ecuador", "ec", "593"], ["Egypt (‫مصر‬‎)", "eg", "20"], ["El Salvador", "sv", "503"], ["Equatorial Guinea (Guinea Ecuatorial)", "gq", "240"], ["Eritrea", "er", "291"], ["Estonia (Eesti)", "ee", "372"], ["Ethiopia", "et", "251"], ["Falkland Islands (Islas Malvinas)", "fk", "500"], ["Faroe Islands (Føroyar)", "fo", "298"], ["Fiji", "fj", "679"], ["Finland (Suomi)", "fi", "358", 0], ["France", "fr", "33"], ["French Guiana (Guyane française)", "gf", "594"], ["French Polynesia (Polynésie française)", "pf", "689"], ["Gabon", "ga", "241"], ["Gambia", "gm", "220"], ["Georgia (საქართველო)", "ge", "995"], ["Germany (Deutschland)", "de", "49"], ["Ghana (Gaana)", "gh", "233"], ["Gibraltar", "gi", "350"], ["Greece (Ελλάδα)", "gr", "30"], ["Greenland (Kalaallit Nunaat)", "gl", "299"], ["Grenada", "gd", "1473"], ["Guadeloupe", "gp", "590", 0], ["Guam", "gu", "1671"], ["Guatemala", "gt", "502"], ["Guernsey", "gg", "44", 1], ["Guinea (Guinée)", "gn", "224"], ["Guinea-Bissau (Guiné Bissau)", "gw", "245"], ["Guyana", "gy", "592"], ["Haiti", "ht", "509"], ["Honduras", "hn", "504"], ["Hong Kong (香港)", "hk", "852"], ["Hungary (Magyarország)", "hu", "36"], ["Iceland (Ísland)", "is", "354"], ["India (भारत)", "in", "91"], ["Indonesia", "id", "62"], ["Iran (‫ایران‬‎)", "ir", "98"], ["Iraq (‫العراق‬‎)", "iq", "964"], ["Ireland", "ie", "353"], ["Isle of Man", "im", "44", 2], ["Israel (‫ישראל‬‎)", "il", "972"], ["Italy (Italia)", "it", "39", 0], ["Jamaica", "jm", "1876"], ["Japan (日本)", "jp", "81"], ["Jersey", "je", "44", 3], ["Jordan (‫الأردن‬‎)", "jo", "962"], ["Kazakhstan (Казахстан)", "kz", "7", 1], ["Kenya", "ke", "254"], ["Kiribati", "ki", "686"], ["Kosovo", "xk", "383"], ["Kuwait (‫الكويت‬‎)", "kw", "965"], ["Kyrgyzstan (Кыргызстан)", "kg", "996"], ["Laos (ລາວ)", "la", "856"], ["Latvia (Latvija)", "lv", "371"], ["Lebanon (‫لبنان‬‎)", "lb", "961"], ["Lesotho", "ls", "266"], ["Liberia", "lr", "231"], ["Libya (‫ليبيا‬‎)", "ly", "218"], ["Liechtenstein", "li", "423"], ["Lithuania (Lietuva)", "lt", "370"], ["Luxembourg", "lu", "352"], ["Macau (澳門)", "mo", "853"], ["Macedonia (FYROM) (Македонија)", "mk", "389"], ["Madagascar (Madagasikara)", "mg", "261"], ["Malawi", "mw", "265"], ["Malaysia", "my", "60"], ["Maldives", "mv", "960"], ["Mali", "ml", "223"], ["Malta", "mt", "356"], ["Marshall Islands", "mh", "692"], ["Martinique", "mq", "596"], ["Mauritania (‫موريتانيا‬‎)", "mr", "222"], ["Mauritius (Moris)", "mu", "230"], ["Mayotte", "yt", "262", 1], ["Mexico (México)", "mx", "52"], ["Micronesia", "fm", "691"], ["Moldova (Republica Moldova)", "md", "373"], ["Monaco", "mc", "377"], ["Mongolia (Монгол)", "mn", "976"], ["Montenegro (Crna Gora)", "me", "382"], ["Montserrat", "ms", "1664"], ["Morocco (‫المغرب‬‎)", "ma", "212", 0], ["Mozambique (Moçambique)", "mz", "258"], ["Myanmar (Burma) (မြန်မာ)", "mm", "95"], ["Namibia (Namibië)", "na", "264"], ["Nauru", "nr", "674"], ["Nepal (नेपाल)", "np", "977"], ["Netherlands (Nederland)", "nl", "31"], ["New Caledonia (Nouvelle-Calédonie)", "nc", "687"], ["New Zealand", "nz", "64"], ["Nicaragua", "ni", "505"], ["Niger (Nijar)", "ne", "227"], ["Nigeria", "ng", "234"], ["Niue", "nu", "683"], ["Norfolk Island", "nf", "672"], ["North Korea (조선 민주주의 인민 공화국)", "kp", "850"], ["Northern Mariana Islands", "mp", "1670"], ["Norway (Norge)", "no", "47", 0], ["Oman (‫عُمان‬‎)", "om", "968"], ["Pakistan (‫پاکستان‬‎)", "pk", "92"], ["Palau", "pw", "680"], ["Palestine (‫فلسطين‬‎)", "ps", "970"], ["Panama (Panamá)", "pa", "507"], ["Papua New Guinea", "pg", "675"], ["Paraguay", "py", "595"], ["Peru (Perú)", "pe", "51"], ["Philippines", "ph", "63"], ["Poland (Polska)", "pl", "48"], ["Portugal", "pt", "351"], ["Puerto Rico", "pr", "1", 3, ["787", "939"]], ["Qatar (‫قطر‬‎)", "qa", "974"], ["Réunion (La Réunion)", "re", "262", 0], ["Romania (România)", "ro", "40"], ["Russia (Россия)", "ru", "7", 0], ["Rwanda", "rw", "250"], ["Saint Barthélemy", "bl", "590", 1], ["Saint Helena", "sh", "290"], ["Saint Kitts and Nevis", "kn", "1869"], ["Saint Lucia", "lc", "1758"], ["Saint Martin (Saint-Martin (partie française))", "mf", "590", 2], ["Saint Pierre and Miquelon (Saint-Pierre-et-Miquelon)", "pm", "508"], ["Saint Vincent and the Grenadines", "vc", "1784"], ["Samoa", "ws", "685"], ["San Marino", "sm", "378"], ["São Tomé and Príncipe (São Tomé e Príncipe)", "st", "239"], ["Saudi Arabia (‫المملكة العربية السعودية‬‎)", "sa", "966"], ["Senegal (Sénégal)", "sn", "221"], ["Serbia (Србија)", "rs", "381"], ["Seychelles", "sc", "248"], ["Sierra Leone", "sl", "232"], ["Singapore", "sg", "65"], ["Sint Maarten", "sx", "1721"], ["Slovakia (Slovensko)", "sk", "421"], ["Slovenia (Slovenija)", "si", "386"], ["Solomon Islands", "sb", "677"], ["Somalia (Soomaaliya)", "so", "252"], ["South Africa", "za", "27"], ["South Korea (대한민국)", "kr", "82"], ["South Sudan (‫جنوب السودان‬‎)", "ss", "211"], ["Spain (España)", "es", "34"], ["Sri Lanka (ශ්‍රී ලංකාව)", "lk", "94"], ["Sudan (‫السودان‬‎)", "sd", "249"], ["Suriname", "sr", "597"], ["Svalbard and Jan Mayen", "sj", "47", 1], ["Swaziland", "sz", "268"], ["Sweden (Sverige)", "se", "46"], ["Switzerland (Schweiz)", "ch", "41"], ["Syria (‫سوريا‬‎)", "sy", "963"], ["Taiwan (台灣)", "tw", "886"], ["Tajikistan", "tj", "992"], ["Tanzania", "tz", "255"], ["Thailand (ไทย)", "th", "66"], ["Timor-Leste", "tl", "670"], ["Togo", "tg", "228"], ["Tokelau", "tk", "690"], ["Tonga", "to", "676"], ["Trinidad and Tobago", "tt", "1868"], ["Tunisia (‫تونس‬‎)", "tn", "216"], ["Turkey (Türkiye)", "tr", "90"], ["Turkmenistan", "tm", "993"], ["Turks and Caicos Islands", "tc", "1649"], ["Tuvalu", "tv", "688"], ["U.S. Virgin Islands", "vi", "1340"], ["Uganda", "ug", "256"], ["Ukraine (Україна)", "ua", "380"], ["United Arab Emirates (‫الإمارات العربية المتحدة‬‎)", "ae", "971"], ["United Kingdom", "gb", "44", 0], ["United States", "us", "1", 0], ["Uruguay", "uy", "598"], ["Uzbekistan (Oʻzbekiston)", "uz", "998"], ["Vanuatu", "vu", "678"], ["Vatican City (Città del Vaticano)", "va", "39", 1], ["Venezuela", "ve", "58"], ["Vietnam (Việt Nam)", "vn", "84"], ["Wallis and Futuna (Wallis-et-Futuna)", "wf", "681"], ["Western Sahara (‫الصحراء الغربية‬‎)", "eh", "212", 1], ["Yemen (‫اليمن‬‎)", "ye", "967"], ["Zambia", "zm", "260"], ["Zimbabwe", "zw", "263"], ["Åland Islands", "ax", "358", 1]];
    // loop over all of the countries above
    for (var i = 0; i < allCountries.length; i++) {
        var c = allCountries[i];
        allCountries[i] = {
            name: c[0],
            iso2: c[1],
            dialCode: c[2],
            priority: c[3] || 0,
            areaCodes: c[4] || null
        };
    }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludGxUZWxJbnB1dC5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwiJCIsIndpbmRvdyIsImRvY3VtZW50IiwibW9kdWxlIiwiZXhwb3J0cyIsInJlcXVpcmUiLCJqUXVlcnkiLCJ1bmRlZmluZWQiLCJwbHVnaW5OYW1lIiwiaWQiLCJkZWZhdWx0cyIsImFsbG93RHJvcGRvd24iLCJhdXRvSGlkZURpYWxDb2RlIiwiYXV0b1BsYWNlaG9sZGVyIiwiY3VzdG9tUGxhY2Vob2xkZXIiLCJkcm9wZG93bkNvbnRhaW5lciIsImV4Y2x1ZGVDb3VudHJpZXMiLCJmb3JtYXRPbkRpc3BsYXkiLCJnZW9JcExvb2t1cCIsImhpZGRlbklucHV0IiwiaW5pdGlhbENvdW50cnkiLCJuYXRpb25hbE1vZGUiLCJvbmx5Q291bnRyaWVzIiwicGxhY2Vob2xkZXJOdW1iZXJUeXBlIiwicHJlZmVycmVkQ291bnRyaWVzIiwic2VwYXJhdGVEaWFsQ29kZSIsInV0aWxzU2NyaXB0Iiwia2V5cyIsIlVQIiwiRE9XTiIsIkVOVEVSIiwiRVNDIiwiUExVUyIsIkEiLCJaIiwiU1BBQ0UiLCJUQUIiLCJyZWdpb25sZXNzTmFucE51bWJlcnMiLCJvbiIsImZuIiwid2luZG93TG9hZGVkIiwiUGx1Z2luIiwiZWxlbWVudCIsIm9wdGlvbnMiLCJ0ZWxJbnB1dCIsImV4dGVuZCIsIm5zIiwiaXNHb29kQnJvd3NlciIsIkJvb2xlYW4iLCJzZXRTZWxlY3Rpb25SYW5nZSIsImhhZEluaXRpYWxQbGFjZWhvbGRlciIsImF0dHIiLCJwcm90b3R5cGUiLCJfaW5pdCIsImlzTW9iaWxlIiwidGVzdCIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImFkZENsYXNzIiwiYXV0b0NvdW50cnlEZWZlcnJlZCIsIkRlZmVycmVkIiwidXRpbHNTY3JpcHREZWZlcnJlZCIsInNlbGVjdGVkQ291bnRyeURhdGEiLCJfcHJvY2Vzc0NvdW50cnlEYXRhIiwiX2dlbmVyYXRlTWFya3VwIiwiX3NldEluaXRpYWxTdGF0ZSIsIl9pbml0TGlzdGVuZXJzIiwiX2luaXRSZXF1ZXN0cyIsIl9wcm9jZXNzQWxsQ291bnRyaWVzIiwiX3Byb2Nlc3NDb3VudHJ5Q29kZXMiLCJfcHJvY2Vzc1ByZWZlcnJlZENvdW50cmllcyIsIl9hZGRDb3VudHJ5Q29kZSIsImlzbzIiLCJkaWFsQ29kZSIsInByaW9yaXR5IiwiY291bnRyeUNvZGVzIiwiaW5kZXgiLCJsZW5ndGgiLCJsb3dlckNhc2VPbmx5Q291bnRyaWVzIiwibWFwIiwiY291bnRyeSIsInRvTG93ZXJDYXNlIiwiY291bnRyaWVzIiwiYWxsQ291bnRyaWVzIiwiZmlsdGVyIiwiaW5kZXhPZiIsImxvd2VyQ2FzZUV4Y2x1ZGVDb3VudHJpZXMiLCJpIiwiYyIsImFyZWFDb2RlcyIsImoiLCJjb3VudHJ5Q29kZSIsImNvdW50cnlEYXRhIiwiX2dldENvdW50cnlEYXRhIiwicHVzaCIsInBhcmVudENsYXNzIiwid3JhcCIsImZsYWdzQ29udGFpbmVyIiwiaW5zZXJ0QmVmb3JlIiwic2VsZWN0ZWRGbGFnIiwiYXBwZW5kVG8iLCJzZWxlY3RlZEZsYWdJbm5lciIsInNlbGVjdGVkRGlhbENvZGUiLCJjb3VudHJ5TGlzdCIsIl9hcHBlbmRMaXN0SXRlbXMiLCJjb3VudHJ5TGlzdEl0ZW1zIiwiY2hpbGRyZW4iLCJkcm9wZG93biIsImFwcGVuZCIsInR5cGUiLCJuYW1lIiwiY2xhc3NOYW1lIiwidG1wIiwidmFsIiwiX2dldERpYWxDb2RlIiwiX2lzUmVnaW9ubGVzc05hbnAiLCJfdXBkYXRlRmxhZ0Zyb21OdW1iZXIiLCJfc2V0RmxhZyIsImRlZmF1bHRDb3VudHJ5IiwiX3VwZGF0ZVZhbEZyb21OdW1iZXIiLCJfaW5pdEtleUxpc3RlbmVycyIsIl9pbml0Rm9jdXNMaXN0ZW5lcnMiLCJfaW5pdERyb3Bkb3duTGlzdGVuZXJzIiwiX2luaXRIaWRkZW5JbnB1dExpc3RlbmVyIiwidGhhdCIsImZvcm0iLCJjbG9zZXN0Iiwic3VibWl0IiwiZ2V0TnVtYmVyIiwibGFiZWwiLCJlIiwiaGFzQ2xhc3MiLCJmb2N1cyIsInByZXZlbnREZWZhdWx0IiwicGFyZW50IiwicHJvcCIsIl9zaG93RHJvcGRvd24iLCJpc0Ryb3Bkb3duSGlkZGVuIiwid2hpY2giLCJzdG9wUHJvcGFnYXRpb24iLCJfY2xvc2VEcm9wZG93biIsImxvYWRVdGlscyIsInJlc29sdmUiLCJfbG9hZEF1dG9Db3VudHJ5IiwiYXV0b0NvdW50cnkiLCJoYW5kbGVBdXRvQ291bnRyeSIsInN0YXJ0ZWRMb2FkaW5nQXV0b0NvdW50cnkiLCJzZXRUaW1lb3V0IiwiaW50bFRlbElucHV0IiwiX3RyaWdnZXJDb3VudHJ5Q2hhbmdlIiwiX2NhcCIsIm51bWJlciIsIm1heCIsInN1YnN0ciIsImlzIiwib25lIiwiaW5wdXQiLCJsZW4iLCJfcmVtb3ZlRW1wdHlEaWFsQ29kZSIsInZhbHVlIiwic3RhcnRzUGx1cyIsImNoYXJBdCIsIm51bWVyaWMiLCJfZ2V0TnVtZXJpYyIsIm9mZiIsInMiLCJyZXBsYWNlIiwiX3NldERyb3Bkb3duUG9zaXRpb24iLCJhY3RpdmVMaXN0SXRlbSIsIl9oaWdobGlnaHRMaXN0SXRlbSIsIl9zY3JvbGxUbyIsIl9iaW5kRHJvcGRvd25MaXN0ZW5lcnMiLCJ0cmlnZ2VyIiwiZHJvcGRvd25IZWlnaHQiLCJyZW1vdmVDbGFzcyIsIm91dGVySGVpZ2h0IiwicG9zIiwib2Zmc2V0IiwiaW5wdXRUb3AiLCJ0b3AiLCJ3aW5kb3dUb3AiLCJzY3JvbGxUb3AiLCJkcm9wZG93bkZpdHNCZWxvdyIsImhlaWdodCIsImRyb3Bkb3duRml0c0Fib3ZlIiwidG9nZ2xlQ2xhc3MiLCJleHRyYVRvcCIsImlubmVySGVpZ2h0IiwiY3NzIiwibGVmdCIsIl9zZWxlY3RMaXN0SXRlbSIsImlzT3BlbmluZyIsInF1ZXJ5IiwicXVlcnlUaW1lciIsIl9oYW5kbGVVcERvd25LZXkiLCJfaGFuZGxlRW50ZXJLZXkiLCJjbGVhclRpbWVvdXQiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJfc2VhcmNoRm9yQ291bnRyeSIsImtleSIsImN1cnJlbnQiLCJmaXJzdCIsIm5leHQiLCJwcmV2IiwiY3VycmVudENvdW50cnkiLCJfc3RhcnRzV2l0aCIsImxpc3RJdGVtIiwibm90IiwiYSIsImIiLCJ0b1VwcGVyQ2FzZSIsImludGxUZWxJbnB1dFV0aWxzIiwiZm9ybWF0IiwibnVtYmVyRm9ybWF0IiwiTkFUSU9OQUwiLCJJTlRFUk5BVElPTkFMIiwiZm9ybWF0TnVtYmVyIiwiX2JlZm9yZVNldE51bWJlciIsImFscmVhZHlTZWxlY3RlZCIsImluQXJyYXkiLCJpc05hbnBBcmVhQ29kZSIsIm5hbnBTZWxlY3RlZCIsImFyZWFDb2RlIiwiaWdub3JlT25seUNvdW50cmllc09wdGlvbiIsImFsbG93RmFpbCIsIkVycm9yIiwicHJldkNvdW50cnkiLCJ0aXRsZSIsInRleHQiLCJfdXBkYXRlUGxhY2Vob2xkZXIiLCJmaW5kIiwic2hvdWxkU2V0UGxhY2Vob2xkZXIiLCJudW1iZXJUeXBlIiwicGxhY2Vob2xkZXIiLCJnZXRFeGFtcGxlTnVtYmVyIiwiZmxhZ0NoYW5nZWQiLCJfdXBkYXRlRGlhbENvZGUiLCJkZXRhY2giLCJtaWRkbGUiLCJjb250YWluZXIiLCJjb250YWluZXJIZWlnaHQiLCJjb250YWluZXJUb3AiLCJjb250YWluZXJCb3R0b20iLCJlbGVtZW50SGVpZ2h0IiwiZWxlbWVudFRvcCIsImVsZW1lbnRCb3R0b20iLCJuZXdTY3JvbGxUb3AiLCJtaWRkbGVPZmZzZXQiLCJoZWlnaHREaWZmZXJlbmNlIiwibmV3RGlhbENvZGUiLCJoYXNTZWxlY3RlZExpc3RJdGVtIiwiaW5wdXRWYWwiLCJuZXdOdW1iZXIiLCJwcmV2RGlhbENvZGUiLCJudW1lcmljQ2hhcnMiLCJpc051bWVyaWMiLCJfZ2V0RnVsbE51bWJlciIsInRyaW0iLCJwcmVmaXgiLCJudW1lcmljVmFsIiwibm9ybWFsaXplZFZhbCIsInN0YXJ0Iiwic2V0Q291bnRyeSIsImhhbmRsZVV0aWxzIiwiZGVzdHJveSIsImJlZm9yZSIsInJlbW92ZSIsImdldEV4dGVuc2lvbiIsImdldE51bWJlclR5cGUiLCJnZXRTZWxlY3RlZENvdW50cnlEYXRhIiwiZ2V0VmFsaWRhdGlvbkVycm9yIiwiaXNWYWxpZE51bWJlciIsInNldE51bWJlciIsInNldFBsYWNlaG9sZGVyTnVtYmVyVHlwZSIsImFyZ3MiLCJhcmd1bWVudHMiLCJkZWZlcnJlZHMiLCJlYWNoIiwiZGF0YSIsImluc3RhbmNlIiwiaW5zdGFuY2VEZWZlcnJlZHMiLCJ3aGVuIiwiYXBwbHkiLCJyZXR1cm5zIiwiQXJyYXkiLCJzbGljZSIsImNhbGwiLCJnZXRDb3VudHJ5RGF0YSIsInBhdGgiLCJsb2FkZWRVdGlsc1NjcmlwdCIsImFqYXgiLCJ1cmwiLCJjb21wbGV0ZSIsImRhdGFUeXBlIiwiY2FjaGUiLCJ2ZXJzaW9uIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7OztBQU1BO0FBQ0EsQ0FBQyxVQUFTQSxPQUFULEVBQWtCO0FBQ2YsUUFBSSxPQUFPQyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDQSxPQUFPQyxHQUEzQyxFQUFnRDtBQUM1Q0QsZUFBTyxDQUFFLFFBQUYsQ0FBUCxFQUFxQixVQUFTRSxDQUFULEVBQVk7QUFDN0JILG9CQUFRRyxDQUFSLEVBQVdDLE1BQVgsRUFBbUJDLFFBQW5CO0FBQ0gsU0FGRDtBQUdILEtBSkQsTUFJTyxJQUFJLFFBQU9DLE1BQVAseUNBQU9BLE1BQVAsT0FBa0IsUUFBbEIsSUFBOEJBLE9BQU9DLE9BQXpDLEVBQWtEO0FBQ3JERCxlQUFPQyxPQUFQLEdBQWlCUCxRQUFRUSxRQUFRLFFBQVIsQ0FBUixFQUEyQkosTUFBM0IsRUFBbUNDLFFBQW5DLENBQWpCO0FBQ0gsS0FGTSxNQUVBO0FBQ0hMLGdCQUFRUyxNQUFSLEVBQWdCTCxNQUFoQixFQUF3QkMsUUFBeEI7QUFDSDtBQUNKLENBVkQsRUFVRyxVQUFTRixDQUFULEVBQVlDLE1BQVosRUFBb0JDLFFBQXBCLEVBQThCSyxTQUE5QixFQUF5QztBQUN4QztBQUNBOztBQUNBLFFBQUlDLGFBQWEsY0FBakI7QUFBQSxRQUFp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QixFQUE4QixJQUE5QixDQUE5elIsRUFBbzJSLENBQUUsc0NBQUYsRUFBMEMsSUFBMUMsRUFBZ0QsS0FBaEQsQ0FBcDJSLEVBQTY1UixDQUFFLHFDQUFGLEVBQXlDLElBQXpDLEVBQStDLEtBQS9DLEVBQXNELENBQXRELENBQTc1UixFQUF3OVIsQ0FBRSxrQkFBRixFQUFzQixJQUF0QixFQUE0QixLQUE1QixDQUF4OVIsRUFBNi9SLENBQUUsUUFBRixFQUFZLElBQVosRUFBa0IsS0FBbEIsQ0FBNy9SLEVBQXdoUyxDQUFFLFVBQUYsRUFBYyxJQUFkLEVBQW9CLEtBQXBCLENBQXhoUyxFQUFxalMsQ0FBRSxlQUFGLEVBQW1CLElBQW5CLEVBQXlCLEtBQXpCLEVBQWdDLENBQWhDLENBQXJqUyxDQUFuQjtBQUNBO0FBQ0EsU0FBSyxJQUFJSSxJQUFJLENBQWIsRUFBZ0JBLElBQUlKLGFBQWFOLE1BQWpDLEVBQXlDVSxHQUF6QyxFQUE4QztBQUMxQyxZQUFJQyxJQUFJTCxhQUFhSSxDQUFiLENBQVI7QUFDQUoscUJBQWFJLENBQWIsSUFBa0I7QUFDZHVCLGtCQUFNdEIsRUFBRSxDQUFGLENBRFE7QUFFZGhCLGtCQUFNZ0IsRUFBRSxDQUFGLENBRlE7QUFHZGYsc0JBQVVlLEVBQUUsQ0FBRixDQUhJO0FBSWRkLHNCQUFVYyxFQUFFLENBQUYsS0FBUSxDQUpKO0FBS2RDLHVCQUFXRCxFQUFFLENBQUYsS0FBUTtBQUxMLFNBQWxCO0FBT0g7QUFDSixDQTltQ0QiLCJmaWxlIjoiaW50bFRlbElucHV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEludGVybmF0aW9uYWwgVGVsZXBob25lIElucHV0IHYxMi4xLjBcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qYWNrb2Nuci9pbnRsLXRlbC1pbnB1dC5naXRcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG5cbi8vIHdyYXAgaW4gVU1EIC0gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvanF1ZXJ5UGx1Z2luQ29tbW9uanMuanNcbihmdW5jdGlvbihmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbIFwianF1ZXJ5XCIgXSwgZnVuY3Rpb24oJCkge1xuICAgICAgICAgICAgZmFjdG9yeSgkLCB3aW5kb3csIGRvY3VtZW50KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKFwianF1ZXJ5XCIpLCB3aW5kb3csIGRvY3VtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KGpRdWVyeSwgd2luZG93LCBkb2N1bWVudCk7XG4gICAgfVxufSkoZnVuY3Rpb24oJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgLy8gdGhlc2UgdmFycyBwZXJzaXN0IHRocm91Z2ggYWxsIGluc3RhbmNlcyBvZiB0aGUgcGx1Z2luXG4gICAgdmFyIHBsdWdpbk5hbWUgPSBcImludGxUZWxJbnB1dFwiLCBpZCA9IDEsIC8vIGdpdmUgZWFjaCBpbnN0YW5jZSBpdCdzIG93biBpZCBmb3IgbmFtZXNwYWNlZCBldmVudCBoYW5kbGluZ1xuICAgIGRlZmF1bHRzID0ge1xuICAgICAgICAvLyB3aGV0aGVyIG9yIG5vdCB0byBhbGxvdyB0aGUgZHJvcGRvd25cbiAgICAgICAgYWxsb3dEcm9wZG93bjogdHJ1ZSxcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMganVzdCBhIGRpYWwgY29kZSBpbiB0aGUgaW5wdXQ6IHJlbW92ZSBpdCBvbiBibHVyLCBhbmQgcmUtYWRkIGl0IG9uIGZvY3VzXG4gICAgICAgIGF1dG9IaWRlRGlhbENvZGU6IHRydWUsXG4gICAgICAgIC8vIGFkZCBhIHBsYWNlaG9sZGVyIGluIHRoZSBpbnB1dCB3aXRoIGFuIGV4YW1wbGUgbnVtYmVyIGZvciB0aGUgc2VsZWN0ZWQgY291bnRyeVxuICAgICAgICBhdXRvUGxhY2Vob2xkZXI6IFwicG9saXRlXCIsXG4gICAgICAgIC8vIG1vZGlmeSB0aGUgYXV0byBwbGFjZWhvbGRlclxuICAgICAgICBjdXN0b21QbGFjZWhvbGRlcjogbnVsbCxcbiAgICAgICAgLy8gYXBwZW5kIG1lbnUgdG8gYSBzcGVjaWZpYyBlbGVtZW50XG4gICAgICAgIGRyb3Bkb3duQ29udGFpbmVyOiBcIlwiLFxuICAgICAgICAvLyBkb24ndCBkaXNwbGF5IHRoZXNlIGNvdW50cmllc1xuICAgICAgICBleGNsdWRlQ291bnRyaWVzOiBbXSxcbiAgICAgICAgLy8gZm9ybWF0IHRoZSBpbnB1dCB2YWx1ZSBkdXJpbmcgaW5pdGlhbGlzYXRpb24gYW5kIG9uIHNldE51bWJlclxuICAgICAgICBmb3JtYXRPbkRpc3BsYXk6IHRydWUsXG4gICAgICAgIC8vIGdlb0lwIGxvb2t1cCBmdW5jdGlvblxuICAgICAgICBnZW9JcExvb2t1cDogbnVsbCxcbiAgICAgICAgLy8gaW5qZWN0IGEgaGlkZGVuIGlucHV0IHdpdGggdGhpcyBuYW1lLCBhbmQgb24gc3VibWl0LCBwb3B1bGF0ZSBpdCB3aXRoIHRoZSByZXN1bHQgb2YgZ2V0TnVtYmVyXG4gICAgICAgIGhpZGRlbklucHV0OiBcIlwiLFxuICAgICAgICAvLyBpbml0aWFsIGNvdW50cnlcbiAgICAgICAgaW5pdGlhbENvdW50cnk6IFwiXCIsXG4gICAgICAgIC8vIGRvbid0IGluc2VydCBpbnRlcm5hdGlvbmFsIGRpYWwgY29kZXNcbiAgICAgICAgbmF0aW9uYWxNb2RlOiB0cnVlLFxuICAgICAgICAvLyBkaXNwbGF5IG9ubHkgdGhlc2UgY291bnRyaWVzXG4gICAgICAgIG9ubHlDb3VudHJpZXM6IFtdLFxuICAgICAgICAvLyBudW1iZXIgdHlwZSB0byB1c2UgZm9yIHBsYWNlaG9sZGVyc1xuICAgICAgICBwbGFjZWhvbGRlck51bWJlclR5cGU6IFwiTU9CSUxFXCIsXG4gICAgICAgIC8vIHRoZSBjb3VudHJpZXMgYXQgdGhlIHRvcCBvZiB0aGUgbGlzdC4gZGVmYXVsdHMgdG8gdW5pdGVkIHN0YXRlcyBhbmQgdW5pdGVkIGtpbmdkb21cbiAgICAgICAgcHJlZmVycmVkQ291bnRyaWVzOiBbIFwidXNcIiwgXCJnYlwiIF0sXG4gICAgICAgIC8vIGRpc3BsYXkgdGhlIGNvdW50cnkgZGlhbCBjb2RlIG5leHQgdG8gdGhlIHNlbGVjdGVkIGZsYWcgc28gaXQncyBub3QgcGFydCBvZiB0aGUgdHlwZWQgbnVtYmVyXG4gICAgICAgIHNlcGFyYXRlRGlhbENvZGU6IGZhbHNlLFxuICAgICAgICAvLyBzcGVjaWZ5IHRoZSBwYXRoIHRvIHRoZSBsaWJwaG9uZW51bWJlciBzY3JpcHQgdG8gZW5hYmxlIHZhbGlkYXRpb24vZm9ybWF0dGluZ1xuICAgICAgICB1dGlsc1NjcmlwdDogXCJcIlxuICAgIH0sIGtleXMgPSB7XG4gICAgICAgIFVQOiAzOCxcbiAgICAgICAgRE9XTjogNDAsXG4gICAgICAgIEVOVEVSOiAxMyxcbiAgICAgICAgRVNDOiAyNyxcbiAgICAgICAgUExVUzogNDMsXG4gICAgICAgIEE6IDY1LFxuICAgICAgICBaOiA5MCxcbiAgICAgICAgU1BBQ0U6IDMyLFxuICAgICAgICBUQUI6IDlcbiAgICB9LCAvLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MaXN0X29mX05vcnRoX0FtZXJpY2FuX051bWJlcmluZ19QbGFuX2FyZWFfY29kZXMjTm9uLWdlb2dyYXBoaWNfYXJlYV9jb2Rlc1xuICAgIHJlZ2lvbmxlc3NOYW5wTnVtYmVycyA9IFsgXCI4MDBcIiwgXCI4MjJcIiwgXCI4MzNcIiwgXCI4NDRcIiwgXCI4NTVcIiwgXCI4NjZcIiwgXCI4NzdcIiwgXCI4ODBcIiwgXCI4ODFcIiwgXCI4ODJcIiwgXCI4ODNcIiwgXCI4ODRcIiwgXCI4ODVcIiwgXCI4ODZcIiwgXCI4ODdcIiwgXCI4ODhcIiwgXCI4ODlcIiBdO1xuICAgIC8vIGtlZXAgdHJhY2sgb2YgaWYgdGhlIHdpbmRvdy5sb2FkIGV2ZW50IGhhcyBmaXJlZCBhcyBpbXBvc3NpYmxlIHRvIGNoZWNrIGFmdGVyIHRoZSBmYWN0XG4gICAgJCh3aW5kb3cpLm9uKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVVBEQVRFOiB1c2UgYSBwdWJsaWMgc3RhdGljIGZpZWxkIHNvIHdlIGNhbiBmdWRnZSBpdCBpbiB0aGUgdGVzdHNcbiAgICAgICAgJC5mbltwbHVnaW5OYW1lXS53aW5kb3dMb2FkZWQgPSB0cnVlO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIFBsdWdpbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMudGVsSW5wdXQgPSAkKGVsZW1lbnQpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgICAgICAvLyBldmVudCBuYW1lc3BhY2VcbiAgICAgICAgdGhpcy5ucyA9IFwiLlwiICsgcGx1Z2luTmFtZSArIGlkKys7XG4gICAgICAgIC8vIENocm9tZSwgRkYsIFNhZmFyaSwgSUU5K1xuICAgICAgICB0aGlzLmlzR29vZEJyb3dzZXIgPSBCb29sZWFuKGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UpO1xuICAgICAgICB0aGlzLmhhZEluaXRpYWxQbGFjZWhvbGRlciA9IEJvb2xlYW4oJChlbGVtZW50KS5hdHRyKFwicGxhY2Vob2xkZXJcIikpO1xuICAgIH1cbiAgICBQbHVnaW4ucHJvdG90eXBlID0ge1xuICAgICAgICBfaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBpZiBpbiBuYXRpb25hbE1vZGUsIGRpc2FibGUgb3B0aW9ucyByZWxhdGluZyB0byBkaWFsIGNvZGVzXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLm5hdGlvbmFsTW9kZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdXRvSGlkZURpYWxDb2RlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiBzZXBhcmF0ZURpYWxDb2RlIHRoZW4gZG9lc24ndCBtYWtlIHNlbnNlIHRvIEEpIGluc2VydCBkaWFsIGNvZGUgaW50byBpbnB1dCAoYXV0b0hpZGVEaWFsQ29kZSksIGFuZCBCKSBkaXNwbGF5IG5hdGlvbmFsIG51bWJlcnMgKGJlY2F1c2Ugd2UncmUgZGlzcGxheWluZyB0aGUgY291bnRyeSBkaWFsIGNvZGUgbmV4dCB0byB0aGVtKVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmF1dG9IaWRlRGlhbENvZGUgPSB0aGlzLm9wdGlvbnMubmF0aW9uYWxNb2RlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB3ZSBjYW5ub3QganVzdCB0ZXN0IHNjcmVlbiBzaXplIGFzIHNvbWUgc21hcnRwaG9uZXMvd2Vic2l0ZSBtZXRhIHRhZ3Mgd2lsbCByZXBvcnQgZGVza3RvcCByZXNvbHV0aW9uc1xuICAgICAgICAgICAgLy8gTm90ZTogZm9yIHNvbWUgcmVhc29uIGphc21pbmUgYnJlYWtzIGlmIHlvdSBwdXQgdGhpcyBpbiB0aGUgbWFpbiBQbHVnaW4gZnVuY3Rpb24gd2l0aCB0aGUgcmVzdCBvZiB0aGVzZSBkZWNsYXJhdGlvbnNcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHRhcmdldCBBbmRyb2lkIE1vYmlsZXMgKGFuZCBub3QgVGFibGV0cyksIHdlIG11c3QgZmluZCBcIkFuZHJvaWRcIiBhbmQgXCJNb2JpbGVcIlxuICAgICAgICAgICAgdGhpcy5pc01vYmlsZSA9IC9BbmRyb2lkLitNb2JpbGV8d2ViT1N8aVBob25lfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTW9iaWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gdHJpZ2dlciB0aGUgbW9iaWxlIGRyb3Bkb3duIGNzc1xuICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmFkZENsYXNzKFwiaXRpLW1vYmlsZVwiKTtcbiAgICAgICAgICAgICAgICAvLyBvbiBtb2JpbGUsIHdlIHdhbnQgYSBmdWxsIHNjcmVlbiBkcm9wZG93biwgc28gd2UgbXVzdCBhcHBlbmQgaXQgdG8gdGhlIGJvZHlcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5kcm9wZG93bkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuZHJvcGRvd25Db250YWluZXIgPSBcImJvZHlcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB3ZSByZXR1cm4gdGhlc2UgZGVmZXJyZWQgb2JqZWN0cyBmcm9tIHRoZSBfaW5pdCgpIGNhbGwgc28gdGhleSBjYW4gYmUgd2F0Y2hlZCwgYW5kIHRoZW4gd2UgcmVzb2x2ZSB0aGVtIHdoZW4gZWFjaCBzcGVjaWZpYyByZXF1ZXN0IHJldHVybnNcbiAgICAgICAgICAgIC8vIE5vdGU6IGFnYWluLCBqYXNtaW5lIGJyZWFrcyB3aGVuIEkgcHV0IHRoZXNlIGluIHRoZSBQbHVnaW4gZnVuY3Rpb25cbiAgICAgICAgICAgIHRoaXMuYXV0b0NvdW50cnlEZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB0aGlzLnV0aWxzU2NyaXB0RGVmZXJyZWQgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgLy8gaW4gdmFyaW91cyBzaXR1YXRpb25zIHRoZXJlIGNvdWxkIGJlIG5vIGNvdW50cnkgc2VsZWN0ZWQgaW5pdGlhbGx5LCBidXQgd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFzc3VtZSB0aGlzIHZhcmlhYmxlIGV4aXN0c1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhID0ge307XG4gICAgICAgICAgICAvLyBwcm9jZXNzIGFsbCB0aGUgZGF0YTogb25seUNvdW50cmllcywgZXhjbHVkZUNvdW50cmllcywgcHJlZmVycmVkQ291bnRyaWVzIGV0Y1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc0NvdW50cnlEYXRhKCk7XG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSB0aGUgbWFya3VwXG4gICAgICAgICAgICB0aGlzLl9nZW5lcmF0ZU1hcmt1cCgpO1xuICAgICAgICAgICAgLy8gc2V0IHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBpbnB1dCB2YWx1ZSBhbmQgdGhlIHNlbGVjdGVkIGZsYWdcbiAgICAgICAgICAgIHRoaXMuX3NldEluaXRpYWxTdGF0ZSgpO1xuICAgICAgICAgICAgLy8gc3RhcnQgYWxsIG9mIHRoZSBldmVudCBsaXN0ZW5lcnM6IGF1dG9IaWRlRGlhbENvZGUsIGlucHV0IGtleWRvd24sIHNlbGVjdGVkRmxhZyBjbGlja1xuICAgICAgICAgICAgdGhpcy5faW5pdExpc3RlbmVycygpO1xuICAgICAgICAgICAgLy8gdXRpbHMgc2NyaXB0LCBhbmQgYXV0byBjb3VudHJ5XG4gICAgICAgICAgICB0aGlzLl9pbml0UmVxdWVzdHMoKTtcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgZGVmZXJyZWRzXG4gICAgICAgICAgICByZXR1cm4gWyB0aGlzLmF1dG9Db3VudHJ5RGVmZXJyZWQsIHRoaXMudXRpbHNTY3JpcHREZWZlcnJlZCBdO1xuICAgICAgICB9LFxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcbiAgICogIFBSSVZBVEUgTUVUSE9EU1xuICAgKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIC8vIHByZXBhcmUgYWxsIG9mIHRoZSBjb3VudHJ5IGRhdGEsIGluY2x1ZGluZyBvbmx5Q291bnRyaWVzLCBleGNsdWRlQ291bnRyaWVzIGFuZCBwcmVmZXJyZWRDb3VudHJpZXMgb3B0aW9uc1xuICAgICAgICBfcHJvY2Vzc0NvdW50cnlEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHByb2Nlc3Mgb25seUNvdW50cmllcyBvciBleGNsdWRlQ291bnRyaWVzIGFycmF5IGlmIHByZXNlbnRcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NBbGxDb3VudHJpZXMoKTtcbiAgICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIGNvdW50cnlDb2RlcyBtYXBcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NDb3VudHJ5Q29kZXMoKTtcbiAgICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIHByZWZlcnJlZENvdW50cmllc1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1ByZWZlcnJlZENvdW50cmllcygpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBhZGQgYSBjb3VudHJ5IGNvZGUgdG8gdGhpcy5jb3VudHJ5Q29kZXNcbiAgICAgICAgX2FkZENvdW50cnlDb2RlOiBmdW5jdGlvbihpc28yLCBkaWFsQ29kZSwgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIGlmICghKGRpYWxDb2RlIGluIHRoaXMuY291bnRyeUNvZGVzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUNvZGVzW2RpYWxDb2RlXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGluZGV4ID0gcHJpb3JpdHkgfHwgMDtcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUNvZGVzW2RpYWxDb2RlXVtpbmRleF0gPSBpc28yO1xuICAgICAgICB9LFxuICAgICAgICAvLyBwcm9jZXNzIG9ubHlDb3VudHJpZXMgb3IgZXhjbHVkZUNvdW50cmllcyBhcnJheSBpZiBwcmVzZW50XG4gICAgICAgIF9wcm9jZXNzQWxsQ291bnRyaWVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMub25seUNvdW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG93ZXJDYXNlT25seUNvdW50cmllcyA9IHRoaXMub3B0aW9ucy5vbmx5Q291bnRyaWVzLm1hcChmdW5jdGlvbihjb3VudHJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb3VudHJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudHJpZXMgPSBhbGxDb3VudHJpZXMuZmlsdGVyKGZ1bmN0aW9uKGNvdW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvd2VyQ2FzZU9ubHlDb3VudHJpZXMuaW5kZXhPZihjb3VudHJ5LmlzbzIpID4gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5leGNsdWRlQ291bnRyaWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBsb3dlckNhc2VFeGNsdWRlQ291bnRyaWVzID0gdGhpcy5vcHRpb25zLmV4Y2x1ZGVDb3VudHJpZXMubWFwKGZ1bmN0aW9uKGNvdW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvdW50cnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50cmllcyA9IGFsbENvdW50cmllcy5maWx0ZXIoZnVuY3Rpb24oY291bnRyeSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbG93ZXJDYXNlRXhjbHVkZUNvdW50cmllcy5pbmRleE9mKGNvdW50cnkuaXNvMikgPT09IC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50cmllcyA9IGFsbENvdW50cmllcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gcHJvY2VzcyB0aGUgY291bnRyeUNvZGVzIG1hcFxuICAgICAgICBfcHJvY2Vzc0NvdW50cnlDb2RlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50cnlDb2RlcyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjID0gdGhpcy5jb3VudHJpZXNbaV07XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkQ291bnRyeUNvZGUoYy5pc28yLCBjLmRpYWxDb2RlLCBjLnByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICAvLyBhcmVhIGNvZGVzXG4gICAgICAgICAgICAgICAgaWYgKGMuYXJlYUNvZGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYy5hcmVhQ29kZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZ1bGwgZGlhbCBjb2RlIGlzIGNvdW50cnkgY29kZSArIGRpYWwgY29kZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWRkQ291bnRyeUNvZGUoYy5pc28yLCBjLmRpYWxDb2RlICsgYy5hcmVhQ29kZXNbal0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBwcm9jZXNzIHByZWZlcnJlZCBjb3VudHJpZXMgLSBpdGVyYXRlIHRocm91Z2ggdGhlIHByZWZlcmVuY2VzLCBmZXRjaGluZyB0aGUgY291bnRyeSBkYXRhIGZvciBlYWNoIG9uZVxuICAgICAgICBfcHJvY2Vzc1ByZWZlcnJlZENvdW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnByZWZlcnJlZENvdW50cmllcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMucHJlZmVycmVkQ291bnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvdW50cnlDb2RlID0gdGhpcy5vcHRpb25zLnByZWZlcnJlZENvdW50cmllc1tpXS50b0xvd2VyQ2FzZSgpLCBjb3VudHJ5RGF0YSA9IHRoaXMuX2dldENvdW50cnlEYXRhKGNvdW50cnlDb2RlLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50cnlEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJlZmVycmVkQ291bnRyaWVzLnB1c2goY291bnRyeURhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gZ2VuZXJhdGUgYWxsIG9mIHRoZSBtYXJrdXAgZm9yIHRoZSBwbHVnaW46IHRoZSBzZWxlY3RlZCBmbGFnIG92ZXJsYXksIGFuZCB0aGUgZHJvcGRvd25cbiAgICAgICAgX2dlbmVyYXRlTWFya3VwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgYXV0b2NvbXBsZXRlIGFzIHRoZXJlJ3Mgbm8gc2FmZSwgY3Jvc3MtYnJvd3NlciBldmVudCB3ZSBjYW4gcmVhY3QgdG8sIHNvIGl0IGNhbiBlYXNpbHkgcHV0IHRoZSBwbHVnaW4gaW4gYW4gaW5jb25zaXN0ZW50IHN0YXRlIGUuZy4gdGhlIHdyb25nIGZsYWcgc2VsZWN0ZWQgZm9yIHRoZSBhdXRvY29tcGxldGVkIG51bWJlciwgd2hpY2ggb24gc3VibWl0IGNvdWxkIG1lYW4gdGhlIHdyb25nIG51bWJlciBpcyBzYXZlZCAoZXNwIGluIG5hdGlvbmFsTW9kZSlcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQuYXR0cihcImF1dG9jb21wbGV0ZVwiLCBcIm9mZlwiKTtcbiAgICAgICAgICAgIC8vIGNvbnRhaW5lcnMgKG1vc3RseSBmb3IgcG9zaXRpb25pbmcpXG4gICAgICAgICAgICB2YXIgcGFyZW50Q2xhc3MgPSBcImludGwtdGVsLWlucHV0XCI7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsbG93RHJvcGRvd24pIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRDbGFzcyArPSBcIiBhbGxvdy1kcm9wZG93blwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50Q2xhc3MgKz0gXCIgc2VwYXJhdGUtZGlhbC1jb2RlXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRlbElucHV0LndyYXAoJChcIjxkaXY+XCIsIHtcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IHBhcmVudENsYXNzXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLmZsYWdzQ29udGFpbmVyID0gJChcIjxkaXY+XCIsIHtcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiZmxhZy1jb250YWluZXJcIlxuICAgICAgICAgICAgfSkuaW5zZXJ0QmVmb3JlKHRoaXMudGVsSW5wdXQpO1xuICAgICAgICAgICAgLy8gY3VycmVudGx5IHNlbGVjdGVkIGZsYWcgKGRpc3BsYXllZCB0byBsZWZ0IG9mIGlucHV0KVxuICAgICAgICAgICAgdmFyIHNlbGVjdGVkRmxhZyA9ICQoXCI8ZGl2PlwiLCB7XG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcInNlbGVjdGVkLWZsYWdcIlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZWxlY3RlZEZsYWcuYXBwZW5kVG8odGhpcy5mbGFnc0NvbnRhaW5lcik7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkRmxhZ0lubmVyID0gJChcIjxkaXY+XCIsIHtcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiaXRpLWZsYWdcIlxuICAgICAgICAgICAgfSkuYXBwZW5kVG8oc2VsZWN0ZWRGbGFnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2VwYXJhdGVEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWREaWFsQ29kZSA9ICQoXCI8ZGl2PlwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJzZWxlY3RlZC1kaWFsLWNvZGVcIlxuICAgICAgICAgICAgICAgIH0pLmFwcGVuZFRvKHNlbGVjdGVkRmxhZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsbG93RHJvcGRvd24pIHtcbiAgICAgICAgICAgICAgICAvLyBtYWtlIGVsZW1lbnQgZm9jdXNhYmxlIGFuZCB0YWIgbmF2aWFnYWJsZVxuICAgICAgICAgICAgICAgIHNlbGVjdGVkRmxhZy5hdHRyKFwidGFiaW5kZXhcIiwgXCIwXCIpO1xuICAgICAgICAgICAgICAgIC8vIENTUyB0cmlhbmdsZVxuICAgICAgICAgICAgICAgICQoXCI8ZGl2PlwiLCB7XG4gICAgICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJpdGktYXJyb3dcIlxuICAgICAgICAgICAgICAgIH0pLmFwcGVuZFRvKHNlbGVjdGVkRmxhZyk7XG4gICAgICAgICAgICAgICAgLy8gY291bnRyeSBkcm9wZG93bjogcHJlZmVycmVkIGNvdW50cmllcywgdGhlbiBkaXZpZGVyLCB0aGVuIGFsbCBjb3VudHJpZXNcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50cnlMaXN0ID0gJChcIjx1bD5cIiwge1xuICAgICAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiY291bnRyeS1saXN0IGhpZGVcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByZWZlcnJlZENvdW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kTGlzdEl0ZW1zKHRoaXMucHJlZmVycmVkQ291bnRyaWVzLCBcInByZWZlcnJlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgJChcIjxsaT5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImRpdmlkZXJcIlxuICAgICAgICAgICAgICAgICAgICB9KS5hcHBlbmRUbyh0aGlzLmNvdW50cnlMaXN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kTGlzdEl0ZW1zKHRoaXMuY291bnRyaWVzLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHVzZWZ1bCBpbiBsb3RzIG9mIHBsYWNlc1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3RJdGVtcyA9IHRoaXMuY291bnRyeUxpc3QuY2hpbGRyZW4oXCIuY291bnRyeVwiKTtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgZHJvcGRvd25Db250YWluZXIgbWFya3VwXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kcm9wZG93bkNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duID0gJChcIjxkaXY+XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJpbnRsLXRlbC1pbnB1dCBpdGktY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgfSkuYXBwZW5kKHRoaXMuY291bnRyeUxpc3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3QuYXBwZW5kVG8odGhpcy5mbGFnc0NvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhIGxpdHRsZSBoYWNrIHNvIHdlIGRvbid0IGJyZWFrIGFueXRoaW5nXG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdEl0ZW1zID0gJCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oaWRkZW5JbnB1dCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZGVuSW5wdXQgPSAkKFwiPGlucHV0PlwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiaGlkZGVuXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMub3B0aW9ucy5oaWRkZW5JbnB1dFxuICAgICAgICAgICAgICAgIH0pLmluc2VydEJlZm9yZSh0aGlzLnRlbElucHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gYWRkIGEgY291bnRyeSA8bGk+IHRvIHRoZSBjb3VudHJ5TGlzdCA8dWw+IGNvbnRhaW5lclxuICAgICAgICBfYXBwZW5kTGlzdEl0ZW1zOiBmdW5jdGlvbihjb3VudHJpZXMsIGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgLy8gd2UgY3JlYXRlIHNvIG1hbnkgRE9NIGVsZW1lbnRzLCBpdCBpcyBmYXN0ZXIgdG8gYnVpbGQgYSB0ZW1wIHN0cmluZ1xuICAgICAgICAgICAgLy8gYW5kIHRoZW4gYWRkIGV2ZXJ5dGhpbmcgdG8gdGhlIERPTSBpbiBvbmUgZ28gYXQgdGhlIGVuZFxuICAgICAgICAgICAgdmFyIHRtcCA9IFwiXCI7XG4gICAgICAgICAgICAvLyBmb3IgZWFjaCBjb3VudHJ5XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjID0gY291bnRyaWVzW2ldO1xuICAgICAgICAgICAgICAgIC8vIG9wZW4gdGhlIGxpc3QgaXRlbVxuICAgICAgICAgICAgICAgIHRtcCArPSBcIjxsaSBjbGFzcz0nY291bnRyeSBcIiArIGNsYXNzTmFtZSArIFwiJyBkYXRhLWRpYWwtY29kZT0nXCIgKyBjLmRpYWxDb2RlICsgXCInIGRhdGEtY291bnRyeS1jb2RlPSdcIiArIGMuaXNvMiArIFwiJz5cIjtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIGZsYWdcbiAgICAgICAgICAgICAgICB0bXAgKz0gXCI8ZGl2IGNsYXNzPSdmbGFnLWJveCc+PGRpdiBjbGFzcz0naXRpLWZsYWcgXCIgKyBjLmlzbzIgKyBcIic+PC9kaXY+PC9kaXY+XCI7XG4gICAgICAgICAgICAgICAgLy8gYW5kIHRoZSBjb3VudHJ5IG5hbWUgYW5kIGRpYWwgY29kZVxuICAgICAgICAgICAgICAgIHRtcCArPSBcIjxzcGFuIGNsYXNzPSdjb3VudHJ5LW5hbWUnPlwiICsgYy5uYW1lICsgXCI8L3NwYW4+XCI7XG4gICAgICAgICAgICAgICAgdG1wICs9IFwiPHNwYW4gY2xhc3M9J2RpYWwtY29kZSc+K1wiICsgYy5kaWFsQ29kZSArIFwiPC9zcGFuPlwiO1xuICAgICAgICAgICAgICAgIC8vIGNsb3NlIHRoZSBsaXN0IGl0ZW1cbiAgICAgICAgICAgICAgICB0bXAgKz0gXCI8L2xpPlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdC5hcHBlbmQodG1wKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gc2V0IHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBpbnB1dCB2YWx1ZSBhbmQgdGhlIHNlbGVjdGVkIGZsYWcgYnk6XG4gICAgICAgIC8vIDEuIGV4dHJhY3RpbmcgYSBkaWFsIGNvZGUgZnJvbSB0aGUgZ2l2ZW4gbnVtYmVyXG4gICAgICAgIC8vIDIuIHVzaW5nIGV4cGxpY2l0IGluaXRpYWxDb3VudHJ5XG4gICAgICAgIC8vIDMuIHBpY2tpbmcgdGhlIGZpcnN0IHByZWZlcnJlZCBjb3VudHJ5XG4gICAgICAgIC8vIDQuIHBpY2tpbmcgdGhlIGZpcnN0IGNvdW50cnlcbiAgICAgICAgX3NldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gdGhpcy50ZWxJbnB1dC52YWwoKTtcbiAgICAgICAgICAgIC8vIGlmIHdlIGFscmVhZHkgaGF2ZSBhIGRpYWwgY29kZSwgYW5kIGl0J3Mgbm90IGEgcmVnaW9ubGVzc05hbnAsIHdlIGNhbiBnbyBhaGVhZCBhbmQgc2V0IHRoZSBmbGFnLCBlbHNlIGZhbGwgYmFjayB0byB0aGUgZGVmYXVsdCBjb3VudHJ5XG4gICAgICAgICAgICAvLyBVUERBVEU6IGFjdHVhbGx5IHdlIGRvIHdhbnQgdG8gc2V0IHRoZSBmbGFnIGZvciBhIHJlZ2lvbmxlc3NOYW5wIGluIG9uZSBzaXR1YXRpb246IGlmIHdlJ3JlIGluIG5hdGlvbmFsTW9kZSBhbmQgdGhlcmUncyBubyBpbml0aWFsQ291bnRyeSAtIG90aGVyd2lzZSB3ZSBsb3NlIHRoZSArMSBhbmQgd2UncmUgbGVmdCB3aXRoIGFuIGludmFsaWQgbnVtYmVyXG4gICAgICAgICAgICBpZiAodGhpcy5fZ2V0RGlhbENvZGUodmFsKSAmJiAoIXRoaXMuX2lzUmVnaW9ubGVzc05hbnAodmFsKSB8fCB0aGlzLm9wdGlvbnMubmF0aW9uYWxNb2RlICYmICF0aGlzLm9wdGlvbnMuaW5pdGlhbENvdW50cnkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlRmxhZ0Zyb21OdW1iZXIodmFsKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmluaXRpYWxDb3VudHJ5ICE9PSBcImF1dG9cIikge1xuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBzaG91bGQgc2VsZWN0IGEgZmxhZ1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaW5pdGlhbENvdW50cnkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RmxhZyh0aGlzLm9wdGlvbnMuaW5pdGlhbENvdW50cnkudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gZGlhbCBjb2RlIGFuZCBubyBpbml0aWFsQ291bnRyeSwgc28gZGVmYXVsdCB0byBmaXJzdCBpbiBsaXN0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdENvdW50cnkgPSB0aGlzLnByZWZlcnJlZENvdW50cmllcy5sZW5ndGggPyB0aGlzLnByZWZlcnJlZENvdW50cmllc1swXS5pc28yIDogdGhpcy5jb3VudHJpZXNbMF0uaXNvMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldEZsYWcodGhpcy5kZWZhdWx0Q291bnRyeSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gaWYgZW1wdHkgYW5kIG5vIG5hdGlvbmFsTW9kZSBhbmQgbm8gYXV0b0hpZGVEaWFsQ29kZSB0aGVuIGluc2VydCB0aGUgZGVmYXVsdCBkaWFsIGNvZGVcbiAgICAgICAgICAgICAgICBpZiAoIXZhbCAmJiAhdGhpcy5vcHRpb25zLm5hdGlvbmFsTW9kZSAmJiAhdGhpcy5vcHRpb25zLmF1dG9IaWRlRGlhbENvZGUgJiYgIXRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudmFsKFwiK1wiICsgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOT1RFOiBpZiBpbml0aWFsQ291bnRyeSBpcyBzZXQgdG8gYXV0bywgdGhhdCB3aWxsIGJlIGhhbmRsZWQgc2VwYXJhdGVseVxuICAgICAgICAgICAgLy8gZm9ybWF0XG4gICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyB3b250IGJlIHJ1biBhZnRlciBfdXBkYXRlRGlhbENvZGUgYXMgdGhhdCdzIG9ubHkgY2FsbGVkIGlmIG5vIHZhbFxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZhbEZyb21OdW1iZXIodmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gaW5pdGlhbGlzZSB0aGUgbWFpbiBldmVudCBsaXN0ZW5lcnM6IGlucHV0IGtleXVwLCBhbmQgY2xpY2sgc2VsZWN0ZWQgZmxhZ1xuICAgICAgICBfaW5pdExpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0S2V5TGlzdGVuZXJzKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9IaWRlRGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0Rm9jdXNMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxsb3dEcm9wZG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luaXREcm9wZG93bkxpc3RlbmVycygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaGlkZGVuSW5wdXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0SGlkZGVuSW5wdXRMaXN0ZW5lcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyB1cGRhdGUgaGlkZGVuIGlucHV0IG9uIGZvcm0gc3VibWl0XG4gICAgICAgIF9pbml0SGlkZGVuSW5wdXRMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgZm9ybSA9IHRoaXMudGVsSW5wdXQuY2xvc2VzdChcImZvcm1cIik7XG4gICAgICAgICAgICBpZiAoZm9ybS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3JtLnN1Ym1pdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5oaWRkZW5JbnB1dC52YWwodGhhdC5nZXROdW1iZXIoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGluaXRpYWxpc2UgdGhlIGRyb3Bkb3duIGxpc3RlbmVyc1xuICAgICAgICBfaW5pdERyb3Bkb3duTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIC8vIGhhY2sgZm9yIGlucHV0IG5lc3RlZCBpbnNpZGUgbGFiZWw6IGNsaWNraW5nIHRoZSBzZWxlY3RlZC1mbGFnIHRvIG9wZW4gdGhlIGRyb3Bkb3duIHdvdWxkIHRoZW4gYXV0b21hdGljYWxseSB0cmlnZ2VyIGEgMm5kIGNsaWNrIG9uIHRoZSBpbnB1dCB3aGljaCB3b3VsZCBjbG9zZSBpdCBhZ2FpblxuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy50ZWxJbnB1dC5jbG9zZXN0KFwibGFiZWxcIik7XG4gICAgICAgICAgICBpZiAobGFiZWwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwub24oXCJjbGlja1wiICsgdGhpcy5ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgZHJvcGRvd24gaXMgY2xvc2VkLCB0aGVuIGZvY3VzIHRoZSBpbnB1dCwgZWxzZSBpZ25vcmUgdGhlIGNsaWNrXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LmNvdW50cnlMaXN0Lmhhc0NsYXNzKFwiaGlkZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC50ZWxJbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0b2dnbGUgY291bnRyeSBkcm9wZG93biBvbiBjbGlja1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkRmxhZyA9IHRoaXMuc2VsZWN0ZWRGbGFnSW5uZXIucGFyZW50KCk7XG4gICAgICAgICAgICBzZWxlY3RlZEZsYWcub24oXCJjbGlja1wiICsgdGhpcy5ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIC8vIG9ubHkgaW50ZXJjZXB0IHRoaXMgZXZlbnQgaWYgd2UncmUgb3BlbmluZyB0aGUgZHJvcGRvd25cbiAgICAgICAgICAgICAgICAvLyBlbHNlIGxldCBpdCBidWJibGUgdXAgdG8gdGhlIHRvcCAoXCJjbGljay1vZmYtdG8tY2xvc2VcIiBsaXN0ZW5lcilcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW5ub3QganVzdCBzdG9wUHJvcGFnYXRpb24gYXMgaXQgbWF5IGJlIG5lZWRlZCB0byBjbG9zZSBhbm90aGVyIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuY291bnRyeUxpc3QuaGFzQ2xhc3MoXCJoaWRlXCIpICYmICF0aGF0LnRlbElucHV0LnByb3AoXCJkaXNhYmxlZFwiKSAmJiAhdGhhdC50ZWxJbnB1dC5wcm9wKFwicmVhZG9ubHlcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2hvd0Ryb3Bkb3duKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBvcGVuIGRyb3Bkb3duIGxpc3QgaWYgY3VycmVudGx5IGZvY3VzZWRcbiAgICAgICAgICAgIHRoaXMuZmxhZ3NDb250YWluZXIub24oXCJrZXlkb3duXCIgKyB0aGF0Lm5zLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzRHJvcGRvd25IaWRkZW4gPSB0aGF0LmNvdW50cnlMaXN0Lmhhc0NsYXNzKFwiaGlkZVwiKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNEcm9wZG93bkhpZGRlbiAmJiAoZS53aGljaCA9PSBrZXlzLlVQIHx8IGUud2hpY2ggPT0ga2V5cy5ET1dOIHx8IGUud2hpY2ggPT0ga2V5cy5TUEFDRSB8fCBlLndoaWNoID09IGtleXMuRU5URVIpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgZm9ybSBmcm9tIGJlaW5nIHN1Ym1pdHRlZCBpZiBcIkVOVEVSXCIgd2FzIHByZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBwcmV2ZW50IGV2ZW50IGZyb20gYmVpbmcgaGFuZGxlZCBhZ2FpbiBieSBkb2N1bWVudFxuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zaG93RHJvcGRvd24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYWxsb3cgbmF2aWdhdGlvbiBmcm9tIGRyb3Bkb3duIHRvIGlucHV0IG9uIFRBQlxuICAgICAgICAgICAgICAgIGlmIChlLndoaWNoID09IGtleXMuVEFCKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2Nsb3NlRHJvcGRvd24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gaW5pdCBtYW55IHJlcXVlc3RzOiB1dGlscyBzY3JpcHQgLyBnZW8gaXAgbG9va3VwXG4gICAgICAgIF9pbml0UmVxdWVzdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgLy8gaWYgdGhlIHVzZXIgaGFzIHNwZWNpZmllZCB0aGUgcGF0aCB0byB0aGUgdXRpbHMgc2NyaXB0LCBmZXRjaCBpdCBvbiB3aW5kb3cubG9hZCwgZWxzZSByZXNvbHZlXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnV0aWxzU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIHBsdWdpbiBpcyBiZWluZyBpbml0aWFsaXNlZCBhZnRlciB0aGUgd2luZG93LmxvYWQgZXZlbnQgaGFzIGFscmVhZHkgYmVlbiBmaXJlZFxuICAgICAgICAgICAgICAgIGlmICgkLmZuW3BsdWdpbk5hbWVdLndpbmRvd0xvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAkLmZuW3BsdWdpbk5hbWVdLmxvYWRVdGlscyh0aGlzLm9wdGlvbnMudXRpbHNTY3JpcHQsIHRoaXMudXRpbHNTY3JpcHREZWZlcnJlZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gd2FpdCB1bnRpbCB0aGUgbG9hZCBldmVudCBzbyB3ZSBkb24ndCBibG9jayBhbnkgb3RoZXIgcmVxdWVzdHMgZS5nLiB0aGUgZmxhZ3MgaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgJCh3aW5kb3cpLm9uKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZm5bcGx1Z2luTmFtZV0ubG9hZFV0aWxzKHRoYXQub3B0aW9ucy51dGlsc1NjcmlwdCwgdGhhdC51dGlsc1NjcmlwdERlZmVycmVkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnV0aWxzU2NyaXB0RGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbml0aWFsQ291bnRyeSA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2FkQXV0b0NvdW50cnkoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdXRvQ291bnRyeURlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gcGVyZm9ybSB0aGUgZ2VvIGlwIGxvb2t1cFxuICAgICAgICBfbG9hZEF1dG9Db3VudHJ5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIC8vIDMgb3B0aW9uczpcbiAgICAgICAgICAgIC8vIDEpIGFscmVhZHkgbG9hZGVkICh3ZSdyZSBkb25lKVxuICAgICAgICAgICAgLy8gMikgbm90IGFscmVhZHkgc3RhcnRlZCBsb2FkaW5nIChzdGFydClcbiAgICAgICAgICAgIC8vIDMpIGFscmVhZHkgc3RhcnRlZCBsb2FkaW5nIChkbyBub3RoaW5nIC0ganVzdCB3YWl0IGZvciBsb2FkaW5nIGNhbGxiYWNrIHRvIGZpcmUpXG4gICAgICAgICAgICBpZiAoJC5mbltwbHVnaW5OYW1lXS5hdXRvQ291bnRyeSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlQXV0b0NvdW50cnkoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoISQuZm5bcGx1Z2luTmFtZV0uc3RhcnRlZExvYWRpbmdBdXRvQ291bnRyeSkge1xuICAgICAgICAgICAgICAgIC8vIGRvbid0IGRvIHRoaXMgdHdpY2UhXG4gICAgICAgICAgICAgICAgJC5mbltwbHVnaW5OYW1lXS5zdGFydGVkTG9hZGluZ0F1dG9Db3VudHJ5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5nZW9JcExvb2t1cCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5nZW9JcExvb2t1cChmdW5jdGlvbihjb3VudHJ5Q29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJC5mbltwbHVnaW5OYW1lXS5hdXRvQ291bnRyeSA9IGNvdW50cnlDb2RlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZWxsIGFsbCBpbnN0YW5jZXMgdGhlIGF1dG8gY291bnRyeSBpcyByZWFkeVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogdGhpcyBzaG91bGQganVzdCBiZSB0aGUgY3VycmVudCBpbnN0YW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVQREFURTogdXNlIHNldFRpbWVvdXQgaW4gY2FzZSB0aGVpciBnZW9JcExvb2t1cCBmdW5jdGlvbiBjYWxscyB0aGlzIGNhbGxiYWNrIHN0cmFpZ2h0IGF3YXkgKGUuZy4gaWYgdGhleSBoYXZlIGFscmVhZHkgZG9uZSB0aGUgZ2VvIGlwIGxvb2t1cCBzb21ld2hlcmUgZWxzZSkuIFVzaW5nIHNldFRpbWVvdXQgbWVhbnMgdGhhdCB0aGUgY3VycmVudCB0aHJlYWQgb2YgZXhlY3V0aW9uIHdpbGwgZmluaXNoIGJlZm9yZSBleGVjdXRpbmcgdGhpcywgd2hpY2ggYWxsb3dzIHRoZSBwbHVnaW4gdG8gZmluaXNoIGluaXRpYWxpc2luZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChcIi5pbnRsLXRlbC1pbnB1dCBpbnB1dFwiKS5pbnRsVGVsSW5wdXQoXCJoYW5kbGVBdXRvQ291bnRyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGluaXRpYWxpemUgYW55IGtleSBsaXN0ZW5lcnNcbiAgICAgICAgX2luaXRLZXlMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgLy8gdXBkYXRlIGZsYWcgb24ga2V5dXBcbiAgICAgICAgICAgIC8vIChrZWVwIHRoaXMgbGlzdGVuZXIgc2VwYXJhdGUgb3RoZXJ3aXNlIHRoZSBzZXRUaW1lb3V0IGJyZWFrcyBhbGwgdGhlIHRlc3RzKVxuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5vbihcImtleXVwXCIgKyB0aGlzLm5zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5fdXBkYXRlRmxhZ0Zyb21OdW1iZXIodGhhdC50ZWxJbnB1dC52YWwoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fdHJpZ2dlckNvdW50cnlDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBmbGFnIG9uIGN1dC9wYXN0ZSBldmVudHMgKG5vdyBzdXBwb3J0ZWQgaW4gYWxsIG1ham9yIGJyb3dzZXJzKVxuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5vbihcImN1dFwiICsgdGhpcy5ucyArIFwiIHBhc3RlXCIgKyB0aGlzLm5zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBoYWNrIGJlY2F1c2UgXCJwYXN0ZVwiIGV2ZW50IGlzIGZpcmVkIGJlZm9yZSBpbnB1dCBpcyB1cGRhdGVkXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuX3VwZGF0ZUZsYWdGcm9tTnVtYmVyKHRoYXQudGVsSW5wdXQudmFsKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll90cmlnZ2VyQ291bnRyeUNoYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gYWRoZXJlIHRvIHRoZSBpbnB1dCdzIG1heGxlbmd0aCBhdHRyXG4gICAgICAgIF9jYXA6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIG1heCA9IHRoaXMudGVsSW5wdXQuYXR0cihcIm1heGxlbmd0aFwiKTtcbiAgICAgICAgICAgIHJldHVybiBtYXggJiYgbnVtYmVyLmxlbmd0aCA+IG1heCA/IG51bWJlci5zdWJzdHIoMCwgbWF4KSA6IG51bWJlcjtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gbGlzdGVuIGZvciBtb3VzZWRvd24sIGZvY3VzIGFuZCBibHVyXG4gICAgICAgIF9pbml0Rm9jdXNMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgLy8gbW91c2Vkb3duIGRlY2lkZXMgd2hlcmUgdGhlIGN1cnNvciBnb2VzLCBzbyBpZiB3ZSdyZSBmb2N1c2luZyB3ZSBtdXN0IHByZXZlbnREZWZhdWx0IGFzIHdlJ2xsIGJlIGluc2VydGluZyB0aGUgZGlhbCBjb2RlLCBhbmQgd2Ugd2FudCB0aGUgY3Vyc29yIHRvIGJlIGF0IHRoZSBlbmQgbm8gbWF0dGVyIHdoZXJlIHRoZXkgY2xpY2tcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQub24oXCJtb3VzZWRvd25cIiArIHRoaXMubnMsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoYXQudGVsSW5wdXQuaXMoXCI6Zm9jdXNcIikgJiYgIXRoYXQudGVsSW5wdXQudmFsKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBidXQgdGhpcyBhbHNvIGNhbmNlbHMgdGhlIGZvY3VzLCBzbyB3ZSBtdXN0IHRyaWdnZXIgdGhhdCBtYW51YWxseVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnRlbElucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBvbiBmb2N1czogaWYgZW1wdHksIGluc2VydCB0aGUgZGlhbCBjb2RlIGZvciB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGZsYWdcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQub24oXCJmb2N1c1wiICsgdGhpcy5ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhhdC50ZWxJbnB1dC52YWwoKSAmJiAhdGhhdC50ZWxJbnB1dC5wcm9wKFwicmVhZG9ubHlcIikgJiYgdGhhdC5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGluc2VydCB0aGUgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgICAgIHRoYXQudGVsSW5wdXQudmFsKFwiK1wiICsgdGhhdC5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgYXV0by1pbnNlcnRpbmcgYSBkaWFsIGNvZGUsIGlmIHRoZSBmaXJzdCBrZXkgdGhleSBoaXQgaXMgJysnIHRoZW4gYXNzdW1lIHRoZXkgYXJlIGVudGVyaW5nIGEgbmV3IG51bWJlciwgc28gcmVtb3ZlIHRoZSBkaWFsIGNvZGUuIHVzZSBrZXlwcmVzcyBpbnN0ZWFkIG9mIGtleWRvd24gYmVjYXVzZSBrZXlkb3duIGdldHMgdHJpZ2dlcmVkIGZvciB0aGUgc2hpZnQga2V5IChyZXF1aXJlZCB0byBoaXQgdGhlICsga2V5KSwgYW5kIGluc3RlYWQgb2Yga2V5dXAgYmVjYXVzZSB0aGF0IHNob3dzIHRoZSBuZXcgJysnIGJlZm9yZSByZW1vdmluZyB0aGUgb2xkIG9uZVxuICAgICAgICAgICAgICAgICAgICB0aGF0LnRlbElucHV0Lm9uZShcImtleXByZXNzLnBsdXNcIiArIHRoYXQubnMsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLndoaWNoID09IGtleXMuUExVUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudGVsSW5wdXQudmFsKFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWZ0ZXIgdGFiYmluZyBpbiwgbWFrZSBzdXJlIHRoZSBjdXJzb3IgaXMgYXQgdGhlIGVuZCB3ZSBtdXN0IHVzZSBzZXRUaW1lb3V0IHRvIGdldCBvdXRzaWRlIG9mIHRoZSBmb2N1cyBoYW5kbGVyIGFzIGl0IHNlZW1zIHRoZSBzZWxlY3Rpb24gaGFwcGVucyBhZnRlciB0aGF0XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGF0LnRlbElucHV0WzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuaXNHb29kQnJvd3Nlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSB0aGF0LnRlbElucHV0LnZhbCgpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5zZXRTZWxlY3Rpb25SYW5nZShsZW4sIGxlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gb24gYmx1ciBvciBmb3JtIHN1Ym1pdDogaWYganVzdCBhIGRpYWwgY29kZSB0aGVuIHJlbW92ZSBpdFxuICAgICAgICAgICAgdmFyIGZvcm0gPSB0aGlzLnRlbElucHV0LnByb3AoXCJmb3JtXCIpO1xuICAgICAgICAgICAgaWYgKGZvcm0pIHtcbiAgICAgICAgICAgICAgICAkKGZvcm0pLm9uKFwic3VibWl0XCIgKyB0aGlzLm5zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fcmVtb3ZlRW1wdHlEaWFsQ29kZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC5vbihcImJsdXJcIiArIHRoaXMubnMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoYXQuX3JlbW92ZUVtcHR5RGlhbENvZGUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBfcmVtb3ZlRW1wdHlEaWFsQ29kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnRlbElucHV0LnZhbCgpLCBzdGFydHNQbHVzID0gdmFsdWUuY2hhckF0KDApID09IFwiK1wiO1xuICAgICAgICAgICAgaWYgKHN0YXJ0c1BsdXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbnVtZXJpYyA9IHRoaXMuX2dldE51bWVyaWModmFsdWUpO1xuICAgICAgICAgICAgICAgIC8vIGlmIGp1c3QgYSBwbHVzLCBvciBpZiBqdXN0IGEgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgaWYgKCFudW1lcmljIHx8IHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5kaWFsQ29kZSA9PSBudW1lcmljKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudmFsKFwiXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUga2V5cHJlc3MgbGlzdGVuZXIgd2UgYWRkZWQgb24gZm9jdXNcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQub2ZmKFwia2V5cHJlc3MucGx1c1wiICsgdGhpcy5ucyk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIG51bWVyaWMgZGlnaXRzIGZyb20gdGhlIGdpdmVuIHN0cmluZ1xuICAgICAgICBfZ2V0TnVtZXJpYzogZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXFxEL2csIFwiXCIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBzaG93IHRoZSBkcm9wZG93blxuICAgICAgICBfc2hvd0Ryb3Bkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldERyb3Bkb3duUG9zaXRpb24oKTtcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBoaWdobGlnaHRpbmcgYW5kIHNjcm9sbCB0byBhY3RpdmUgbGlzdCBpdGVtXG4gICAgICAgICAgICB2YXIgYWN0aXZlTGlzdEl0ZW0gPSB0aGlzLmNvdW50cnlMaXN0LmNoaWxkcmVuKFwiLmFjdGl2ZVwiKTtcbiAgICAgICAgICAgIGlmIChhY3RpdmVMaXN0SXRlbS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWdobGlnaHRMaXN0SXRlbShhY3RpdmVMaXN0SXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsVG8oYWN0aXZlTGlzdEl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gYmluZCBhbGwgdGhlIGRyb3Bkb3duLXJlbGF0ZWQgbGlzdGVuZXJzOiBtb3VzZW92ZXIsIGNsaWNrLCBjbGljay1vZmYsIGtleWRvd25cbiAgICAgICAgICAgIHRoaXMuX2JpbmREcm9wZG93bkxpc3RlbmVycygpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBhcnJvd1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEZsYWdJbm5lci5jaGlsZHJlbihcIi5pdGktYXJyb3dcIikuYWRkQ2xhc3MoXCJ1cFwiKTtcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudHJpZ2dlcihcIm9wZW46Y291bnRyeWRyb3Bkb3duXCIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBkZWNpZGUgd2hlcmUgdG8gcG9zaXRpb24gZHJvcGRvd24gKGRlcGVuZHMgb24gcG9zaXRpb24gd2l0aGluIHZpZXdwb3J0LCBhbmQgc2Nyb2xsKVxuICAgICAgICBfc2V0RHJvcGRvd25Qb3NpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyb3Bkb3duQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bi5hcHBlbmRUbyh0aGlzLm9wdGlvbnMuZHJvcGRvd25Db250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2hvdyB0aGUgbWVudSBhbmQgZ3JhYiB0aGUgZHJvcGRvd24gaGVpZ2h0XG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duSGVpZ2h0ID0gdGhpcy5jb3VudHJ5TGlzdC5yZW1vdmVDbGFzcyhcImhpZGVcIikub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc01vYmlsZSkge1xuICAgICAgICAgICAgICAgIHZhciBwb3MgPSB0aGlzLnRlbElucHV0Lm9mZnNldCgpLCBpbnB1dFRvcCA9IHBvcy50b3AsIHdpbmRvd1RvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKSwgLy8gZHJvcGRvd25GaXRzQmVsb3cgPSAoZHJvcGRvd25Cb3R0b20gPCB3aW5kb3dCb3R0b20pXG4gICAgICAgICAgICAgICAgZHJvcGRvd25GaXRzQmVsb3cgPSBpbnB1dFRvcCArIHRoaXMudGVsSW5wdXQub3V0ZXJIZWlnaHQoKSArIHRoaXMuZHJvcGRvd25IZWlnaHQgPCB3aW5kb3dUb3AgKyAkKHdpbmRvdykuaGVpZ2h0KCksIGRyb3Bkb3duRml0c0Fib3ZlID0gaW5wdXRUb3AgLSB0aGlzLmRyb3Bkb3duSGVpZ2h0ID4gd2luZG93VG9wO1xuICAgICAgICAgICAgICAgIC8vIGJ5IGRlZmF1bHQsIHRoZSBkcm9wZG93biB3aWxsIGJlIGJlbG93IHRoZSBpbnB1dC4gSWYgd2Ugd2FudCB0byBwb3NpdGlvbiBpdCBhYm92ZSB0aGUgaW5wdXQsIHdlIGFkZCB0aGUgZHJvcHVwIGNsYXNzLlxuICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3QudG9nZ2xlQ2xhc3MoXCJkcm9wdXBcIiwgIWRyb3Bkb3duRml0c0JlbG93ICYmIGRyb3Bkb3duRml0c0Fib3ZlKTtcbiAgICAgICAgICAgICAgICAvLyBpZiBkcm9wZG93bkNvbnRhaW5lciBpcyBlbmFibGVkLCBjYWxjdWxhdGUgcG9zdGlvblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZHJvcGRvd25Db250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYnkgZGVmYXVsdCB0aGUgZHJvcGRvd24gd2lsbCBiZSBkaXJlY3RseSBvdmVyIHRoZSBpbnB1dCBiZWNhdXNlIGl0J3Mgbm90IGluIHRoZSBmbG93LiBJZiB3ZSB3YW50IHRvIHBvc2l0aW9uIGl0IGJlbG93LCB3ZSBuZWVkIHRvIGFkZCBzb21lIGV4dHJhIHRvcCB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhVG9wID0gIWRyb3Bkb3duRml0c0JlbG93ICYmIGRyb3Bkb3duRml0c0Fib3ZlID8gMCA6IHRoaXMudGVsSW5wdXQuaW5uZXJIZWlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHBsYWNlbWVudFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IGlucHV0VG9wICsgZXh0cmFUb3AsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBwb3MubGVmdFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2xvc2UgbWVudSBvbiB3aW5kb3cgc2Nyb2xsXG4gICAgICAgICAgICAgICAgICAgICQod2luZG93KS5vbihcInNjcm9sbFwiICsgdGhpcy5ucywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9jbG9zZURyb3Bkb3duKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gd2Ugb25seSBiaW5kIGRyb3Bkb3duIGxpc3RlbmVycyB3aGVuIHRoZSBkcm9wZG93biBpcyBvcGVuXG4gICAgICAgIF9iaW5kRHJvcGRvd25MaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgLy8gd2hlbiBtb3VzZSBvdmVyIGEgbGlzdCBpdGVtLCBqdXN0IGhpZ2hsaWdodCB0aGF0IG9uZVxuICAgICAgICAgICAgLy8gd2UgYWRkIHRoZSBjbGFzcyBcImhpZ2hsaWdodFwiLCBzbyBpZiB0aGV5IGhpdCBcImVudGVyXCIgd2Uga25vdyB3aGljaCBvbmUgdG8gc2VsZWN0XG4gICAgICAgICAgICB0aGlzLmNvdW50cnlMaXN0Lm9uKFwibW91c2VvdmVyXCIgKyB0aGlzLm5zLCBcIi5jb3VudHJ5XCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9oaWdobGlnaHRMaXN0SXRlbSgkKHRoaXMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gbGlzdGVuIGZvciBjb3VudHJ5IHNlbGVjdGlvblxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdC5vbihcImNsaWNrXCIgKyB0aGlzLm5zLCBcIi5jb3VudHJ5XCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9zZWxlY3RMaXN0SXRlbSgkKHRoaXMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gY2xpY2sgb2ZmIHRvIGNsb3NlXG4gICAgICAgICAgICAvLyAoZXhjZXB0IHdoZW4gdGhpcyBpbml0aWFsIG9wZW5pbmcgY2xpY2sgaXMgYnViYmxpbmcgdXApXG4gICAgICAgICAgICAvLyB3ZSBjYW5ub3QganVzdCBzdG9wUHJvcGFnYXRpb24gYXMgaXQgbWF5IGJlIG5lZWRlZCB0byBjbG9zZSBhbm90aGVyIGluc3RhbmNlXG4gICAgICAgICAgICB2YXIgaXNPcGVuaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICQoXCJodG1sXCIpLm9uKFwiY2xpY2tcIiArIHRoaXMubnMsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWlzT3BlbmluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9jbG9zZURyb3Bkb3duKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlzT3BlbmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBsaXN0ZW4gZm9yIHVwL2Rvd24gc2Nyb2xsaW5nLCBlbnRlciB0byBzZWxlY3QsIG9yIGxldHRlcnMgdG8ganVtcCB0byBjb3VudHJ5IG5hbWUuXG4gICAgICAgICAgICAvLyB1c2Uga2V5ZG93biBhcyBrZXlwcmVzcyBkb2Vzbid0IGZpcmUgZm9yIG5vbi1jaGFyIGtleXMgYW5kIHdlIHdhbnQgdG8gY2F0Y2ggaWYgdGhleVxuICAgICAgICAgICAgLy8ganVzdCBoaXQgZG93biBhbmQgaG9sZCBpdCB0byBzY3JvbGwgZG93biAobm8ga2V5dXAgZXZlbnQpLlxuICAgICAgICAgICAgLy8gbGlzdGVuIG9uIHRoZSBkb2N1bWVudCBiZWNhdXNlIHRoYXQncyB3aGVyZSBrZXkgZXZlbnRzIGFyZSB0cmlnZ2VyZWQgaWYgbm8gaW5wdXQgaGFzIGZvY3VzXG4gICAgICAgICAgICB2YXIgcXVlcnkgPSBcIlwiLCBxdWVyeVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKFwia2V5ZG93blwiICsgdGhpcy5ucywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgZG93biBrZXkgZnJvbSBzY3JvbGxpbmcgdGhlIHdob2xlIHBhZ2UsXG4gICAgICAgICAgICAgICAgLy8gYW5kIGVudGVyIGtleSBmcm9tIHN1Ym1pdHRpbmcgYSBmb3JtIGV0Y1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBpZiAoZS53aGljaCA9PSBrZXlzLlVQIHx8IGUud2hpY2ggPT0ga2V5cy5ET1dOKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwIGFuZCBkb3duIHRvIG5hdmlnYXRlXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2hhbmRsZVVwRG93bktleShlLndoaWNoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUud2hpY2ggPT0ga2V5cy5FTlRFUikge1xuICAgICAgICAgICAgICAgICAgICAvLyBlbnRlciB0byBzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5faGFuZGxlRW50ZXJLZXkoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUud2hpY2ggPT0ga2V5cy5FU0MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNjIHRvIGNsb3NlXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX2Nsb3NlRHJvcGRvd24oKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUud2hpY2ggPj0ga2V5cy5BICYmIGUud2hpY2ggPD0ga2V5cy5aIHx8IGUud2hpY2ggPT0ga2V5cy5TUEFDRSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB1cHBlciBjYXNlIGxldHRlcnMgKG5vdGU6IGtleXVwL2tleWRvd24gb25seSByZXR1cm4gdXBwZXIgY2FzZSBsZXR0ZXJzKVxuICAgICAgICAgICAgICAgICAgICAvLyBqdW1wIHRvIGNvdW50cmllcyB0aGF0IHN0YXJ0IHdpdGggdGhlIHF1ZXJ5IHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVlcnlUaW1lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHF1ZXJ5VGltZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoZS53aGljaCk7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuX3NlYXJjaEZvckNvdW50cnkocXVlcnkpO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdGltZXIgaGl0cyAxIHNlY29uZCwgcmVzZXQgdGhlIHF1ZXJ5XG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5VGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnkgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB9LCAxZTMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBoaWdobGlnaHQgdGhlIG5leHQvcHJldiBpdGVtIGluIHRoZSBsaXN0IChhbmQgZW5zdXJlIGl0IGlzIHZpc2libGUpXG4gICAgICAgIF9oYW5kbGVVcERvd25LZXk6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLmNvdW50cnlMaXN0LmNoaWxkcmVuKFwiLmhpZ2hsaWdodFwiKS5maXJzdCgpO1xuICAgICAgICAgICAgdmFyIG5leHQgPSBrZXkgPT0ga2V5cy5VUCA/IGN1cnJlbnQucHJldigpIDogY3VycmVudC5uZXh0KCk7XG4gICAgICAgICAgICBpZiAobmV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBza2lwIHRoZSBkaXZpZGVyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQuaGFzQ2xhc3MoXCJkaXZpZGVyXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQgPSBrZXkgPT0ga2V5cy5VUCA/IG5leHQucHJldigpIDogbmV4dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2hpZ2hsaWdodExpc3RJdGVtKG5leHQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbFRvKG5leHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBzZWxlY3QgdGhlIGN1cnJlbnRseSBoaWdobGlnaHRlZCBpdGVtXG4gICAgICAgIF9oYW5kbGVFbnRlcktleTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudENvdW50cnkgPSB0aGlzLmNvdW50cnlMaXN0LmNoaWxkcmVuKFwiLmhpZ2hsaWdodFwiKS5maXJzdCgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDb3VudHJ5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdExpc3RJdGVtKGN1cnJlbnRDb3VudHJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gZmluZCB0aGUgZmlyc3QgbGlzdCBpdGVtIHdob3NlIG5hbWUgc3RhcnRzIHdpdGggdGhlIHF1ZXJ5IHN0cmluZ1xuICAgICAgICBfc2VhcmNoRm9yQ291bnRyeTogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhcnRzV2l0aCh0aGlzLmNvdW50cmllc1tpXS5uYW1lLCBxdWVyeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3RJdGVtID0gdGhpcy5jb3VudHJ5TGlzdC5jaGlsZHJlbihcIltkYXRhLWNvdW50cnktY29kZT1cIiArIHRoaXMuY291bnRyaWVzW2ldLmlzbzIgKyBcIl1cIikubm90KFwiLnByZWZlcnJlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIGhpZ2hsaWdodGluZyBhbmQgc2Nyb2xsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hpZ2hsaWdodExpc3RJdGVtKGxpc3RJdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsVG8obGlzdEl0ZW0sIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGNoZWNrIGlmICh1cHBlcmNhc2UpIHN0cmluZyBhIHN0YXJ0cyB3aXRoIHN0cmluZyBiXG4gICAgICAgIF9zdGFydHNXaXRoOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5zdWJzdHIoMCwgYi5sZW5ndGgpLnRvVXBwZXJDYXNlKCkgPT0gYjtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBpbnB1dCdzIHZhbHVlIHRvIHRoZSBnaXZlbiB2YWwgKGZvcm1hdCBmaXJzdCBpZiBwb3NzaWJsZSlcbiAgICAgICAgLy8gTk9URTogdGhpcyBpcyBjYWxsZWQgZnJvbSBfc2V0SW5pdGlhbFN0YXRlLCBoYW5kbGVVdGlscyBhbmQgc2V0TnVtYmVyXG4gICAgICAgIF91cGRhdGVWYWxGcm9tTnVtYmVyOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZm9ybWF0T25EaXNwbGF5ICYmIHdpbmRvdy5pbnRsVGVsSW5wdXRVdGlscyAmJiB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgZm9ybWF0ID0gIXRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlICYmICh0aGlzLm9wdGlvbnMubmF0aW9uYWxNb2RlIHx8IG51bWJlci5jaGFyQXQoMCkgIT0gXCIrXCIpID8gaW50bFRlbElucHV0VXRpbHMubnVtYmVyRm9ybWF0Lk5BVElPTkFMIDogaW50bFRlbElucHV0VXRpbHMubnVtYmVyRm9ybWF0LklOVEVSTkFUSU9OQUw7XG4gICAgICAgICAgICAgICAgbnVtYmVyID0gaW50bFRlbElucHV0VXRpbHMuZm9ybWF0TnVtYmVyKG51bWJlciwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIsIGZvcm1hdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBudW1iZXIgPSB0aGlzLl9iZWZvcmVTZXROdW1iZXIobnVtYmVyKTtcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudmFsKG51bWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGNoZWNrIGlmIG5lZWQgdG8gc2VsZWN0IGEgbmV3IGZsYWcgYmFzZWQgb24gdGhlIGdpdmVuIG51bWJlclxuICAgICAgICAvLyBOb3RlOiBjYWxsZWQgZnJvbSBfc2V0SW5pdGlhbFN0YXRlLCBrZXl1cCBoYW5kbGVyLCBzZXROdW1iZXJcbiAgICAgICAgX3VwZGF0ZUZsYWdGcm9tTnVtYmVyOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgICAgIC8vIGlmIHdlJ3JlIGluIG5hdGlvbmFsTW9kZSBhbmQgd2UgYWxyZWFkeSBoYXZlIFVTL0NhbmFkYSBzZWxlY3RlZCwgbWFrZSBzdXJlIHRoZSBudW1iZXIgc3RhcnRzIHdpdGggYSArMSBzbyBfZ2V0RGlhbENvZGUgd2lsbCBiZSBhYmxlIHRvIGV4dHJhY3QgdGhlIGFyZWEgY29kZVxuICAgICAgICAgICAgLy8gdXBkYXRlOiBpZiB3ZSBkb250IHlldCBoYXZlIHNlbGVjdGVkQ291bnRyeURhdGEsIGJ1dCB3ZSdyZSBoZXJlICh0cnlpbmcgdG8gdXBkYXRlIHRoZSBmbGFnIGZyb20gdGhlIG51bWJlciksIHRoYXQgbWVhbnMgd2UncmUgaW5pdGlhbGlzaW5nIHRoZSBwbHVnaW4gd2l0aCBhIG51bWJlciB0aGF0IGFscmVhZHkgaGFzIGEgZGlhbCBjb2RlLCBzbyBmaW5lIHRvIGlnbm9yZSB0aGlzIGJpdFxuICAgICAgICAgICAgaWYgKG51bWJlciAmJiB0aGlzLm9wdGlvbnMubmF0aW9uYWxNb2RlICYmIHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5kaWFsQ29kZSA9PSBcIjFcIiAmJiBudW1iZXIuY2hhckF0KDApICE9IFwiK1wiKSB7XG4gICAgICAgICAgICAgICAgaWYgKG51bWJlci5jaGFyQXQoMCkgIT0gXCIxXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyID0gXCIxXCIgKyBudW1iZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG51bWJlciA9IFwiK1wiICsgbnVtYmVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdHJ5IGFuZCBleHRyYWN0IHZhbGlkIGRpYWwgY29kZSBmcm9tIGlucHV0XG4gICAgICAgICAgICB2YXIgZGlhbENvZGUgPSB0aGlzLl9nZXREaWFsQ29kZShudW1iZXIpLCBjb3VudHJ5Q29kZSA9IG51bGwsIG51bWVyaWMgPSB0aGlzLl9nZXROdW1lcmljKG51bWJlcik7XG4gICAgICAgICAgICBpZiAoZGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBvbmUgb2YgdGhlIG1hdGNoaW5nIGNvdW50cmllcyBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgdmFyIGNvdW50cnlDb2RlcyA9IHRoaXMuY291bnRyeUNvZGVzW3RoaXMuX2dldE51bWVyaWMoZGlhbENvZGUpXSwgYWxyZWFkeVNlbGVjdGVkID0gJC5pbkFycmF5KHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5pc28yLCBjb3VudHJ5Q29kZXMpID4gLTEsIC8vIGNoZWNrIGlmIHRoZSBnaXZlbiBudW1iZXIgY29udGFpbnMgYSBOQU5QIGFyZWEgY29kZSBpLmUuIHRoZSBvbmx5IGRpYWxDb2RlIHRoYXQgY291bGQgYmUgZXh0cmFjdGVkIHdhcyArMSAoaW5zdGVhZCBvZiBzYXkgKzEyMDQpIGFuZCB0aGUgYWN0dWFsIG51bWJlcidzIGxlbmd0aCBpcyA+PTRcbiAgICAgICAgICAgICAgICBpc05hbnBBcmVhQ29kZSA9IGRpYWxDb2RlID09IFwiKzFcIiAmJiBudW1lcmljLmxlbmd0aCA+PSA0LCBuYW5wU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuZGlhbENvZGUgPT0gXCIxXCI7XG4gICAgICAgICAgICAgICAgLy8gb25seSB1cGRhdGUgdGhlIGZsYWcgaWY6XG4gICAgICAgICAgICAgICAgLy8gQSkgTk9UICh3ZSBjdXJyZW50bHkgaGF2ZSBhIE5BTlAgZmxhZyBzZWxlY3RlZCwgYW5kIHRoZSBudW1iZXIgaXMgYSByZWdpb25sZXNzTmFucClcbiAgICAgICAgICAgICAgICAvLyBBTkRcbiAgICAgICAgICAgICAgICAvLyBCKSBlaXRoZXIgYSBtYXRjaGluZyBjb3VudHJ5IGlzIG5vdCBhbHJlYWR5IHNlbGVjdGVkIE9SIHRoZSBudW1iZXIgY29udGFpbnMgYSBOQU5QIGFyZWEgY29kZSAoZW5zdXJlIHRoZSBmbGFnIGlzIHNldCB0byB0aGUgZmlyc3QgbWF0Y2hpbmcgY291bnRyeSlcbiAgICAgICAgICAgICAgICBpZiAoIShuYW5wU2VsZWN0ZWQgJiYgdGhpcy5faXNSZWdpb25sZXNzTmFucChudW1lcmljKSkgJiYgKCFhbHJlYWR5U2VsZWN0ZWQgfHwgaXNOYW5wQXJlYUNvZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHVzaW5nIG9ubHlDb3VudHJpZXMgb3B0aW9uLCBjb3VudHJ5Q29kZXNbMF0gbWF5IGJlIGVtcHR5LCBzbyB3ZSBtdXN0IGZpbmQgdGhlIGZpcnN0IG5vbi1lbXB0eSBpbmRleFxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNvdW50cnlDb2Rlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50cnlDb2Rlc1tqXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50cnlDb2RlID0gY291bnRyeUNvZGVzW2pdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChudW1iZXIuY2hhckF0KDApID09IFwiK1wiICYmIG51bWVyaWMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gaW52YWxpZCBkaWFsIGNvZGUsIHNvIGVtcHR5XG4gICAgICAgICAgICAgICAgLy8gTm90ZTogdXNlIGdldE51bWVyaWMgaGVyZSBiZWNhdXNlIHRoZSBudW1iZXIgaGFzIG5vdCBiZWVuIGZvcm1hdHRlZCB5ZXQsIHNvIGNvdWxkIGNvbnRhaW4gYmFkIGNoYXJzXG4gICAgICAgICAgICAgICAgY291bnRyeUNvZGUgPSBcIlwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghbnVtYmVyIHx8IG51bWJlciA9PSBcIitcIikge1xuICAgICAgICAgICAgICAgIC8vIGVtcHR5LCBvciBqdXN0IGEgcGx1cywgc28gZGVmYXVsdFxuICAgICAgICAgICAgICAgIGNvdW50cnlDb2RlID0gdGhpcy5kZWZhdWx0Q291bnRyeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb3VudHJ5Q29kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9zZXRGbGFnKGNvdW50cnlDb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGdpdmVuIG51bWJlciBpcyBhIHJlZ2lvbmxlc3MgTkFOUCBudW1iZXIgKGV4cGVjdHMgdGhlIG51bWJlciB0byBjb250YWluIGFuIGludGVybmF0aW9uYWwgZGlhbCBjb2RlKVxuICAgICAgICBfaXNSZWdpb25sZXNzTmFucDogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgbnVtZXJpYyA9IHRoaXMuX2dldE51bWVyaWMobnVtYmVyKTtcbiAgICAgICAgICAgIGlmIChudW1lcmljLmNoYXJBdCgwKSA9PSBcIjFcIikge1xuICAgICAgICAgICAgICAgIHZhciBhcmVhQ29kZSA9IG51bWVyaWMuc3Vic3RyKDEsIDMpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkLmluQXJyYXkoYXJlYUNvZGUsIHJlZ2lvbmxlc3NOYW5wTnVtYmVycykgPiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gcmVtb3ZlIGhpZ2hsaWdodGluZyBmcm9tIG90aGVyIGxpc3QgaXRlbXMgYW5kIGhpZ2hsaWdodCB0aGUgZ2l2ZW4gaXRlbVxuICAgICAgICBfaGlnaGxpZ2h0TGlzdEl0ZW06IGZ1bmN0aW9uKGxpc3RJdGVtKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50cnlMaXN0SXRlbXMucmVtb3ZlQ2xhc3MoXCJoaWdobGlnaHRcIik7XG4gICAgICAgICAgICBsaXN0SXRlbS5hZGRDbGFzcyhcImhpZ2hsaWdodFwiKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gZmluZCB0aGUgY291bnRyeSBkYXRhIGZvciB0aGUgZ2l2ZW4gY291bnRyeSBjb2RlXG4gICAgICAgIC8vIHRoZSBpZ25vcmVPbmx5Q291bnRyaWVzT3B0aW9uIGlzIG9ubHkgdXNlZCBkdXJpbmcgaW5pdCgpIHdoaWxlIHBhcnNpbmcgdGhlIG9ubHlDb3VudHJpZXMgYXJyYXlcbiAgICAgICAgX2dldENvdW50cnlEYXRhOiBmdW5jdGlvbihjb3VudHJ5Q29kZSwgaWdub3JlT25seUNvdW50cmllc09wdGlvbiwgYWxsb3dGYWlsKSB7XG4gICAgICAgICAgICB2YXIgY291bnRyeUxpc3QgPSBpZ25vcmVPbmx5Q291bnRyaWVzT3B0aW9uID8gYWxsQ291bnRyaWVzIDogdGhpcy5jb3VudHJpZXM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50cnlMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50cnlMaXN0W2ldLmlzbzIgPT0gY291bnRyeUNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvdW50cnlMaXN0W2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhbGxvd0ZhaWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gY291bnRyeSBkYXRhIGZvciAnXCIgKyBjb3VudHJ5Q29kZSArIFwiJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gc2VsZWN0IHRoZSBnaXZlbiBmbGFnLCB1cGRhdGUgdGhlIHBsYWNlaG9sZGVyIGFuZCB0aGUgYWN0aXZlIGxpc3QgaXRlbVxuICAgICAgICAvLyBOb3RlOiBjYWxsZWQgZnJvbSBfc2V0SW5pdGlhbFN0YXRlLCBfdXBkYXRlRmxhZ0Zyb21OdW1iZXIsIF9zZWxlY3RMaXN0SXRlbSwgc2V0Q291bnRyeVxuICAgICAgICBfc2V0RmxhZzogZnVuY3Rpb24oY291bnRyeUNvZGUpIHtcbiAgICAgICAgICAgIHZhciBwcmV2Q291bnRyeSA9IHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5pc28yID8gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhIDoge307XG4gICAgICAgICAgICAvLyBkbyB0aGlzIGZpcnN0IGFzIGl0IHdpbGwgdGhyb3cgYW4gZXJyb3IgYW5kIHN0b3AgaWYgY291bnRyeUNvZGUgaXMgaW52YWxpZFxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhID0gY291bnRyeUNvZGUgPyB0aGlzLl9nZXRDb3VudHJ5RGF0YShjb3VudHJ5Q29kZSwgZmFsc2UsIGZhbHNlKSA6IHt9O1xuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBkZWZhdWx0Q291bnRyeSAtIHdlIG9ubHkgbmVlZCB0aGUgaXNvMiBmcm9tIG5vdyBvbiwgc28ganVzdCBzdG9yZSB0aGF0XG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRDb3VudHJ5ID0gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkRmxhZ0lubmVyLmF0dHIoXCJjbGFzc1wiLCBcIml0aS1mbGFnIFwiICsgY291bnRyeUNvZGUpO1xuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBzZWxlY3RlZCBjb3VudHJ5J3MgdGl0bGUgYXR0cmlidXRlXG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBjb3VudHJ5Q29kZSA/IHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5uYW1lICsgXCI6ICtcIiArIHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5kaWFsQ29kZSA6IFwiVW5rbm93blwiO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEZsYWdJbm5lci5wYXJlbnQoKS5hdHRyKFwidGl0bGVcIiwgdGl0bGUpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpYWxDb2RlID0gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlID8gXCIrXCIgKyB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuZGlhbENvZGUgOiBcIlwiLCBwYXJlbnQgPSB0aGlzLnRlbElucHV0LnBhcmVudCgpO1xuICAgICAgICAgICAgICAgIGlmIChwcmV2Q291bnRyeS5kaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MoXCJpdGktc2RjLVwiICsgKHByZXZDb3VudHJ5LmRpYWxDb2RlLmxlbmd0aCArIDEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5hZGRDbGFzcyhcIml0aS1zZGMtXCIgKyBkaWFsQ29kZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkRGlhbENvZGUudGV4dChkaWFsQ29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhbmQgdGhlIGlucHV0J3MgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYWNlaG9sZGVyKCk7XG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGFjdGl2ZSBsaXN0IGl0ZW1cbiAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3RJdGVtcy5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIGlmIChjb3VudHJ5Q29kZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnRyeUxpc3RJdGVtcy5maW5kKFwiLml0aS1mbGFnLlwiICsgY291bnRyeUNvZGUpLmZpcnN0KCkuY2xvc2VzdChcIi5jb3VudHJ5XCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmV0dXJuIGlmIHRoZSBmbGFnIGhhcyBjaGFuZ2VkIG9yIG5vdFxuICAgICAgICAgICAgcmV0dXJuIHByZXZDb3VudHJ5LmlzbzIgIT09IGNvdW50cnlDb2RlO1xuICAgICAgICB9LFxuICAgICAgICAvLyB1cGRhdGUgdGhlIGlucHV0IHBsYWNlaG9sZGVyIHRvIGFuIGV4YW1wbGUgbnVtYmVyIGZyb20gdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBjb3VudHJ5XG4gICAgICAgIF91cGRhdGVQbGFjZWhvbGRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2hvdWxkU2V0UGxhY2Vob2xkZXIgPSB0aGlzLm9wdGlvbnMuYXV0b1BsYWNlaG9sZGVyID09PSBcImFnZ3Jlc3NpdmVcIiB8fCAhdGhpcy5oYWRJbml0aWFsUGxhY2Vob2xkZXIgJiYgKHRoaXMub3B0aW9ucy5hdXRvUGxhY2Vob2xkZXIgPT09IHRydWUgfHwgdGhpcy5vcHRpb25zLmF1dG9QbGFjZWhvbGRlciA9PT0gXCJwb2xpdGVcIik7XG4gICAgICAgICAgICBpZiAod2luZG93LmludGxUZWxJbnB1dFV0aWxzICYmIHNob3VsZFNldFBsYWNlaG9sZGVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG51bWJlclR5cGUgPSBpbnRsVGVsSW5wdXRVdGlscy5udW1iZXJUeXBlW3RoaXMub3B0aW9ucy5wbGFjZWhvbGRlck51bWJlclR5cGVdLCBwbGFjZWhvbGRlciA9IHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5pc28yID8gaW50bFRlbElucHV0VXRpbHMuZ2V0RXhhbXBsZU51bWJlcih0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuaXNvMiwgdGhpcy5vcHRpb25zLm5hdGlvbmFsTW9kZSwgbnVtYmVyVHlwZSkgOiBcIlwiO1xuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gdGhpcy5fYmVmb3JlU2V0TnVtYmVyKHBsYWNlaG9sZGVyKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5jdXN0b21QbGFjZWhvbGRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gdGhpcy5vcHRpb25zLmN1c3RvbVBsYWNlaG9sZGVyKHBsYWNlaG9sZGVyLCB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRlbElucHV0LmF0dHIoXCJwbGFjZWhvbGRlclwiLCBwbGFjZWhvbGRlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGNhbGxlZCB3aGVuIHRoZSB1c2VyIHNlbGVjdHMgYSBsaXN0IGl0ZW0gZnJvbSB0aGUgZHJvcGRvd25cbiAgICAgICAgX3NlbGVjdExpc3RJdGVtOiBmdW5jdGlvbihsaXN0SXRlbSkge1xuICAgICAgICAgICAgLy8gdXBkYXRlIHNlbGVjdGVkIGZsYWcgYW5kIGFjdGl2ZSBsaXN0IGl0ZW1cbiAgICAgICAgICAgIHZhciBmbGFnQ2hhbmdlZCA9IHRoaXMuX3NldEZsYWcobGlzdEl0ZW0uYXR0cihcImRhdGEtY291bnRyeS1jb2RlXCIpKTtcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlRHJvcGRvd24oKTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZURpYWxDb2RlKGxpc3RJdGVtLmF0dHIoXCJkYXRhLWRpYWwtY29kZVwiKSwgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBmb2N1cyB0aGUgaW5wdXRcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIC8vIHB1dCBjdXJzb3IgYXQgZW5kIC0gdGhpcyBmaXggaXMgcmVxdWlyZWQgZm9yIEZGIGFuZCBJRTExICh3aXRoIG5hdGlvbmFsTW9kZT1mYWxzZSBpLmUuIGF1dG8gaW5zZXJ0aW5nIGRpYWwgY29kZSksIHdobyB0cnkgdG8gcHV0IHRoZSBjdXJzb3IgYXQgdGhlIGJlZ2lubmluZyB0aGUgZmlyc3QgdGltZVxuICAgICAgICAgICAgaWYgKHRoaXMuaXNHb29kQnJvd3Nlcikge1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSB0aGlzLnRlbElucHV0LnZhbCgpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzLnRlbElucHV0WzBdLnNldFNlbGVjdGlvblJhbmdlKGxlbiwgbGVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmbGFnQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJDb3VudHJ5Q2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGNsb3NlIHRoZSBkcm9wZG93biBhbmQgdW5iaW5kIGFueSBsaXN0ZW5lcnNcbiAgICAgICAgX2Nsb3NlRHJvcGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudHJ5TGlzdC5hZGRDbGFzcyhcImhpZGVcIik7XG4gICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGFycm93XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkRmxhZ0lubmVyLmNoaWxkcmVuKFwiLml0aS1hcnJvd1wiKS5yZW1vdmVDbGFzcyhcInVwXCIpO1xuICAgICAgICAgICAgLy8gdW5iaW5kIGtleSBldmVudHNcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZih0aGlzLm5zKTtcbiAgICAgICAgICAgIC8vIHVuYmluZCBjbGljay1vZmYtdG8tY2xvc2VcbiAgICAgICAgICAgICQoXCJodG1sXCIpLm9mZih0aGlzLm5zKTtcbiAgICAgICAgICAgIC8vIHVuYmluZCBob3ZlciBhbmQgY2xpY2sgbGlzdGVuZXJzXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlMaXN0Lm9mZih0aGlzLm5zKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBtZW51IGZyb20gY29udGFpbmVyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRyb3Bkb3duQ29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICQod2luZG93KS5vZmYoXCJzY3JvbGxcIiArIHRoaXMubnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duLmRldGFjaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy50ZWxJbnB1dC50cmlnZ2VyKFwiY2xvc2U6Y291bnRyeWRyb3Bkb3duXCIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyBjaGVjayBpZiBhbiBlbGVtZW50IGlzIHZpc2libGUgd2l0aGluIGl0J3MgY29udGFpbmVyLCBlbHNlIHNjcm9sbCB1bnRpbCBpdCBpc1xuICAgICAgICBfc2Nyb2xsVG86IGZ1bmN0aW9uKGVsZW1lbnQsIG1pZGRsZSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuY291bnRyeUxpc3QsIGNvbnRhaW5lckhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSwgY29udGFpbmVyVG9wID0gY29udGFpbmVyLm9mZnNldCgpLnRvcCwgY29udGFpbmVyQm90dG9tID0gY29udGFpbmVyVG9wICsgY29udGFpbmVySGVpZ2h0LCBlbGVtZW50SGVpZ2h0ID0gZWxlbWVudC5vdXRlckhlaWdodCgpLCBlbGVtZW50VG9wID0gZWxlbWVudC5vZmZzZXQoKS50b3AsIGVsZW1lbnRCb3R0b20gPSBlbGVtZW50VG9wICsgZWxlbWVudEhlaWdodCwgbmV3U2Nyb2xsVG9wID0gZWxlbWVudFRvcCAtIGNvbnRhaW5lclRvcCArIGNvbnRhaW5lci5zY3JvbGxUb3AoKSwgbWlkZGxlT2Zmc2V0ID0gY29udGFpbmVySGVpZ2h0IC8gMiAtIGVsZW1lbnRIZWlnaHQgLyAyO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRUb3AgPCBjb250YWluZXJUb3ApIHtcbiAgICAgICAgICAgICAgICAvLyBzY3JvbGwgdXBcbiAgICAgICAgICAgICAgICBpZiAobWlkZGxlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1Njcm9sbFRvcCAtPSBtaWRkbGVPZmZzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5zY3JvbGxUb3AobmV3U2Nyb2xsVG9wKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudEJvdHRvbSA+IGNvbnRhaW5lckJvdHRvbSkge1xuICAgICAgICAgICAgICAgIC8vIHNjcm9sbCBkb3duXG4gICAgICAgICAgICAgICAgaWYgKG1pZGRsZSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdTY3JvbGxUb3AgKz0gbWlkZGxlT2Zmc2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0RGlmZmVyZW5jZSA9IGNvbnRhaW5lckhlaWdodCAtIGVsZW1lbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLnNjcm9sbFRvcChuZXdTY3JvbGxUb3AgLSBoZWlnaHREaWZmZXJlbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gcmVwbGFjZSBhbnkgZXhpc3RpbmcgZGlhbCBjb2RlIHdpdGggdGhlIG5ldyBvbmVcbiAgICAgICAgLy8gTm90ZTogY2FsbGVkIGZyb20gX3NlbGVjdExpc3RJdGVtIGFuZCBzZXRDb3VudHJ5XG4gICAgICAgIF91cGRhdGVEaWFsQ29kZTogZnVuY3Rpb24obmV3RGlhbENvZGUsIGhhc1NlbGVjdGVkTGlzdEl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBpbnB1dFZhbCA9IHRoaXMudGVsSW5wdXQudmFsKCksIG5ld051bWJlcjtcbiAgICAgICAgICAgIC8vIHNhdmUgaGF2aW5nIHRvIHBhc3MgdGhpcyBldmVyeSB0aW1lXG4gICAgICAgICAgICBuZXdEaWFsQ29kZSA9IFwiK1wiICsgbmV3RGlhbENvZGU7XG4gICAgICAgICAgICBpZiAoaW5wdXRWYWwuY2hhckF0KDApID09IFwiK1wiKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlcmUncyBhIHBsdXMgc28gd2UncmUgZGVhbGluZyB3aXRoIGEgcmVwbGFjZW1lbnQgKGRvZXNuJ3QgbWF0dGVyIGlmIG5hdGlvbmFsTW9kZSBvciBub3QpXG4gICAgICAgICAgICAgICAgdmFyIHByZXZEaWFsQ29kZSA9IHRoaXMuX2dldERpYWxDb2RlKGlucHV0VmFsKTtcbiAgICAgICAgICAgICAgICBpZiAocHJldkRpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGN1cnJlbnQgbnVtYmVyIGNvbnRhaW5zIGEgdmFsaWQgZGlhbCBjb2RlLCBzbyByZXBsYWNlIGl0XG4gICAgICAgICAgICAgICAgICAgIG5ld051bWJlciA9IGlucHV0VmFsLnJlcGxhY2UocHJldkRpYWxDb2RlLCBuZXdEaWFsQ29kZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY3VycmVudCBudW1iZXIgY29udGFpbnMgYW4gaW52YWxpZCBkaWFsIGNvZGUsIHNvIGRpdGNoIGl0XG4gICAgICAgICAgICAgICAgICAgIC8vIChubyB3YXkgdG8gZGV0ZXJtaW5lIHdoZXJlIHRoZSBpbnZhbGlkIGRpYWwgY29kZSBlbmRzIGFuZCB0aGUgcmVzdCBvZiB0aGUgbnVtYmVyIGJlZ2lucylcbiAgICAgICAgICAgICAgICAgICAgbmV3TnVtYmVyID0gbmV3RGlhbENvZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMubmF0aW9uYWxNb2RlIHx8IHRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8gZG9uJ3QgZG8gYW55dGhpbmdcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG5hdGlvbmFsTW9kZSBpcyBkaXNhYmxlZFxuICAgICAgICAgICAgICAgIGlmIChpbnB1dFZhbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGVyZSBpcyBhbiBleGlzdGluZyB2YWx1ZSB3aXRoIG5vIGRpYWwgY29kZTogcHJlZml4IHRoZSBuZXcgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgICAgIG5ld051bWJlciA9IG5ld0RpYWxDb2RlICsgaW5wdXRWYWw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNTZWxlY3RlZExpc3RJdGVtIHx8ICF0aGlzLm9wdGlvbnMuYXV0b0hpZGVEaWFsQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBubyBleGlzdGluZyB2YWx1ZSBhbmQgZWl0aGVyIHRoZXkndmUganVzdCBzZWxlY3RlZCBhIGxpc3QgaXRlbSwgb3IgYXV0b0hpZGVEaWFsQ29kZSBpcyBkaXNhYmxlZDogaW5zZXJ0IG5ldyBkaWFsIGNvZGVcbiAgICAgICAgICAgICAgICAgICAgbmV3TnVtYmVyID0gbmV3RGlhbENvZGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudmFsKG5ld051bWJlcik7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHRyeSBhbmQgZXh0cmFjdCBhIHZhbGlkIGludGVybmF0aW9uYWwgZGlhbCBjb2RlIGZyb20gYSBmdWxsIHRlbGVwaG9uZSBudW1iZXJcbiAgICAgICAgLy8gTm90ZTogcmV0dXJucyB0aGUgcmF3IHN0cmluZyBpbmMgcGx1cyBjaGFyYWN0ZXIgYW5kIGFueSB3aGl0ZXNwYWNlL2RvdHMgZXRjXG4gICAgICAgIF9nZXREaWFsQ29kZTogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgZGlhbENvZGUgPSBcIlwiO1xuICAgICAgICAgICAgLy8gb25seSBpbnRlcmVzdGVkIGluIGludGVybmF0aW9uYWwgbnVtYmVycyAoc3RhcnRpbmcgd2l0aCBhIHBsdXMpXG4gICAgICAgICAgICBpZiAobnVtYmVyLmNoYXJBdCgwKSA9PSBcIitcIikge1xuICAgICAgICAgICAgICAgIHZhciBudW1lcmljQ2hhcnMgPSBcIlwiO1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGUgb3ZlciBjaGFyc1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtYmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjID0gbnVtYmVyLmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgY2hhciBpcyBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNOdW1lcmljKGMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljQ2hhcnMgKz0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIGN1cnJlbnQgbnVtZXJpY0NoYXJzIG1ha2UgYSB2YWxpZCBkaWFsIGNvZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvdW50cnlDb2Rlc1tudW1lcmljQ2hhcnNdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RvcmUgdGhlIGFjdHVhbCByYXcgc3RyaW5nICh1c2VmdWwgZm9yIG1hdGNoaW5nIGxhdGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpYWxDb2RlID0gbnVtYmVyLnN1YnN0cigwLCBpICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsb25nZXN0IGRpYWwgY29kZSBpcyA0IGNoYXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtZXJpY0NoYXJzLmxlbmd0aCA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGlhbENvZGU7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGdldCB0aGUgaW5wdXQgdmFsLCBhZGRpbmcgdGhlIGRpYWwgY29kZSBpZiBzZXBhcmF0ZURpYWxDb2RlIGlzIGVuYWJsZWRcbiAgICAgICAgX2dldEZ1bGxOdW1iZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbCA9ICQudHJpbSh0aGlzLnRlbElucHV0LnZhbCgpKSwgZGlhbENvZGUgPSB0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuZGlhbENvZGUsIHByZWZpeCwgbnVtZXJpY1ZhbCA9IHRoaXMuX2dldE51bWVyaWModmFsKSwgLy8gbm9ybWFsaXplZCBtZWFucyBlbnN1cmUgc3RhcnRzIHdpdGggYSAxLCBzbyB3ZSBjYW4gbWF0Y2ggYWdhaW5zdCB0aGUgZnVsbCBkaWFsIGNvZGVcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRWYWwgPSBudW1lcmljVmFsLmNoYXJBdCgwKSA9PSBcIjFcIiA/IG51bWVyaWNWYWwgOiBcIjFcIiArIG51bWVyaWNWYWw7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNlcGFyYXRlRGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBcIitcIiArIGRpYWxDb2RlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWwuY2hhckF0KDApICE9IFwiK1wiICYmIHZhbC5jaGFyQXQoMCkgIT0gXCIxXCIgJiYgZGlhbENvZGUgJiYgZGlhbENvZGUuY2hhckF0KDApID09IFwiMVwiICYmIGRpYWxDb2RlLmxlbmd0aCA9PSA0ICYmIGRpYWxDb2RlICE9IG5vcm1hbGl6ZWRWYWwuc3Vic3RyKDAsIDQpKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIHVzZXIgaGFzIGVudGVyZWQgYSBuYXRpb25hbCBOQU5QIG51bWJlciwgdGhlbiBlbnN1cmUgaXQgaW5jbHVkZXMgdGhlIGZ1bGwgZGlhbCBjb2RlIC8gYXJlYSBjb2RlXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gZGlhbENvZGUuc3Vic3RyKDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIHZhbDtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gcmVtb3ZlIHRoZSBkaWFsIGNvZGUgaWYgc2VwYXJhdGVEaWFsQ29kZSBpcyBlbmFibGVkXG4gICAgICAgIF9iZWZvcmVTZXROdW1iZXI6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zZXBhcmF0ZURpYWxDb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpYWxDb2RlID0gdGhpcy5fZ2V0RGlhbENvZGUobnVtYmVyKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVVMgZGlhbENvZGUgaXMgXCIrMVwiLCB3aGljaCBpcyB3aGF0IHdlIHdhbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gQ0EgZGlhbENvZGUgaXMgXCIrMSAxMjNcIiwgd2hpY2ggaXMgd3JvbmcgLSBzaG91bGQgYmUgXCIrMVwiIChhcyBpdCBoYXMgbXVsdGlwbGUgYXJlYSBjb2RlcylcbiAgICAgICAgICAgICAgICAgICAgLy8gQVMgZGlhbENvZGUgaXMgXCIrMSA2ODRcIiwgd2hpY2ggaXMgd2hhdCB3ZSB3YW50XG4gICAgICAgICAgICAgICAgICAgIC8vIFNvbHV0aW9uOiBpZiB0aGUgY291bnRyeSBoYXMgYXJlYSBjb2RlcywgdGhlbiByZXZlcnQgdG8ganVzdCB0aGUgZGlhbCBjb2RlXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkQ291bnRyeURhdGEuYXJlYUNvZGVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWFsQ29kZSA9IFwiK1wiICsgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmRpYWxDb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGEgbG90IG9mIG51bWJlcnMgd2lsbCBoYXZlIGEgc3BhY2Ugc2VwYXJhdGluZyB0aGUgZGlhbCBjb2RlIGFuZCB0aGUgbWFpbiBudW1iZXIsIGFuZCBzb21lIE5BTlAgbnVtYmVycyB3aWxsIGhhdmUgYSBoeXBoZW4gZS5nLiArMSA2ODQtNzMzLTEyMzQgLSBpbiBib3RoIGNhc2VzIHdlIHdhbnQgdG8gZ2V0IHJpZCBvZiBpdFxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBkb24ndCBqdXN0IHRyaW0gYWxsIG5vbi1udW1lcmljcyBhcyBtYXkgd2FudCB0byBwcmVzZXJ2ZSBhbiBvcGVuIHBhcmVudGhlc2lzIGV0Y1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnQgPSBudW1iZXJbZGlhbENvZGUubGVuZ3RoXSA9PT0gXCIgXCIgfHwgbnVtYmVyW2RpYWxDb2RlLmxlbmd0aF0gPT09IFwiLVwiID8gZGlhbENvZGUubGVuZ3RoICsgMSA6IGRpYWxDb2RlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnN1YnN0cihzdGFydCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhcChudW1iZXIpO1xuICAgICAgICB9LFxuICAgICAgICAvLyB0cmlnZ2VyIHRoZSAnY291bnRyeWNoYW5nZScgZXZlbnRcbiAgICAgICAgX3RyaWdnZXJDb3VudHJ5Q2hhbmdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQudHJpZ2dlcihcImNvdW50cnljaGFuZ2VcIiwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAqICBTRUNSRVQgUFVCTElDIE1FVEhPRFNcbiAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuICAgICAgICAvLyB0aGlzIGlzIGNhbGxlZCB3aGVuIHRoZSBnZW9pcCBjYWxsIHJldHVybnNcbiAgICAgICAgaGFuZGxlQXV0b0NvdW50cnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbml0aWFsQ291bnRyeSA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICAgICAgICAvLyB3ZSBtdXN0IHNldCB0aGlzIGV2ZW4gaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWwgaW4gdGhlIGlucHV0OiBpbiBjYXNlIHRoZSBpbml0aWFsIHZhbCBpcyBpbnZhbGlkIGFuZCB0aGV5IGRlbGV0ZSBpdCAtIHRoZXkgc2hvdWxkIHNlZSB0aGVpciBhdXRvIGNvdW50cnlcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRDb3VudHJ5ID0gJC5mbltwbHVnaW5OYW1lXS5hdXRvQ291bnRyeTtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSdzIG5vIGluaXRpYWwgdmFsdWUgaW4gdGhlIGlucHV0LCB0aGVuIHVwZGF0ZSB0aGUgZmxhZ1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy50ZWxJbnB1dC52YWwoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldENvdW50cnkodGhpcy5kZWZhdWx0Q291bnRyeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuYXV0b0NvdW50cnlEZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHRoaXMgaXMgY2FsbGVkIHdoZW4gdGhlIHV0aWxzIHJlcXVlc3QgY29tcGxldGVzXG4gICAgICAgIGhhbmRsZVV0aWxzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGlmIHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsXG4gICAgICAgICAgICBpZiAod2luZG93LmludGxUZWxJbnB1dFV0aWxzKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUncyBhbiBpbml0aWFsIHZhbHVlIGluIHRoZSBpbnB1dCwgdGhlbiBmb3JtYXQgaXRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50ZWxJbnB1dC52YWwoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVWYWxGcm9tTnVtYmVyKHRoaXMudGVsSW5wdXQudmFsKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVQbGFjZWhvbGRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51dGlsc1NjcmlwdERlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqXG4gICAqICBQVUJMSUMgTUVUSE9EU1xuICAgKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIC8vIHJlbW92ZSBwbHVnaW5cbiAgICAgICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hbGxvd0Ryb3Bkb3duKSB7XG4gICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBkcm9wZG93biBpcyBjbG9zZWQgKGFuZCB1bmJpbmQgbGlzdGVuZXJzKVxuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlRHJvcGRvd24oKTtcbiAgICAgICAgICAgICAgICAvLyBjbGljayBldmVudCB0byBvcGVuIGRyb3Bkb3duXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEZsYWdJbm5lci5wYXJlbnQoKS5vZmYodGhpcy5ucyk7XG4gICAgICAgICAgICAgICAgLy8gbGFiZWwgY2xpY2sgaGFja1xuICAgICAgICAgICAgICAgIHRoaXMudGVsSW5wdXQuY2xvc2VzdChcImxhYmVsXCIpLm9mZih0aGlzLm5zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHVuYmluZCBzdWJtaXQgZXZlbnQgaGFuZGxlciBvbiBmb3JtXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9IaWRlRGlhbENvZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZm9ybSA9IHRoaXMudGVsSW5wdXQucHJvcChcImZvcm1cIik7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm0pIHtcbiAgICAgICAgICAgICAgICAgICAgJChmb3JtKS5vZmYodGhpcy5ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdW5iaW5kIGFsbCBldmVudHM6IGtleSBldmVudHMsIGFuZCBmb2N1cy9ibHVyIGV2ZW50cyBpZiBhdXRvSGlkZURpYWxDb2RlPXRydWVcbiAgICAgICAgICAgIHRoaXMudGVsSW5wdXQub2ZmKHRoaXMubnMpO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIG1hcmt1cCAoYnV0IGxlYXZlIHRoZSBvcmlnaW5hbCBpbnB1dClcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLnRlbElucHV0LnBhcmVudCgpO1xuICAgICAgICAgICAgY29udGFpbmVyLmJlZm9yZSh0aGlzLnRlbElucHV0KS5yZW1vdmUoKTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gZ2V0IHRoZSBleHRlbnNpb24gZnJvbSB0aGUgY3VycmVudCBudW1iZXJcbiAgICAgICAgZ2V0RXh0ZW5zaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaW50bFRlbElucHV0VXRpbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50bFRlbElucHV0VXRpbHMuZ2V0RXh0ZW5zaW9uKHRoaXMuX2dldEZ1bGxOdW1iZXIoKSwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGZvcm1hdCB0aGUgbnVtYmVyIHRvIHRoZSBnaXZlbiBmb3JtYXRcbiAgICAgICAgZ2V0TnVtYmVyOiBmdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaW50bFRlbElucHV0VXRpbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50bFRlbElucHV0VXRpbHMuZm9ybWF0TnVtYmVyKHRoaXMuX2dldEZ1bGxOdW1iZXIoKSwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIsIGZvcm1hdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gZ2V0IHRoZSB0eXBlIG9mIHRoZSBlbnRlcmVkIG51bWJlciBlLmcuIGxhbmRsaW5lL21vYmlsZVxuICAgICAgICBnZXROdW1iZXJUeXBlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaW50bFRlbElucHV0VXRpbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50bFRlbElucHV0VXRpbHMuZ2V0TnVtYmVyVHlwZSh0aGlzLl9nZXRGdWxsTnVtYmVyKCksIHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5pc28yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAtOTk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIGdldCB0aGUgY291bnRyeSBkYXRhIGZvciB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGZsYWdcbiAgICAgICAgZ2V0U2VsZWN0ZWRDb3VudHJ5RGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhO1xuICAgICAgICB9LFxuICAgICAgICAvLyBnZXQgdGhlIHZhbGlkYXRpb24gZXJyb3JcbiAgICAgICAgZ2V0VmFsaWRhdGlvbkVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaW50bFRlbElucHV0VXRpbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50bFRlbElucHV0VXRpbHMuZ2V0VmFsaWRhdGlvbkVycm9yKHRoaXMuX2dldEZ1bGxOdW1iZXIoKSwgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC05OTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gdmFsaWRhdGUgdGhlIGlucHV0IHZhbCAtIGFzc3VtZXMgdGhlIGdsb2JhbCBmdW5jdGlvbiBpc1ZhbGlkTnVtYmVyIChmcm9tIHV0aWxzU2NyaXB0KVxuICAgICAgICBpc1ZhbGlkTnVtYmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSAkLnRyaW0odGhpcy5fZ2V0RnVsbE51bWJlcigpKSwgY291bnRyeUNvZGUgPSB0aGlzLm9wdGlvbnMubmF0aW9uYWxNb2RlID8gdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLmlzbzIgOiBcIlwiO1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5pbnRsVGVsSW5wdXRVdGlscyA/IGludGxUZWxJbnB1dFV0aWxzLmlzVmFsaWROdW1iZXIodmFsLCBjb3VudHJ5Q29kZSkgOiBudWxsO1xuICAgICAgICB9LFxuICAgICAgICAvLyB1cGRhdGUgdGhlIHNlbGVjdGVkIGZsYWcsIGFuZCB1cGRhdGUgdGhlIGlucHV0IHZhbCBhY2NvcmRpbmdseVxuICAgICAgICBzZXRDb3VudHJ5OiBmdW5jdGlvbihjb3VudHJ5Q29kZSkge1xuICAgICAgICAgICAgY291bnRyeUNvZGUgPSBjb3VudHJ5Q29kZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWxyZWFkeSBzZWxlY3RlZFxuICAgICAgICAgICAgaWYgKCF0aGlzLnNlbGVjdGVkRmxhZ0lubmVyLmhhc0NsYXNzKGNvdW50cnlDb2RlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldEZsYWcoY291bnRyeUNvZGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZURpYWxDb2RlKHRoaXMuc2VsZWN0ZWRDb3VudHJ5RGF0YS5kaWFsQ29kZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3RyaWdnZXJDb3VudHJ5Q2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHNldCB0aGUgaW5wdXQgdmFsdWUgYW5kIHVwZGF0ZSB0aGUgZmxhZ1xuICAgICAgICBzZXROdW1iZXI6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgLy8gd2UgbXVzdCB1cGRhdGUgdGhlIGZsYWcgZmlyc3QsIHdoaWNoIHVwZGF0ZXMgdGhpcy5zZWxlY3RlZENvdW50cnlEYXRhLCB3aGljaCBpcyB1c2VkIGZvciBmb3JtYXR0aW5nIHRoZSBudW1iZXIgYmVmb3JlIGRpc3BsYXlpbmcgaXRcbiAgICAgICAgICAgIHZhciBmbGFnQ2hhbmdlZCA9IHRoaXMuX3VwZGF0ZUZsYWdGcm9tTnVtYmVyKG51bWJlcik7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVWYWxGcm9tTnVtYmVyKG51bWJlcik7XG4gICAgICAgICAgICBpZiAoZmxhZ0NoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90cmlnZ2VyQ291bnRyeUNoYW5nZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBzZXQgdGhlIHBsYWNlaG9sZGVyIG51bWJlciB0eXBcbiAgICAgICAgc2V0UGxhY2Vob2xkZXJOdW1iZXJUeXBlOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXJOdW1iZXJUeXBlID0gdHlwZTtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYWNlaG9sZGVyKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIHVzaW5nIGh0dHBzOi8vZ2l0aHViLmNvbS9qcXVlcnktYm9pbGVycGxhdGUvanF1ZXJ5LWJvaWxlcnBsYXRlL3dpa2kvRXh0ZW5kaW5nLWpRdWVyeS1Cb2lsZXJwbGF0ZVxuICAgIC8vIChhZGFwdGVkIHRvIGFsbG93IHB1YmxpYyBmdW5jdGlvbnMpXG4gICAgJC5mbltwbHVnaW5OYW1lXSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIC8vIElzIHRoZSBmaXJzdCBwYXJhbWV0ZXIgYW4gb2JqZWN0IChvcHRpb25zKSwgb3Igd2FzIG9taXR0ZWQsXG4gICAgICAgIC8vIGluc3RhbnRpYXRlIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBwbHVnaW4uXG4gICAgICAgIGlmIChvcHRpb25zID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIC8vIGNvbGxlY3QgYWxsIG9mIHRoZSBkZWZlcnJlZCBvYmplY3RzIGZvciBhbGwgaW5zdGFuY2VzIGNyZWF0ZWQgd2l0aCB0aGlzIHNlbGVjdG9yXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWRzID0gW107XG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEkLmRhdGEodGhpcywgXCJwbHVnaW5fXCIgKyBwbHVnaW5OYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgUGx1Z2luKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5zdGFuY2VEZWZlcnJlZHMgPSBpbnN0YW5jZS5faW5pdCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBub3cgaGF2ZSAyIGRlZmZlcmVkczogMSBmb3IgYXV0byBjb3VudHJ5LCAxIGZvciB1dGlscyBzY3JpcHRcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRzLnB1c2goaW5zdGFuY2VEZWZlcnJlZHNbMF0pO1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZHMucHVzaChpbnN0YW5jZURlZmVycmVkc1sxXSk7XG4gICAgICAgICAgICAgICAgICAgICQuZGF0YSh0aGlzLCBcInBsdWdpbl9cIiArIHBsdWdpbk5hbWUsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgcHJvbWlzZSBmcm9tIHRoZSBcIm1hc3RlclwiIGRlZmVycmVkIG9iamVjdCB0aGF0IHRyYWNrcyBhbGwgdGhlIG90aGVyc1xuICAgICAgICAgICAgcmV0dXJuICQud2hlbi5hcHBseShudWxsLCBkZWZlcnJlZHMpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInN0cmluZ1wiICYmIG9wdGlvbnNbMF0gIT09IFwiX1wiKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZmlyc3QgcGFyYW1ldGVyIGlzIGEgc3RyaW5nIGFuZCBpdCBkb2Vzbid0IHN0YXJ0XG4gICAgICAgICAgICAvLyB3aXRoIGFuIHVuZGVyc2NvcmUgb3IgXCJjb250YWluc1wiIHRoZSBgaW5pdGAtZnVuY3Rpb24sXG4gICAgICAgICAgICAvLyB0cmVhdCB0aGlzIGFzIGEgY2FsbCB0byBhIHB1YmxpYyBtZXRob2QuXG4gICAgICAgICAgICAvLyBDYWNoZSB0aGUgbWV0aG9kIGNhbGwgdG8gbWFrZSBpdCBwb3NzaWJsZSB0byByZXR1cm4gYSB2YWx1ZVxuICAgICAgICAgICAgdmFyIHJldHVybnM7XG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gJC5kYXRhKHRoaXMsIFwicGx1Z2luX1wiICsgcGx1Z2luTmFtZSk7XG4gICAgICAgICAgICAgICAgLy8gVGVzdHMgdGhhdCB0aGVyZSdzIGFscmVhZHkgYSBwbHVnaW4taW5zdGFuY2VcbiAgICAgICAgICAgICAgICAvLyBhbmQgY2hlY2tzIHRoYXQgdGhlIHJlcXVlc3RlZCBwdWJsaWMgbWV0aG9kIGV4aXN0c1xuICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZSBpbnN0YW5jZW9mIFBsdWdpbiAmJiB0eXBlb2YgaW5zdGFuY2Vbb3B0aW9uc10gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIHRoZSBtZXRob2Qgb2Ygb3VyIHBsdWdpbiBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHBhc3MgaXQgdGhlIHN1cHBsaWVkIGFyZ3VtZW50cy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJucyA9IGluc3RhbmNlW29wdGlvbnNdLmFwcGx5KGluc3RhbmNlLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFsbG93IGluc3RhbmNlcyB0byBiZSBkZXN0cm95ZWQgdmlhIHRoZSAnZGVzdHJveScgbWV0aG9kXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMgPT09IFwiZGVzdHJveVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICQuZGF0YSh0aGlzLCBcInBsdWdpbl9cIiArIHBsdWdpbk5hbWUsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gSWYgdGhlIGVhcmxpZXIgY2FjaGVkIG1ldGhvZCBnaXZlcyBhIHZhbHVlIGJhY2sgcmV0dXJuIHRoZSB2YWx1ZSxcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSByZXR1cm4gdGhpcyB0byBwcmVzZXJ2ZSBjaGFpbmFiaWxpdHkuXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJucyAhPT0gdW5kZWZpbmVkID8gcmV0dXJucyA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKioqKioqKioqKioqKioqKioqKlxuICogIFNUQVRJQyBNRVRIT0RTXG4gKioqKioqKioqKioqKioqKioqKiovXG4gICAgLy8gZ2V0IHRoZSBjb3VudHJ5IGRhdGEgb2JqZWN0XG4gICAgJC5mbltwbHVnaW5OYW1lXS5nZXRDb3VudHJ5RGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gYWxsQ291bnRyaWVzO1xuICAgIH07XG4gICAgLy8gbG9hZCB0aGUgdXRpbHMgc2NyaXB0XG4gICAgJC5mbltwbHVnaW5OYW1lXS5sb2FkVXRpbHMgPSBmdW5jdGlvbihwYXRoLCB1dGlsc1NjcmlwdERlZmVycmVkKSB7XG4gICAgICAgIGlmICghJC5mbltwbHVnaW5OYW1lXS5sb2FkZWRVdGlsc1NjcmlwdCkge1xuICAgICAgICAgICAgLy8gZG9uJ3QgZG8gdGhpcyB0d2ljZSEgKGRvbnQganVzdCBjaGVjayBpZiB3aW5kb3cuaW50bFRlbElucHV0VXRpbHMgZXhpc3RzIGFzIGlmIGluaXQgcGx1Z2luIG11bHRpcGxlIHRpbWVzIGluIHF1aWNrIHN1Y2Nlc3Npb24sIGl0IG1heSBub3QgaGF2ZSBmaW5pc2hlZCBsb2FkaW5nIHlldClcbiAgICAgICAgICAgICQuZm5bcGx1Z2luTmFtZV0ubG9hZGVkVXRpbHNTY3JpcHQgPSB0cnVlO1xuICAgICAgICAgICAgLy8gZG9udCB1c2UgJC5nZXRTY3JpcHQgYXMgaXQgcHJldmVudHMgY2FjaGluZ1xuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgIHVybDogcGF0aCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRlbGwgYWxsIGluc3RhbmNlcyB0aGF0IHRoZSB1dGlscyByZXF1ZXN0IGlzIGNvbXBsZXRlXG4gICAgICAgICAgICAgICAgICAgICQoXCIuaW50bC10ZWwtaW5wdXQgaW5wdXRcIikuaW50bFRlbElucHV0KFwiaGFuZGxlVXRpbHNcIik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogXCJzY3JpcHRcIixcbiAgICAgICAgICAgICAgICBjYWNoZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAodXRpbHNTY3JpcHREZWZlcnJlZCkge1xuICAgICAgICAgICAgdXRpbHNTY3JpcHREZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIGRlZmF1bHQgb3B0aW9uc1xuICAgICQuZm5bcGx1Z2luTmFtZV0uZGVmYXVsdHMgPSBkZWZhdWx0cztcbiAgICAvLyB2ZXJzaW9uXG4gICAgJC5mbltwbHVnaW5OYW1lXS52ZXJzaW9uID0gXCIxMi4xLjBcIjtcbiAgICAvLyBBcnJheSBvZiBjb3VudHJ5IG9iamVjdHMgZm9yIHRoZSBmbGFnIGRyb3Bkb3duLlxuICAgIC8vIEhlcmUgaXMgdGhlIGNyaXRlcmlhIGZvciB0aGUgcGx1Z2luIHRvIHN1cHBvcnQgYSBnaXZlbiBjb3VudHJ5L3RlcnJpdG9yeVxuICAgIC8vIC0gSXQgaGFzIGFuIGlzbzIgY29kZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPXzMxNjYtMV9hbHBoYS0yXG4gICAgLy8gLSBJdCBoYXMgaXQncyBvd24gY291bnRyeSBjYWxsaW5nIGNvZGUgKGl0IGlzIG5vdCBhIHN1Yi1yZWdpb24gb2YgYW5vdGhlciBjb3VudHJ5KTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGlzdF9vZl9jb3VudHJ5X2NhbGxpbmdfY29kZXNcbiAgICAvLyAtIEl0IGhhcyBhIGZsYWcgaW4gdGhlIHJlZ2lvbi1mbGFncyBwcm9qZWN0OiBodHRwczovL2dpdGh1Yi5jb20vYmVoZGFkL3JlZ2lvbi1mbGFncy90cmVlL2doLXBhZ2VzL3BuZ1xuICAgIC8vIC0gSXQgaXMgc3VwcG9ydGVkIGJ5IGxpYnBob25lbnVtYmVyIChpdCBtdXN0IGJlIGxpc3RlZCBvbiB0aGlzIHBhZ2UpOiBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlaTE4bi9saWJwaG9uZW51bWJlci9ibG9iL21hc3Rlci9yZXNvdXJjZXMvU2hvcnROdW1iZXJNZXRhZGF0YS54bWxcbiAgICAvLyBFYWNoIGNvdW50cnkgYXJyYXkgaGFzIHRoZSBmb2xsb3dpbmcgaW5mb3JtYXRpb246XG4gICAgLy8gW1xuICAgIC8vICAgIENvdW50cnkgbmFtZSxcbiAgICAvLyAgICBpc28yIGNvZGUsXG4gICAgLy8gICAgSW50ZXJuYXRpb25hbCBkaWFsIGNvZGUsXG4gICAgLy8gICAgT3JkZXIgKGlmID4xIGNvdW50cnkgd2l0aCBzYW1lIGRpYWwgY29kZSksXG4gICAgLy8gICAgQXJlYSBjb2Rlc1xuICAgIC8vIF1cbiAgICB2YXIgYWxsQ291bnRyaWVzID0gWyBbIFwiQWZnaGFuaXN0YW4gKOKAq9in2YHYutin2YbYs9iq2KfZhuKArOKAjilcIiwgXCJhZlwiLCBcIjkzXCIgXSwgWyBcIkFsYmFuaWEgKFNocWlww6tyaSlcIiwgXCJhbFwiLCBcIjM1NVwiIF0sIFsgXCJBbGdlcmlhICjigKvYp9mE2KzYstin2KbYseKArOKAjilcIiwgXCJkelwiLCBcIjIxM1wiIF0sIFsgXCJBbWVyaWNhbiBTYW1vYVwiLCBcImFzXCIsIFwiMTY4NFwiIF0sIFsgXCJBbmRvcnJhXCIsIFwiYWRcIiwgXCIzNzZcIiBdLCBbIFwiQW5nb2xhXCIsIFwiYW9cIiwgXCIyNDRcIiBdLCBbIFwiQW5ndWlsbGFcIiwgXCJhaVwiLCBcIjEyNjRcIiBdLCBbIFwiQW50aWd1YSBhbmQgQmFyYnVkYVwiLCBcImFnXCIsIFwiMTI2OFwiIF0sIFsgXCJBcmdlbnRpbmFcIiwgXCJhclwiLCBcIjU0XCIgXSwgWyBcIkFybWVuaWEgKNWA1aHVtdWh1b3Vv9Wh1bYpXCIsIFwiYW1cIiwgXCIzNzRcIiBdLCBbIFwiQXJ1YmFcIiwgXCJhd1wiLCBcIjI5N1wiIF0sIFsgXCJBdXN0cmFsaWFcIiwgXCJhdVwiLCBcIjYxXCIsIDAgXSwgWyBcIkF1c3RyaWEgKMOWc3RlcnJlaWNoKVwiLCBcImF0XCIsIFwiNDNcIiBdLCBbIFwiQXplcmJhaWphbiAoQXrJmXJiYXljYW4pXCIsIFwiYXpcIiwgXCI5OTRcIiBdLCBbIFwiQmFoYW1hc1wiLCBcImJzXCIsIFwiMTI0MlwiIF0sIFsgXCJCYWhyYWluICjigKvYp9mE2KjYrdix2YrZhuKArOKAjilcIiwgXCJiaFwiLCBcIjk3M1wiIF0sIFsgXCJCYW5nbGFkZXNoICjgpqzgpr7gpoLgprLgpr7gpqbgp4fgprYpXCIsIFwiYmRcIiwgXCI4ODBcIiBdLCBbIFwiQmFyYmFkb3NcIiwgXCJiYlwiLCBcIjEyNDZcIiBdLCBbIFwiQmVsYXJ1cyAo0JHQtdC70LDRgNGD0YHRjClcIiwgXCJieVwiLCBcIjM3NVwiIF0sIFsgXCJCZWxnaXVtIChCZWxnacOrKVwiLCBcImJlXCIsIFwiMzJcIiBdLCBbIFwiQmVsaXplXCIsIFwiYnpcIiwgXCI1MDFcIiBdLCBbIFwiQmVuaW4gKELDqW5pbilcIiwgXCJialwiLCBcIjIyOVwiIF0sIFsgXCJCZXJtdWRhXCIsIFwiYm1cIiwgXCIxNDQxXCIgXSwgWyBcIkJodXRhbiAo4L2g4L2W4L6y4L204L2CKVwiLCBcImJ0XCIsIFwiOTc1XCIgXSwgWyBcIkJvbGl2aWFcIiwgXCJib1wiLCBcIjU5MVwiIF0sIFsgXCJCb3NuaWEgYW5kIEhlcnplZ292aW5hICjQkdC+0YHQvdCwINC4INCl0LXRgNGG0LXQs9C+0LLQuNC90LApXCIsIFwiYmFcIiwgXCIzODdcIiBdLCBbIFwiQm90c3dhbmFcIiwgXCJid1wiLCBcIjI2N1wiIF0sIFsgXCJCcmF6aWwgKEJyYXNpbClcIiwgXCJiclwiLCBcIjU1XCIgXSwgWyBcIkJyaXRpc2ggSW5kaWFuIE9jZWFuIFRlcnJpdG9yeVwiLCBcImlvXCIsIFwiMjQ2XCIgXSwgWyBcIkJyaXRpc2ggVmlyZ2luIElzbGFuZHNcIiwgXCJ2Z1wiLCBcIjEyODRcIiBdLCBbIFwiQnJ1bmVpXCIsIFwiYm5cIiwgXCI2NzNcIiBdLCBbIFwiQnVsZ2FyaWEgKNCR0YrQu9Cz0LDRgNC40Y8pXCIsIFwiYmdcIiwgXCIzNTlcIiBdLCBbIFwiQnVya2luYSBGYXNvXCIsIFwiYmZcIiwgXCIyMjZcIiBdLCBbIFwiQnVydW5kaSAoVWJ1cnVuZGkpXCIsIFwiYmlcIiwgXCIyNTdcIiBdLCBbIFwiQ2FtYm9kaWEgKOGegOGemOGfkuGeluGeu+Geh+GetilcIiwgXCJraFwiLCBcIjg1NVwiIF0sIFsgXCJDYW1lcm9vbiAoQ2FtZXJvdW4pXCIsIFwiY21cIiwgXCIyMzdcIiBdLCBbIFwiQ2FuYWRhXCIsIFwiY2FcIiwgXCIxXCIsIDEsIFsgXCIyMDRcIiwgXCIyMjZcIiwgXCIyMzZcIiwgXCIyNDlcIiwgXCIyNTBcIiwgXCIyODlcIiwgXCIzMDZcIiwgXCIzNDNcIiwgXCIzNjVcIiwgXCIzODdcIiwgXCI0MDNcIiwgXCI0MTZcIiwgXCI0MThcIiwgXCI0MzFcIiwgXCI0MzdcIiwgXCI0MzhcIiwgXCI0NTBcIiwgXCI1MDZcIiwgXCI1MTRcIiwgXCI1MTlcIiwgXCI1NDhcIiwgXCI1NzlcIiwgXCI1ODFcIiwgXCI1ODdcIiwgXCI2MDRcIiwgXCI2MTNcIiwgXCI2MzlcIiwgXCI2NDdcIiwgXCI2NzJcIiwgXCI3MDVcIiwgXCI3MDlcIiwgXCI3NDJcIiwgXCI3NzhcIiwgXCI3ODBcIiwgXCI3ODJcIiwgXCI4MDdcIiwgXCI4MTlcIiwgXCI4MjVcIiwgXCI4NjdcIiwgXCI4NzNcIiwgXCI5MDJcIiwgXCI5MDVcIiBdIF0sIFsgXCJDYXBlIFZlcmRlIChLYWJ1IFZlcmRpKVwiLCBcImN2XCIsIFwiMjM4XCIgXSwgWyBcIkNhcmliYmVhbiBOZXRoZXJsYW5kc1wiLCBcImJxXCIsIFwiNTk5XCIsIDEgXSwgWyBcIkNheW1hbiBJc2xhbmRzXCIsIFwia3lcIiwgXCIxMzQ1XCIgXSwgWyBcIkNlbnRyYWwgQWZyaWNhbiBSZXB1YmxpYyAoUsOpcHVibGlxdWUgY2VudHJhZnJpY2FpbmUpXCIsIFwiY2ZcIiwgXCIyMzZcIiBdLCBbIFwiQ2hhZCAoVGNoYWQpXCIsIFwidGRcIiwgXCIyMzVcIiBdLCBbIFwiQ2hpbGVcIiwgXCJjbFwiLCBcIjU2XCIgXSwgWyBcIkNoaW5hICjkuK3lm70pXCIsIFwiY25cIiwgXCI4NlwiIF0sIFsgXCJDaHJpc3RtYXMgSXNsYW5kXCIsIFwiY3hcIiwgXCI2MVwiLCAyIF0sIFsgXCJDb2NvcyAoS2VlbGluZykgSXNsYW5kc1wiLCBcImNjXCIsIFwiNjFcIiwgMSBdLCBbIFwiQ29sb21iaWFcIiwgXCJjb1wiLCBcIjU3XCIgXSwgWyBcIkNvbW9yb3MgKOKAq9is2LLYsSDYp9mE2YLZhdix4oCs4oCOKVwiLCBcImttXCIsIFwiMjY5XCIgXSwgWyBcIkNvbmdvIChEUkMpIChKYW1odXJpIHlhIEtpZGVtb2tyYXNpYSB5YSBLb25nbylcIiwgXCJjZFwiLCBcIjI0M1wiIF0sIFsgXCJDb25nbyAoUmVwdWJsaWMpIChDb25nby1CcmF6emF2aWxsZSlcIiwgXCJjZ1wiLCBcIjI0MlwiIF0sIFsgXCJDb29rIElzbGFuZHNcIiwgXCJja1wiLCBcIjY4MlwiIF0sIFsgXCJDb3N0YSBSaWNhXCIsIFwiY3JcIiwgXCI1MDZcIiBdLCBbIFwiQ8O0dGUgZOKAmUl2b2lyZVwiLCBcImNpXCIsIFwiMjI1XCIgXSwgWyBcIkNyb2F0aWEgKEhydmF0c2thKVwiLCBcImhyXCIsIFwiMzg1XCIgXSwgWyBcIkN1YmFcIiwgXCJjdVwiLCBcIjUzXCIgXSwgWyBcIkN1cmHDp2FvXCIsIFwiY3dcIiwgXCI1OTlcIiwgMCBdLCBbIFwiQ3lwcnVzICjOms+Nz4DPgc6/z4IpXCIsIFwiY3lcIiwgXCIzNTdcIiBdLCBbIFwiQ3plY2ggUmVwdWJsaWMgKMSMZXNrw6EgcmVwdWJsaWthKVwiLCBcImN6XCIsIFwiNDIwXCIgXSwgWyBcIkRlbm1hcmsgKERhbm1hcmspXCIsIFwiZGtcIiwgXCI0NVwiIF0sIFsgXCJEamlib3V0aVwiLCBcImRqXCIsIFwiMjUzXCIgXSwgWyBcIkRvbWluaWNhXCIsIFwiZG1cIiwgXCIxNzY3XCIgXSwgWyBcIkRvbWluaWNhbiBSZXB1YmxpYyAoUmVww7pibGljYSBEb21pbmljYW5hKVwiLCBcImRvXCIsIFwiMVwiLCAyLCBbIFwiODA5XCIsIFwiODI5XCIsIFwiODQ5XCIgXSBdLCBbIFwiRWN1YWRvclwiLCBcImVjXCIsIFwiNTkzXCIgXSwgWyBcIkVneXB0ICjigKvZhdi12LHigKzigI4pXCIsIFwiZWdcIiwgXCIyMFwiIF0sIFsgXCJFbCBTYWx2YWRvclwiLCBcInN2XCIsIFwiNTAzXCIgXSwgWyBcIkVxdWF0b3JpYWwgR3VpbmVhIChHdWluZWEgRWN1YXRvcmlhbClcIiwgXCJncVwiLCBcIjI0MFwiIF0sIFsgXCJFcml0cmVhXCIsIFwiZXJcIiwgXCIyOTFcIiBdLCBbIFwiRXN0b25pYSAoRWVzdGkpXCIsIFwiZWVcIiwgXCIzNzJcIiBdLCBbIFwiRXRoaW9waWFcIiwgXCJldFwiLCBcIjI1MVwiIF0sIFsgXCJGYWxrbGFuZCBJc2xhbmRzIChJc2xhcyBNYWx2aW5hcylcIiwgXCJma1wiLCBcIjUwMFwiIF0sIFsgXCJGYXJvZSBJc2xhbmRzIChGw7hyb3lhcilcIiwgXCJmb1wiLCBcIjI5OFwiIF0sIFsgXCJGaWppXCIsIFwiZmpcIiwgXCI2NzlcIiBdLCBbIFwiRmlubGFuZCAoU3VvbWkpXCIsIFwiZmlcIiwgXCIzNThcIiwgMCBdLCBbIFwiRnJhbmNlXCIsIFwiZnJcIiwgXCIzM1wiIF0sIFsgXCJGcmVuY2ggR3VpYW5hIChHdXlhbmUgZnJhbsOnYWlzZSlcIiwgXCJnZlwiLCBcIjU5NFwiIF0sIFsgXCJGcmVuY2ggUG9seW5lc2lhIChQb2x5bsOpc2llIGZyYW7Dp2Fpc2UpXCIsIFwicGZcIiwgXCI2ODlcIiBdLCBbIFwiR2Fib25cIiwgXCJnYVwiLCBcIjI0MVwiIF0sIFsgXCJHYW1iaWFcIiwgXCJnbVwiLCBcIjIyMFwiIF0sIFsgXCJHZW9yZ2lhICjhg6Hhg5Dhg6Xhg5Dhg6Dhg5fhg5Xhg5Thg5rhg50pXCIsIFwiZ2VcIiwgXCI5OTVcIiBdLCBbIFwiR2VybWFueSAoRGV1dHNjaGxhbmQpXCIsIFwiZGVcIiwgXCI0OVwiIF0sIFsgXCJHaGFuYSAoR2FhbmEpXCIsIFwiZ2hcIiwgXCIyMzNcIiBdLCBbIFwiR2licmFsdGFyXCIsIFwiZ2lcIiwgXCIzNTBcIiBdLCBbIFwiR3JlZWNlICjOlc67zrvOrM60zrEpXCIsIFwiZ3JcIiwgXCIzMFwiIF0sIFsgXCJHcmVlbmxhbmQgKEthbGFhbGxpdCBOdW5hYXQpXCIsIFwiZ2xcIiwgXCIyOTlcIiBdLCBbIFwiR3JlbmFkYVwiLCBcImdkXCIsIFwiMTQ3M1wiIF0sIFsgXCJHdWFkZWxvdXBlXCIsIFwiZ3BcIiwgXCI1OTBcIiwgMCBdLCBbIFwiR3VhbVwiLCBcImd1XCIsIFwiMTY3MVwiIF0sIFsgXCJHdWF0ZW1hbGFcIiwgXCJndFwiLCBcIjUwMlwiIF0sIFsgXCJHdWVybnNleVwiLCBcImdnXCIsIFwiNDRcIiwgMSBdLCBbIFwiR3VpbmVhIChHdWluw6llKVwiLCBcImduXCIsIFwiMjI0XCIgXSwgWyBcIkd1aW5lYS1CaXNzYXUgKEd1aW7DqSBCaXNzYXUpXCIsIFwiZ3dcIiwgXCIyNDVcIiBdLCBbIFwiR3V5YW5hXCIsIFwiZ3lcIiwgXCI1OTJcIiBdLCBbIFwiSGFpdGlcIiwgXCJodFwiLCBcIjUwOVwiIF0sIFsgXCJIb25kdXJhc1wiLCBcImhuXCIsIFwiNTA0XCIgXSwgWyBcIkhvbmcgS29uZyAo6aaZ5rivKVwiLCBcImhrXCIsIFwiODUyXCIgXSwgWyBcIkh1bmdhcnkgKE1hZ3lhcm9yc3rDoWcpXCIsIFwiaHVcIiwgXCIzNlwiIF0sIFsgXCJJY2VsYW5kICjDjXNsYW5kKVwiLCBcImlzXCIsIFwiMzU0XCIgXSwgWyBcIkluZGlhICjgpK3gpL7gpLDgpKQpXCIsIFwiaW5cIiwgXCI5MVwiIF0sIFsgXCJJbmRvbmVzaWFcIiwgXCJpZFwiLCBcIjYyXCIgXSwgWyBcIklyYW4gKOKAq9in24zYsdin2YbigKzigI4pXCIsIFwiaXJcIiwgXCI5OFwiIF0sIFsgXCJJcmFxICjigKvYp9mE2LnYsdin2YLigKzigI4pXCIsIFwiaXFcIiwgXCI5NjRcIiBdLCBbIFwiSXJlbGFuZFwiLCBcImllXCIsIFwiMzUzXCIgXSwgWyBcIklzbGUgb2YgTWFuXCIsIFwiaW1cIiwgXCI0NFwiLCAyIF0sIFsgXCJJc3JhZWwgKOKAq9eZ16nXqNeQ15zigKzigI4pXCIsIFwiaWxcIiwgXCI5NzJcIiBdLCBbIFwiSXRhbHkgKEl0YWxpYSlcIiwgXCJpdFwiLCBcIjM5XCIsIDAgXSwgWyBcIkphbWFpY2FcIiwgXCJqbVwiLCBcIjE4NzZcIiBdLCBbIFwiSmFwYW4gKOaXpeacrClcIiwgXCJqcFwiLCBcIjgxXCIgXSwgWyBcIkplcnNleVwiLCBcImplXCIsIFwiNDRcIiwgMyBdLCBbIFwiSm9yZGFuICjigKvYp9mE2KPYsdiv2YbigKzigI4pXCIsIFwiam9cIiwgXCI5NjJcIiBdLCBbIFwiS2F6YWtoc3RhbiAo0JrQsNC30LDRhdGB0YLQsNC9KVwiLCBcImt6XCIsIFwiN1wiLCAxIF0sIFsgXCJLZW55YVwiLCBcImtlXCIsIFwiMjU0XCIgXSwgWyBcIktpcmliYXRpXCIsIFwia2lcIiwgXCI2ODZcIiBdLCBbIFwiS29zb3ZvXCIsIFwieGtcIiwgXCIzODNcIiBdLCBbIFwiS3V3YWl0ICjigKvYp9mE2YPZiNmK2KrigKzigI4pXCIsIFwia3dcIiwgXCI5NjVcIiBdLCBbIFwiS3lyZ3l6c3RhbiAo0JrRi9GA0LPRi9C30YHRgtCw0L0pXCIsIFwia2dcIiwgXCI5OTZcIiBdLCBbIFwiTGFvcyAo4Lql4Lqy4LqnKVwiLCBcImxhXCIsIFwiODU2XCIgXSwgWyBcIkxhdHZpYSAoTGF0dmlqYSlcIiwgXCJsdlwiLCBcIjM3MVwiIF0sIFsgXCJMZWJhbm9uICjigKvZhNio2YbYp9mG4oCs4oCOKVwiLCBcImxiXCIsIFwiOTYxXCIgXSwgWyBcIkxlc290aG9cIiwgXCJsc1wiLCBcIjI2NlwiIF0sIFsgXCJMaWJlcmlhXCIsIFwibHJcIiwgXCIyMzFcIiBdLCBbIFwiTGlieWEgKOKAq9mE2YrYqNmK2KfigKzigI4pXCIsIFwibHlcIiwgXCIyMThcIiBdLCBbIFwiTGllY2h0ZW5zdGVpblwiLCBcImxpXCIsIFwiNDIzXCIgXSwgWyBcIkxpdGh1YW5pYSAoTGlldHV2YSlcIiwgXCJsdFwiLCBcIjM3MFwiIF0sIFsgXCJMdXhlbWJvdXJnXCIsIFwibHVcIiwgXCIzNTJcIiBdLCBbIFwiTWFjYXUgKOa+s+mWgClcIiwgXCJtb1wiLCBcIjg1M1wiIF0sIFsgXCJNYWNlZG9uaWEgKEZZUk9NKSAo0JzQsNC60LXQtNC+0L3QuNGY0LApXCIsIFwibWtcIiwgXCIzODlcIiBdLCBbIFwiTWFkYWdhc2NhciAoTWFkYWdhc2lrYXJhKVwiLCBcIm1nXCIsIFwiMjYxXCIgXSwgWyBcIk1hbGF3aVwiLCBcIm13XCIsIFwiMjY1XCIgXSwgWyBcIk1hbGF5c2lhXCIsIFwibXlcIiwgXCI2MFwiIF0sIFsgXCJNYWxkaXZlc1wiLCBcIm12XCIsIFwiOTYwXCIgXSwgWyBcIk1hbGlcIiwgXCJtbFwiLCBcIjIyM1wiIF0sIFsgXCJNYWx0YVwiLCBcIm10XCIsIFwiMzU2XCIgXSwgWyBcIk1hcnNoYWxsIElzbGFuZHNcIiwgXCJtaFwiLCBcIjY5MlwiIF0sIFsgXCJNYXJ0aW5pcXVlXCIsIFwibXFcIiwgXCI1OTZcIiBdLCBbIFwiTWF1cml0YW5pYSAo4oCr2YXZiNix2YrYqtin2YbZitin4oCs4oCOKVwiLCBcIm1yXCIsIFwiMjIyXCIgXSwgWyBcIk1hdXJpdGl1cyAoTW9yaXMpXCIsIFwibXVcIiwgXCIyMzBcIiBdLCBbIFwiTWF5b3R0ZVwiLCBcInl0XCIsIFwiMjYyXCIsIDEgXSwgWyBcIk1leGljbyAoTcOpeGljbylcIiwgXCJteFwiLCBcIjUyXCIgXSwgWyBcIk1pY3JvbmVzaWFcIiwgXCJmbVwiLCBcIjY5MVwiIF0sIFsgXCJNb2xkb3ZhIChSZXB1YmxpY2EgTW9sZG92YSlcIiwgXCJtZFwiLCBcIjM3M1wiIF0sIFsgXCJNb25hY29cIiwgXCJtY1wiLCBcIjM3N1wiIF0sIFsgXCJNb25nb2xpYSAo0JzQvtC90LPQvtC7KVwiLCBcIm1uXCIsIFwiOTc2XCIgXSwgWyBcIk1vbnRlbmVncm8gKENybmEgR29yYSlcIiwgXCJtZVwiLCBcIjM4MlwiIF0sIFsgXCJNb250c2VycmF0XCIsIFwibXNcIiwgXCIxNjY0XCIgXSwgWyBcIk1vcm9jY28gKOKAq9in2YTZhdi62LHYqOKArOKAjilcIiwgXCJtYVwiLCBcIjIxMlwiLCAwIF0sIFsgXCJNb3phbWJpcXVlIChNb8OnYW1iaXF1ZSlcIiwgXCJtelwiLCBcIjI1OFwiIF0sIFsgXCJNeWFubWFyIChCdXJtYSkgKOGAmeGAvOGAlOGAuuGAmeGArClcIiwgXCJtbVwiLCBcIjk1XCIgXSwgWyBcIk5hbWliaWEgKE5hbWliacOrKVwiLCBcIm5hXCIsIFwiMjY0XCIgXSwgWyBcIk5hdXJ1XCIsIFwibnJcIiwgXCI2NzRcIiBdLCBbIFwiTmVwYWwgKOCkqOClh+CkquCkvuCksilcIiwgXCJucFwiLCBcIjk3N1wiIF0sIFsgXCJOZXRoZXJsYW5kcyAoTmVkZXJsYW5kKVwiLCBcIm5sXCIsIFwiMzFcIiBdLCBbIFwiTmV3IENhbGVkb25pYSAoTm91dmVsbGUtQ2Fsw6lkb25pZSlcIiwgXCJuY1wiLCBcIjY4N1wiIF0sIFsgXCJOZXcgWmVhbGFuZFwiLCBcIm56XCIsIFwiNjRcIiBdLCBbIFwiTmljYXJhZ3VhXCIsIFwibmlcIiwgXCI1MDVcIiBdLCBbIFwiTmlnZXIgKE5pamFyKVwiLCBcIm5lXCIsIFwiMjI3XCIgXSwgWyBcIk5pZ2VyaWFcIiwgXCJuZ1wiLCBcIjIzNFwiIF0sIFsgXCJOaXVlXCIsIFwibnVcIiwgXCI2ODNcIiBdLCBbIFwiTm9yZm9sayBJc2xhbmRcIiwgXCJuZlwiLCBcIjY3MlwiIF0sIFsgXCJOb3J0aCBLb3JlYSAo7KGw7ISgIOuvvOyjvOyjvOydmCDsnbjrr7wg6rO17ZmU6rWtKVwiLCBcImtwXCIsIFwiODUwXCIgXSwgWyBcIk5vcnRoZXJuIE1hcmlhbmEgSXNsYW5kc1wiLCBcIm1wXCIsIFwiMTY3MFwiIF0sIFsgXCJOb3J3YXkgKE5vcmdlKVwiLCBcIm5vXCIsIFwiNDdcIiwgMCBdLCBbIFwiT21hbiAo4oCr2LnZj9mF2KfZhuKArOKAjilcIiwgXCJvbVwiLCBcIjk2OFwiIF0sIFsgXCJQYWtpc3RhbiAo4oCr2b7Yp9qp2LPYqtin2YbigKzigI4pXCIsIFwicGtcIiwgXCI5MlwiIF0sIFsgXCJQYWxhdVwiLCBcInB3XCIsIFwiNjgwXCIgXSwgWyBcIlBhbGVzdGluZSAo4oCr2YHZhNiz2LfZitmG4oCs4oCOKVwiLCBcInBzXCIsIFwiOTcwXCIgXSwgWyBcIlBhbmFtYSAoUGFuYW3DoSlcIiwgXCJwYVwiLCBcIjUwN1wiIF0sIFsgXCJQYXB1YSBOZXcgR3VpbmVhXCIsIFwicGdcIiwgXCI2NzVcIiBdLCBbIFwiUGFyYWd1YXlcIiwgXCJweVwiLCBcIjU5NVwiIF0sIFsgXCJQZXJ1IChQZXLDuilcIiwgXCJwZVwiLCBcIjUxXCIgXSwgWyBcIlBoaWxpcHBpbmVzXCIsIFwicGhcIiwgXCI2M1wiIF0sIFsgXCJQb2xhbmQgKFBvbHNrYSlcIiwgXCJwbFwiLCBcIjQ4XCIgXSwgWyBcIlBvcnR1Z2FsXCIsIFwicHRcIiwgXCIzNTFcIiBdLCBbIFwiUHVlcnRvIFJpY29cIiwgXCJwclwiLCBcIjFcIiwgMywgWyBcIjc4N1wiLCBcIjkzOVwiIF0gXSwgWyBcIlFhdGFyICjigKvZgti32LHigKzigI4pXCIsIFwicWFcIiwgXCI5NzRcIiBdLCBbIFwiUsOpdW5pb24gKExhIFLDqXVuaW9uKVwiLCBcInJlXCIsIFwiMjYyXCIsIDAgXSwgWyBcIlJvbWFuaWEgKFJvbcOibmlhKVwiLCBcInJvXCIsIFwiNDBcIiBdLCBbIFwiUnVzc2lhICjQoNC+0YHRgdC40Y8pXCIsIFwicnVcIiwgXCI3XCIsIDAgXSwgWyBcIlJ3YW5kYVwiLCBcInJ3XCIsIFwiMjUwXCIgXSwgWyBcIlNhaW50IEJhcnRow6lsZW15XCIsIFwiYmxcIiwgXCI1OTBcIiwgMSBdLCBbIFwiU2FpbnQgSGVsZW5hXCIsIFwic2hcIiwgXCIyOTBcIiBdLCBbIFwiU2FpbnQgS2l0dHMgYW5kIE5ldmlzXCIsIFwia25cIiwgXCIxODY5XCIgXSwgWyBcIlNhaW50IEx1Y2lhXCIsIFwibGNcIiwgXCIxNzU4XCIgXSwgWyBcIlNhaW50IE1hcnRpbiAoU2FpbnQtTWFydGluIChwYXJ0aWUgZnJhbsOnYWlzZSkpXCIsIFwibWZcIiwgXCI1OTBcIiwgMiBdLCBbIFwiU2FpbnQgUGllcnJlIGFuZCBNaXF1ZWxvbiAoU2FpbnQtUGllcnJlLWV0LU1pcXVlbG9uKVwiLCBcInBtXCIsIFwiNTA4XCIgXSwgWyBcIlNhaW50IFZpbmNlbnQgYW5kIHRoZSBHcmVuYWRpbmVzXCIsIFwidmNcIiwgXCIxNzg0XCIgXSwgWyBcIlNhbW9hXCIsIFwid3NcIiwgXCI2ODVcIiBdLCBbIFwiU2FuIE1hcmlub1wiLCBcInNtXCIsIFwiMzc4XCIgXSwgWyBcIlPDo28gVG9tw6kgYW5kIFByw61uY2lwZSAoU8OjbyBUb23DqSBlIFByw61uY2lwZSlcIiwgXCJzdFwiLCBcIjIzOVwiIF0sIFsgXCJTYXVkaSBBcmFiaWEgKOKAq9in2YTZhdmF2YTZg9ipINin2YTYudix2KjZitipINin2YTYs9i52YjYr9mK2KnigKzigI4pXCIsIFwic2FcIiwgXCI5NjZcIiBdLCBbIFwiU2VuZWdhbCAoU8OpbsOpZ2FsKVwiLCBcInNuXCIsIFwiMjIxXCIgXSwgWyBcIlNlcmJpYSAo0KHRgNCx0LjRmNCwKVwiLCBcInJzXCIsIFwiMzgxXCIgXSwgWyBcIlNleWNoZWxsZXNcIiwgXCJzY1wiLCBcIjI0OFwiIF0sIFsgXCJTaWVycmEgTGVvbmVcIiwgXCJzbFwiLCBcIjIzMlwiIF0sIFsgXCJTaW5nYXBvcmVcIiwgXCJzZ1wiLCBcIjY1XCIgXSwgWyBcIlNpbnQgTWFhcnRlblwiLCBcInN4XCIsIFwiMTcyMVwiIF0sIFsgXCJTbG92YWtpYSAoU2xvdmVuc2tvKVwiLCBcInNrXCIsIFwiNDIxXCIgXSwgWyBcIlNsb3ZlbmlhIChTbG92ZW5pamEpXCIsIFwic2lcIiwgXCIzODZcIiBdLCBbIFwiU29sb21vbiBJc2xhbmRzXCIsIFwic2JcIiwgXCI2NzdcIiBdLCBbIFwiU29tYWxpYSAoU29vbWFhbGl5YSlcIiwgXCJzb1wiLCBcIjI1MlwiIF0sIFsgXCJTb3V0aCBBZnJpY2FcIiwgXCJ6YVwiLCBcIjI3XCIgXSwgWyBcIlNvdXRoIEtvcmVhICjrjIDtlZzrr7zqta0pXCIsIFwia3JcIiwgXCI4MlwiIF0sIFsgXCJTb3V0aCBTdWRhbiAo4oCr2KzZhtmI2Kgg2KfZhNiz2YjYr9in2YbigKzigI4pXCIsIFwic3NcIiwgXCIyMTFcIiBdLCBbIFwiU3BhaW4gKEVzcGHDsWEpXCIsIFwiZXNcIiwgXCIzNFwiIF0sIFsgXCJTcmkgTGFua2EgKOC3geC3iuKAjeC2u+C3kyDgtr3gtoLgtprgt4/gt4ApXCIsIFwibGtcIiwgXCI5NFwiIF0sIFsgXCJTdWRhbiAo4oCr2KfZhNiz2YjYr9in2YbigKzigI4pXCIsIFwic2RcIiwgXCIyNDlcIiBdLCBbIFwiU3VyaW5hbWVcIiwgXCJzclwiLCBcIjU5N1wiIF0sIFsgXCJTdmFsYmFyZCBhbmQgSmFuIE1heWVuXCIsIFwic2pcIiwgXCI0N1wiLCAxIF0sIFsgXCJTd2F6aWxhbmRcIiwgXCJzelwiLCBcIjI2OFwiIF0sIFsgXCJTd2VkZW4gKFN2ZXJpZ2UpXCIsIFwic2VcIiwgXCI0NlwiIF0sIFsgXCJTd2l0emVybGFuZCAoU2Nod2VpeilcIiwgXCJjaFwiLCBcIjQxXCIgXSwgWyBcIlN5cmlhICjigKvYs9mI2LHZitin4oCs4oCOKVwiLCBcInN5XCIsIFwiOTYzXCIgXSwgWyBcIlRhaXdhbiAo5Y+w54GjKVwiLCBcInR3XCIsIFwiODg2XCIgXSwgWyBcIlRhamlraXN0YW5cIiwgXCJ0alwiLCBcIjk5MlwiIF0sIFsgXCJUYW56YW5pYVwiLCBcInR6XCIsIFwiMjU1XCIgXSwgWyBcIlRoYWlsYW5kICjguYTguJfguKIpXCIsIFwidGhcIiwgXCI2NlwiIF0sIFsgXCJUaW1vci1MZXN0ZVwiLCBcInRsXCIsIFwiNjcwXCIgXSwgWyBcIlRvZ29cIiwgXCJ0Z1wiLCBcIjIyOFwiIF0sIFsgXCJUb2tlbGF1XCIsIFwidGtcIiwgXCI2OTBcIiBdLCBbIFwiVG9uZ2FcIiwgXCJ0b1wiLCBcIjY3NlwiIF0sIFsgXCJUcmluaWRhZCBhbmQgVG9iYWdvXCIsIFwidHRcIiwgXCIxODY4XCIgXSwgWyBcIlR1bmlzaWEgKOKAq9iq2YjZhtiz4oCs4oCOKVwiLCBcInRuXCIsIFwiMjE2XCIgXSwgWyBcIlR1cmtleSAoVMO8cmtpeWUpXCIsIFwidHJcIiwgXCI5MFwiIF0sIFsgXCJUdXJrbWVuaXN0YW5cIiwgXCJ0bVwiLCBcIjk5M1wiIF0sIFsgXCJUdXJrcyBhbmQgQ2FpY29zIElzbGFuZHNcIiwgXCJ0Y1wiLCBcIjE2NDlcIiBdLCBbIFwiVHV2YWx1XCIsIFwidHZcIiwgXCI2ODhcIiBdLCBbIFwiVS5TLiBWaXJnaW4gSXNsYW5kc1wiLCBcInZpXCIsIFwiMTM0MFwiIF0sIFsgXCJVZ2FuZGFcIiwgXCJ1Z1wiLCBcIjI1NlwiIF0sIFsgXCJVa3JhaW5lICjQo9C60YDQsNGX0L3QsClcIiwgXCJ1YVwiLCBcIjM4MFwiIF0sIFsgXCJVbml0ZWQgQXJhYiBFbWlyYXRlcyAo4oCr2KfZhNil2YXYp9ix2KfYqiDYp9mE2LnYsdio2YrYqSDYp9mE2YXYqtit2K/YqeKArOKAjilcIiwgXCJhZVwiLCBcIjk3MVwiIF0sIFsgXCJVbml0ZWQgS2luZ2RvbVwiLCBcImdiXCIsIFwiNDRcIiwgMCBdLCBbIFwiVW5pdGVkIFN0YXRlc1wiLCBcInVzXCIsIFwiMVwiLCAwIF0sIFsgXCJVcnVndWF5XCIsIFwidXlcIiwgXCI1OThcIiBdLCBbIFwiVXpiZWtpc3RhbiAoT8q7emJla2lzdG9uKVwiLCBcInV6XCIsIFwiOTk4XCIgXSwgWyBcIlZhbnVhdHVcIiwgXCJ2dVwiLCBcIjY3OFwiIF0sIFsgXCJWYXRpY2FuIENpdHkgKENpdHTDoCBkZWwgVmF0aWNhbm8pXCIsIFwidmFcIiwgXCIzOVwiLCAxIF0sIFsgXCJWZW5lenVlbGFcIiwgXCJ2ZVwiLCBcIjU4XCIgXSwgWyBcIlZpZXRuYW0gKFZp4buHdCBOYW0pXCIsIFwidm5cIiwgXCI4NFwiIF0sIFsgXCJXYWxsaXMgYW5kIEZ1dHVuYSAoV2FsbGlzLWV0LUZ1dHVuYSlcIiwgXCJ3ZlwiLCBcIjY4MVwiIF0sIFsgXCJXZXN0ZXJuIFNhaGFyYSAo4oCr2KfZhNi12K3Ysdin2KEg2KfZhNi62LHYqNmK2KnigKzigI4pXCIsIFwiZWhcIiwgXCIyMTJcIiwgMSBdLCBbIFwiWWVtZW4gKOKAq9in2YTZitmF2YbigKzigI4pXCIsIFwieWVcIiwgXCI5NjdcIiBdLCBbIFwiWmFtYmlhXCIsIFwiem1cIiwgXCIyNjBcIiBdLCBbIFwiWmltYmFid2VcIiwgXCJ6d1wiLCBcIjI2M1wiIF0sIFsgXCLDhWxhbmQgSXNsYW5kc1wiLCBcImF4XCIsIFwiMzU4XCIsIDEgXSBdO1xuICAgIC8vIGxvb3Agb3ZlciBhbGwgb2YgdGhlIGNvdW50cmllcyBhYm92ZVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsQ291bnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjID0gYWxsQ291bnRyaWVzW2ldO1xuICAgICAgICBhbGxDb3VudHJpZXNbaV0gPSB7XG4gICAgICAgICAgICBuYW1lOiBjWzBdLFxuICAgICAgICAgICAgaXNvMjogY1sxXSxcbiAgICAgICAgICAgIGRpYWxDb2RlOiBjWzJdLFxuICAgICAgICAgICAgcHJpb3JpdHk6IGNbM10gfHwgMCxcbiAgICAgICAgICAgIGFyZWFDb2RlczogY1s0XSB8fCBudWxsXG4gICAgICAgIH07XG4gICAgfVxufSk7Il19
