(function (window, document) {
    /*global HTMLElement */

    var typeof_string           = typeof "",
        typeof_undefined        = typeof undefined,
        typeof_function         = typeof function () {},
        typeof_object           = typeof {},
        isTypeOf                = function (item, type) { return typeof item === type; },
        isString                = function (item) { return isTypeOf(item, typeof_string); },
        isUndefined             = function (item) { return isTypeOf(item, typeof_undefined); },
        isFunction              = function (item) { return isTypeOf(item, typeof_function); },

        isObject                = function (item) { return isTypeOf(item, typeof_object); },
        //Returns true if it is a DOM element
        isElement               = function (o) {
            return typeof HTMLElement === "object" ? o instanceof HTMLElement : typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string";
        },



        generatesellMediaCart = function (space) {

            // stealing this from selectivizr
            var selectorEngines = {
                "MooTools"                          : "$$",
                "Prototype"                         : "$$",
                "jQuery"                            : "*"
            },


                // local variables for internal use
                item_id                 = 0,
                item_id_namespace       = "SCI-",
                sc_items                = {},
                namespace               = space || "sellMediaCart",
                selectorFunctions       = {},
                eventFunctions          = {},
                baseEvents              = {},

                // local references
                localStorage            = window.localStorage,
                console                 = window.console || { msgs: [], log: function (msg) { console.msgs.push(msg); } },

                // used in views
                _VALUE_     = 'value',
                _TEXT_      = 'text',
                _HTML_      = 'html',
                _CLICK_     = 'click',

                // Currencies
                currencies = {
                    "USD": { code: "USD", symbol: "&#36;", name: "US Dollar" },
                    "AUD": { code: "AUD", symbol: "&#36;", name: "Australian Dollar" },
                    "BRL": { code: "BRL", symbol: "R&#36;", name: "Brazilian Real" },
                    "CAD": { code: "CAD", symbol: "&#36;", name: "Canadian Dollar" },
                    "CZK": { code: "CZK", symbol: "&nbsp;&#75;&#269;", name: "Czech Koruna", after: true },
                    "DKK": { code: "DKK", symbol: "DKK&nbsp;", name: "Danish Krone" },
                    "EUR": { code: "EUR", symbol: "&euro;", name: "Euro" },
                    "HKD": { code: "HKD", symbol: "&#36;", name: "Hong Kong Dollar" },
                    "HUF": { code: "HUF", symbol: "&#70;&#116;", name: "Hungarian Forint" },
                    "ILS": { code: "ILS", symbol: "&#8362;", name: "Israeli New Sheqel" },
                    "JPY": { code: "JPY", symbol: "&yen;", name: "Japanese Yen", accuracy: 0 },
                    "MXN": { code: "MXN", symbol: "&#36;", name: "Mexican Peso" },
                    "NOK": { code: "NOK", symbol: "NOK&nbsp;", name: "Norwegian Krone" },
                    "NZD": { code: "NZD", symbol: "&#36;", name: "New Zealand Dollar" },
                    "PLN": { code: "PLN", symbol: "PLN&nbsp;", name: "Polish Zloty" },
                    "GBP": { code: "GBP", symbol: "&pound;", name: "Pound Sterling" },
                    "SGD": { code: "SGD", symbol: "&#36;", name: "Singapore Dollar" },
                    "SEK": { code: "SEK", symbol: "SEK&nbsp;", name: "Swedish Krona" },
                    "CHF": { code: "CHF", symbol: "CHF&nbsp;", name: "Swiss Franc" },
                    "THB": { code: "THB", symbol: "&#3647;", name: "Thai Baht" },
                    "ZAR": { code: "ZAR", symbol: "R&nbsp;", name: "South African rand" },
                    "PHP": { code: "PHP", symbol: "&#8369;", name: "Philippine Peso" },
                    "MYR": { code: "MYR", symbol: "RM &nbsp;", name: "Malaysian Ringgits" },
                    "TRY": { code: "TRY", symbol: "&#8378;", name: "Turkish Lira" },
                    "BTC": { code: "BTC", symbol: " BTC", name: "Bitcoin", accuracy: 4, after: true }
                },

                // default options
                settings = {
                    checkout                : { type: "PayPal", email: "you@yours.com" },
                    currency                : "USD",
                    language                : "english-us",

                    cartStyle               : "div",
                    cartColumns             : [
                        { attr: "name", label: "Name" },
                        { attr: "price", label: "Price", view: 'currency' },
                        { view: "decrement", label: false },
                        { attr: "quantity", label: "Qty" },
                        { view: "increment", label: false },
                        { attr: "total", label: "SubTotal", view: 'currency' },
                        { view: "remove", text: "Remove", label: false }
                    ],

                    excludeFromCheckout     : ['thumb'],

                    shippingFlatRate        : 0,
                    shippingQuantityRate    : 0,
                    shippingTotalRate       : 0,
                    shippingCustom          : null,

                    taxRate                 : 0,

                    taxShipping             : false,

                    data                    : {}

                },


                // main sellMediaCart object, function call is used for setting options
                sellMediaCart = function (options) {
                    // shortcut for sellMediaCart.ready
                    if (isFunction(options)) {
                        return sellMediaCart.ready(options);
                    }

                    // set options
                    if (isObject(options)) {
                        return sellMediaCart.extend(settings, options);
                    }
                },

                // selector engine
                $engine,

                // built in cart views for item cells
                cartColumnViews;

            // function for extending objects
            sellMediaCart.extend = function (target, opts) {
                var next;

                if (isUndefined(opts)) {
                    opts = target;
                    target = sellMediaCart;
                }

                for (next in opts) {
                    if (Object.prototype.hasOwnProperty.call(opts, next)) {
                        target[next] = opts[next];
                    }
                }
                return target;
            };

            // create copy function
            sellMediaCart.extend({
                copy: function (n) {
                    var cp = generatesellMediaCart(n);
                    cp.init();
                    return cp;
                }
            });

            // add in the core functionality
            sellMediaCart.extend({

                isReady: false,

                // this is where the magic happens, the add function
                add: function (values, opt_quiet) {
                    var info        = values || {},
                        newItem     = new sellMediaCart.Item(info),
                        addItem     = true,
                        // optionally supress event triggers
                        quiet       = opt_quiet === true ? opt_quiet : false,
                        oldItem;

                    // trigger before add event
                    if (!quiet) {
                        addItem = sellMediaCart.trigger('beforeAdd', [newItem]);

                        if (addItem === false) {
                            return false;
                        }
                    }

                    // if the new item already exists, increment the value
                    oldItem = sellMediaCart.has(newItem);
                    if (oldItem) {
                        oldItem.increment(newItem.quantity());
                        newItem = oldItem;

                    // otherwise add the item
                    } else {
                        sc_items[newItem.id()] = newItem;
                    }

                    // update the cart
                    sellMediaCart.update();

                    if (!quiet) {
                        // trigger after add event
                        sellMediaCart.trigger('afterAdd', [newItem, isUndefined(oldItem)]);
                    }

                    // return a reference to the added item
                    return newItem;
                },


                // iteration function
                each: function (array, callback) {
                    var next,
                        x = 0,
                        result,
                        cb,
                        items;

                    if (isFunction(array)) {
                        cb = array;
                        items = sc_items;
                    } else if (isFunction(callback)) {
                        cb = callback;
                        items = array;
                    } else {
                        return;
                    }

                    for (next in items) {
                        if (Object.prototype.hasOwnProperty.call(items, next)) {
                            result = cb.call(sellMediaCart, items[next], x, next);
                            if (result === false) {
                                return;
                            }
                            x += 1;
                        }
                    }
                },

                find: function (id) {
                    var items = [];

                    // return object for id if it exists
                    if (isObject(sc_items[id])) {
                        return sc_items[id];
                    }
                    // search through items with the given criteria
                    if (isObject(id)) {
                        sellMediaCart.each(function (item) {
                            var match = true;
                            sellMediaCart.each(id, function (val, x, attr) {

                                if (isString(val)) {
                                    // less than or equal to
                                    if (val.match(/<=.*/)) {
                                        val = parseFloat(val.replace('<=', ''));
                                        if (!(item.get(attr) && parseFloat(item.get(attr)) <= val)) {
                                            match = false;
                                        }

                                    // less than
                                    } else if (val.match(/</)) {
                                        val = parseFloat(val.replace('<', ''));
                                        if (!(item.get(attr) && parseFloat(item.get(attr)) < val)) {
                                            match = false;
                                        }

                                    // greater than or equal to
                                    } else if (val.match(/>=/)) {
                                        val = parseFloat(val.replace('>=', ''));
                                        if (!(item.get(attr) && parseFloat(item.get(attr)) >= val)) {
                                            match = false;
                                        }

                                    // greater than
                                    } else if (val.match(/>/)) {
                                        val = parseFloat(val.replace('>', ''));
                                        if (!(item.get(attr) && parseFloat(item.get(attr)) > val)) {
                                            match = false;
                                        }

                                    // equal to
                                    } else if (!(item.get(attr) && item.get(attr) === val)) {
                                        match = false;
                                    }

                                // equal to non string
                                } else if (!(item.get(attr) && item.get(attr) === val)) {
                                    match = false;
                                }

                                return match;
                            });

                            // add the item if it matches
                            if (match) {
                                items.push(item);
                            }
                        });
                        return items;
                    }

                    // if no criteria is given we return all items
                    if (isUndefined(id)) {

                        // use a new array so we don't give a reference to the
                        // cart's item array
                        sellMediaCart.each(function (item) {
                            items.push(item);
                        });
                        return items;
                    }

                    // return empty array as default
                    return items;
                },

                // return all items
                items: function () {
                    return this.find();
                },

                // check to see if item is in the cart already
                has: function (item) {
                    var match = false;

                    sellMediaCart.each(function (testItem) {
                        if (testItem.equals(item)) {
                            match = testItem;
                        }
                    });
                    return match;
                },

                // empty the cart
                empty: function () {
                    // remove each item individually so we see the remove events
                    var newItems = {};
                    sellMediaCart.each(function (item) {
                        // send a param of true to make sure it doesn't
                        // update after every removal
                        // keep the item if the function returns false,
                        // because we know it has been prevented
                        // from being removed
                        if (item.remove(true) === false) {
                            newItems[item.id()] = item
                        }
                    });
                    sc_items = newItems;
                    sellMediaCart.update();
                },


                // functions for accessing cart info
                quantity: function () {
                    var quantity = 0;
                    sellMediaCart.each(function (item) {
                        quantity += item.quantity();
                    });
                    return quantity;
                },

                total: function () {
                    var total = 0;
                    sellMediaCart.each(function (item) {
                        total += item.total();
                    });
                    return total;
                },

                grandTotal: function () {
                    return sellMediaCart.total() + sellMediaCart.tax() + sellMediaCart.shipping();
                },


                // updating functions
                update: function () {
                    sellMediaCart.save();
                    sellMediaCart.trigger("update");
                },

                init: function () {
                    sellMediaCart.load();
                    sellMediaCart.update();
                    sellMediaCart.ready();
                },

                // view management
                $: function (selector) {
                    return new sellMediaCart.ELEMENT(selector);
                },

                $create: function (tag) {
                    return sellMediaCart.$(document.createElement(tag));
                },

                setupViewTool: function () {
                    var members, member, context = window, engine;

                    // Determine the "best fit" selector engine
                    for (engine in selectorEngines) {
                        if (Object.prototype.hasOwnProperty.call(selectorEngines, engine) && window[engine]) {
                            members = selectorEngines[engine].replace("*", engine).split(".");
                            member = members.shift();
                            if (member) {
                                context = context[member];
                            }
                            if (typeof context === "function") {
                                // set the selector engine and extend the prototype of our
                                // element wrapper class
                                $engine = context;
                                sellMediaCart.extend(sellMediaCart.ELEMENT._, selectorFunctions[engine]);
                                return;
                            }
                        }
                    }
                },

                // return a list of id's in the cart
                ids: function () {
                    var ids = [];
                    sellMediaCart.each(function (item) {
                        ids.push(item.id());
                    });
                    return ids;

                },


                // storage
                save: function () {
                    sellMediaCart.trigger('beforeSave');

                    var items = {};

                    // save all the items
                    sellMediaCart.each(function (item) {
                        items[item.id()] = sellMediaCart.extend(item.fields(), item.options());
                    });

                    localStorage.setItem(namespace + "_items", JSON.stringify(items));

                    sellMediaCart.trigger('afterSave');
                },

                load: function () {

                    // empty without the update
                    sc_items = {};

                    var items = localStorage.getItem(namespace + "_items");

                    if (!items) {
                        return;
                    }

                    // we wrap this in a try statement so we can catch
                    // any json parsing errors. no more stick and we
                    // have a playing card pluckin the spokes now...
                    // soundin like a harley.
                    try {
                        sellMediaCart.each(JSON.parse(items), function (item) {
                            sellMediaCart.add(item, true);
                        });
                    } catch (e){
                        sellMediaCart.error( "Error Loading data: " + e );
                    }


                    sellMediaCart.trigger('load');
                },

                // ready function used as a shortcut for bind('ready',fn)
                ready: function (fn) {

                    if (isFunction(fn)) {
                        // call function if already ready already
                        if (sellMediaCart.isReady) {
                            fn.call(sellMediaCart);

                        // bind if not ready
                        } else {
                            sellMediaCart.bind('ready', fn);
                        }

                    // trigger ready event
                    } else if (isUndefined(fn) && !sellMediaCart.isReady) {
                        sellMediaCart.trigger('ready');
                        sellMediaCart.isReady = true;
                    }

                },


                error: function (message) {
                    var msg = "";
                    if (isString(message)) {
                        msg = message;
                    } else if (isObject(message) && isString(message.message)) {
                        msg = message.message;
                    }
                    try { console.log("sellMediaCart(js) Error: " + msg); } catch (e) {}
                    sellMediaCart.trigger('error', [message]);
                }
            });


            /*******************************************************************
             *  TAX AND SHIPPING
             *******************************************************************/
            sellMediaCart.extend({

                // TODO: tax and shipping
                tax: function () {
                    var totalToTax = settings.taxShipping ? sellMediaCart.total() + sellMediaCart.shipping() : sellMediaCart.total(),
                        cost = sellMediaCart.taxRate() * totalToTax;

                    sellMediaCart.each(function (item) {
                        if (item.get('tax')) {
                            cost += item.get('tax');
                        } else if (item.get('taxRate')) {
                            cost += item.get('taxRate') * item.total();
                        }
                    });
                    return parseFloat(cost);
                },

                taxRate: function () {
                    return settings.taxRate || 0;
                },

                shipping: function (opt_custom_function) {

                    // shortcut to extend options with custom shipping
                    if (isFunction(opt_custom_function)) {
                        sellMediaCart({
                            shippingCustom: opt_custom_function
                        });
                        return;
                    }

                    var cost = settings.shippingQuantityRate * sellMediaCart.quantity() +
                            settings.shippingTotalRate * sellMediaCart.total() +
                            settings.shippingFlatRate;

                    if (isFunction(settings.shippingCustom)) {
                        custom_shipping = settings.shippingCustom.call(sellMediaCart);
                    }

                    if ( custom_shipping ) {
                        sellMediaCart.each(function (item) {
                            cost += parseFloat(item.get('shipping') || 0);
                        });
                    } else {
                        cost = 0;
                    }

                    return parseFloat(cost);
                }

            });

            /*******************************************************************
             *  CART VIEWS
             *******************************************************************/

            // built in cart views for item cells
            cartColumnViews = {
                attr: function (item, column) {
                    return item.get(column.attr) || "";
                },

                currency: function (item, column) {
                    return sellMediaCart.toCurrency(item.get(column.attr) || 0);
                },

                link: function (item, column) {
                    return "<a href='" + item.get(column.attr) + "'>" + column.text + "</a>";
                },

                decrement: function (item, column) {
                    return "<a href='javascript:;' class='" + namespace + "_decrement'>" + (column.text || "-") + "</a>";
                },

                increment: function (item, column) {
                    return "<a href='javascript:;' class='" + namespace + "_increment'>" + (column.text || "+") + "</a>";
                },

                image: function (item, column) {
                    return "<img src='" + item.get(column.attr) + "'/>";
                },

                input: function (item, column) {
                    return "<input type='text' value='" + item.get(column.attr) + "' class='" + namespace + "_input'/>";
                },

                remove: function (item, column) {
                    return "<a href='javascript:;' class='" + namespace + "_remove'>" + (column.text || "X") + "</a>";
                }
            };

            // cart column wrapper class and functions
            function cartColumn(opts) {
                var options = opts || {};
                return sellMediaCart.extend({
                    attr            : "",
                    label           : "",
                    view            : "attr",
                    text            : "",
                    className       : "",
                    hide            : false
                }, options);
            }

            function cartCellView(item, column) {
                var viewFunc = isFunction(column.view) ? column.view : isString(column.view) && isFunction(cartColumnViews[column.view]) ? cartColumnViews[column.view] : cartColumnViews.attr;

                return viewFunc.call(sellMediaCart, item, column);
            }


            sellMediaCart.extend({

                // write out cart
                writeCart: function (selector) {
                    var TABLE = settings.cartStyle.toLowerCase(),
                        isTable = TABLE === 'table',
                        TR = isTable ? "tr" : "div",
                        TH = isTable ? 'th' : 'div',
                        TD = isTable ? 'td' : 'div',
                        THEAD = isTable ? 'thead' : 'div',
                        cart_container = sellMediaCart.$create(TABLE),
                        thead_container = sellMediaCart.$create(THEAD),
                        header_container = sellMediaCart.$create(TR).addClass('headerRow'),
                        container = sellMediaCart.$(selector),
                        column,
                        klass,
                        label,
                        x,
                        xlen;

                    container.html(' ').append(cart_container);

                    cart_container.append(thead_container);

                    thead_container.append(header_container);


                    // create header
                    for (x = 0, xlen = settings.cartColumns.length; x < xlen; x += 1) {
                        column  = cartColumn(settings.cartColumns[x]);
                        klass   =  "item-" + (column.attr || column.view || column.label || column.text || "cell") + " " + column.className;
                        label   = column.label || "";

                        // append the header cell
                        header_container.append(
                            sellMediaCart.$create(TH).addClass(klass).html(label)
                        );
                    }

                    // cycle through the items
                    sellMediaCart.each(function (item, y) {
                        sellMediaCart.createCartRow(item, y, TR, TD, cart_container);
                    });

                    return cart_container;
                },

                // generate a cart row from an item
                createCartRow: function (item, y, TR, TD, container) {
                    var row = sellMediaCart.$create(TR)
                                        .addClass('itemRow row-' + y + " " + (y % 2 ? "even" : "odd"))
                                        .attr('id', "cartItem_" + item.id()),
                        j,
                        jlen,
                        column,
                        klass,
                        content,
                        cell;

                    container.append(row);

                    // cycle through the columns to create each cell for the item
                    for (j = 0, jlen = settings.cartColumns.length; j < jlen; j += 1) {
                        column  = cartColumn(settings.cartColumns[j]);
                        klass   = "item-" + (column.attr || (isString(column.view) ? column.view : column.label || column.text || "cell")) + " " + column.className;
                        content = cartCellView(item, column);
                        cell    = sellMediaCart.$create(TD).addClass(klass).html(content);

                        row.append(cell);
                    }
                    return row;
                }

            });

            /*******************************************************************
             *  CART ITEM CLASS MANAGEMENT
             *******************************************************************/

            sellMediaCart.Item = function (info) {

                // we use the data object to track values for the item
                var _data = {},
                    me = this;

                // cycle through given attributes and set them to the data object
                if (isObject(info)) {
                    sellMediaCart.extend(_data, info);
                }

                // set the item id
                item_id += 1;
                _data.id = _data.id || item_id_namespace + item_id;
                while (!isUndefined(sc_items[_data.id])) {
                    item_id += 1;
                    _data.id = item_id_namespace + item_id;
                }

                function checkQuantityAndPrice() {

                    // check to make sure price is valid
                    if (isString(_data.price)) {
                       // trying to remove all chars that aren't numbers or '.'
                        _data.price = parseFloat(_data.price.replace(sellMediaCart.currency().decimal, ".").replace(/[^0-9\.]+/ig, ""));

                    }
                    if (isNaN(_data.price)) {
                        _data.price = 0;
                    }
                    if (_data.price < 0) {
                        _data.price = 0;
                    }

                    // check to make sure quantity is valid
                    if (isString(_data.quantity)) {
                        _data.quantity = parseInt(_data.quantity.replace(sellMediaCart.currency().delimiter, ""), 10);
                    }
                    if (isNaN(_data.quantity)) {
                        _data.quantity = 1;
                    }
                    if (_data.quantity <= 0) {
                        me.remove();
                    }

                }

                // getter and setter methods to access private variables
                me.get = function (name, skipPrototypes) {

                    var usePrototypes = !skipPrototypes;

                    if (isUndefined(name)) {
                        return name;
                    }

                    // return the value in order of the data object and then the prototype
                    return isFunction(_data[name])  ? _data[name].call(me) :
                            !isUndefined(_data[name]) ? _data[name] :

                            isFunction(me[name]) && usePrototypes       ? me[name].call(me) :
                            !isUndefined(me[name]) && usePrototypes ? me[name] :
                            _data[name];
                };
                me.set = function (name, value) {
                    if (!isUndefined(name)) {
                        _data[name.toLowerCase()] = value;
                        if (name.toLowerCase() === 'price' || name.toLowerCase() === 'quantity') {
                            checkQuantityAndPrice();
                        }
                    }
                    return me;
                };
                me.equals = function (item) {
                    for( var label in _data ){
                        if (Object.prototype.hasOwnProperty.call(_data, label)) {
                            if (label !== 'quantity' && label !== 'id') {
                                if (item.get(label) !== _data[label]) {
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                };
                me.options = function () {
                    var data = {};
                    sellMediaCart.each(_data,function (val, x, label) {
                        var add = true;
                        sellMediaCart.each(me.reservedFields(), function (field) {
                            if (field === label) {
                                add = false;
                            }
                            return add;
                        });

                        if (add) {
                            data[label] = me.get(label);
                        }
                    });
                    return data;
                };


                checkQuantityAndPrice();
            };

            sellMediaCart.Item._ = sellMediaCart.Item.prototype = {

                // editing the item quantity
                increment: function (amount) {
                    var diff = amount || 1;
                    diff = parseInt(diff, 10);

                    this.quantity(this.quantity() + diff);
                    if (this.quantity() < 1) {
                        this.remove();
                        return null;
                    }
                    return this;

                },
                decrement: function (amount) {
                    var diff = amount || 1;
                    return this.increment(-parseInt(diff, 10));
                },
                remove: function (skipUpdate) {
                    var removeItemBool = sellMediaCart.trigger("beforeRemove", [sc_items[this.id()]]);
                    if (removeItemBool === false ) {
                        return false;
                    }
                    delete sc_items[this.id()];
                    if (!skipUpdate) {
                        sellMediaCart.update();
                    }
                    return null;
                },

                // special fields for items
                reservedFields: function () {
                    return ['quantity', 'id', 'number', 'price', 'name', 'shipping', 'tax', 'taxRate'];
                },

                // return values for all reserved fields if they exist
                fields: function () {
                    var data = {},
                        me = this;
                    sellMediaCart.each(me.reservedFields(), function (field) {
                        if (me.get(field)) {
                            data[field] = me.get(field);
                        }
                    });
                    return data;
                },


                // shortcuts for getter/setters. can
                // be overwritten for customization
                // btw, we are hiring at wojo design, and could
                // use a great web designer. if thats you, you can
                // get more info at http://wojodesign.com/now-hiring/
                // or email me directly: brett@wojodesign.com
                quantity: function (val) {
                    return isUndefined(val) ? parseInt(this.get("quantity", true) || 1, 10) : this.set("quantity", val);
                },
                price: function (val) {
                    return isUndefined(val) ?
                            parseFloat((this.get("price",true).toString()).replace(sellMediaCart.currency().symbol,"").replace(sellMediaCart.currency().delimiter,"") || 1) :
                            this.set("price", parseFloat((val).toString().replace(sellMediaCart.currency().symbol,"").replace(sellMediaCart.currency().delimiter,"")));
                },
                id: function () {
                    return this.get('id',false);
                },
                total:function () {
                    return this.quantity()*this.price();
                }

            };




            /*******************************************************************
             *  CHECKOUT MANAGEMENT
             *******************************************************************/

            sellMediaCart.extend({
                checkout: function () {
                    if (settings.checkout.type.toLowerCase() === 'custom' && isFunction(settings.checkout.fn)) {
                        settings.checkout.fn.call(sellMediaCart,settings.checkout);
                    } else if (isFunction(sellMediaCart.checkout[settings.checkout.type])) {
                        var checkoutData = sellMediaCart.checkout[settings.checkout.type].call(sellMediaCart,settings.checkout);

                        // if the checkout method returns data, try to send the form
                        if( checkoutData.data && checkoutData.action && checkoutData.method ){
                            // if no one has any objections, send the checkout form
                            if( false !== sellMediaCart.trigger('beforeCheckout', [checkoutData.data]) ){
                                sellMediaCart.generateAndSendForm( checkoutData );
                            }
                        }

                    } else {
                        sellMediaCart.error("No Valid Checkout Method Specified");
                    }
                },
                extendCheckout: function (methods) {
                    return sellMediaCart.extend(sellMediaCart.checkout, methods);
                },
                generateAndSendForm: function (opts) {
                    var form = sellMediaCart.$create("form");
                    form.attr('style', 'display:none;');
                    form.attr('action', opts.action);
                    form.attr('method', opts.method);
                    sellMediaCart.each(opts.data, function (val, x, name) {
                        form.append(
                            sellMediaCart.$create("input").attr("type","hidden").attr("name",name).val(val)
                        );
                    });
                    sellMediaCart.$("body").append(form);
                    form.el.submit();
                    form.remove();
                }
            });

            sellMediaCart.extendCheckout({
                PayPal: function (opts) {
                    // account email is required
                    if (!opts.email) {
                        return sellMediaCart.error("No email provided for PayPal checkout");
                    }

                    // build basic form options
                    var data = {
                              cmd           : "_cart"
                            , upload        : "1"
                            , currency_code : sellMediaCart.currency().code
                            , business      : opts.email
                            , rm            : "2"
                            , tax_cart      : (sellMediaCart.tax()*1).toFixed(2)
                            , handling_cart : (sellMediaCart.shipping()*1).toFixed(2)
                            , charset       : "utf-8"
                            , cbt           : opts.site
                        },
                        action = opts.sandbox ? "https://www.sandbox.paypal.com/cgi-bin/webscr" : "https://www.paypal.com/cgi-bin/webscr",
                        method = "POST";


                    // check for return and success URLs in the options
                    if (opts.success) {
                        data['return'] = opts.success;
                    }
                    if (opts.cancel) {
                        data.cancel_return = opts.cancel;
                    }
                    if (opts.notify) {
                        data.notify_url = opts.notify;
                    }
                    if (opts.shipping) {
                        data.no_shipping = opts.shipping;
                    }


                    // add all the items to the form data
                    sellMediaCart.each(function (item,x) {
                        var counter = x+1,
                            item_options = item.options(),
                            optionCount = 0,
                            send;

                        // basic item data
                        data["item_name_" + counter] = item.get("name");
                        data["quantity_" + counter] = item.quantity();
                        data["amount_" + counter] = (item.price()*1).toFixed(2);
                        data["item_number_" + counter] = item.get("number") || counter;


                        // add the options
                        sellMediaCart.each(item_options, function (val,k,attr) {
                            // paypal limits us to 10 options
                            if (k < 10) {

                                // check to see if we need to exclude this from checkout
                                send = true;
                                sellMediaCart.each(settings.excludeFromCheckout, function (field_name) {
                                    if (field_name === attr) { send = false; }
                                });
                                if (send) {
                                        optionCount += 1;
                                        data["on" + k + "_" + counter] = attr;
                                        data["os" + k + "_" + counter] = val;
                                }

                            }
                        });

                        // options count
                        data["option_index_"+ x] = Math.min(10, optionCount);
                    });


                    // return the data for the checkout form
                    return {
                          action    : action
                        , method    : method
                        , data      : data
                    };

                },

                AmazonPayments: function (opts) {
                    // required options
                    if (!opts.merchant_signature) {
                        return sellMediaCart.error("No merchant signature provided for Amazon Payments");
                    }
                    if (!opts.merchant_id) {
                        return sellMediaCart.error("No merchant id provided for Amazon Payments");
                    }
                    if (!opts.aws_access_key_id) {
                        return sellMediaCart.error("No AWS access key id provided for Amazon Payments");
                    }


                    // build basic form options
                    var data = {
                              aws_access_key_id:    opts.aws_access_key_id
                            , merchant_signature:   opts.merchant_signature
                            , currency_code:        sellMediaCart.currency().code
                            , tax_rate:             sellMediaCart.taxRate()
                            , weight_unit:          opts.weight_unit || 'lb'
                        },
                        action = "https://payments" + (opts.sandbox ? "-sandbox" : "") + ".amazon.com/checkout/" + opts.merchant_id,
                        method = opts.method === "GET" ? "GET" : "POST";


                    // add items to data
                    sellMediaCart.each(function (item,x) {
                        var counter = x+1,
                            options_list = [];
                        data['item_title_' + counter]           = item.get('name');
                        data['item_quantity_' + counter]        = item.quantity();
                        data['item_price_' + counter]           = item.price();
                        data['item_sku_ ' + counter]            = item.get('sku') || item.id();
                        data['item_merchant_id_' + counter] = opts.merchant_id;
                        if (item.get('weight')) {
                            data['item_weight_' + counter]      = item.get('weight');
                        }
                        if (settings.shippingQuantityRate) {
                            data['shipping_method_price_per_unit_rate_' + counter] = settings.shippingQuantityRate;
                        }


                        // create array of extra options
                        sellMediaCart.each(item.options(), function (val,x,attr) {
                            // check to see if we need to exclude this from checkout
                            var send = true;
                            sellMediaCart.each(settings.excludeFromCheckout, function (field_name) {
                                if (field_name === attr) { send = false; }
                            });
                            if (send && attr !== 'weight' && attr !== 'tax') {
                                options_list.push(attr + ": " + val);
                            }
                        });

                        // add the options to the description
                        data['item_description_' + counter] = options_list.join(", ");
                    });

                    // return the data for the checkout form
                    return {
                          action    : action
                        , method    : method
                        , data      : data
                    };

                },


                SendForm: function (opts) {
                    // url required
                    if (!opts.url) {
                        return sellMediaCart.error('URL required for SendForm Checkout');
                    }

                    // build basic form options
                    var data = {
                              currency  : sellMediaCart.currency().code
                            , shipping  : sellMediaCart.shipping()
                            , tax       : sellMediaCart.tax()
                            , taxRate   : sellMediaCart.taxRate()
                            , itemCount : sellMediaCart.find({}).length
                        },
                        action = opts.url,
                        method = opts.method === "GET" ? "GET" : "POST";


                    // add items to data
                    sellMediaCart.each(function (item,x) {
                        var counter = x+1,
                            options_list = [],
                            send;
                        data['item_name_' + counter]        = item.get('name');
                        data['item_quantity_' + counter]    = item.quantity();
                        data['item_price_' + counter]       = item.price();

                        // create array of extra options
                        sellMediaCart.each(item.options(), function (val,x,attr) {
                            // check to see if we need to exclude this from checkout
                            send = true;
                            sellMediaCart.each(settings.excludeFromCheckout, function (field_name) {
                                if (field_name === attr) { send = false; }
                            });
                            if (send) {
                                options_list.push(attr + ": " + val);
                            }
                        });

                        // add the options to the description
                        data['item_options_' + counter] = options_list.join(", ");
                    });


                    // check for return and success URLs in the options
                    if (opts.success) {
                        data['return'] = opts.success;
                    }
                    if (opts.cancel) {
                        data.cancel_return = opts.cancel;
                    }

                    if (opts.extra_data) {
                        data = sellMediaCart.extend(data,opts.extra_data);
                    }

                    // return the data for the checkout form
                    return {
                          action    : action
                        , method    : method
                        , data      : data
                    };
                }


            });


            /*******************************************************************
             *  EVENT MANAGEMENT
             *******************************************************************/
            eventFunctions = {

                // bind a callback to an event
                bind: function (name, callback) {
                    if (!isFunction(callback)) {
                        return this;
                    }

                    if (!this._events) {
                        this._events = {};
                    }

                    // split by spaces to allow for multiple event bindings at once
                    var eventNameList = name.split(/ +/);

                    // iterate through and bind each event
                    sellMediaCart.each( eventNameList , function( eventName ){
                        if (this._events[eventName] === true) {
                            callback.apply(this);
                        } else if (!isUndefined(this._events[eventName])) {
                            this._events[eventName].push(callback);
                        } else {
                            this._events[eventName] = [callback];
                        }
                    });


                    return this;
                },

                // trigger event
                trigger: function (name, options) {
                    var returnval = true,
                        x,
                        xlen;

                    if (!this._events) {
                        this._events = {};
                    }
                    if (!isUndefined(this._events[name]) && isFunction(this._events[name][0])) {
                        for (x = 0, xlen = this._events[name].length; x < xlen; x += 1) {
                            returnval = this._events[name][x].apply(this, (options || []));
                        }
                    }
                    if (returnval === false) {
                        return false;
                    }
                    return true;
                }

            };
            // alias for bind
            eventFunctions.on = eventFunctions.bind;
            sellMediaCart.extend(eventFunctions);
            sellMediaCart.extend(sellMediaCart.Item._, eventFunctions);


            // base sellMediaCart events in options
            baseEvents = {
                  beforeAdd             : null
                , afterAdd              : null
                , load                  : null
                , beforeSave            : null
                , afterSave             : null
                , update                : null
                , ready                 : null
                , checkoutSuccess       : null
                , checkoutFail          : null
                , beforeCheckout        : null
                , beforeRemove          : null
            };

            // extend with base events
            sellMediaCart(baseEvents);

            // bind settings to events
            sellMediaCart.each(baseEvents, function (val, x, name) {
                sellMediaCart.bind(name, function () {
                    if (isFunction(settings[name])) {
                        settings[name].apply(this, arguments);
                    }
                });
            });

            /*******************************************************************
             *  FORMATTING FUNCTIONS
             *******************************************************************/
            sellMediaCart.extend({
                toCurrency: function (number,opts) {
                    var num = parseFloat(number),
                        opt_input = opts || {},
                        _opts = sellMediaCart.extend(sellMediaCart.extend({
                              symbol:       "$"
                            , decimal:      "."
                            , delimiter:    ","
                            , accuracy:     2
                            , after: false
                        }, sellMediaCart.currency()), opt_input),

                        numParts = num.toFixed(_opts.accuracy).split("."),
                        dec = numParts[1],
                        ints = numParts[0];

                    ints = sellMediaCart.chunk(ints.reverse(), 3).join(_opts.delimiter.reverse()).reverse();

                    return  (!_opts.after ? _opts.symbol : "") +
                            ints +
                            (dec ? _opts.decimal + dec : "") +
                            (_opts.after ? _opts.symbol : "");

                },


                // break a string in blocks of size n
                chunk: function (str, n) {
                    if (typeof n==='undefined') {
                        n=2;
                    }
                    var result = str.match(new RegExp('.{1,' + n + '}','g'));
                    return result || [];
                }

            });


            // reverse string function
            String.prototype.reverse = function () {
                return this.split("").reverse().join("");
            };


            // currency functions
            sellMediaCart.extend({
                currency: function (currency) {
                    if (isString(currency) && !isUndefined(currencies[currency])) {
                        settings.currency = currency;
                    } else if (isObject(currency)) {
                        currencies[currency.code] = currency;
                        settings.currency = currency.code;
                    } else {
                        return currencies[settings.currency];
                    }
                }
            });


            /*******************************************************************
             *  VIEW MANAGEMENT
             *******************************************************************/

            sellMediaCart.extend({
                // bind outlets to function
                bindOutlets: function (outlets) {
                    sellMediaCart.each(outlets, function (callback, x, selector) {

                        sellMediaCart.bind('update', function () {
                            sellMediaCart.setOutlet("." + namespace + "_" + selector, callback);
                        });
                    });
                },

                // set function return to outlet
                setOutlet: function (selector, func) {
                    var val = func.call(sellMediaCart, selector);
                    if (isObject(val) && val.el) {
                        sellMediaCart.$(selector).html(' ').append(val);
                    } else if (!isUndefined(val)) {
                        sellMediaCart.$(selector).html(val);
                    }
                },

                // bind click events on inputs
                bindInputs: function (inputs) {
                    sellMediaCart.each(inputs, function (info) {
                        sellMediaCart.setInput("." + namespace + "_" + info.selector, info.event, info.callback);
                    });
                },

                // attach events to inputs
                setInput: function (selector, event, func) {
                    sellMediaCart.$(selector).live(event, func);
                }
            });


            // class for wrapping DOM selector shit
            sellMediaCart.ELEMENT = function (selector) {

                this.create(selector);
                this.selector = selector || null; // "#" + this.attr('id'); TODO: test length?
            };

            sellMediaCart.extend(selectorFunctions, {

                "MooTools"      : {
                    text: function (text) {
                        return this.attr(_TEXT_, text);
                    },
                    html: function (html) {
                        return this.attr(_HTML_, html);
                    },
                    val: function (val) {
                        return this.attr(_VALUE_, val);
                    },
                    attr: function (attr, val) {
                        if (isUndefined(val)) {
                            return this.el[0] && this.el[0].get(attr);
                        }

                        this.el.set(attr, val);
                        return this;
                    },
                    remove: function () {
                        this.el.dispose();
                        return null;
                    },
                    addClass: function (klass) {
                        this.el.addClass(klass);
                        return this;
                    },
                    removeClass: function (klass) {
                        this.el.removeClass(klass);
                        return this;
                    },
                    append: function (item) {
                        this.el.adopt(item.el);
                        return this;
                    },
                    each: function (callback) {
                        if (isFunction(callback)) {
                            sellMediaCart.each(this.el, function( e, i, c) {
                                callback.call( i, i, e, c );
                            });
                        }
                        return this;
                    },
                    click: function (callback) {
                        if (isFunction(callback)) {
                            this.each(function (e) {
                                e.addEvent(_CLICK_, function (ev) {
                                    callback.call(e,ev);
                                });
                            });
                        } else if (isUndefined(callback)) {
                            this.el.fireEvent(_CLICK_);
                        }

                        return this;
                    },
                    live: function (    event,callback) {
                        var selector = this.selector;
                        if (isFunction(callback)) {
                            sellMediaCart.$("body").el.addEvent(event + ":relay(" + selector + ")", function (e, el) {
                                callback.call(el, e);
                            });
                        }
                    },
                    match: function (selector) {
                        return this.el.match(selector);
                    },
                    parent: function () {
                        return sellMediaCart.$(this.el.getParent());
                    },
                    find: function (selector) {
                        return sellMediaCart.$(this.el.getElements(selector));
                    },
                    closest: function (selector) {
                        return sellMediaCart.$(this.el.getParent(selector));
                    },
                    descendants: function () {
                        return this.find("*");
                    },
                    tag: function () {
                        return this.el[0].tagName;
                    },
                    submit: function (){
                        this.el[0].submit();
                        return this;
                    },
                    create: function (selector) {
                        this.el = $engine(selector);
                    }


                },

                "Prototype"     : {
                    text: function (text) {
                        if (isUndefined(text)) {
                            return this.el[0].innerHTML;
                        }
                        this.each(function (i,e) {
                            $(e).update(text);
                        });
                        return this;
                    },
                    html: function (html) {
                        return this.text(html);
                    },
                    val: function (val) {
                        return this.attr(_VALUE_, val);
                    },
                    attr: function (attr, val) {
                        if (isUndefined(val)) {
                            return this.el[0].readAttribute(attr);
                        }
                        this.each(function (i,e) {
                            $(e).writeAttribute(attr, val);
                        });
                        return this;
                    },
                    append: function (item) {
                        this.each(function (i,e) {
                            if (item.el) {
                                item.each(function (i2,e2) {
                                    $(e).appendChild(e2);
                                });
                            } else if (isElement(item)) {
                                $(e).appendChild(item);
                            }
                        });
                        return this;
                    },
                    remove: function () {
                        this.each(function (i, e) {
                            $(e).remove();
                        });
                        return this;
                    },
                    addClass: function (klass) {
                        this.each(function (i, e) {
                            $(e).addClassName(klass);
                        });
                        return this;
                    },
                    removeClass: function (klass) {
                        this.each(function (i, e) {
                            $(e).removeClassName(klass);
                        });
                        return this;
                    },
                    each: function (callback) {
                        if (isFunction(callback)) {
                            sellMediaCart.each(this.el, function( e, i, c) {
                                callback.call( i, i, e, c );
                            });
                        }
                        return this;
                    },
                    click: function (callback) {
                        if (isFunction(callback)) {
                            this.each(function (i, e) {
                                $(e).observe(_CLICK_, function (ev) {
                                    callback.call(e,ev);
                                });
                            });
                        } else if (isUndefined(callback)) {
                            this.each(function (i, e) {
                                $(e).fire(_CLICK_);
                            });
                        }
                        return this;
                    },
                    live: function (event,callback) {
                        if (isFunction(callback)) {
                            var selector = this.selector;
                            document.observe(event, function (e, el) {
                                if (el === $engine(e).findElement(selector)) {
                                    callback.call(el, e);
                                }
                            });
                        }
                    },
                    parent: function () {
                        return sellMediaCart.$(this.el.up());
                    },
                    find: function (selector) {
                        return sellMediaCart.$(this.el.getElementsBySelector(selector));
                    },
                    closest: function (selector) {
                        return sellMediaCart.$(this.el.up(selector));
                    },
                    descendants: function () {
                        return sellMediaCart.$(this.el.descendants());
                    },
                    tag: function () {
                        return this.el.tagName;
                    },
                    submit: function() {
                        this.el[0].submit();
                    },

                    create: function (selector) {
                        if (isString(selector)) {
                            this.el = $engine(selector);
                        } else if (isElement(selector)) {
                            this.el = [selector];
                        }
                    }



                },

                "jQuery": {
                    passthrough: function (action, val) {
                        if (isUndefined(val)) {
                            return this.el[action]();
                        }

                        this.el[action](val);
                        return this;
                    },
                    text: function (text) {
                        return this.passthrough(_TEXT_, text);
                    },
                    html: function (html) {
                        return this.passthrough(_HTML_, html);
                    },
                    val: function (val) {
                        return this.passthrough("val", val);
                    },
                    append: function (item) {
                        var target = item.el || item;
                        this.el.append(target);
                        return this;
                    },
                    attr: function (attr, val) {
                        if (isUndefined(val)) {
                            return this.el.attr(attr);
                        }
                        this.el.attr(attr, val);
                        return this;
                    },
                    remove: function () {
                        this.el.remove();
                        return this;
                    },
                    addClass: function (klass) {
                        this.el.addClass(klass);
                        return this;
                    },
                    removeClass: function (klass) {
                        this.el.removeClass(klass);
                        return this;
                    },
                    each: function (callback) {
                        return this.passthrough('each', callback);
                    },
                    click: function (callback) {
                        return this.passthrough(_CLICK_, callback);
                    },
                    live: function (event, callback) {
                        $engine(document).delegate(this.selector, event, callback);
                        return this;
                    },
                    parent: function () {
                        return sellMediaCart.$(this.el.parent());
                    },
                    find: function (selector) {
                        return sellMediaCart.$(this.el.find(selector));
                    },
                    closest: function (selector) {
                        return sellMediaCart.$(this.el.closest(selector));
                    },
                    tag: function () {
                        return this.el[0].tagName;
                    },
                    descendants: function () {
                        return sellMediaCart.$(this.el.find("*"));
                    },
                    submit: function() {
                        return this.el.submit();
                    },

                    create: function (selector) {
                        this.el = $engine(selector);
                    }
                }
            });
            sellMediaCart.ELEMENT._ = sellMediaCart.ELEMENT.prototype;

            // bind the DOM setup to the ready event
            sellMediaCart.ready(sellMediaCart.setupViewTool);

            // bind the input and output events
            sellMediaCart.ready(function () {
                sellMediaCart.bindOutlets({
                    total: function () {
                        return sellMediaCart.toCurrency(sellMediaCart.total());
                    }
                    , quantity: function () {
                        return sellMediaCart.quantity();
                    }
                    , items: function (selector) {
                        sellMediaCart.writeCart(selector);
                    }
                    , tax: function () {
                        return sellMediaCart.toCurrency(sellMediaCart.tax());
                    }
                    , taxRate: function () {
                        return sellMediaCart.taxRate().toFixed();
                    }
                    , shipping: function () {
                        return sellMediaCart.toCurrency(sellMediaCart.shipping());
                    }
                    , grandTotal: function () {
                        return sellMediaCart.toCurrency(sellMediaCart.grandTotal());
                    }
                });
                sellMediaCart.bindInputs([
                    {     selector: 'checkout'
                        , event: 'click'
                        , callback: function () {
                            sellMediaCart.checkout();
                        }
                    }
                    , {   selector: 'empty'
                        , event: 'click'
                        , callback: function () {
                            sellMediaCart.empty();
                        }
                    }
                    , {   selector: 'increment'
                        , event: 'click'
                        , callback: function () {
                            sellMediaCart.find(sellMediaCart.$(this).closest('.itemRow').attr('id').split("_")[1]).increment();
                            sellMediaCart.update();
                        }
                    }
                    , {   selector: 'decrement'
                        , event: 'click'
                        , callback: function () {
                            sellMediaCart.find(sellMediaCart.$(this).closest('.itemRow').attr('id').split("_")[1]).decrement();
                            sellMediaCart.update();
                        }
                    }
                    /* remove from cart */
                    , {   selector: 'remove'
                        , event: 'click'
                        , callback: function () {
                            sellMediaCart.find(sellMediaCart.$(this).closest('.itemRow').attr('id').split("_")[1]).remove();
                        }
                    }

                    /* cart inputs */
                    , {   selector: 'input'
                        , event: 'change'
                        , callback: function () {
                            var $input = sellMediaCart.$(this),
                                $parent = $input.parent(),
                                classList = $parent.attr('class').split(" ");
                            sellMediaCart.each(classList, function (klass) {
                                if (klass.match(/item-.+/i)) {
                                    var field = klass.split("-")[1];
                                    sellMediaCart.find($parent.closest('.itemRow').attr('id').split("_")[1]).set(field,$input.val());
                                    sellMediaCart.update();
                                    return;
                                }
                            });
                        }
                    }

                    /* here is our shelfItem add to cart button listener */
                    , { selector: 'shelfItem .item_add'
                        , event: 'click'
                        , callback: function () {
                            var $button = sellMediaCart.$(this),
                                fields = {};

                            $button.closest("." + namespace + "_shelfItem").descendants().each(function (x,item) {
                                var $item = sellMediaCart.$(item);

                                // check to see if the class matches the item_[fieldname] pattern
                                if ($item.attr("class") &&
                                    $item.attr("class").match(/item_.+/) &&
                                    !$item.attr('class').match(/item_add/)) {

                                    // find the class name
                                    sellMediaCart.each($item.attr('class').split(' '), function (klass) {
                                        var attr,
                                            val,
                                            type;

                                        // get the value or text depending on the tagName
                                        if (klass.match(/item_.+/)) {
                                            attr = klass.split("_")[1];
                                            val = "";
                                            switch($item.tag().toLowerCase()) {
                                                case "input":
                                                case "textarea":
                                                case "select":
                                                    type = $item.attr("type");
                                                    if (!type || ((type.toLowerCase() === "checkbox" || type.toLowerCase() === "radio") && $item.attr("checked")) || type.toLowerCase() === "text" || type.toLowerCase() === "number") {
                                                        val = $item.val();
                                                    }
                                                    break;
                                                case "img":
                                                    val = $item.attr('src');
                                                    break;
                                                default:
                                                    val = $item.text();
                                                    break;
                                            }

                                            if (val !== null && val !== "") {
                                                fields[attr.toLowerCase()] = fields[attr.toLowerCase()] ? fields[attr.toLowerCase()] + ", " +  val : val;
                                            }
                                        }
                                    });
                                }
                            });

                            // add the item
                            sellMediaCart.add(fields);
                            $button.attr("disabled","disabled");

                        }
                    }
                ]);
            });


            /*******************************************************************
             *  DOM READY
             *******************************************************************/
            // Cleanup functions for the document ready method
            // used from jQuery
            /*global DOMContentLoaded */
            if (document.addEventListener) {
                window.DOMContentLoaded = function () {
                    document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
                    sellMediaCart.init();
                };

            } else if (document.attachEvent) {
                window.DOMContentLoaded = function () {
                    // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
                    if (document.readyState === "complete") {
                        document.detachEvent("onreadystatechange", DOMContentLoaded);
                        sellMediaCart.init();
                    }
                };
            }
            // The DOM ready check for Internet Explorer
            // used from jQuery
            function doScrollCheck() {
                if (sellMediaCart.isReady) {
                    return;
                }

                try {
                    // If IE is used, use the trick by Diego Perini
                    // http://javascript.nwbox.com/IEContentLoaded/
                    document.documentElement.doScroll("left");
                } catch (e) {
                    setTimeout(doScrollCheck, 1);
                    return;
                }

                // and execute any waiting functions
                sellMediaCart.init();
            }

            // bind ready event used from jquery
            function sc_BindReady () {

                // Catch cases where $(document).ready() is called after the
                // browser event has already occurred.
                if (document.readyState === "complete") {
                    // Handle it asynchronously to allow scripts the opportunity to delay ready
                    return setTimeout(sellMediaCart.init, 1);
                }

                // Mozilla, Opera and webkit nightlies currently support this event
                if (document.addEventListener) {
                    // Use the handy event callback
                    document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);

                    // A fallback to window.onload, that will always work
                    window.addEventListener("load", sellMediaCart.init, false);

                // If IE event model is used
                } else if (document.attachEvent) {
                    // ensure firing before onload,
                    // maybe late but safe also for iframes
                    document.attachEvent("onreadystatechange", DOMContentLoaded);

                    // A fallback to window.onload, that will always work
                    window.attachEvent("onload", sellMediaCart.init);

                    // If IE and not a frame
                    // continually check to see if the document is ready
                    var toplevel = false;

                    try {
                        toplevel = window.frameElement === null;
                    } catch (e) {}

                    if (document.documentElement.doScroll && toplevel) {
                        doScrollCheck();
                    }
                }
            }

            // bind the ready event
            sc_BindReady();

            return sellMediaCart;
        };


    window.sellMediaCart = generatesellMediaCart();

}(window, document));

/************ JSON *************/
var JSON;JSON||(JSON={});
(function () {function k(a) {return a<10?"0"+a:a}function o(a) {p.lastIndex=0;return p.test(a)?'"'+a.replace(p,function (a) {var c=r[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function l(a,j) {var c,d,h,m,g=e,f,b=j[a];b&&typeof b==="object"&&typeof b.toJSON==="function"&&(b=b.toJSON(a));typeof i==="function"&&(b=i.call(j,a,b));switch(typeof b) {case "string":return o(b);case "number":return isFinite(b)?String(b):"null";case "boolean":case "null":return String(b);case "object":if (!b)return"null";
e += n;f=[];if (Object.prototype.toString.apply(b)==="[object Array]") {m=b.length;for (c=0;c<m;c += 1)f[c]=l(c,b)||"null";h=f.length===0?"[]":e?"[\n"+e+f.join(",\n"+e)+"\n"+g+"]":"["+f.join(",")+"]";e=g;return h}if (i&&typeof i==="object") {m=i.length;for (c=0;c<m;c += 1)typeof i[c]==="string"&&(d=i[c],(h=l(d,b))&&f.push(o(d)+(e?": ":":")+h))}else for (d in b)Object.prototype.hasOwnProperty.call(b,d)&&(h=l(d,b))&&f.push(o(d)+(e?": ":":")+h);h=f.length===0?"{}":e?"{\n"+e+f.join(",\n"+e)+"\n"+g+"}":"{"+f.join(",")+
"}";e=g;return h}}if (typeof Date.prototype.toJSON!=="function")Date.prototype.toJSON=function () {return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+k(this.getUTCMonth()+1)+"-"+k(this.getUTCDate())+"T"+k(this.getUTCHours())+":"+k(this.getUTCMinutes())+":"+k(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function () {return this.valueOf()};var q=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
p=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,n,r={"\u0008":"\\b","\t":"\\t","\n":"\\n","\u000c":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},i;if (typeof JSON.stringify!=="function")JSON.stringify=function (a,j,c) {var d;n=e="";if (typeof c==="number")for (d=0;d<c;d += 1)n += " ";else typeof c==="string"&&(n=c);if ((i=j)&&typeof j!=="function"&&(typeof j!=="object"||typeof j.length!=="number"))throw Error("JSON.stringify");return l("",
{"":a})};if (typeof JSON.parse!=="function")JSON.parse=function (a,e) {function c(a,d) {var g,f,b=a[d];if (b&&typeof b==="object")for (g in b)Object.prototype.hasOwnProperty.call(b,g)&&(f=c(b,g),f!==void 0?b[g]=f:delete b[g]);return e.call(a,d,b)}var d,a=String(a);q.lastIndex=0;q.test(a)&&(a=a.replace(q,function (a) {return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if (/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),typeof e==="function"?c({"":d},""):d;throw new SyntaxError("JSON.parse");}})();


/************ HTML5 Local Storage Support *************/
(function () {if (!this.localStorage)if (this.globalStorage)try {this.localStorage=this.globalStorage}catch(e) {}else{var a=document.createElement("div");a.style.display="none";document.getElementsByTagName("head")[0].appendChild(a);if (a.addBehavior) {a.addBehavior("#default#userdata");var d=this.localStorage={length:0,setItem:function (b,d) {a.load("localStorage");b=c(b);a.getAttribute(b)||this.length++;a.setAttribute(b,d);a.save("localStorage")},getItem:function (b) {a.load("localStorage");b=c(b);return a.getAttribute(b)},
removeItem:function (b) {a.load("localStorage");b=c(b);a.removeAttribute(b);a.save("localStorage");this.length=0},clear:function () {a.load("localStorage");for (var b=0;attr=a.XMLDocument.documentElement.attributes[b++];)a.removeAttribute(attr.name);a.save("localStorage");this.length=0},key:function (b) {a.load("localStorage");return a.XMLDocument.documentElement.attributes[b]}},c=function (a) {return a.replace(/[^-._0-9A-Za-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u37f-\u1fff\u200c-\u200d\u203f\u2040\u2070-\u218f]/g,
"-")};a.load("localStorage");d.length=a.XMLDocument.documentElement.attributes.length}}})();
