define('cc/form/Box', [
    'require',
    'exports',
    'module',
    '../function/debounce',
    '../util/life',
    './common'
], function (require, exports, module) {
    'use strict';
    var debounce = require('../function/debounce');
    var lifeUtil = require('../util/life');
    var common = require('./common');
    function Box(options) {
        lifeUtil.init(this, options);
    }
    var proto = Box.prototype;
    proto.type = 'Box';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var toggle = me.option('toggle');
        mainElement.on('click' + me.namespace(), debounce(function (e) {
            if (me.is('disabled')) {
                return;
            }
            var checked = me.is('checked');
            if (checked) {
                if (toggle) {
                    checked = false;
                }
            } else {
                checked = true;
            }
            me.state('checked', checked);
        }, 50));
        me.inner({
            main: mainElement,
            native: common.findNative(me, toggle ? ':checkbox' : ':radio')
        });
        me.set({
            name: me.option('name'),
            value: me.option('value')
        });
        me.state({
            checked: me.option('checked'),
            disabled: me.option('disabled')
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Box.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            common.prop(this, 'value', value);
        }
    };
    Box.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            return common.validateValue(this, value);
        }
    };
    Box.stateUpdater = {
        checked: function (checked) {
            common.prop(this, 'checked', checked);
            common.setClass(this, 'checkedClass', checked ? 'add' : 'remove');
        },
        disabled: function (disabled) {
            common.prop(this, 'disabled', disabled);
            common.setClass(this, 'disabledClass', disabled ? 'add' : 'remove');
        }
    };
    Box.stateValidator = {
        checked: function (checked) {
            if ($.type(checked) !== 'boolean') {
                checked = common.prop(this, 'checked') === 'checked';
            }
            return checked;
        },
        disabled: function (disabled) {
            if ($.type(disabled) !== 'boolean') {
                disabled = common.prop(this, 'disabled') === 'disabled';
            }
            return disabled;
        }
    };
    return Box;
});
define('cc/form/BoxGroup', [
    'require',
    'exports',
    'module',
    '../function/values',
    '../util/life',
    './common',
    './Box'
], function (require, exports, module) {
    'use strict';
    var createValues = require('../function/values');
    var lifeUtil = require('../util/life');
    var common = require('./common');
    var Box = require('./Box');
    function BoxGroup(options) {
        lifeUtil.init(this, options);
    }
    var proto = BoxGroup.prototype;
    proto.type = 'BoxGroup';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var boxElement = mainElement.find(me.option('boxSelector'));
        var boxes = [];
        $.each(boxElement, function (index) {
            boxes.push(new Box({
                mainElement: boxElement.eq(index),
                mainTemplate: me.option('boxTemplate'),
                checkedClass: me.option('boxCheckedClass'),
                disabledClass: me.option('boxDisabledClass'),
                toggle: me.option('toggle')
            }));
        });
        me.once('sync', function () {
            $.each(boxes, function (index, box) {
                box.option('stateChange', {
                    checked: function (checked) {
                        me.set('value', me.inner('values')(box.get('value'), checked));
                    }
                });
            });
        });
        me.inner({
            main: mainElement,
            native: common.findNative(me, 'input:hidden'),
            boxes: boxes
        });
        me.set({
            name: me.option('name'),
            value: me.option('value')
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        $.each(me.inner('boxes'), function (index, box) {
            box.dispose();
        });
    };
    lifeUtil.extend(proto);
    BoxGroup.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            var me = this;
            common.prop(me, 'value', value);
            if (!value) {
                return;
            }
            $.each(me.inner('boxes'), function (index, box) {
                if (box.get('value') === value) {
                    box.state('checked', true);
                } else if (!me.option('multiple')) {
                    box.state('checked', false);
                }
            });
        }
    };
    BoxGroup.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            var me = this;
            var values = createValues(common.validateValue(me, value), me.option('multiple'), me.option('toggle'));
            me.inner('values', values);
            return values();
        }
    };
    return BoxGroup;
});
define('cc/form/Date', [
    'require',
    'exports',
    'module',
    '../function/split',
    '../function/contains',
    '../function/replaceWith',
    '../helper/Popup',
    '../ui/Calendar',
    '../util/life',
    './common'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    var contains = require('../function/contains');
    var replaceWith = require('../function/replaceWith');
    var Popup = require('../helper/Popup');
    var Calendar = require('../ui/Calendar');
    var lifeUtil = require('../util/life');
    var common = require('./common');
    function Date(options) {
        lifeUtil.init(this, options);
    }
    var proto = Date.prototype;
    proto.type = 'Date';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var layerElement = mainElement.find(me.option('layerSelector'));
        var calendarSelector = me.option('calendarSelector');
        var calendarElement = calendarSelector ? layerElement.find(calendarSelector) : layerElement;
        var calendar = new Calendar({
            mainElement: calendarElement,
            mainTemplate: me.option('calendarTemplate'),
            mode: me.option('mode'),
            date: me.option('date'),
            today: me.option('today'),
            stable: me.option('stable'),
            toggle: me.option('toggle'),
            multiple: me.option('multiple'),
            firstDay: me.option('firstDay'),
            parse: me.option('parse'),
            renderSelector: me.option('renderSelector'),
            renderTemplate: me.option('renderTemplate'),
            prevSelector: me.option('prevSelector'),
            nextSelector: me.option('nextSelector'),
            itemSelector: me.option('itemSelector'),
            itemActiveClass: me.option('itemActiveClass'),
            valueAttribute: me.option('valueAttribute'),
            onselect: function () {
                popup.close();
            },
            render: function (data, tpl) {
                return me.execute('render', [
                    data,
                    tpl
                ]);
            },
            propertyChange: {
                value: function (value) {
                    me.set('value', value);
                }
            }
        });
        var popup = new Popup({
            triggerElement: mainElement,
            layerElement: layerElement,
            showLayerTrigger: me.option('showLayerTrigger'),
            showLayerDelay: me.option('showLayerDelay'),
            hideLayerTrigger: me.option('hideLayerTrigger'),
            hideLayerDelay: me.option('hideLayerDelay'),
            showLayerAnimation: function () {
                me.execute('showLayerAnimation', { layerElement: layerElement });
            },
            hideLayerAnimation: function () {
                me.execute('hideLayerAnimation', { layerElement: layerElement });
            },
            stateChange: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });
        var dispatchEvent = function (e, data) {
            if (data && data.event) {
                me.emit(e, data);
            }
        };
        popup.before('open', dispatchEvent).after('open', dispatchEvent).before('close', dispatchEvent).after('close', dispatchEvent);
        var inputElement = mainElement.find(me.option('inputSelector'));
        me.before('close', function (e, data) {
            var event = data && data.event;
            if (event) {
                var target = event.target;
                if (!contains(document, target) || contains(inputElement, target) || contains(layerElement, target)) {
                    return false;
                }
            }
        });
        me.inner({
            main: mainElement,
            native: inputElement,
            input: inputElement,
            popup: popup,
            calendar: calendar
        });
        me.set({
            name: me.option('name'),
            value: me.option('value')
        });
    };
    proto.open = function () {
        this.state('opened', true);
    };
    proto._open = function () {
        if (this.is('opened')) {
            return false;
        }
    };
    proto.close = function () {
        this.state('opened', false);
    };
    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
    };
    proto.render = function () {
        this.inner('calendar').render();
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('popup').dispose();
        me.inner('calendar').dispose();
    };
    lifeUtil.extend(proto);
    Date.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            common.prop(this, 'value', value);
            this.inner('calendar').set('value', value);
        }
    };
    Date.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            var me = this;
            value = common.validateValue(me, value);
            if ($.type(value) === 'string') {
                var list = [];
                $.each(split(value, ','), function (index, value) {
                    if (me.execute('parse', value)) {
                        list.push(value);
                    }
                });
                value = list.join(',');
            }
            return value;
        }
    };
    Date.stateUpdater = {
        opened: function (opened) {
            this.inner('popup').state('opened', opened);
        }
    };
    return Date;
});
define('cc/form/Number', [
    'require',
    'exports',
    'module',
    '../ui/SpinBox',
    '../util/life',
    './common'
], function (require, exports, module) {
    'use strict';
    var SpinBox = require('../ui/SpinBox');
    var lifeUtil = require('../util/life');
    var common = require('./common');
    function Number(options) {
        lifeUtil.init(this, options);
    }
    var proto = Number.prototype;
    proto.type = 'Number';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var spinbox = new SpinBox({
            mainElement: mainElement,
            value: me.option('value'),
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue'),
            upSelector: me.option('upSelector'),
            downSelector: me.option('downSelector'),
            inputSelector: me.option('inputSelector'),
            interval: me.option('interval'),
            step: me.option('step'),
            propertyChange: {
                value: function (value) {
                    me.set('value', value);
                },
                minValue: function (minValue) {
                    me.set('minValue', minValue);
                },
                maxValue: function (maxValue) {
                    me.set('maxValue', maxValue);
                }
            }
        });
        me.inner({
            main: mainElement,
            native: spinbox.inner('input'),
            spinbox: spinbox
        });
        me.set({ name: me.option('name') });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('spinbox').dispose();
    };
    lifeUtil.extend(proto);
    Number.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            this.inner('spinbox').set('value', value);
        }
    };
    Number.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        }
    };
    return Number;
});
define('cc/form/Select', [
    'require',
    'exports',
    'module',
    '../ui/ComboBox',
    '../util/life',
    './common'
], function (require, exports, module) {
    'use strict';
    var ComboBox = require('../ui/ComboBox');
    var lifeUtil = require('../util/life');
    var common = require('./common');
    function Select(options) {
        lifeUtil.init(this, options);
    }
    var proto = Select.prototype;
    proto.type = 'Select';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var combobox = new ComboBox({
            mainElement: mainElement,
            data: me.option('data'),
            value: me.option('value'),
            defaultText: me.option('defaultText'),
            buttonElement: mainElement.find(me.option('buttonSelector')),
            menuElement: mainElement.find(me.option('menuSelector')),
            menuTemplate: me.option('menuTemplate'),
            renderSelector: me.option('renderSelector'),
            renderTemplate: me.option('renderTemplate'),
            showMenuTrigger: me.option('showMenuTrigger'),
            showMenuDelay: me.option('showMenuDelay'),
            hideMenuTrigger: me.option('hideMenuTrigger'),
            hideMenuDelay: me.option('hideMenuDelay'),
            itemSelector: me.option('itemSelector'),
            itemActiveClass: me.option('itemActiveClass'),
            menuActiveClass: me.option('menuActiveClass'),
            textAttribute: me.option('textAttribute'),
            valueAttribute: me.option('valueAttribute'),
            showMenuAnimation: function (options) {
                me.execute('showMenuAnimation', options);
            },
            hideMenuAnimation: function (options) {
                me.execute('hideMenuAnimation', options);
            },
            render: function (data, tpl) {
                return me.execute('render', [
                    data,
                    tpl
                ]);
            },
            setText: function (options) {
                var labelSelector = me.option('labelSelector');
                mainElement.find(labelSelector).html(options.text);
            },
            propertyChange: {
                value: function (value) {
                    me.set('value', value);
                }
            },
            stateChange: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });
        var dispatchEvent = function (e, data) {
            if (data && data.event) {
                me.emit(e, data);
            }
        };
        combobox.before('open', dispatchEvent).after('open', dispatchEvent).before('close', dispatchEvent).after('close', dispatchEvent);
        var nativeElement = common.findNative(me, 'input:hidden');
        me.after('open', function () {
            nativeElement.trigger('focusin');
        }).after('close', function () {
            nativeElement.trigger('focusout');
        });
        me.inner({
            main: mainElement,
            native: nativeElement,
            combobox: combobox
        });
        me.set({
            data: me.option('data'),
            name: me.option('name'),
            value: me.option('value')
        });
    };
    proto.open = function () {
        this.state('opened', true);
    };
    proto._open = function () {
        if (this.is('opened')) {
            return false;
        }
    };
    proto.close = function () {
        this.state('opened', false);
    };
    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('combobox').dispose();
    };
    lifeUtil.extend(proto);
    Select.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        }
    };
    Select.propertyUpdater.data = Select.propertyUpdater.value = function (newValue, oldValue, changes) {
        var me = this;
        var properties = {};
        var valueChange = changes.value;
        if (valueChange) {
            var value = valueChange.newValue;
            common.prop(me, 'value', value);
            properties.value = value;
        }
        var dataChange = changes.data;
        if (dataChange) {
            properties.data = dataChange.newValue;
        }
        me.inner('combobox').set(properties);
        return false;
    };
    Select.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            return common.validateValue(this, value);
        }
    };
    Select.stateUpdater = {
        opened: function (opened) {
            this.inner('combobox').state('opened', opened);
        }
    };
    return Select;
});
define('cc/form/Text', [
    'require',
    'exports',
    '../helper/Input',
    '../helper/Placeholder',
    '../util/life',
    './common'
], function (require, exports) {
    'use strict';
    var Input = require('../helper/Input');
    var Placeholder = require('../helper/Placeholder');
    var lifeUtil = require('../util/life');
    var common = require('./common');
    function Text(options) {
        lifeUtil.init(this, options);
    }
    var proto = Text.prototype;
    proto.type = 'Text';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var placeholder = new Placeholder({
            mainElement: me.option('mainElement'),
            value: me.option('placeholder'),
            nativeFirst: me.option('nativeFirst'),
            inputSelector: me.option('inputSelector'),
            labelSelector: me.option('labelSelector'),
            showAnimation: me.option('showAnimation'),
            hideAnimation: me.option('hideAnimation'),
            propertyChange: {
                value: function (value) {
                    me.set('placeholder', value);
                }
            }
        });
        var inputElement = placeholder.inner('input');
        var input = new Input({
            mainElement: inputElement,
            shortcut: me.option('shortcut'),
            propertyChange: {
                value: function (value) {
                    me.set('value', value);
                }
            }
        });
        me.inner({
            main: placeholder.inner('main'),
            native: inputElement,
            input: input,
            placeholder: placeholder
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('input').dispose();
        me.inner('placeholder').dispose();
    };
    lifeUtil.extend(proto);
    Text.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            this.inner('input').set('value', value);
            this.inner('placeholder').render();
        },
        placeholder: function (placeholder) {
            this.inner('placeholder').set('value', placeholder);
        }
    };
    Text.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        }
    };
    return Text;
});
define('cc/form/Validator', [
    'require',
    'exports',
    'module',
    '../function/isHidden',
    '../function/nextTick',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var isHidden = require('../function/isHidden');
    var nextTick = require('../function/nextTick');
    var lifeUtil = require('../util/life');
    function Validator(options) {
        lifeUtil.init(this, options);
    }
    var proto = Validator.prototype;
    proto.type = 'Validator';
    proto.init = function () {
        var me = this;
        var mainElement = me.option('mainElement');
        var namespace = me.namespace();
        var formElement = mainElement.prop('tagName') === 'FORM' ? mainElement : mainElement.find('form');
        if (formElement.length > 0) {
            formElement.attr('novalidate', 'novalidate').on('submit' + namespace, $.proxy(me.validate, me));
        }
        mainElement.on('focusin' + namespace, function (e) {
            var target = $(e.target);
            var groupSelector = me.option('groupSelector');
            var groupElement = target.closest(groupSelector);
            if (groupElement.length === 1) {
                var className = [
                    me.option('successClass'),
                    me.option('errorClass')
                ].join(' ');
                className = $.trim(className);
                if (className) {
                    groupElement.removeClass(className);
                }
            }
        });
        if (me.option('validateOnBlur')) {
            mainElement.on('focusout' + namespace, function (e) {
                var target = $(e.target);
                var name = target.prop('name');
                if (!name) {
                    target = target.find('[name]');
                    if (target.length === 1) {
                        name = target.prop('name');
                    }
                }
                if (name) {
                    me.validate(name);
                }
            });
        }
        me.inner({ main: mainElement });
    };
    proto.validate = function (fields, autoScroll) {
        var me = this;
        var mainElement = me.option('mainElement');
        var groupSelector = me.option('groupSelector');
        var groupElements;
        if ($.type(fields) === 'string') {
            fields = [fields];
        }
        if ($.isArray(fields) && fields.length > 0) {
            var elementArray = [];
            $.each(fields, function (index, name) {
                var fieldElement = mainElement.find('[name="' + name + '"]');
                if (fieldElement.length === 1) {
                    var groupElement = fieldElement.closest(groupSelector);
                    if (groupElement.length === 1) {
                        elementArray.push(groupElement[0]);
                    }
                }
            });
            groupElements = $($.unique(elementArray));
        } else {
            groupElements = mainElement.find(groupSelector);
            if ($.type(fields) === 'boolean') {
                autoScroll = fields;
            }
        }
        var validateResult = [];
        var syncResult = [];
        for (var i = 0, len = groupElements.length; i < len; i++) {
            var groupResult = me.validateGroup(groupElements.eq(i));
            if (groupResult.then) {
                syncResult.push(groupResult);
                groupResult = groupResult.result;
            }
            $.merge(validateResult, groupResult);
        }
        var fields = [];
        var errors = [];
        var validateComplete = function () {
            $.each(validateResult, function (index, item) {
                if (item.error) {
                    errors.push(item);
                }
                fields.push(item.name);
            });
            if (autoScroll && errors.length > 0) {
                scrollToFirstError(errors, me.option('scrollOffset'));
            }
            nextTick(function () {
                me.emit('validatecomplete', {
                    fields: fields,
                    errors: errors
                });
            });
        };
        if (syncResult.length > 0) {
            return resolvePromises(syncResult).then(validateComplete);
        } else {
            validateComplete();
            return errors.length === 0;
        }
    };
    proto._validate = function (fields) {
        if ($.type(fields) === 'string') {
            fields = [fields];
        }
        if ($.isArray(fields) && fields.length > 0) {
            return { fields: fields };
        }
    };
    proto.validateGroup = function (groupElement) {
        if (isHidden(groupElement)) {
            return;
        }
        var me = this;
        var validateResult = [];
        var syncResult = [];
        var syncIndex = [];
        groupElement.find('[name]').each(function (index) {
            var target = this;
            var fieldElement = $(target);
            var disabled = $.type(target.disabled) === 'boolean' ? target.disabled : fieldElement.attr('disabled') === 'disabled';
            if (disabled) {
                return;
            }
            var name = $.type(target.name) === 'string' ? target.name : fieldElement.attr('name');
            var fieldConfig = me.option('fields')[name];
            if (!fieldConfig) {
                return;
            }
            var rules = me.inner(name + 'Rules');
            if (rules == null) {
                rules = compileRules(fieldElement, fieldConfig);
                me.inner(name + 'Rules', rules || false);
            }
            var failRule;
            var failError;
            if (rules) {
                var ruleMap = {};
                $.each(rules, function (index, rule) {
                    ruleMap[rule.name] = rule.value;
                });
                var value = $.type(target.value) === 'string' ? target.value : fieldElement.attr('value');
                value = $.trim(value);
                var validateData = {
                    rules: ruleMap,
                    value: value
                };
                $.each(rules, function (index, rule) {
                    var result = me.execute(Validator.rule[rule.name], validateData);
                    if (result === false) {
                        failRule = rule;
                        return false;
                    } else if (value === '' && rule.name === 'required') {
                        return false;
                    }
                });
            }
            if (failRule) {
                var errors = fieldConfig.errors;
                if (errors) {
                    failError = errors[failRule.name];
                }
            } else if ($.isFunction(fieldConfig.custom)) {
                var deferred = $.Deferred();
                var customResult = me.execute(fieldConfig.custom, [
                    fieldElement,
                    function (error) {
                        deferred.resolve(error);
                    }
                ]);
                failError = customResult == null || customResult.then ? deferred : customResult;
            }
            var validateItem = {
                name: name,
                element: fieldElement,
                error: failError
            };
            if (failRule) {
                validateItem.rule = failRule.name;
            }
            var index = validateResult.push(validateItem);
            if (failError && failError.then) {
                syncResult.push(failError);
                syncIndex.push(index - 1);
            }
        });
        if (syncResult.length > 0) {
            var promise = resolvePromises(syncResult).then(function (errors) {
                $.each(errors, function (index, error) {
                    validateResult[syncIndex[index]].error = error;
                });
                refreshGroup(me, groupElement, validateResult);
            });
            promise.result = validateResult;
            return promise;
        } else {
            refreshGroup(me, groupElement, validateResult);
            return validateResult;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Validator.type = {
        text: [
            'required',
            'pattern',
            'min',
            'max',
            'minlength',
            'maxlength'
        ],
        hidden: ['required'],
        password: [
            'required',
            'pattern',
            'minlength',
            'maxlength',
            'equals'
        ],
        number: [
            'required',
            'pattern',
            'min',
            'max',
            'step'
        ],
        range: [
            'required',
            'pattern',
            'min',
            'max',
            'step'
        ],
        tel: [
            'required',
            'pattern'
        ],
        url: [
            'required',
            'pattern'
        ],
        email: [
            'required',
            'pattern'
        ],
        mobile: [
            'required',
            'pattern'
        ],
        money: [
            'required',
            'pattern',
            'min',
            'max'
        ],
        idcard: [
            'required',
            'pattern'
        ],
        int: [
            'required',
            'pattern',
            'min',
            'max'
        ],
        internationalMobile: [
            'required',
            'pattern'
        ]
    };
    Validator.rule = {
        required: function (data) {
            if (data.value) {
                return true;
            } else if (data.rules.required) {
                return false;
            }
        },
        pattern: function (data) {
            var pattern = data.rules.pattern;
            if (pattern instanceof RegExp) {
                return pattern.test(data.value);
            }
        },
        minlength: function (data) {
            var minlength = data.rules.minlength;
            if ($.isNumeric(minlength)) {
                return data.value.length >= +minlength;
            }
        },
        maxlength: function (data) {
            var maxlength = data.rules.maxlength;
            if ($.isNumeric(maxlength)) {
                return data.value.length <= +maxlength;
            }
        },
        min: function (data) {
            var min = data.rules.min;
            if ($.isNumeric(min)) {
                return data.value >= +min;
            }
        },
        max: function (data) {
            var max = data.rules.max;
            if ($.isNumeric(max)) {
                return data.value <= +max;
            }
        },
        step: function (data) {
            var min = data.rules.min;
            var step = data.rules.step;
            if ($.isNumeric(min) && $.isNumeric(step)) {
                return (data.value - min) % step === 0;
            }
        },
        equals: function (data) {
            var equals = data.rules.equals;
            if (equals) {
                var target = this.inner('main').find('[name="' + equals + '"]');
                return data.value === $.trim(target.val());
            }
        }
    };
    Validator.pattern = {
        number: /^[\d.]*$/,
        int: /^\d+$/,
        url: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        tel: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        mobile: /^1[3-9]\d{9}$/,
        email: /^(?:[a-z0-9]+[_\-+.]+)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i,
        money: /^[\d.]*$/,
        idcard: /(^\d{15}$)|(^\d{17}([0-9]|X)$)/i,
        internationalMobile: /^\d{7,20}$/
    };
    var ruleParser = {
        required: function (element) {
            return element.attr('required') === 'required';
        },
        pattern: function (element, type) {
            var pattern = element.attr('pattern') || Validator.pattern[type];
            if ($.type(pattern) === 'string') {
                pattern = new RegExp(pattern);
            }
            return pattern;
        },
        minlength: function (element) {
            return element.attr('minlength');
        },
        maxlength: function (element) {
            return element.attr('maxlength');
        },
        min: function (element) {
            return element.attr('min');
        },
        max: function (element) {
            return element.attr('max');
        },
        step: function (element) {
            return element.attr('step');
        },
        equals: function (element) {
            return element.attr('equals');
        }
    };
    function compileRules(fieldElement, fieldConfig) {
        var type = fieldConfig.type;
        if (!type) {
            type = fieldElement.attr('type') || 'text';
        }
        var ruleOrders = Validator.type[type];
        if (!$.isArray(ruleOrders)) {
            return;
        }
        var result = [];
        var rules = fieldConfig.rules || {};
        $.each(ruleOrders, function (index, ruleName) {
            var ruleValue = rules[ruleName];
            if (ruleValue == null) {
                var parse = ruleParser[ruleName];
                if ($.isFunction(parse)) {
                    ruleValue = parse(fieldElement, type);
                }
            }
            if (ruleValue != null) {
                result.push({
                    name: ruleName,
                    value: ruleValue
                });
            }
        });
        return result;
    }
    function refreshGroup(instance, groupElement, validateResult) {
        var successClass = instance.option('successClass');
        var errorClass = instance.option('errorClass');
        var errorTemplate = instance.option('errorTemplate');
        var errorPlacement = instance.option('errorPlacement');
        var errorSelector = instance.option('errorSelector');
        var errorElement;
        if (errorSelector) {
            errorElement = groupElement.find(errorSelector);
        }
        $.each(validateResult, function (index, item) {
            var error = item.error;
            if ($.type(error) !== 'string') {
                error = item.error = '';
            }
            if (error) {
                if (successClass) {
                    groupElement.removeClass(successClass);
                }
                if (errorClass) {
                    groupElement.addClass(errorClass);
                }
                if (errorElement && errorElement.length > index) {
                    var html = instance.execute('render', [
                        { error: error },
                        errorTemplate
                    ]);
                    errorElement.eq(index).html(html);
                    if ($.isFunction(errorPlacement)) {
                        instance.execute(errorPlacement, {
                            fieldElement: item.element,
                            errorElement: errorElement.eq(index)
                        });
                    }
                }
            } else {
                if (successClass) {
                    groupElement.addClass(successClass);
                }
                if (errorClass) {
                    groupElement.removeClass(errorClass);
                }
            }
        });
    }
    function scrollToFirstError(errors, scrollOffset) {
        if (errors.length > 0) {
            var element = errors[0].element;
            if (element.is(':hidden')) {
                element = element.parent();
            }
            var top = element.offset().top;
            if ($.type(scrollOffset) === 'number') {
                top += scrollOffset;
            }
            window.scrollTo(window.scrollX, top);
        }
    }
    function resolvePromises(promises) {
        var deferred = $.Deferred();
        $.when.apply($, promises).done(function () {
            deferred.resolve(arguments);
        });
        return deferred;
    }
    return Validator;
});
define('cc/form/common', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    exports.prop = function (instance, name, value) {
        if ($.isPlainObject(name)) {
            $.each(name, function (name, value) {
                exports.prop(instance, name, value);
            });
        } else {
            var nativeElement = instance.inner('native');
            if (arguments.length === 2) {
                return nativeElement.prop(name);
            } else {
                nativeElement.prop(name, value);
                if (name === 'value') {
                    nativeElement.trigger('change');
                }
            }
        }
    };
    exports.setClass = function (instance, className, action) {
        var classValue = instance.option(className);
        if (classValue) {
            instance.option('mainElement')[action + 'Class'](classValue);
        }
    };
    exports.findNative = function (instance, selector) {
        var nativeElement = instance.option('mainElement').find(selector);
        if (nativeElement.length !== 1) {
            instance.error('form/' + instance.type + ' 必须包含一个 ' + selector + '.');
        }
        return nativeElement;
    };
    exports.validateName = function (instance, name) {
        if ($.type(name) !== 'string') {
            name = exports.prop(instance, 'name');
            if (!name || $.type(name) !== 'string') {
                instance.error('name attribute is missing.');
            }
        }
        return name;
    };
    exports.validateValue = function (instance, value) {
        var type = $.type(value);
        if (type === 'number') {
            value = '' + value;
        } else if (type !== 'string') {
            value = exports.prop(instance, 'value') || '';
        }
        return value;
    };
});
define('cc/function/around', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (target, name, before, after) {
        var isMethod = $.type(name) === 'string';
        var origin = isMethod ? target[name] : target;
        if (!isMethod) {
            after = before;
            before = name;
        }
        var wrapper = function () {
            var result;
            var args = $.makeArray(arguments);
            if ($.isFunction(before)) {
                result = before.apply(this, args);
            }
            if (result !== false) {
                if ($.isFunction(origin)) {
                    result = origin.apply(this, args);
                }
                if ($.isFunction(after)) {
                    args.push(result);
                    var temp = after.apply(this, args);
                    if ($.type(temp) !== 'undefined') {
                        result = temp;
                    }
                }
                return result;
            }
        };
        return isMethod ? target[name] = wrapper : wrapper;
    };
});
define('cc/function/autoScrollDown', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (list, item) {
        var listHeight = list.height();
        var min = list.scrollTop();
        var max = min + listHeight;
        var top = item.prop('offsetTop') + item.outerHeight(true);
        if (top < min || top > max) {
            list.scrollTop(top - listHeight);
        }
    };
});
define('cc/function/autoScrollUp', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (list, item) {
        var min = list.scrollTop();
        var max = min + list.height();
        var top = item.prop('offsetTop');
        if (top < min || top > max) {
            list.scrollTop(top);
        }
    };
});
define('cc/function/contains', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (container, element) {
        container = container.jquery ? container[0] : container;
        element = element.jquery ? element[0] : element;
        if (!container || !element) {
            return false;
        }
        if (container === element) {
            return true;
        }
        return $.contains(container, element);
    };
});
define('cc/function/dateOffset', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var DAY = 24 * 60 * 60 * 1000;
    return function (date, offset) {
        if ($.type(date) === 'date') {
            date = date.getTime();
        }
        return new Date(date + offset * DAY);
    };
});
define('cc/function/debounce', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (fn, delay) {
        delay = $.type(delay) === 'number' ? delay : 50;
        var timer;
        return function () {
            if (timer) {
                return;
            }
            var args = arguments;
            timer = setTimeout(function () {
                timer = null;
                fn.apply(null, $.makeArray(args));
            }, delay);
        };
    };
});
define('cc/function/decimalLength', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (str) {
        var parts = ('' + str).split('.');
        return parts.length === 2 ? parts[1].length : 0;
    };
});
define('cc/function/disableSelection', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var element = $('<i></i>')[0];
    var supportSelectStart = 'onselectstart' in element;
    var supportFirefoxUserSelect = 'MozUserSelect' in element.style;
    element = null;
    if (supportSelectStart) {
        return function (target) {
            target = target || document;
            target.onselectstart = function () {
                return false;
            };
        };
    }
    if (supportFirefoxUserSelect) {
        return function (target) {
            target = target || document.body;
            target.style.MozUserSelect = 'none';
        };
    }
    return $.noop;
});
define('cc/function/divide', [
    'require',
    'exports',
    'module',
    './decimalLength',
    './float2Int'
], function (require, exports, module) {
    'use strict';
    var decimalLength = require('./decimalLength');
    var float2Int = require('./float2Int');
    return function (a, b) {
        var length = Math.max(decimalLength(a), decimalLength(b));
        a = float2Int(a, length);
        b = float2Int(b, length);
        return a / b;
    };
});
define('cc/function/dragGlobal', [
    'require',
    'exports',
    'module',
    '../helper/Draggable',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var Draggable = require('../helper/Draggable');
    var instance = require('../util/instance');
    return function (options) {
        return new Draggable({
            mainElement: options.element,
            containerElement: instance.body,
            mainDraggingClass: options.draggingClass,
            handleSelector: options.handleSelector,
            cancelSelector: options.cancelSelector,
            dragAnimation: options.dragAnimation,
            bind: function (options) {
                var namespace = options.namespace;
                options.mainElement.on('mousedown' + namespace, function (e) {
                    if (!options.downHandler(e)) {
                        return;
                    }
                    instance.document.off(namespace).on('mousemove' + namespace, options.moveHandler).on('mouseup' + namespace, function (e) {
                        options.upHandler(e);
                        instance.document.off(namespace);
                    });
                });
            }
        });
    };
});
define('cc/function/enableSelection', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var element = $('<i></i>')[0];
    var supportSelectStart = 'onselectstart' in element;
    var supportFirefoxUserSelect = 'MozUserSelect' in element.style;
    element = null;
    if (supportSelectStart) {
        return function (target) {
            target = target || document;
            target.onselectstart = null;
        };
    }
    if (supportFirefoxUserSelect) {
        return function (target) {
            target = target || document.body;
            target.style.MozUserSelect = '';
        };
    }
    return $.noop;
});
define('cc/function/eventOffset', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (event) {
        var x = event.offsetX;
        var y = event.offsetY;
        if ($.type(x) !== 'number') {
            var rect = event.target.getBoundingClientRect();
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }
        return {
            x: x,
            y: y
        };
    };
});
define('cc/function/eventPage', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (event) {
        var x = event.pageX;
        var y = event.pageY;
        if ($.type(x) !== 'number') {
            var documentElement = document.documentElement;
            x = event.clientX + documentElement.scrollLeft;
            y = event.clientY + documentElement.scrollTop;
        }
        return {
            x: x,
            y: y
        };
    };
});
define('cc/function/extend', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (to, from) {
        if ($.isPlainObject(from)) {
            $.each(from, function (name, fn) {
                if (!(name in to)) {
                    to[name] = fn;
                }
            });
        }
    };
});
define('cc/function/float2Int', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (float, length) {
        var parts = ('' + float).split('.');
        var result;
        if (length >= 0) {
        } else {
            length = 0;
        }
        if (parts.length === 1) {
            result = float + new Array(length + 1).join('0');
        } else {
            length = Math.max(0, length - parts[1].length);
            result = parts.join('') + new Array(length + 1).join('0');
        }
        return +result;
    };
});
define('cc/function/guid', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    var index = 0;
    return function () {
        return 'cc_' + index++;
    };
});
define('cc/function/imageDimension', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var imageList = [];
    return function (url, callback) {
        var img = new Image();
        var index = imageList.push(img);
        img.onload = function () {
            var height = img.height;
            if (height != null && height > 0) {
                callback(img.width, height);
                delete imageList[index - 1];
                img = null;
            } else {
                setTimeout(img.onload, 10);
            }
        };
        img.src = url;
    };
});
define('cc/function/innerOffset', [
    'require',
    'exports',
    'module',
    './toNumber'
], function (require, exports, module) {
    'use strict';
    var toNumber = require('./toNumber');
    return function (element) {
        var offsetData = element.offset();
        var borderLeftWidth = element.css('border-left-width');
        var borderTopWidth = element.css('border-top-width');
        return {
            x: offsetData.left + toNumber(borderLeftWidth, 0, 'int'),
            y: offsetData.top + toNumber(borderTopWidth, 0, 'int')
        };
    };
});
define('cc/function/isHidden', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (element) {
        var display = element.css('display');
        return element.css('display') === 'none' || element.css('opacity') == 0 || element.css('visibility') === 'hidden';
    };
});
define('cc/function/minus', [
    'require',
    'exports',
    'module',
    './decimalLength',
    './float2Int'
], function (require, exports, module) {
    'use strict';
    var decimalLength = require('./decimalLength');
    var float2Int = require('./float2Int');
    return function (a, b) {
        var length = Math.max(decimalLength(a), decimalLength(b));
        a = float2Int(a, length);
        b = float2Int(b, length);
        return (a - b) / Math.pow(10, length);
    };
});
define('cc/function/monthFirst', [
    'require',
    'exports',
    'module',
    './dateOffset'
], function (require, exports, module) {
    'use strict';
    var dateOffset = require('./dateOffset');
    return function (date) {
        if ($.type(date) === 'number') {
            date = new Date(date);
        }
        return dateOffset(date, 1 - date.getDate());
    };
});
define('cc/function/monthLast', [
    'require',
    'exports',
    'module',
    './dateOffset',
    './monthOffset',
    './monthFirst'
], function (require, exports, module) {
    'use strict';
    var dateOffset = require('./dateOffset');
    var monthOffset = require('./monthOffset');
    var monthFirst = require('./monthFirst');
    return function (date) {
        return dateOffset(monthFirst(monthOffset(date, 1)), -1);
    };
});
define('cc/function/monthOffset', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (date, offset) {
        if ($.type(date) === 'date') {
            date = date.getTime();
        }
        date = new Date(date);
        date.setDate(1);
        date.setMonth(date.getMonth() + offset);
        return date;
    };
});
define('cc/function/multiply', [
    'require',
    'exports',
    'module',
    './decimalLength',
    './float2Int'
], function (require, exports, module) {
    'use strict';
    var decimalLength = require('./decimalLength');
    var float2Int = require('./float2Int');
    return function (a, b) {
        var length = Math.max(decimalLength(a), decimalLength(b));
        a = float2Int(a, length);
        b = float2Int(b, length);
        var factor = Math.pow(10, length);
        return a * b / (factor * factor);
    };
});
define('cc/function/nextTick', [
    'require',
    'exports',
    'module',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var instance = require('../util/instance');
    var global = window;
    var result;
    if ($.isFunction(global.setImmediate)) {
        result = global.setImmediate;
    } else {
        var FLAG = 'musicode';
        var callbacks = $.Callbacks();
        var Observer = global.MutationObserver || global.webKitMutationObserver;
        if (Observer) {
            var observer = new Observer(function (mutations) {
                if (mutations[0].attributeName === FLAG) {
                    callbacks.fire().empty();
                }
            });
            var element = document.createElement('div');
            observer.observe(element, { attributes: true });
            result = function (fn) {
                callbacks.add(fn);
                element.setAttribute(FLAG, $.now());
            };
        } else if ($.isFunction(global.postMessage)) {
            instance.window.on('message', function (e) {
                if (e.source === global && e.data === FLAG) {
                    callbacks.fire().empty();
                }
            });
            result = function (fn) {
                callbacks.add(fn);
                postMessage(FLAG, '*');
            };
        } else {
            result = function (fn) {
                setTimeout(fn, 0);
            };
        }
    }
    return result;
});
define('cc/function/offsetParent', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    function test(element) {
        return element.is('body') || element.css('position') !== 'static';
    }
    return function (element) {
        if (element.is('body')) {
            return element;
        }
        var target = element.parent();
        while (!test(target)) {
            target = target.parent();
        }
        return target;
    };
});
define('cc/function/outerOffset', [
    'require',
    'exports',
    'module',
    './toNumber'
], function (require, exports, module) {
    'use strict';
    var toNumber = require('./toNumber');
    return function (element) {
        var offsetData = element.offset();
        var marginLeft = toNumber(element.css('margin-left'), 0, 'int');
        var marginTop = toNumber(element.css('margin-top'), 0, 'int');
        return {
            x: offsetData.left - marginLeft,
            y: offsetData.top - marginTop
        };
    };
});
define('cc/function/page', [
    'require',
    'exports',
    'module',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var instance = require('../util/instance');
    return function () {
        if (instance.body.prop('clientHeight') < instance.html.prop('clientHeight')) {
            return instance.html;
        } else {
            return instance.body;
        }
    };
});
define('cc/function/pageHeight', [
    'require',
    'exports',
    'module',
    './page'
], function (require, exports, module) {
    'use strict';
    var page = require('./page');
    return function () {
        var element = page()[0];
        return Math.max(element.scrollHeight, element.clientHeight);
    };
});
define('cc/function/pageScrollLeft', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        return Math.max(document.body.scrollLeft, document.documentElement.scrollLeft);
    };
});
define('cc/function/pageScrollTop', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        return Math.max(document.body.scrollTop, document.documentElement.scrollTop);
    };
});
define('cc/function/pageWidth', [
    'require',
    'exports',
    'module',
    './page'
], function (require, exports, module) {
    'use strict';
    var page = require('./page');
    return function () {
        var element = page()[0];
        return Math.max(element.scrollWidth, element.clientWidth);
    };
});
define('cc/function/parseDate', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (year, month, date) {
        var valid = false;
        if ($.isNumeric(year) && $.isNumeric(month) && $.isNumeric(date)) {
            valid = true;
        } else if (arguments.length === 1) {
            valid = true;
            if ($.isPlainObject(year)) {
                date = year.date;
                month = year.month;
                year = year.year;
            } else if ($.type(year) === 'string') {
                var parts = year.split('-');
                year = parts[0];
                month = parts[1];
                date = parts[2];
            }
        }
        if (valid) {
            if (String(year).length === 4 && month >= 1 && month <= 12 && date >= 1 && date <= 31) {
                return new Date(year, month - 1, date);
            }
        }
    };
});
define('cc/function/parsePercent', [
    'require',
    'exports',
    'module',
    './divide'
], function (require, exports, module) {
    'use strict';
    var divide = require('./divide');
    var percentExpr = /(-?\d+(\.\d+)?)%/;
    return function (value) {
        if (percentExpr.test(value)) {
            return divide(RegExp.$1, 100);
        }
    };
});
define('cc/function/pin', [
    'require',
    'exports',
    'module',
    '../util/instance',
    './parsePercent'
], function (require, exports, module) {
    'use strict';
    var instance = require('../util/instance');
    var parsePercent = require('./parsePercent');
    var name2Value = {
        left: 0,
        top: 0,
        center: '50%',
        middle: '50%',
        right: '100%',
        bottom: '100%'
    };
    var percentExpr = /(-?\d+(\.\d+)?)%/;
    function parseX(options) {
        var x = name2Value[options.x];
        if (x == null) {
            x = options.x;
        }
        if ($.type(x) === 'string') {
            var percent = parsePercent(x);
            if (percent != null) {
                x = percent * (options.width || options.element.outerWidth());
            }
        }
        return x;
    }
    function parseY(options) {
        var y = name2Value[options.y];
        if (y == null) {
            y = options.y;
        }
        if ($.type(y) === 'string') {
            var percent = parsePercent(y);
            if (percent != null) {
                y = percent * (options.height || options.element.outerHeight());
            }
        }
        return y;
    }
    return function (options) {
        var element = options.element;
        var attachment = options.attachment || {};
        if (!attachment.element) {
            attachment.element = instance.body;
        }
        var attachmentOffset = attachment.element.offset();
        var originX = attachmentOffset.left + parseX(attachment);
        var originY = attachmentOffset.top + parseY(attachment);
        var x = originX - parseX(options);
        var y = originY - parseY(options);
        var offset = options.offset;
        if (offset) {
            if ($.type(offset.x) === 'number') {
                x += offset.x;
            }
            if ($.type(offset.y) === 'number') {
                y += offset.y;
            }
        }
        var style = {
            left: x,
            top: y
        };
        var position = element.css('position');
        if (position !== 'absolute' && position !== 'fixed') {
            style.position = 'absolute';
        }
        if (options.silence) {
            return style;
        } else {
            element.css(style);
        }
    };
});
define('cc/function/pinGlobal', [
    'require',
    'exports',
    'module',
    './pin',
    './viewport',
    './viewportWidth',
    './viewportHeight',
    './pageScrollLeft',
    './pageScrollTop'
], function (require, exports, module) {
    'use strict';
    var pin = require('./pin');
    var viewport = require('./viewport');
    var viewportWidth = require('./viewportWidth');
    var viewportHeight = require('./viewportHeight');
    var pageScrollLeft = require('./pageScrollLeft');
    var pageScrollTop = require('./pageScrollTop');
    return function (options) {
        var pinOptions = {
            silence: true,
            element: options.element,
            x: options.x === '50%' ? '50%' : 0,
            y: options.y === '50%' ? '50%' : 0,
            attachment: {
                element: viewport(),
                width: viewportWidth(),
                height: viewportHeight(),
                x: options.x,
                y: options.y
            }
        };
        if (!options.fixed) {
            pinOptions.offset = {
                x: pageScrollLeft(),
                y: pageScrollTop()
            };
        }
        return pin(pinOptions);
    };
});
define('cc/function/plus', [
    'require',
    'exports',
    'module',
    './decimalLength',
    './float2Int'
], function (require, exports, module) {
    'use strict';
    var decimalLength = require('./decimalLength');
    var float2Int = require('./float2Int');
    return function (a, b) {
        var length = Math.max(decimalLength(a), decimalLength(b));
        a = float2Int(a, length);
        b = float2Int(b, length);
        return (a + b) / Math.pow(10, length);
    };
});
define('cc/function/position', [
    'require',
    'exports',
    'module',
    './offsetParent'
], function (require, exports, module) {
    'use strict';
    var offsetParent = require('./offsetParent');
    return function (element) {
        var parentElement = offsetParent(element);
        var position = element.css('position');
        var x = parseInt(element.css('left'), 10);
        var y = parseInt(element.css('top'), 10);
        var isAutoX = isNaN(x);
        var isAutoY = isNaN(y);
        if (isAutoX || isAutoY) {
            if (parentElement.length === 1) {
                var targetOffset = element.offset();
                var containerOffset = parentElement.offset();
                if (isAutoX) {
                    x = targetOffset.left - containerOffset.left - (parseInt(parentElement.css('border-left-width'), 10) || 0);
                }
                if (isAutoY) {
                    y = targetOffset.top - containerOffset.top - (parseInt(parentElement.css('border-top-width'), 10) || 0);
                }
            } else {
                x = y = 0;
            }
        }
        if (!position || position === 'static') {
            position = 'absolute';
        }
        return {
            position: position,
            left: x,
            top: y
        };
    };
});
define('cc/function/ratio', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (numerator, denominator) {
        if (numerator >= 0 && denominator > 0) {
            return numerator / denominator;
        } else {
            return 0;
        }
    };
});
define('cc/function/replaceWith', ['require'], function (require) {
    'use strict';
    return function (oldElement, newElement) {
        oldElement = oldElement[0];
        newElement = newElement[0];
        oldElement.parentNode.replaceChild(newElement, oldElement);
    };
});
define('cc/function/restrain', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (value, min, max) {
        if (value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        return value;
    };
});
define('cc/function/simplifyDate', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (date) {
        if (!date) {
            return;
        }
        if ($.type(date) === 'number') {
            date = new Date(date);
        }
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            date: date.getDate(),
            day: date.getDay()
        };
    };
});
define('cc/function/split', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (str, sep) {
        var result = [];
        if ($.type(str) === 'number') {
            str = '' + str;
        }
        if (str && $.type(str) === 'string') {
            $.each(str.split(sep), function (index, part) {
                part = $.trim(part);
                if (part) {
                    result.push(part);
                }
            });
        }
        return result;
    };
});
define('cc/function/toNumber', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var parser = {
        int: parseInt,
        float: parseFloat
    };
    return function (value, defaultValue, parseType) {
        if ($.type(value) !== 'number') {
            var parse = parser[parseType];
            if (parse) {
                value = parse(value, 10);
            } else if ($.isNumeric(value)) {
                value = +value;
            } else {
                value = NaN;
            }
        }
        return isNaN(value) ? defaultValue : value;
    };
});
define('cc/function/toString', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (value, defaultValue) {
        var type = $.type(value);
        if (type === 'number') {
            value = '' + value;
        } else if (type !== 'string') {
            if (arguments.length === 1) {
                defaultValue = '';
            }
            value = defaultValue;
        }
        return value;
    };
});
define('cc/function/ucFirst', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    };
});
define('cc/function/values', [
    'require',
    'exports',
    'module',
    './split'
], function (require, exports, module) {
    'use strict';
    var split = require('./split');
    var VALUE_SEPARATE = ',';
    return function (base, multiple, toggle, sort) {
        var list = split(base, VALUE_SEPARATE);
        if (!$.isFunction(sort)) {
            sort = function (a, b) {
                if (a > b) {
                    return 1;
                } else if (a < b) {
                    return -1;
                } else {
                    return 0;
                }
            };
        }
        return function (item, add) {
            if (item != null) {
                var index = $.inArray(item, list);
                if (index >= 0) {
                    if (toggle || !add) {
                        list.splice(index, 1);
                    }
                } else if (add) {
                    list.push(item);
                }
            }
            if (list.length > 1) {
                if (!multiple) {
                    list = [list.pop()];
                } else if (sort) {
                    list.sort(sort);
                }
            }
            return list.join(VALUE_SEPARATE);
        };
    };
});
define('cc/function/viewport', [
    'require',
    'exports',
    'module',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var instance = require('../util/instance');
    return function () {
        if (instance.body.prop('clientHeight') > instance.html.prop('clientHeight')) {
            return instance.html;
        } else {
            return instance.body;
        }
    };
});
define('cc/function/viewportHeight', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        return window.innerHeight || document.documentElement.clientHeight;
    };
});
define('cc/function/viewportWidth', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        return window.innerWidth || document.documentElement.clientWidth;
    };
});
define('cc/function/weekFirst', [
    'require',
    'exports',
    'module',
    './dateOffset'
], function (require, exports, module) {
    'use strict';
    var dateOffset = require('./dateOffset');
    return function (date, firstDay) {
        if ($.type(date) === 'number') {
            date = new Date(date);
        }
        var day = date.getDay();
        day = day >= firstDay ? day : day + 7;
        return dateOffset(date, -1 * (day - firstDay));
    };
});
define('cc/function/weekLast', [
    'require',
    'exports',
    'module',
    './weekFirst',
    './dateOffset'
], function (require, exports, module) {
    'use strict';
    var weekFirst = require('./weekFirst');
    var dateOffset = require('./dateOffset');
    return function (date, firstDay) {
        return dateOffset(weekFirst(date, firstDay), 6);
    };
});
define('cc/function/weekOffset', [
    'require',
    'exports',
    'module',
    './dateOffset'
], function (require, exports, module) {
    'use strict';
    var dateOffset = require('./dateOffset');
    return function (date, offset) {
        return dateOffset(date, offset * 7);
    };
});
define('cc/helper/AjaxUploader', [
    'require',
    'exports',
    'module',
    '../function/ratio',
    '../util/life',
    '../util/mimeType'
], function (require, exports, module) {
    'use strict';
    var getRatio = require('../function/ratio');
    var lifeUtil = require('../util/life');
    var mimeTypeUtil = require('../util/mimeType');
    function AjaxUploader(options) {
        lifeUtil.init(this, options);
    }
    var proto = AjaxUploader.prototype;
    proto.type = 'AjaxUploader';
    proto.init = function () {
        var me = this;
        var fileElement = me.option('mainElement');
        if (!fileElement.is(':file')) {
            me.error('AjaxUploader mainElement must be <input type="file" />.');
        }
        var mainElement = $('<form></form>');
        fileElement.replaceWith(mainElement);
        mainElement.append(fileElement);
        var properties = {};
        if (me.option('accept')) {
            properties.accept = formatAccept(me.option('accept'));
        }
        if (me.option('multiple')) {
            properties.multiple = true;
        }
        fileElement.prop(properties).on('change' + me.namespace(), function () {
            setFiles(me, fileElement.prop('files'));
            me.emit('filechange');
        });
        me.inner({
            main: mainElement,
            file: fileElement,
            fileQueue: {}
        });
        me.emit('ready');
    };
    proto.getFiles = function () {
        return this.inner('fileQueue').files || [];
    };
    proto.setAction = function (action) {
        this.option('action', action);
    };
    proto.setData = function (data) {
        var currentData = this.option('data');
        if ($.isPlainObject(currentData)) {
            $.extend(currentData, data);
        } else {
            currentData = data;
        }
        this.option('data', currentData);
    };
    proto.reset = function () {
        this.inner('main')[0].reset();
    };
    proto.upload = function (fileItem) {
        var me = this;
        var validStatus = me.option('useChunk') ? AjaxUploader.STATUS_UPLOADING : AjaxUploader.STATUS_WAITING;
        fileItem = fileItem || getCurrentFileItem(me);
        if (!fileItem || fileItem.status > validStatus) {
            return;
        }
        var xhr = new XMLHttpRequest();
        fileItem.xhr = xhr;
        $.each(xhrEventHandler, function (index, item) {
            xhr['on' + item.type] = function (e) {
                item.handler(me, e);
            };
        });
        $.each(uploadEventHandler, function (index, item) {
            xhr.upload['on' + item.type] = function (e) {
                item.handler(me, e);
            };
        });
        xhr.open('post', me.option('action'), true);
        var upload = me.option('useChunk') ? uploadChunk : uploadFile;
        upload(me, fileItem);
    };
    proto.stop = function () {
        var me = this;
        var fileItem = getCurrentFileItem(me);
        if (fileItem && fileItem.status === AjaxUploader.STATUS_UPLOADING) {
            fileItem.xhr.abort();
        }
        me.reset();
    };
    proto.enable = function () {
        this.option('file').prop('disabled', false);
    };
    proto.disable = function () {
        this.option('file').prop('disabled', true);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.stop();
        me.inner('file').off(me.namespace());
    };
    lifeUtil.extend(proto);
    AjaxUploader.supportChunk = typeof FileReader !== 'undefined';
    AjaxUploader.STATUS_WAITING = 0;
    AjaxUploader.STATUS_UPLOADING = 1;
    AjaxUploader.STATUS_UPLOAD_SUCCESS = 2;
    AjaxUploader.STATUS_UPLOAD_ERROR = 3;
    AjaxUploader.ERROR_CANCEL = 0;
    function uploadFile(uploader, fileItem) {
        var formData = new FormData();
        $.each(uploader.option('data'), function (key, value) {
            formData.append(key, value);
        });
        formData.append(uploader.option('fileName'), fileItem.nativeFile);
        fileItem.xhr.send(formData);
    }
    function uploadChunk(uploader, fileItem) {
        var file = fileItem.nativeFile;
        var chunkInfo = fileItem.chunk;
        if (!chunkInfo) {
            chunkInfo = fileItem.chunk = {
                index: 0,
                uploaded: 0
            };
        }
        var chunkIndex = chunkInfo.index;
        var chunkSize = uploader.option('chunkSize');
        var start = chunkSize * chunkIndex;
        var end = chunkSize * (chunkIndex + 1);
        if (end > file.size) {
            end = file.size;
        }
        chunkInfo.uploading = end - start;
        var range = 'bytes ' + (start + 1) + '-' + end + '/' + file.size;
        var xhr = fileItem.xhr;
        xhr.setRequestHeader('Content-Type', '');
        xhr.setRequestHeader('X_FILENAME', encodeURIComponent(file.name));
        xhr.setRequestHeader('Content-Range', range);
        xhr.send(file.slice(start, end));
    }
    var xhrEventHandler = {
        uploadStart: {
            type: 'loadstart',
            handler: function (uploader, e) {
                var fileItem = getCurrentFileItem(uploader);
                fileItem.status = AjaxUploader.STATUS_UPLOADING;
                uploader.emit('uploadstart', { fileItem: fileItem });
            }
        },
        uploadSuccess: {
            type: 'load',
            handler: function (uploader, e) {
                var fileItem = getCurrentFileItem(uploader);
                var data = {
                    fileItem: fileItem,
                    responseText: fileItem.xhr.responseText
                };
                var chunkInfo = fileItem.chunk;
                if (chunkInfo) {
                    chunkInfo.uploaded += chunkInfo.uploading;
                    if (chunkInfo.uploaded < fileItem.file.size) {
                        uploader.emit('chunkuploadsuccess', data);
                        chunkInfo.index++;
                        uploader.upload();
                        return;
                    }
                }
                fileItem.status = AjaxUploader.STATUS_UPLOAD_SUCCESS;
                uploader.emit('uploadsuccess', data);
                uploadComplete(uploader, fileItem);
            }
        },
        uploadError: {
            type: 'error',
            handler: function (uploader, e, errorCode) {
                var fileItem = getCurrentFileItem(uploader);
                fileItem.status = AjaxUploader.STATUS_UPLOAD_ERROR;
                uploader.emit('uploaderror', {
                    fileItem: fileItem,
                    errorCode: errorCode
                });
                uploadComplete(uploader, fileItem);
            }
        },
        uploadStop: {
            type: 'abort',
            handler: function (uploader, e) {
                xhrEventHandler.uploadError.handler(uploader, e, AjaxUploader.ERROR_CANCEL);
            }
        }
    };
    var uploadEventHandler = {
        uploadProgress: {
            type: 'progress',
            handler: function (uploader, e) {
                var fileItem = getCurrentFileItem(uploader);
                var total = fileItem.file.size;
                var uploaded = e.loaded;
                var chunkInfo = fileItem.chunk;
                if (chunkInfo) {
                    uploaded += chunkInfo.uploaded;
                }
                uploader.emit('uploadprogress', {
                    fileItem: fileItem,
                    uploaded: uploaded,
                    total: total,
                    percent: 100 * getRatio(uploaded, total) + '%'
                });
            }
        }
    };
    function uploadComplete(uploader, fileItem) {
        var xhr = fileItem.xhr;
        if (xhr) {
            $.each(xhrEventHandler, function (index, item) {
                xhr['on' + item.type] = null;
            });
            $.each(uploadEventHandler, function (index, item) {
                xhr.upload['on' + item.type] = null;
            });
            delete fileItem.xhr;
        }
        uploader.emit('uploadcomplete', { fileItem: fileItem });
        if (fileItem.status === AjaxUploader.STATUS_UPLOAD_SUCCESS || fileItem.status === AjaxUploader.STATUS_UPLOAD_ERROR && uploader.option('ignoreError')) {
            var index = fileItem.index + 1;
            var fileQueue = uploader.inner('fileQueue');
            if (index < fileQueue.files.length) {
                fileQueue.index = index;
                uploader.upload();
            } else {
                setFiles(uploader, []);
            }
        }
    }
    function setFiles(uploader, files) {
        var fileQueue = uploader.inner('fileQueue');
        fileQueue.index = 0;
        fileQueue.files = $.map(files, function (nativeFile, index) {
            return {
                index: index,
                file: formatFile(nativeFile),
                nativeFile: nativeFile,
                status: AjaxUploader.STATUS_WAITING
            };
        });
    }
    function getCurrentFileItem(uploader) {
        var fileQueue = uploader.inner('fileQueue');
        var index = fileQueue.index;
        if (fileQueue.files && $.type(index) === 'number') {
            return fileQueue.files[index];
        }
    }
    function formatAccept(accept) {
        var result = [];
        $.each(accept, function (index, name) {
            if (mimeTypeUtil[name]) {
                result.push(mimeTypeUtil[name]);
            }
        });
        return $.unique(result).join(',');
    }
    function formatFile(file) {
        var name = file.name;
        var parts = name.split('.');
        var type = parts.length > 1 ? parts.pop().toLowerCase() : '';
        return {
            name: name,
            type: type,
            size: file.size
        };
    }
    return AjaxUploader;
});
define('cc/helper/DOMIterator', [
    'require',
    'exports',
    'module',
    './Keyboard',
    './Iterator',
    '../util/life',
    '../util/keyboard'
], function (require, exports, module) {
    'use strict';
    var Keyboard = require('./Keyboard');
    var Iterator = require('./Iterator');
    var lifeUtil = require('../util/life');
    var keyboardUtil = require('../util/keyboard');
    function DOMIterator(options) {
        lifeUtil.init(this, options);
    }
    var proto = DOMIterator.prototype;
    proto.init = function () {
        var me = this;
        var iterator = new Iterator({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex'),
            defaultIndex: me.option('defaultIndex'),
            interval: me.option('interval'),
            step: me.option('step'),
            loop: me.option('loop'),
            propertyChange: {
                index: function (newIndex, oldIndex, changes) {
                    me.set('index', newIndex, changes.index);
                },
                minIndex: function (minIndex) {
                    me.set('minIndex', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxIndex', maxIndex);
                }
            }
        });
        var prevKey = me.option('prevKey');
        var nextKey = me.option('nextKey');
        var shortcut = {};
        shortcut[prevKey] = function (e, data) {
            if (!data.isLongPress) {
                iterator.prev();
            }
        };
        shortcut[nextKey] = function (e, data) {
            if (!data.isLongPress) {
                iterator.next();
            }
        };
        var watchElement = me.option('watchElement');
        var keyboard = new Keyboard({
            watchElement: watchElement,
            shortcut: shortcut
        });
        var playing = false;
        keyboard.before('longpress', function (e, data) {
            var reserve;
            var keyCode = data.keyCode;
            if (keyCode === keyboardUtil[prevKey]) {
                reserve = true;
            } else if (keyCode === keyboardUtil[nextKey]) {
                reserve = false;
            }
            if (reserve != null) {
                playing = true;
                iterator.start(reserve);
            }
        }).after('longpress', function () {
            if (playing) {
                playing = false;
                iterator.pause();
            }
        });
        if (watchElement.is(':text')) {
            keyboard.on('keydown', function (e) {
                if (e.keyCode === keyboardUtil.up) {
                    e.preventDefault();
                }
            });
        }
        me.inner({
            iterator: iterator,
            keyboard: keyboard
        });
    };
    proto.start = function (reserve) {
        this.inner('iterator').start(reserve);
    };
    proto.pause = function () {
        this.inner('iterator').pause();
    };
    proto.stop = function () {
        this.inner('iterator').stop();
    };
    proto.prev = function () {
        this.inner('iterator').prev();
    };
    proto.next = function () {
        this.inner('iterator').next();
    };
    proto.dispose = function () {
        this.inner('iterator').dispose();
        this.inner('keyboard').dispose();
    };
    lifeUtil.extend(proto);
    DOMIterator.propertyUpdater = {
        index: function (index) {
            this.inner('iterator').set('index', index);
        },
        minIndex: function (minIndex) {
            this.inner('iterator').set('minIndex', minIndex);
        },
        maxIndex: function (maxIndex) {
            this.inner('iterator').set('maxIndex', maxIndex);
        }
    };
    return DOMIterator;
});
define('cc/helper/Draggable', [
    'require',
    'exports',
    'module',
    '../function/page',
    '../function/restrain',
    '../function/position',
    '../function/contains',
    '../function/innerOffset',
    '../function/outerOffset',
    '../function/pageScrollLeft',
    '../function/pageScrollTop',
    '../function/viewportWidth',
    '../function/viewportHeight',
    '../function/enableSelection',
    '../function/disableSelection',
    '../util/life',
    '../util/touch',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var page = require('../function/page');
    var restrain = require('../function/restrain');
    var position = require('../function/position');
    var contains = require('../function/contains');
    var innerOffset = require('../function/innerOffset');
    var outerOffset = require('../function/outerOffset');
    var pageScrollLeft = require('../function/pageScrollLeft');
    var pageScrollTop = require('../function/pageScrollTop');
    var viewportWidth = require('../function/viewportWidth');
    var viewportHeight = require('../function/viewportHeight');
    var enableSelection = require('../function/enableSelection');
    var disableSelection = require('../function/disableSelection');
    var lifeUtil = require('../util/life');
    var touchUtil = require('../util/touch');
    var bodyElement = require('../util/instance').body;
    function Draggable(options) {
        lifeUtil.init(this, options);
    }
    var proto = Draggable.prototype;
    proto.type = 'Draggable';
    proto.init = function () {
        var me = this;
        var mainElement = me.option('mainElement');
        mainElement.css(position(mainElement));
        me.inner({ main: mainElement });
        var containerElement = me.option('containerElement');
        var pageElement = page();
        var rectElement = containerElement || pageElement;
        var draggingClass = me.option('draggingClass');
        var containerDraggingClass = me.option('containerDraggingClass');
        var bodyDraggingClass = me.option('bodyDraggingClass') || 'dragging';
        var beforeDragHandler = function (e, offset) {
            var handleSelector = me.option('handleSelector');
            var cancelSelector = me.option('cancelSelector');
            var target = e.target;
            if (handleSelector && !hitTarget(mainElement, handleSelector, target) || cancelSelector && hitTarget(mainElement, cancelSelector, target)) {
                return;
            }
            var style = position(mainElement);
            var coord;
            $.each(globalCoord, function (key, value) {
                if (e.type.indexOf(key) === 0) {
                    coord = value;
                    return false;
                }
            });
            if (!coord) {
                me.error('event[' + type + '] is not supported.');
            }
            var mainOuterOffset = outerOffset(mainElement);
            var rectInnerOffset = innerOffset(rectElement);
            var offsetX;
            var offsetY;
            if (offset) {
                offsetX = offset.x;
                offsetY = offset.y;
            } else {
                offsetX = coord.absoluteX(e) - mainOuterOffset.x;
                offsetY = coord.absoluteY(e) - mainOuterOffset.y;
            }
            var rectContainsElement = contains(rectElement, mainElement);
            if (rectContainsElement) {
                offsetX += rectInnerOffset.x;
                offsetY += rectInnerOffset.y;
            }
            point.left = style.left;
            point.top = style.top;
            var x = rectContainsElement ? 0 : rectInnerOffset.x;
            var y = rectContainsElement ? 0 : rectInnerOffset.y;
            var width;
            var height;
            var isFixed = style.position === 'fixed';
            var vHeight = viewportHeight();
            if (isFixed) {
                x -= pageScrollLeft();
                y -= pageScrollTop();
                width = containerElement ? containerElement.innerWidth() : viewportWidth();
                height = containerElement ? containerElement.innerHeight() : vHeight;
            } else {
                width = rectElement.innerWidth();
                height = rectElement.innerHeight();
            }
            if (rectElement.is('body') || rectElement.is('html')) {
                if (height < vHeight) {
                    height = vHeight;
                }
            }
            width = Math.max(0, width - mainElement.outerWidth(true));
            height = Math.max(0, height - mainElement.outerHeight(true));
            console.log(x, y, width, height);
            var axis = me.option('axis');
            xCalculator = axis === 'y' ? calculator.constant(style.left) : calculator.variable(coord[isFixed ? 'fixedX' : 'absoluteX'], offsetX, x, x + width);
            yCalculator = axis === 'x' ? calculator.constant(style.top) : calculator.variable(coord[isFixed ? 'fixedY' : 'absoluteY'], offsetY, y, y + height);
            counter = 0;
            return true;
        };
        var dragHandler = function (e) {
            var x = xCalculator(e);
            var y = yCalculator(e);
            if (point.left === x && point.top === y) {
                return;
            }
            point.left = x;
            point.top = y;
            if (++counter === 1) {
                disableSelection();
                if (draggingClass) {
                    mainElement.addClass(draggingClass);
                }
                if (containerDraggingClass) {
                    containerElement.addClass(containerDraggingClass);
                }
                if (bodyDraggingClass) {
                    bodyElement.addClass(bodyDraggingClass);
                }
                me.emit('beforedrag', point);
            }
            me.execute('dragAnimation', {
                mainElement: mainElement,
                mainStyle: point
            });
            me.emit('drag', point);
        };
        var afterDragHandler = function (e) {
            enableSelection();
            if (draggingClass) {
                mainElement.removeClass(draggingClass);
            }
            if (containerDraggingClass) {
                containerElement.removeClass(containerDraggingClass);
            }
            if (bodyDraggingClass) {
                bodyElement.removeClass(bodyDraggingClass);
            }
            if (counter > 0) {
                me.emit('afterdrag', point);
            }
            counter = xCalculator = yCalculator = null;
        };
        me.execute('bind', {
            mainElement: mainElement,
            containerElement: containerElement,
            namespace: me.namespace(),
            downHandler: beforeDragHandler,
            moveHandler: dragHandler,
            upHandler: afterDragHandler
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    var point = {};
    var xCalculator;
    var yCalculator;
    var counter;
    var calculator = {
        constant: function (value) {
            return function () {
                return value;
            };
        },
        variable: function (fn, offset, min, max) {
            return function (e) {
                return restrain(fn(e) - offset, min, max);
            };
        }
    };
    var globalCoord = {};
    $.each(touchUtil, function (key, event) {
        if (!event.support) {
            return;
        }
        globalCoord[key] = {
            absoluteX: function (e) {
                return event.client(e).x + pageScrollLeft();
            },
            absoluteY: function (e) {
                return event.client(e).y + pageScrollTop();
            },
            fixedX: function (e) {
                return event.client(e).x;
            },
            fixedY: function (e) {
                return event.client(e).y;
            }
        };
    });
    function hitTarget(element, selector, target) {
        var result = false;
        if ($.isArray(selector)) {
            selector = selector.join(',');
        }
        element.find(selector).each(function () {
            if (result = contains(this, target)) {
                return false;
            }
        });
        return result;
    }
    return Draggable;
});
define('cc/helper/FlashUploader', [
    'require',
    'exports',
    'module',
    '../function/ucFirst',
    '../function/ratio',
    '../util/life',
    '../util/supload/supload'
], function (require, exports, module) {
    'use strict';
    var ucFirst = require('../function/ucFirst');
    var getRatio = require('../function/ratio');
    var lifeUtil = require('../util/life');
    require('../util/supload/supload');
    var Supload = window.Supload;
    function FlashUploader(options) {
        lifeUtil.init(this, options);
    }
    var proto = FlashUploader.prototype;
    proto.type = 'FlashUploader';
    proto.init = function () {
        var me = this;
        var mainElement = me.option('mainElement');
        var options = {
            element: mainElement[0],
            flashUrl: me.option('flashUrl'),
            action: me.option('action'),
            accept: me.option('accept'),
            multiple: me.option('multiple'),
            data: me.option('data'),
            fileName: me.option('fileName'),
            ignoreError: me.option('ignoreError'),
            customSettings: { uploader: me }
        };
        $.each(eventHandler, function (type, handler) {
            options['on' + ucFirst(type)] = handler;
        });
        me.inner({ supload: new Supload(options) });
    };
    proto.getFiles = function () {
        return this.inner('supload').getFiles();
    };
    proto.setAction = function (action) {
        this.inner('supload').setAction(action);
    };
    proto.setData = function (data) {
        this.inner('supload').setData(data);
    };
    proto.reset = function () {
        this.inner('supload').reset();
    };
    proto.upload = function () {
        this.inner('supload').upload();
    };
    proto.stop = function () {
        this.inner('supload').cancel();
    };
    proto.enable = function () {
        this.inner('supload').enable();
    };
    proto.disable = function () {
        this.inner('supload').disable();
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('supload').dispose();
    };
    lifeUtil.extend(proto);
    FlashUploader.STATUS_WAITING = Supload.STATUS_WAITING;
    FlashUploader.STATUS_UPLOADING = Supload.STATUS_UPLOADING;
    FlashUploader.STATUS_UPLOAD_SUCCESS = Supload.STATUS_UPLOAD_SUCCESS;
    FlashUploader.STATUS_UPLOAD_ERROR = Supload.STATUS_UPLOAD_ERROR;
    FlashUploader.ERROR_CANCEL = Supload.ERROR_CANCEL;
    FlashUploader.ERROR_SECURITY = Supload.ERROR_SECURITY;
    FlashUploader.ERROR_IO = Supload.ERROR_IO;
    var eventHandler = {
        ready: function () {
            var uploader = this.customSettings.uploader;
            uploader.emit('ready');
        },
        fileChange: function () {
            var uploader = this.customSettings.uploader;
            uploader.emit('filechange');
        },
        uploadStart: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploadstart', data);
        },
        uploadProgress: function (data) {
            var uploader = this.customSettings.uploader;
            data.percent = 100 * getRatio(data.uploaded, data.total) + '%';
            uploader.emit('uploadprogress', data);
        },
        uploadSuccess: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploadsuccess', data);
        },
        uploadError: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploaderror', data);
        },
        uploadComplete: function (data) {
            var uploader = this.customSettings.uploader;
            uploader.emit('uploadcomplete', data);
        }
    };
    return FlashUploader;
});
define('cc/helper/Input', [
    'require',
    'exports',
    'module',
    '../function/toString',
    '../util/life',
    '../util/input',
    '../util/keyboard',
    './Keyboard'
], function (require, exports, module) {
    'use strict';
    var toString = require('../function/toString');
    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');
    var keyboardUtil = require('../util/keyboard');
    var Keyboard = require('./Keyboard');
    function Input(options) {
        lifeUtil.init(this, options);
    }
    var proto = Input.prototype;
    proto.type = 'Input';
    proto.init = function () {
        var me = this;
        var mainElement = me.option('mainElement');
        inputUtil.init(mainElement);
        var keyboard = new Keyboard({
            watchElement: mainElement,
            shortcut: me.option('shortcut')
        });
        var isLongPress;
        var dispatchEvent = function (e, data) {
            me.emit(e, data);
        };
        var updateValue = function (value) {
            if (value == null) {
                value = mainElement.val();
            }
            me.set('value', value);
        };
        keyboard.on('keydown', dispatchEvent).on('keyup', dispatchEvent).before('longpress', function (e, data) {
            isLongPress = true;
            dispatchEvent(e, data);
        }).after('longpress', function (e, data) {
            isLongPress = false;
            if (keyboardUtil.isCharKey(data.keyCode) || keyboardUtil.isDeleteKey()) {
                updateValue();
            }
            dispatchEvent(e, data);
        });
        mainElement.on('input' + me.namespace(), function () {
            if (!isLongPress || !me.option('silentOnLongPress')) {
                updateValue();
            }
        });
        me.inner({
            keyboard: keyboard,
            main: mainElement
        });
        updateValue(me.option('value'));
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        var mainElement = me.inner('main');
        mainElement.off(me.namespace());
        inputUtil.dispose(mainElement);
        me.inner('keyboard').dispose();
    };
    lifeUtil.extend(proto);
    Input.propertyUpdater = {
        value: function (value) {
            this.inner('main').val(value);
        }
    };
    Input.propertyValidator = {
        value: function (value) {
            return toString(value);
        }
    };
    return Input;
});
define('cc/helper/Iterator', [
    'require',
    'exports',
    'module',
    '../function/toNumber',
    '../util/timer',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var toNumber = require('../function/toNumber');
    var createTimer = require('../util/timer');
    var lifeUtil = require('../util/life');
    function Iterator(options) {
        lifeUtil.init(this, options);
    }
    var proto = Iterator.prototype;
    proto.init = function () {
        var me = this;
        me.set({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex')
        });
    };
    proto.start = function (reverse) {
        var me = this;
        var timer = me.inner('timer');
        if (timer) {
            timer.stop();
        }
        var fn = reverse ? me.prev : me.next;
        var interval = me.option('interval');
        timer = createTimer($.proxy(fn, me), interval, interval);
        timer.start();
        me.inner('timer', timer);
    };
    proto.pause = function () {
        var me = this;
        me.inner('timer').stop();
        me.inner('timer', null);
    };
    proto._pause = function () {
        if (!this.inner('timer')) {
            return false;
        }
    };
    proto.stop = function () {
        var me = this;
        me.pause();
        me.set('index', me.option('defaultIndex'));
    };
    proto.prev = function () {
        var me = this;
        var index = me.get('index') - me.option('step');
        var minIndex = me.get('minIndex');
        var maxIndex = me.get('maxIndex');
        if (!$.isNumeric(index) || (index < minIndex || index > maxIndex)) {
            index = maxIndex;
        }
        me.set('index', toNumber(index, 0), { action: 'prev' });
    };
    proto._prev = function () {
        var me = this;
        if (me.get('index') - me.option('step') < me.get('minIndex')) {
            if (!me.option('loop')) {
                return false;
            }
        }
    };
    proto.next = function () {
        var me = this;
        var index = me.get('index') + me.option('step');
        var minIndex = me.get('minIndex');
        var maxIndex = me.get('maxIndex');
        if (!$.isNumeric(index) || (index > maxIndex || index < minIndex)) {
            index = minIndex;
        }
        me.set('index', toNumber(index, 0), { action: 'next' });
    };
    proto._next = function () {
        var me = this;
        if (me.get('index') + me.option('step') > me.get('maxIndex')) {
            if (!me.option('loop')) {
                return false;
            }
        }
    };
    proto.dispose = proto.stop;
    lifeUtil.extend(proto);
    Iterator.propertyValidator = {
        index: function (index) {
            index = toNumber(index, null);
            if (index == null) {
                index = this.option('defaultIndex');
            }
            return index;
        }
    };
    return Iterator;
});
define('cc/helper/Keyboard', [
    'require',
    'exports',
    'module',
    '../function/split',
    '../util/life',
    '../util/keyboard'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    var lifeUtil = require('../util/life');
    var keyboardUtil = require('../util/keyboard');
    function Keyboard(options) {
        lifeUtil.init(this, options);
    }
    var proto = Keyboard.prototype;
    proto.type = 'Keyboard';
    proto.init = function () {
        var me = this;
        var shortcut = me.option('shortcut');
        if ($.isPlainObject(shortcut)) {
            shortcut = parseShortcut(shortcut);
        }
        var prevKeyCode;
        var pressCounter = 0;
        var longPressCounterDefine = 1;
        var isLongPress = function () {
            return pressCounter > longPressCounterDefine;
        };
        var namespace = me.namespace();
        me.option('watchElement').on('keydown' + namespace, function (e) {
            var currentKeyCode = e.keyCode;
            if (prevKeyCode === currentKeyCode && pressCounter > 0) {
                if (pressCounter === longPressCounterDefine) {
                    me.emit('beforelongpress', { keyCode: currentKeyCode });
                }
                pressCounter++;
            } else {
                prevKeyCode = currentKeyCode;
                pressCounter = 1;
            }
            me.emit(e);
            if (!shortcut) {
                return;
            }
            var data = { isLongPress: isLongPress() };
            var args = [
                e,
                data
            ];
            $.each(shortcut, function (index, item) {
                if (item.test(e)) {
                    me.execute(item.handler, args);
                }
            });
        }).on('keyup' + namespace, function (e) {
            if (isLongPress()) {
                me.emit('afterlongpress', { keyCode: e.keyCode });
            }
            pressCounter = 0;
            prevKeyCode = null;
            me.emit(e);
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.option('watchElement').off(me.namespace());
    };
    lifeUtil.extend(proto);
    function parseShortcut(shortcut) {
        var result = [];
        $.each(shortcut, function (key, handler) {
            var expressions = [];
            var plus = 'plus';
            var keys = split(key.replace(/\$\+/g, plus), '+');
            $.each(keyboardUtil.combinationKey, function (name) {
                if ($.inArray(name, keys) < 0) {
                    keys.push('!' + name);
                }
            });
            $.each(keys, function (index, name) {
                var negative = name.indexOf('!') === 0;
                if (negative) {
                    name = name.substr(1);
                }
                if (name === plus) {
                    name = '$+';
                }
                if (keyboardUtil.combinationKey[name]) {
                    expressions.push((negative ? '!' : '') + 'e.' + name + 'Key');
                } else if (keyboardUtil[name]) {
                    expressions.push('e.keyCode===' + keyboardUtil[name]);
                } else {
                    expressions.length = 0;
                    return false;
                }
            });
            if (expressions.length > 0) {
                result.push({
                    test: new Function('e', 'return ' + expressions.join('&')),
                    handler: handler
                });
            }
        });
        return result;
    }
    return Keyboard;
});
define('cc/helper/Placeholder', [
    'require',
    'exports',
    'module',
    '../function/isHidden',
    '../function/toString',
    '../util/life',
    '../util/input',
    '../util/detection'
], function (require, exports, module) {
    'use strict';
    var isHidden = require('../function/isHidden');
    var toString = require('../function/toString');
    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');
    var detectionUtil = require('../util/detection');
    function Placeholder(options) {
        lifeUtil.init(this, options);
    }
    var proto = Placeholder.prototype;
    proto.type = 'Placeholder';
    proto.init = function () {
        var me = this;
        me.initStruct();
        me.inner({ proxy: me.option('nativeFirst') && detectionUtil.supportPlaceholder() ? nativeProxy : fakeProxy });
        executeProxyMethod(me, 'init');
        me.set({ value: me.option('value') });
        me.state({ hidden: me.option('hidden') });
    };
    proto.show = function () {
        this.state('hidden', false);
    };
    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };
    proto.render = function () {
        executeProxyMethod(this, 'render');
    };
    proto.dispose = function () {
        executeProxyMethod(this, 'dispose');
        lifeUtil.dispose(this);
    };
    lifeUtil.extend(proto);
    Placeholder.propertyUpdater = {
        value: function () {
            this.render();
        }
    };
    Placeholder.propertyValidator = {
        value: function (value) {
            value = toString(value, null);
            if (value == null) {
                value = this.inner('input').attr('placeholder');
            }
            return value || '';
        }
    };
    Placeholder.stateUpdater = {
        hidden: function (hidden) {
            executeProxyMethod(this, hidden ? 'hide' : 'show');
        }
    };
    Placeholder.stateValidator = {
        hidden: function (hidden) {
            if ($.type(hidden) !== 'boolean') {
                hidden = executeProxyMethod(this, 'isHidden');
            }
            return hidden;
        }
    };
    function executeProxyMethod(instance, method) {
        var proxy = instance.inner('proxy');
        var fn = proxy[method];
        if (fn) {
            return fn(instance);
        }
    }
    var nativeProxy = {
        init: function (instance) {
            var mainElement = instance.option('mainElement');
            instance.inner({
                main: mainElement,
                input: mainElement
            });
        },
        render: function (instance) {
            instance.inner('input').attr('placeholder', instance.get('value'));
        },
        isHidden: function (instance) {
            return instance.inner('input').val().length > 0;
        }
    };
    var fakeProxy = {
        init: function (instance) {
            var mainElement = instance.option('mainElement');
            var inputElement = mainElement.find(instance.option('inputSelector'));
            instance.inner({
                main: mainElement,
                input: inputElement,
                label: mainElement.find(instance.option('labelSelector'))
            });
            inputUtil.init(inputElement);
            inputElement.on('input' + instance.namespace(), function () {
                var hidden = $.trim(inputElement.val()).length > 0;
                if (hidden !== instance.is('hidden')) {
                    if (hidden) {
                        instance.hide();
                    } else {
                        instance.show();
                    }
                }
            });
        },
        show: function (instance) {
            instance.execute('showAnimation', { labelElement: instance.inner('label') });
        },
        hide: function (instance) {
            instance.execute('hideAnimation', { labelElement: instance.inner('label') });
        },
        render: function (instance) {
            var inputElement = instance.inner('input');
            inputElement.removeAttr('placeholder');
            instance.inner('label').html(instance.get('value'));
        },
        dispose: function (instance) {
            var inputElement = instance.inner('input');
            inputUtil.dispose(inputElement);
            inputElement.off(instance.namespace());
        },
        isHidden: function (instance) {
            return isHidden(instance.inner('label'));
        }
    };
    return Placeholder;
});
define('cc/helper/Popup', [
    'require',
    'exports',
    'module',
    '../function/isHidden',
    '../function/contains',
    '../function/nextTick',
    '../util/life',
    '../util/trigger',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var isHidden = require('../function/isHidden');
    var contains = require('../function/contains');
    var nextTick = require('../function/nextTick');
    var lifeUtil = require('../util/life');
    var triggerUtil = require('../util/trigger');
    var instanceUtil = require('../util/instance');
    function Popup(options) {
        lifeUtil.init(this, options);
    }
    var proto = Popup.prototype;
    proto.type = 'Popup';
    proto.init = function () {
        var me = this;
        if (!me.option('triggerElement')) {
            me.option('triggerElement', $({}));
        }
        var curry = function (proxy, name) {
            if ($.isFunction(proxy[name])) {
                return proxy[name](me);
            }
        };
        var showTriggers = triggerUtil.parse(me.option('showLayerTrigger'), function (trigger) {
            var showLayerTrigger = triggers.show[trigger];
            return {
                delay: me.option('showLayerDelay'),
                startDelay: curry(showLayerTrigger, 'startDelay'),
                endDelay: curry(showLayerTrigger, 'endDelay'),
                handler: curry(showLayerTrigger, 'handler')
            };
        });
        var hideTriggers = triggerUtil.parse(me.option('hideLayerTrigger'), function (trigger) {
            var hideLayerTrigger = triggers.hide[trigger];
            return {
                delay: me.option('hideLayerDelay'),
                startDelay: curry(hideLayerTrigger, 'startDelay'),
                endDelay: curry(hideLayerTrigger, 'endDelay'),
                handler: curry(hideLayerTrigger, 'handler')
            };
        });
        var showEvent = function (action) {
            $.each(showTriggers, function (trigger, config) {
                triggers.show[trigger][action](me, config);
            });
        };
        var hideEvent = function (action) {
            $.each(hideTriggers, function (trigger, config) {
                triggers.hide[trigger][action](me, config);
            });
        };
        var hasShowEvent = false;
        var hasHideEvent = false;
        var bindShowEvent = function () {
            if (!hasShowEvent) {
                showEvent('on');
                hasShowEvent = true;
            }
        };
        var unbindShowEvent = function () {
            if (hasShowEvent) {
                showEvent('off');
                hasShowEvent = false;
            }
        };
        var bindHideEvent = function () {
            if (!hasHideEvent) {
                hideEvent('on');
                hasHideEvent = true;
            }
        };
        var unbindHideEvent = function () {
            if (hasHideEvent) {
                hideEvent('off');
                hasHideEvent = false;
            }
        };
        var stateChangeHandler = function (e, data) {
            var opened = data.opened;
            if (opened) {
                if (opened.newValue) {
                    if (!me.option('triggerSelector')) {
                        unbindShowEvent();
                    }
                    setTimeout(bindHideEvent);
                } else {
                    unbindHideEvent();
                    bindShowEvent();
                }
            }
        };
        var context = me.option('context') || me;
        context.before('dispose', function () {
            context.off('statechange', stateChangeHandler);
            unbindShowEvent();
            unbindHideEvent();
            me.close();
        }).on('statechange', stateChangeHandler);
        me.state({ opened: me.option('opened') });
    };
    proto.open = function () {
        this.state('opened', true);
    };
    proto._open = function (e) {
        var me = this;
        if (me.is('opened')) {
            var layerElement = me.option('layerElement');
            var triggerElement = getTriggerElement(e);
            var prevTriggerElement = layerElement.data(TRIGGER_ELEMENT_KEY);
            if (triggerElement && prevTriggerElement && triggerElement !== prevTriggerElement) {
                layerElement.data(POPUP_KEY).close();
                nextTick(function () {
                    me.open(e);
                });
            }
            return false;
        }
    };
    proto.open_ = function (e) {
        var me = this;
        var layerElement = me.option('layerElement');
        var data = {};
        data[TRIGGER_ELEMENT_KEY] = getTriggerElement(e);
        data[POPUP_KEY] = me;
        layerElement.data(data);
    };
    proto.close = function () {
        this.state('opened', false);
    };
    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
    };
    proto.close_ = function () {
        this.option('layerElement').removeData(POPUP_KEY).removeData(TRIGGER_ELEMENT_KEY);
    };
    proto.dispose = function () {
        lifeUtil.dispose(this);
    };
    lifeUtil.extend(proto);
    Popup.stateUpdater = {
        opened: function (opened) {
            this.execute(opened ? 'showLayerAnimation' : 'hideLayerAnimation', { layerElement: this.option('layerElement') });
        }
    };
    Popup.stateValidator = {
        opened: function (opened) {
            if ($.type(opened) !== 'boolean') {
                opened = !isHidden(this.option('layerElement'));
            }
            return opened;
        }
    };
    function createShowHandler(instance, before) {
        return function (e) {
            if ($.isFunction(before)) {
                if (!before.call(this, e)) {
                    return;
                }
            }
            instance.open(e);
        };
    }
    function createHideHandler(instance, before) {
        return function (e) {
            if ($.isFunction(before)) {
                if (!before.call(this, e)) {
                    return;
                }
            }
            instance.close(e);
        };
    }
    function on(instance, config) {
        instance.option('triggerElement').on(config.type, instance.option('triggerSelector'), config.handler);
    }
    function off(instance, config) {
        instance.option('triggerElement').off(config.type, config.handler);
    }
    function onDocument(instance, config) {
        instanceUtil.document.on(config.type, config.handler);
    }
    function offDocument(instance, config) {
        instanceUtil.document.off(config.type, config.handler);
    }
    function createDocumentHideHandler(instance) {
        return createHideHandler(instance, function (e) {
            return !contains(instance.option('layerElement'), e.target);
        });
    }
    function getTriggerElement(event) {
        if (event) {
            return event.currentTarget;
        }
    }
    var POPUP_KEY = '__prev_popup__';
    var TRIGGER_ELEMENT_KEY = '__trigger_element__';
    var enterType = triggerUtil.enter.type;
    var leaveType = triggerUtil.leave.type;
    var triggers = {
        show: {
            focus: {
                on: on,
                off: off,
                handler: createShowHandler
            },
            click: {
                on: on,
                off: off,
                handler: createShowHandler
            },
            enter: {
                on: on,
                off: off,
                handler: createShowHandler,
                startDelay: function (instance) {
                    return function (fn) {
                        instance.option('triggerElement').on(leaveType, instance.option('triggerSelector'), fn);
                    };
                },
                endDelay: function (instance) {
                    return function (fn) {
                        instance.option('triggerElement').off(leaveType, fn);
                    };
                }
            },
            context: {
                on: on,
                off: off,
                handler: createShowHandler
            }
        },
        hide: {
            blur: {
                on: on,
                off: off,
                handler: createHideHandler
            },
            click: {
                on: onDocument,
                off: offDocument,
                handler: createDocumentHideHandler
            },
            leave: {
                on: function (instance, config) {
                    instance.option('triggerElement').on(config.type, instance.option('triggerSelector'), config.handler);
                    instance.option('layerElement').on(config.type, config.handler);
                },
                off: function (instance, config) {
                    instance.option('triggerElement').off(config.type, config.handler);
                    instance.option('layerElement').off(config.type, config.handler);
                },
                handler: createHideHandler,
                startDelay: function (instance) {
                    return function (fn) {
                        instance.option('triggerElement').on(enterType, instance.option('triggerSelector'), fn);
                        instance.option('layerElement').on(enterType, fn);
                    };
                },
                endDelay: function (instance) {
                    return function (fn) {
                        instance.option('triggerElement').off(enterType, fn);
                        instance.option('layerElement').off(enterType, fn);
                    };
                }
            },
            context: {
                on: onDocument,
                off: offDocument,
                handler: createDocumentHideHandler
            }
        }
    };
    return Popup;
});
define('cc/helper/Switchable', [
    'require',
    'exports',
    'module',
    '../function/toNumber',
    '../util/life',
    '../util/trigger'
], function (require, exports, module) {
    'use strict';
    var toNumber = require('../function/toNumber');
    var lifeUtil = require('../util/life');
    var triggerUtil = require('../util/trigger');
    function Switchable(options) {
        lifeUtil.init(this, options);
    }
    var proto = Switchable.prototype;
    proto.type = 'Switchable';
    proto.init = function () {
        var me = this;
        var mainElement = me.option('mainElement');
        var itemSelector = me.option('itemSelector');
        if (itemSelector) {
            var curry = function (proxy, name) {
                if ($.isFunction(proxy[name])) {
                    return proxy[name](me);
                }
            };
            $.each(triggerUtil.parse(me.option('switchTrigger'), function (trigger) {
                var proxy = triggers[trigger];
                return {
                    delay: me.option('switchDelay'),
                    startDelay: curry(proxy, 'startDelay'),
                    endDelay: curry(proxy, 'endDelay'),
                    handler: curry(proxy, 'handler')
                };
            }), function (name, config) {
                mainElement.on(config.type + me.namespace(), itemSelector, config.handler);
            });
        }
        me.inner({ main: mainElement });
        me.set({ index: me.option('index') });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Switchable.propertyValidator = {
        index: function (index) {
            var me = this;
            index = toNumber(index, null);
            if (index == null) {
                var itemSelector = me.option('itemSelector');
                var itemActiveClass = me.option('itemActiveClass');
                if (itemSelector && itemActiveClass) {
                    var mainElement = me.inner('main');
                    index = mainElement.find(itemSelector).index(mainElement.find('.' + itemActiveClass));
                }
            }
            if (!$.isNumeric(index)) {
                me.error('index must be a number.');
            }
            return index;
        }
    };
    var triggers = {
        enter: {
            startDelay: function (instance) {
                return function (fn) {
                    instance.inner('main').on(triggerUtil.leave.type, instance.option('itemSelector'), fn);
                };
            },
            endDelay: function (instance) {
                return function (fn) {
                    instance.inner('main').off(triggerUtil.leave.type, fn);
                };
            }
        },
        click: {}
    };
    triggers.enter.handler = triggers.click.handler = function (instance) {
        return function () {
            var itemSelector = instance.option('itemSelector');
            var itemElements = instance.inner('main').find(itemSelector);
            instance.set('index', itemElements.index(this));
        };
    };
    return Switchable;
});
define('cc/helper/Wheel', [
    'require',
    'exports',
    'module',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var lifeUtil = require('../util/life');
    function Wheel(options) {
        lifeUtil.init(this, options);
    }
    var proto = Wheel.prototype;
    proto.type = 'Wheel';
    proto.init = function () {
        var me = this;
        me.option('watchElement').on(support + me.namespace(), function (e) {
            var delta;
            var event = e.originalEvent;
            var wheelDelta = event.wheelDelta;
            if (wheelDelta % 120 === 0) {
                delta = -wheelDelta / 120;
            } else if (wheelDelta % 3 === 0) {
                delta = -wheelDelta / 3;
            } else if (event.detail % 3 === 0) {
                delta = -event.detail / 3;
            } else {
                delta = event.delta || 0;
            }
            e.type = 'wheel';
            me.emit(e, { delta: delta });
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.option('watchElement').off(me.namespace());
    };
    lifeUtil.extend(proto);
    var support = 'onmousewheel' in document.body ? 'mousewheel' : 'DOMMouseScroll';
    return Wheel;
});
define('cc/main', [
    'require',
    'exports',
    'module',
    './form/Box',
    './form/BoxGroup',
    './form/Date',
    './form/Number',
    './form/Select',
    './form/Text',
    './form/Validator',
    './helper/AjaxUploader',
    './helper/DOMIterator',
    './helper/Draggable',
    './helper/FlashUploader',
    './helper/Input',
    './helper/Iterator',
    './helper/Keyboard',
    './helper/Placeholder',
    './helper/Popup',
    './helper/Switchable',
    './helper/Wheel',
    './ui/AutoComplete',
    './ui/Calendar',
    './ui/Carousel',
    './ui/ComboBox',
    './ui/ContextMenu',
    './ui/Dialog',
    './ui/Pager',
    './ui/Rater',
    './ui/ScrollBar',
    './ui/Slider',
    './ui/SpinBox',
    './ui/Tab',
    './ui/Tooltip',
    './ui/Tree',
    './ui/Uploader',
    './ui/Zoom',
    './util/browser',
    './util/cookie',
    './util/detection',
    './util/etpl',
    './util/FiniteArray',
    './util/fullScreen',
    './util/input',
    './util/instance',
    './util/json',
    './util/keyboard',
    './util/life',
    './util/localStorage',
    './util/Message',
    './util/mimeType',
    './util/orientation',
    './util/position',
    './util/Queue',
    './util/Range',
    './util/redirect',
    './util/string',
    './util/swipe',
    './util/time',
    './util/timer',
    './util/touch',
    './util/trigger',
    './util/url',
    './util/visibility',
    './util/supload/supload'
], function (require, exports, module) {
    'use strict';
    require('./form/Box');
    require('./form/BoxGroup');
    require('./form/Date');
    require('./form/Number');
    require('./form/Select');
    require('./form/Text');
    require('./form/Validator');
    require('./helper/AjaxUploader');
    require('./helper/DOMIterator');
    require('./helper/Draggable');
    require('./helper/FlashUploader');
    require('./helper/Input');
    require('./helper/Iterator');
    require('./helper/Keyboard');
    require('./helper/Placeholder');
    require('./helper/Popup');
    require('./helper/Switchable');
    require('./helper/Wheel');
    require('./ui/AutoComplete');
    require('./ui/Calendar');
    require('./ui/Carousel');
    require('./ui/ComboBox');
    require('./ui/ContextMenu');
    require('./ui/Dialog');
    require('./ui/Pager');
    require('./ui/Rater');
    require('./ui/ScrollBar');
    require('./ui/Slider');
    require('./ui/SpinBox');
    require('./ui/Tab');
    require('./ui/Tooltip');
    require('./ui/Tree');
    require('./ui/Uploader');
    require('./ui/Zoom');
    require('./util/browser');
    require('./util/cookie');
    require('./util/detection');
    require('./util/etpl');
    require('./util/FiniteArray');
    require('./util/fullScreen');
    require('./util/input');
    require('./util/instance');
    require('./util/json');
    require('./util/keyboard');
    require('./util/life');
    require('./util/localStorage');
    require('./util/Message');
    require('./util/mimeType');
    require('./util/orientation');
    require('./util/position');
    require('./util/Queue');
    require('./util/Range');
    require('./util/redirect');
    require('./util/string');
    require('./util/swipe');
    require('./util/time');
    require('./util/timer');
    require('./util/touch');
    require('./util/trigger');
    require('./util/url');
    require('./util/visibility');
    require('./util/supload/supload');
});
define('cc/ui/AutoComplete', [
    'require',
    'exports',
    'module',
    '../function/contains',
    '../function/autoScrollUp',
    '../function/autoScrollDown',
    '../helper/Input',
    '../helper/Popup',
    '../helper/DOMIterator',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var contains = require('../function/contains');
    var autoScrollUp = require('../function/autoScrollUp');
    var autoScrollDown = require('../function/autoScrollDown');
    var Input = require('../helper/Input');
    var Popup = require('../helper/Popup');
    var Iterator = require('../helper/DOMIterator');
    var lifeUtil = require('../util/life');
    function AutoComplete(options) {
        lifeUtil.init(this, options);
    }
    var proto = AutoComplete.prototype;
    proto.type = 'AutoComplete';
    proto.init = function () {
        var me = this;
        var inputElement = me.option('inputElement');
        var menuElement = me.option('menuElement');
        var autoScroll = me.option('autoScroll');
        var itemSelector = me.option('itemSelector');
        var itemActiveClass = me.option('itemActiveClass');
        var activeIndex;
        var iteratorData = [{
                element: inputElement,
                data: { text: inputElement.val() }
            }];
        var processIndex = function (index, callback) {
            var item = iteratorData[index];
            if (item) {
                callback(item.element, item.data);
            }
        };
        var iterator = new Iterator({
            watchElement: inputElement,
            minIndex: me.option('includeInput') ? 0 : 1,
            defaultIndex: 0,
            step: 1,
            loop: true,
            prevKey: 'up',
            nextKey: 'down',
            interval: me.option('interval'),
            propertyChange: {
                index: function (newIndex, oldIndex, changes) {
                    var action = changes.index.action;
                    processIndex(activeIndex, function (itemElement) {
                        if (itemActiveClass && itemElement[0] !== inputElement[0]) {
                            itemElement.removeClass(itemActiveClass);
                        }
                    });
                    activeIndex = newIndex;
                    processIndex(activeIndex, function (itemElement, itemData) {
                        if (itemActiveClass && itemElement[0] !== inputElement[0]) {
                            itemElement.addClass(itemActiveClass);
                        }
                        if (valueActionMap[action]) {
                            inputElement.val(itemData.text);
                        }
                        if (autoScroll) {
                            var fn = action === 'prev' ? autoScrollUp : autoScrollDown;
                            fn(menuElement, itemElement);
                        }
                    });
                }
            }
        });
        var keyboardAction = {
            enter: function (e, data) {
                if (data.isLongPress) {
                    return;
                }
                if (me.is('opened')) {
                    me.close();
                }
                processIndex(activeIndex, function (element, data) {
                    me.emit('enter', data);
                });
            }
        };
        var suggest = function () {
            me.execute('load', [
                $.trim(iteratorData[0].data.text),
                function (error, data) {
                    if (data) {
                        me.set('data', data);
                        me.open();
                    } else {
                        me.close();
                    }
                }
            ]);
        };
        var input = new Input({
            mainElement: inputElement,
            silentOnLongPress: true,
            shortcut: keyboardAction,
            propertyChange: {
                value: function (value) {
                    iteratorData[0].data.text = value;
                    suggest();
                }
            }
        });
        var popup = new Popup({
            triggerElement: inputElement,
            layerElement: menuElement,
            showLayerTrigger: me.option('showMenuTrigger'),
            showLayerDelay: me.option('showMenuDelay'),
            hideLayerTrigger: me.option('hideMenuTrigger'),
            hideLayerDelay: me.option('hideMenuDelay'),
            showLayerAnimation: function () {
                me.execute('showMenuAnimation', { menuElement: menuElement });
            },
            hideLayerAnimation: function () {
                me.execute('hideMenuAnimation', { menuElement: menuElement });
            },
            stateChange: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });
        var dispatchEvent = function (e, data) {
            if (data && data.event) {
                me.emit(e, data);
            }
        };
        popup.before('open', dispatchEvent).after('open', dispatchEvent).before('close', dispatchEvent).after('close', dispatchEvent);
        me.before('open', function (e, data) {
            var event = data && data.event;
            if (event) {
                var target = event.target;
                if (contains(inputElement, target)) {
                    suggest();
                    return false;
                }
            }
        }).after('open', function (e, data) {
            iterator.set('maxIndex', iteratorData.length - 1);
        }).before('close', function (e, data) {
            var event = data && data.event;
            if (event) {
                var target = event.target;
                if (contains(inputElement, target) || contains(menuElement, target)) {
                    return false;
                }
            }
        }).after('close', function (e, data) {
            iterator.stop();
            iterator.set('maxIndex', 0);
            activeIndex = 0;
            mouseEnterElement = null;
        }).before('render', function () {
            iterator.stop();
        }).after('render', function () {
            iteratorData.length = 1;
            var maxIndex = iteratorData.length - 1;
            menuElement.find(itemSelector).each(function () {
                var itemElement = $(this);
                var data = itemElement.data();
                if (data.text == null) {
                    data.text = itemElement.html();
                }
                maxIndex++;
                iteratorData[maxIndex] = {
                    element: itemElement,
                    data: data
                };
                itemElement.data(ITEM_INDEX, maxIndex);
            });
            var properties = { maxIndex: maxIndex };
            if (itemActiveClass) {
                var activeElement = menuElement.find('.' + itemActiveClass);
                if (activeElement.length === 1) {
                    var index = activeElement.data(ITEM_INDEX);
                    processIndex(index, function () {
                        properties.index = index;
                    });
                }
            }
            iterator.set(properties);
        });
        var scrollTimer;
        var mouseEnterElement;
        var namespace = me.namespace();
        menuElement.on('scroll' + namespace, function () {
            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }
            scrollTimer = setTimeout(function () {
                scrollTimer = null;
            }, 500);
        }).on('click' + namespace, itemSelector, function () {
            var index = $(this).data(ITEM_INDEX);
            processIndex(index, function (itemElement, itemData) {
                iterator.set('index', index, {
                    action: ACTION_CLICK,
                    force: true
                });
                me.close();
                me.emit('select', itemData);
            });
        }).on('mouseenter' + namespace, itemSelector, function () {
            if (scrollTimer) {
                return;
            }
            mouseEnterElement = $(this);
            var index = mouseEnterElement.data(ITEM_INDEX);
            processIndex(index, function () {
                iterator.set('index', index);
                iterator.sync();
            });
        }).on('mouseleave' + namespace, itemSelector, function () {
            if (scrollTimer) {
                return;
            }
            if (mouseEnterElement) {
                if (mouseEnterElement[0] === this) {
                    iterator.set('index', iterator.option('defaultIndex'));
                    iterator.sync();
                }
                mouseEnterElement = null;
            }
        });
        me.inner({
            iterator: iterator,
            input: input,
            popup: popup
        });
    };
    proto.render = function () {
        var me = this;
        me.renderWith(me.get('data'), me.option('menuTemplate'), me.option('menuElement'));
    };
    proto._render = function () {
        if (!this.get('data')) {
            return false;
        }
    };
    proto.open = function () {
        this.state('opened', true);
    };
    proto._open = function () {
        if (this.is('opened')) {
            return false;
        }
    };
    proto.close = function () {
        this.state('opened', false);
    };
    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('iterator').dispose();
        me.inner('input').dispose();
        me.inner('popup').dispose();
        me.option('menuElement').off(me.namespace());
    };
    lifeUtil.extend(proto);
    AutoComplete.propertyUpdater = {
        data: function () {
            this.render();
        }
    };
    AutoComplete.stateUpdater = {
        opened: function (opened) {
            this.inner('popup').state('opened', opened);
        }
    };
    var ITEM_INDEX = '__index__';
    var ACTION_CLICK = 'click';
    var valueActionMap = {
        prev: 1,
        next: 1
    };
    valueActionMap[ACTION_CLICK] = 1;
    return AutoComplete;
});
define('cc/ui/Calendar', [
    'require',
    '../function/split',
    '../function/values',
    '../function/weekOffset',
    '../function/monthOffset',
    '../function/weekFirst',
    '../function/weekLast',
    '../function/monthFirst',
    '../function/monthLast',
    '../function/parseDate',
    '../function/simplifyDate',
    '../util/life'
], function (require) {
    'use strict';
    var split = require('../function/split');
    var createValues = require('../function/values');
    var weekOffset = require('../function/weekOffset');
    var monthOffset = require('../function/monthOffset');
    var weekFirst = require('../function/weekFirst');
    var weekLast = require('../function/weekLast');
    var monthFirst = require('../function/monthFirst');
    var monthLast = require('../function/monthLast');
    var parseDate = require('../function/parseDate');
    var simplifyDate = require('../function/simplifyDate');
    var lifeUtil = require('../util/life');
    function Calendar(options) {
        lifeUtil.init(this, options);
    }
    var proto = Calendar.prototype;
    proto.type = 'Calendar';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var clickType = 'click' + me.namespace();
        var itemSelector = me.option('itemSelector');
        if (itemSelector) {
            var valueAttribute = me.option('valueAttribute');
            if (!valueAttribute) {
                me.error('valueAttribute is missing.');
            }
            mainElement.on(clickType, itemSelector, function (e) {
                var itemValue = $(this).attr(valueAttribute);
                if (!itemValue) {
                    me.error('value is not found by valueAttribute.');
                }
                var oldValue = me.get('value');
                var newValue = me.inner('values')(itemValue, true);
                var oldCount = split(oldValue, ',').length;
                var newCount = split(newValue, ',').length;
                e.type = newCount < oldCount ? 'unselect' : 'select';
                me.emit(e, { value: itemValue });
                me.set('value', newValue);
            });
        }
        var prevSelector = me.option('prevSelector');
        if (prevSelector) {
            mainElement.on(clickType, prevSelector, $.proxy(me.prev, me));
        }
        var nextSelector = me.option('nextSelector');
        if (nextSelector) {
            mainElement.on(clickType, nextSelector, $.proxy(me.next, me));
        }
        me.inner({ main: mainElement });
        var today = me.option('today') || new Date();
        me.set({
            today: today,
            date: me.option('date') || today,
            value: me.option('value')
        });
    };
    proto.prev = function () {
        offsetCalendar(this, -1);
    };
    proto.next = function () {
        offsetCalendar(this, 1);
    };
    proto.inRange = function (date) {
        var data = this.get('data');
        return data && date >= parseDate(data.start) && date < parseDate(data.end).getTime() + DAY;
    };
    proto.createRenderData = function (date) {
        var me = this;
        var firstDay = me.option('firstDay');
        var weekFirstDay;
        var weekLastDay;
        var isMonthMode = me.option('mode') === MODE_MONTH;
        if (isMonthMode) {
            weekFirstDay = weekFirst(monthFirst(date), firstDay);
            weekLastDay = weekLast(monthLast(date), firstDay);
        } else {
            weekFirstDay = weekFirst(date, firstDay);
            weekLastDay = weekLast(date, firstDay);
        }
        weekFirstDay = normalizeDate(weekFirstDay);
        weekLastDay = normalizeDate(weekLastDay);
        if (isMonthMode && me.option('stable')) {
            var duration = weekLastDay - weekFirstDay;
            var offset = stableDuration - duration;
            if (offset > 0) {
                weekLastDay += offset;
            }
        }
        var values = [];
        $.each(split(me.get('value'), ','), function (index, literal) {
            if (literal) {
                var date = me.execute('parse', literal);
                if (date) {
                    values.push(normalizeDate(date));
                }
            }
        });
        var list = createDatasource(weekFirstDay, weekLastDay, normalizeDate(me.get('today')), values);
        return $.extend(simplifyDate(date), {
            start: list[0],
            end: list[list.length - 1],
            list: list
        });
    };
    proto.render = function () {
        this.renderWith(this.get('data'));
    };
    proto._render = function () {
        if (!this.get('data')) {
            return false;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Calendar.propertyUpdater = {};
    Calendar.propertyUpdater.data = Calendar.propertyUpdater.date = Calendar.propertyUpdater.value = function (newValue, oldValue, change) {
        var me = this;
        var needRender;
        if (change.date) {
            var date = change.date.newValue;
            if (!me.inRange(date)) {
                needRender = true;
                me.set('data', me.createRenderData(date), { silent: true });
            }
        }
        if (!needRender && change.data) {
            needRender = true;
        }
        if (needRender) {
            me.render();
        }
        if (!needRender && !change.value) {
            return;
        }
        var valueAttribute = me.option('valueAttribute');
        var itemActiveClass = me.option('itemActiveClass');
        if (!valueAttribute || !itemActiveClass) {
            return;
        }
        var mainElement = me.inner('main');
        mainElement.find('.' + itemActiveClass).removeClass(itemActiveClass);
        $.each(split(me.get('value'), ','), function (index, value) {
            if (!value) {
                return;
            }
            mainElement.find('[' + valueAttribute + '="' + value + '"]').addClass(itemActiveClass);
        });
    };
    Calendar.propertyValidator = {
        value: function (value) {
            var me = this;
            var values = createValues(value, me.option('multiple'), me.option('toggle'));
            this.inner('values', values);
            return values();
        }
    };
    var MODE_MONTH = 'month';
    var MODE_WEEK = 'week';
    var DAY = 24 * 60 * 60 * 1000;
    var stableDuration = 41 * DAY;
    function createDatasource(start, end, today, values) {
        var data = [];
        for (var time = start, date, item; time <= end; time += DAY) {
            item = simplifyDate(time);
            if (time > today) {
                item.phase = 'future';
            } else if (time < today) {
                item.phase = 'past';
            } else {
                item.phase = 'today';
            }
            if ($.inArray(time, values) >= 0) {
                item.active = true;
            }
            data.push(item);
        }
        return data;
    }
    function offsetCalendar(instance, offset) {
        var date = instance.get('date');
        date = instance.option('mode') === MODE_WEEK ? weekOffset(date, offset) : monthOffset(date, offset);
        instance.set({
            date: date,
            data: instance.createRenderData(date)
        });
    }
    function normalizeDate(date) {
        return date.setHours(0, 0, 0, 0);
    }
    return Calendar;
});
define('cc/ui/Carousel', [
    'require',
    'exports',
    'module',
    '../function/toNumber',
    '../helper/Switchable',
    '../helper/Iterator',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var toNumber = require('../function/toNumber');
    var Switchable = require('../helper/Switchable');
    var Iterator = require('../helper/Iterator');
    var lifeUtil = require('../util/life');
    function Carousel(options) {
        lifeUtil.init(this, options);
    }
    var proto = Carousel.prototype;
    proto.type = 'Carousel';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var namespace = me.namespace();
        var clickType = 'click' + namespace;
        var prevSelector = me.option('prevSelector');
        if (prevSelector) {
            mainElement.on(clickType, prevSelector, $.proxy(me.prev, me));
        }
        var nextSelector = me.option('nextSelector');
        if (nextSelector) {
            mainElement.on(clickType, nextSelector, $.proxy(me.next, me));
        }
        var itemSelector = me.option('itemSelector');
        if (me.option('autoplay') && me.option('pauseOnHover')) {
            mainElement.on('mouseenter' + namespace, itemSelector, $.proxy(me.pause, me)).on('mouseleave' + namespace, itemSelector, $.proxy(me.play, me));
        }
        var navTrigger = me.option('navTrigger');
        var navSelector = me.option('navSelector');
        var navActiveClass = me.option('navActiveClass');
        var switcher;
        if (navTrigger && navSelector) {
            switcher = new Switchable({
                mainElement: mainElement,
                switchTrigger: navTrigger,
                switchDelay: me.option('navDelay'),
                itemSelector: navSelector,
                itemActiveClass: navActiveClass,
                propertyChange: {
                    index: function (toIndex, fromIndex) {
                        me.set('index', toIndex, { action: navTrigger });
                    }
                }
            });
        }
        var iterator = new Iterator({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex'),
            interval: me.option('interval'),
            step: me.option('step'),
            loop: me.option('loop'),
            propertyChange: {
                index: function (toIndex, fromIndex, changes) {
                    me.set('index', toIndex, changes.index);
                    if (switcher) {
                        me.execute('navAnimation', {
                            mainElement: mainElement,
                            navSelector: navSelector,
                            navActiveClass: navActiveClass,
                            fromIndex: fromIndex,
                            toIndex: toIndex
                        });
                    }
                    me.execute('itemAnimation', {
                        mainElement: mainElement,
                        itemSelector: itemSelector,
                        itemActiveClass: me.option('itemActiveClass'),
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });
                },
                minIndex: function (minIndex) {
                    me.set('minIndex', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxIndex', maxIndex);
                }
            }
        });
        me.inner({
            main: mainElement,
            switcher: switcher,
            iterator: iterator
        });
    };
    proto.prev = function () {
        this.inner('iterator').prev();
    };
    proto.next = function () {
        this.inner('iterator').next();
    };
    proto.play = function () {
        this.inner('iterator').start(this.option('reverse'));
    };
    proto.pause = function () {
        this.inner('iterator').pause();
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('iterator').dispose();
        var switcher = me.inner('switcher');
        if (switcher) {
            switcher.dispose();
        }
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Carousel.propertyUpdater = {
        index: function (index) {
            var me = this;
            me.inner('iterator').set('index', index);
            var switcher = me.inner('switcher');
            if (switcher) {
                switcher.set('index', index);
            }
            if (me.option('autoplay')) {
                me.play();
            }
        },
        minIndex: function (minIndex) {
            this.inner('iterator').set('minIndex', minIndex);
        },
        maxIndex: function (maxIndex) {
            this.inner('iterator').set('maxIndex', maxIndex);
        }
    };
    Carousel.propertyValidator = {
        minIndex: function (minIndex) {
            return toNumber(minIndex, 0);
        },
        maxIndex: function (maxIndex) {
            maxIndex = toNumber(maxIndex, null);
            if (maxIndex == null) {
                var me = this;
                var items = me.inner('main').find(me.option('itemSelector'));
                maxIndex = items.length - 1;
            }
            return maxIndex;
        }
    };
    return Carousel;
});
define('cc/ui/ComboBox', [
    'require',
    'exports',
    'module',
    '../function/toString',
    '../helper/Popup',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var toString = require('../function/toString');
    var Popup = require('../helper/Popup');
    var lifeUtil = require('../util/life');
    function ComboBox(options) {
        lifeUtil.init(this, options);
    }
    var proto = ComboBox.prototype;
    proto.type = 'ComboBox';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var buttonElement = me.option('buttonElement');
        var menuElement = me.option('menuElement');
        var popup = new Popup({
            triggerElement: buttonElement,
            layerElement: menuElement,
            showLayerTrigger: me.option('showMenuTrigger'),
            showLayerDelay: me.option('showMenuDelay'),
            hideLayerTrigger: me.option('hideMenuTrigger'),
            hideLayerDelay: me.option('hideMenuDelay'),
            showLayerAnimation: function (options) {
                me.execute('showMenuAnimation', { menuElement: menuElement });
            },
            hideLayerAnimation: function (options) {
                me.execute('hideMenuAnimation', { menuElement: menuElement });
            },
            stateChange: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });
        var dispatchEvent = function (e, data) {
            if (data && data.event) {
                me.emit(e, data);
            }
        };
        popup.before('open', dispatchEvent).after('open', dispatchEvent).before('close', dispatchEvent).after('close', dispatchEvent);
        var menuActiveClass = me.option('menuActiveClass');
        if (menuActiveClass) {
            var element = mainElement || buttonElement;
            me.after('open', function () {
                element.addClass(menuActiveClass);
            }).after('close', function () {
                element.removeClass(menuActiveClass);
            });
        }
        var itemSelector = me.option('itemSelector');
        if (!itemSelector) {
            me.error('itemSelector is missing.');
        }
        var valueAttribute = me.option('valueAttribute');
        if (!valueAttribute) {
            me.error('valueAttribute is missing.');
        }
        menuElement.on('click' + me.namespace(), itemSelector, function (e) {
            var value = $(this).attr(valueAttribute);
            if ($.type(value) !== 'string') {
                me.error('value is not found by valueAttribute.');
            }
            me.set('value', value);
            me.close();
            e.type = 'select';
            me.emit(e);
        });
        me.inner({
            main: mainElement,
            popup: popup
        });
        me.set({
            data: me.option('data'),
            value: me.option('value')
        });
    };
    proto.render = function () {
        var me = this;
        me.renderWith(me.get('data'), me.option('menuTemplate'), me.option('menuElement'));
    };
    proto._render = function () {
        if (!this.get('data')) {
            return false;
        }
    };
    proto.open = function () {
        this.state('opened', true);
    };
    proto._open = function () {
        if (this.is('opened')) {
            return false;
        }
    };
    proto.close = function () {
        this.state('opened', false);
    };
    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('popup').dispose();
        me.option('menuElement').off(me.namespace());
    };
    lifeUtil.extend(proto);
    ComboBox.propertyUpdater = {};
    ComboBox.propertyUpdater.data = ComboBox.propertyUpdater.value = function (newValue, oldValue, changes) {
        var me = this;
        var menuElement = me.option('menuElement');
        var itemActiveClass = me.option('itemActiveClass');
        var textAttribute = me.option('textAttribute');
        var valueAttribute = me.option('valueAttribute');
        if (changes.data) {
            this.render();
        } else if (changes.value && itemActiveClass) {
            menuElement.find('.' + itemActiveClass).removeClass(itemActiveClass);
        }
        var text;
        var value = toString(me.get('value'), null);
        if (value != null && value !== '') {
            var itemElement = menuElement.find('[' + valueAttribute + '=' + value + ']');
            switch (itemElement.length) {
            case 1:
                if (itemActiveClass) {
                    itemElement.addClass(itemActiveClass);
                }
                text = itemElement.attr(textAttribute);
                if (text == null) {
                    text = itemElement.html();
                }
                break;
            case 0:
                me.error('value is not found by valueAttribute.');
                break;
            default:
                me.error('value repeated.');
                break;
            }
        }
        me.execute('setText', {
            buttonElement: me.option('buttonElement'),
            text: text || me.option('defaultText')
        });
    };
    ComboBox.propertyValidator = {
        value: function (value) {
            var me = this;
            var itemActiveClass = me.option('itemActiveClass');
            if (value == null && itemActiveClass) {
                var itemElement = me.option('menuElement').find('.' + itemActiveClass);
                if (itemElement.length === 1) {
                    value = itemElement.attr(me.option('valueAttribute'));
                }
            }
            return value;
        }
    };
    ComboBox.stateUpdater = {
        opened: function (opened) {
            this.inner('popup').state('opened', opened);
        }
    };
    return ComboBox;
});
define('cc/ui/ContextMenu', [
    'require',
    'exports',
    'module',
    '../function/pin',
    '../function/eventPage',
    '../helper/Popup',
    '../util/instance',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var pin = require('../function/pin');
    var eventPage = require('../function/eventPage');
    var Popup = require('../helper/Popup');
    var instanceUtil = require('../util/instance');
    var lifeUtil = require('../util/life');
    function ContextMenu(options) {
        lifeUtil.init(this, options);
    }
    var proto = ContextMenu.prototype;
    proto.type = 'ContextMenu';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var contextEvent;
        var namespace = me.namespace();
        var action = me.option('action');
        if (action) {
            $.each(action, function (selector, handler) {
                mainElement.on('click' + namespace, selector, function () {
                    me.execute(handler, contextEvent);
                });
            });
        }
        var popup = new Popup({
            layerElement: mainElement,
            hideLayerTrigger: me.option('hideTrigger'),
            hideLayerDelay: me.option('hideDelay'),
            showLayerAnimation: function () {
                me.execute('showAnimation', { mainElement: mainElement });
            },
            hideLayerAnimation: function () {
                me.execute('hideAnimation', { mainElement: mainElement });
            },
            stateChange: {
                opened: function (opened) {
                    me.state('hidden', !opened);
                }
            }
        });
        var dispatchEvent = function (e, type, data) {
            if (data && data.event) {
                e.type = type;
                me.emit(e, data);
            }
        };
        popup.before('open', function (e, data) {
            dispatchEvent(e, 'beforeshow', data);
        }).after('open', function (e, data) {
            dispatchEvent(e, 'aftershow', data);
        }).before('close', function (e, data) {
            dispatchEvent(e, 'beforehide', data);
        }).after('close', function (e, data) {
            dispatchEvent(e, 'afterhide', data);
        });
        me.inner({
            popup: popup,
            main: mainElement
        });
        me.option('watchElement').on('contextmenu' + namespace, function (e) {
            if (activeMenu) {
                activeMenu.hide();
            }
            contextEvent = e;
            activeMenu = me;
            activeMenu.show();
            var pos = eventPage(e);
            pin({
                element: mainElement,
                x: 0,
                y: 0,
                attachment: {
                    element: instanceUtil.body,
                    x: pos.x,
                    y: pos.y
                }
            });
            return false;
        });
    };
    proto.show = function () {
        this.state('hidden', false);
    };
    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('popup').dispose();
        me.option('watchElement').off(me.namespace());
        if (activeMenu === me) {
            activeMenu = null;
        }
    };
    lifeUtil.extend(proto);
    ContextMenu.stateUpdater = {
        hidden: function (hidden) {
            var popup = this.inner('popup');
            if (hidden) {
                popup.close();
            } else {
                popup.open();
            }
        }
    };
    var activeMenu;
    return ContextMenu;
});
define('cc/ui/Dialog', [
    'require',
    'exports',
    'module',
    '../function/debounce',
    '../function/pageWidth',
    '../function/pageHeight',
    '../function/pinGlobal',
    '../function/dragGlobal',
    '../util/life',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var debounce = require('../function/debounce');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
    var pinGlobal = require('../function/pinGlobal');
    var dragGlobal = require('../function/dragGlobal');
    var lifeUtil = require('../util/life');
    var window = require('../util/instance').window;
    function Dialog(options) {
        lifeUtil.init(this, options);
    }
    var proto = Dialog.prototype;
    proto.type = 'Dialog';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var maskElement = me.option('maskElement');
        if (me.option('modal')) {
            if (!maskElement) {
                maskElement = $(me.option('maskTemplate'));
            }
            mainElement.before(maskElement);
        } else if (maskElement) {
            maskElement = null;
        }
        var classList = [];
        var skinClass = me.option('skinClass');
        if (skinClass) {
            classList.push(skinClass);
        }
        var draggableClass = me.option('draggableClass');
        if (me.option('draggable') && draggableClass) {
            classList.push(draggableClass);
        }
        if (classList.length > 0) {
            mainElement.addClass(classList.join(' '));
        }
        var removeOnEmpty = me.option('removeOnEmpty');
        var title = me.option('title');
        if (title) {
            mainElement.find(me.option('titleSelector')).html(title);
        } else if (removeOnEmpty) {
            mainElement.find(me.option('headerSelector')).remove();
        }
        var content = me.option('content');
        var contentElement = mainElement.find(me.option('contentSelector'));
        if (content) {
            contentElement.html(content);
        } else if (removeOnEmpty) {
            contentElement.remove();
        }
        var style = {};
        var width = me.option('width');
        switch ($.type(width)) {
        case 'string':
        case 'number':
            style.width = width;
            break;
        }
        var position = me.option('fixed') ? 'fixed' : 'absolute';
        if (mainElement.css('position') !== position) {
            style.position = position;
        }
        if (maskElement) {
            var zIndexStyleName = 'z-index';
            var zIndex = me.option('zIndex');
            if (!$.isNumeric(zIndex)) {
                zIndex = maskElement.css(zIndexStyleName);
                if (!$.isNumeric(zIndex)) {
                    zIndex = 'auto';
                }
            }
            maskElement.css(zIndexStyleName, zIndex);
            style[zIndexStyleName] = zIndex;
        }
        mainElement.css(style);
        var clickType = 'click' + me.namespace();
        var hideHandler = $.proxy(me.hide, me);
        var closeSelector = me.option('closeSelector');
        if (closeSelector) {
            mainElement.on(clickType, closeSelector, hideHandler);
        }
        if (me.option('disposeOnHide')) {
            me.after('hide', $.proxy(me.dispose, me));
        }
        if (maskElement) {
            if (me.option('hideOnBlur')) {
                maskElement.on(clickType, hideHandler);
            }
            if (me.option('removeOnDispose')) {
                me.after('dispose', function () {
                    maskElement.remove();
                });
            }
        }
        me.inner({
            main: mainElement,
            mask: maskElement
        });
        me.state({ hidden: me.option('hidden') });
    };
    proto.show = function () {
        this.state('hidden', false);
    };
    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };
    proto.refresh = function () {
        var me = this;
        var isResize = arguments[0];
        var options = {};
        if (!isResize || me.option('positionOnResize')) {
            var mainElement = me.inner('main');
            options.mainElement = mainElement;
            options.mainStyle = pinGlobal({
                element: mainElement,
                x: me.option('x'),
                y: me.option('y'),
                fixed: me.option('fixed')
            });
        }
        var maskElement = me.inner('mask');
        if (maskElement) {
            options.maskElement = maskElement;
            options.maskStyle = {
                width: pageWidth(),
                height: pageHeight()
            };
        }
        me.execute(isResize ? 'resizeWindowAnimation' : 'refreshAnimation', options);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        if (!me.is('hidden')) {
            me.hide();
        }
        var mainElement = me.inner('main');
        var maskElement = me.inner('mask');
        var namespace = me.namespace();
        mainElement.off(namespace);
        if (maskElement) {
            maskElement.off(namespace);
        }
    };
    lifeUtil.extend(proto);
    Dialog.stateUpdater = {
        hidden: function (hidden) {
            var me = this;
            var namespace = me.namespace();
            window.off(namespace);
            var dragger = me.inner('dragger');
            if (dragger) {
                dragger.dispose();
                dragger = null;
            }
            var mainElement = me.inner('main');
            var maskElement = me.inner('mask');
            var options = { mainElement: mainElement };
            if (maskElement) {
                options.maskElement = maskElement;
            }
            if (hidden) {
                me.execute('hideAnimation', options);
            } else {
                window.on('resize' + namespace, debounce(function () {
                    me.refresh(true);
                }, 50));
                if (me.option('draggable')) {
                    dragger = dragGlobal({
                        element: mainElement,
                        handleSelector: me.option('draggableHandleSelector'),
                        cancelSelector: me.option('draggableCancelSelector'),
                        draggingClass: me.option('draggingClass'),
                        dragAnimation: me.option('dragAnimation')
                    });
                }
                me.execute('showAnimation', options);
                me.refresh();
            }
            me.inner('dragger', dragger);
        }
    };
    return Dialog;
});
define('cc/ui/Pager', [
    'require',
    'exports',
    'module',
    '../function/toNumber',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var toNumber = require('../function/toNumber');
    var lifeUtil = require('../util/life');
    function Pager(options) {
        lifeUtil.init(this, options);
    }
    var proto = Pager.prototype;
    proto.type = 'Pager';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var pageSelector = me.option('pageSelector');
        var pageAttribute = me.option('pageAttribute');
        if (pageSelector && pageAttribute) {
            mainElement.on('click' + me.namespace(), pageSelector, function () {
                var page = $(this).attr(pageAttribute);
                if (page >= FIRST_PAGE) {
                    page = +page;
                    me.set('page', page);
                    me.emit('select', { page: page });
                }
            });
        }
        me.inner({ main: mainElement });
        me.set({
            page: me.option('page'),
            count: me.option('count')
        });
    };
    proto.render = function () {
        var me = this;
        var count = me.get('count');
        var mainElement = me.inner('main');
        if (count < 2 && me.option('hideOnSingle')) {
            me.state('hidden', true);
            return;
        }
        var page = Math.min(me.get('page'), count);
        var showCount = me.option('showCount');
        var startCount = me.option('startCount');
        var endCount = me.option('endCount');
        var pageTemplate = me.option('pageTemplate');
        var prevTemplate = me.option('prevTemplate');
        var nextTemplate = me.option('nextTemplate');
        var activeTemplate = me.option('activeTemplate');
        var ellipsisTemplate = me.option('ellipsisTemplate');
        var datasource = [];
        var start = Math.max(FIRST_PAGE, page - Math.ceil(showCount / 2));
        var end = Math.min(count, start + showCount - 1);
        if (end === count && end - start < showCount) {
            start = Math.max(FIRST_PAGE, end - showCount + 1);
        }
        if (start < page) {
            datasource.push({
                range: [
                    start,
                    page - 1
                ],
                tpl: pageTemplate
            });
        }
        datasource.push({ tpl: activeTemplate });
        if (end > page) {
            datasource.push({
                range: [
                    page + 1,
                    end
                ],
                tpl: pageTemplate
            });
        }
        var offset;
        if (startCount > 0 && start > FIRST_PAGE) {
            offset = start - startCount;
            if (offset > 1) {
                datasource.unshift({
                    range: [
                        FIRST_PAGE,
                        startCount
                    ],
                    tpl: pageTemplate
                }, { tpl: ellipsisTemplate });
            } else {
                datasource.unshift({
                    range: [
                        FIRST_PAGE,
                        start - 1
                    ],
                    tpl: pageTemplate
                });
            }
        }
        if (endCount > 0 && end < count) {
            offset = count - end - endCount;
            if (offset > 1) {
                datasource.push({ tpl: ellipsisTemplate }, {
                    range: [
                        count - endCount + 1,
                        count
                    ],
                    tpl: pageTemplate
                });
            } else {
                datasource.push({
                    range: [
                        end + 1,
                        count
                    ],
                    tpl: pageTemplate
                });
            }
        }
        datasource.unshift({ tpl: prevTemplate });
        datasource.push({ tpl: nextTemplate });
        var html = $.map(datasource, function (item, index) {
            var tpl = item.tpl;
            if (!tpl) {
                return;
            }
            var html = '';
            var append = function () {
                html += me.execute('render', [
                    data,
                    tpl
                ]);
            };
            var data = {
                first: FIRST_PAGE,
                last: count,
                active: page
            };
            var range = item.range;
            if (range) {
                for (var i = range[0], end = range[1]; i <= end; i++) {
                    data.page = i;
                    append();
                }
            } else {
                append();
            }
            return html;
        }).join('');
        me.renderWith(html);
        me.state('hidden', false);
    };
    proto.prev = function () {
        var me = this;
        me.set('page', me.get('page') - 1);
    };
    proto._prev = function () {
        if (this.get('page') > FIRST_PAGE) {
        } else {
            return false;
        }
    };
    proto.next = function () {
        var me = this;
        me.set('page', me.get('page') + 1);
    };
    proto._next = function () {
        var me = this;
        if (me.get('page') < me.get('count')) {
        } else {
            return false;
        }
    };
    proto.show = function () {
        this.state('hidden', false);
    };
    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Pager.propertyUpdater = {};
    Pager.propertyUpdater.page = Pager.propertyUpdater.count = function () {
        this.render();
        return false;
    };
    Pager.propertyValidator = {
        page: function (page) {
            return toNumber(page, 0);
        },
        count: function (count) {
            return toNumber(count, 0);
        }
    };
    Pager.stateUpdater = {
        hidden: function (hidden) {
            var me = this;
            me.execute(hidden ? 'hideAnimation' : 'showAnimation', { mainElement: me.inner('main') });
        }
    };
    var FIRST_PAGE = 1;
    return Pager;
});
define('cc/ui/Rater', [
    'require',
    'exports',
    'module',
    '../function/debounce',
    '../function/restrain',
    '../function/toNumber',
    '../function/eventOffset',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var debounce = require('../function/debounce');
    var restrain = require('../function/restrain');
    var toNumber = require('../function/toNumber');
    var eventOffset = require('../function/eventOffset');
    var lifeUtil = require('../util/life');
    function Rater(options) {
        lifeUtil.init(this, options);
    }
    var proto = Rater.prototype;
    proto.type = 'Rater';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        me.inner({ main: mainElement });
        me.set({
            count: me.option('count'),
            value: me.option('value'),
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue')
        });
        if (me.option('readOnly')) {
            return;
        }
        var itemSelector = me.option('itemSelector');
        if (!itemSelector) {
            me.error('itemSelector is missing.');
        }
        var activeItemElement;
        var supportHalf = me.option('half');
        var namespace = me.namespace();
        var getValueByItem = function (e, target) {
            var value = target.data('value');
            if (supportHalf) {
                if (eventOffset(e).x / target.width() < 0.5) {
                    value -= 0.5;
                }
            }
            return restrain(value, me.get('minValue'), me.get('maxValue'));
        };
        var moveHandler = function (e) {
            if (!activeItemElement) {
                return;
            }
            me.preview(getValueByItem(e, activeItemElement));
        };
        mainElement.on('mouseenter' + namespace, itemSelector, function (e) {
            activeItemElement = $(this);
            if (supportHalf) {
                activeItemElement.on('mousemove' + namespace, debounce(moveHandler, 50));
            }
            me.preview(getValueByItem(e, activeItemElement));
        }).on('mouseleave' + namespace, itemSelector, function (e) {
            if (supportHalf) {
                activeItemElement.off(namespace);
            }
            activeItemElement = null;
            me.preview();
        }).on('click' + namespace, itemSelector, function (e) {
            me.set('value', getValueByItem(e, activeItemElement || $(this)));
        });
    };
    proto.render = function () {
        var me = this;
        var list = [];
        var hintMap = me.option('hint') || {};
        var classMap = {
            '1': me.option('itemActiveClass'),
            '0.5': me.option('itemHalfClass')
        };
        traverse(me.get('value'), me.get('count'), function (index, value) {
            var className = classMap[value];
            value = index + 1;
            list.push({
                'value': value,
                'class': className || '',
                'hint': hintMap[value] || ''
            });
        });
        me.renderWith({ list: list });
    };
    proto.preview = function (value) {
        var me = this;
        me.inner('value', value);
        value = toNumber(value, null);
        if (value == null) {
            value = me.get('value');
        }
        refresh(me, value);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Rater.propertyUpdater = {};
    Rater.propertyUpdater.value = Rater.propertyUpdater.count = function (newValue, oldValue, changes) {
        var me = this;
        if (changes.count) {
            me.render();
        } else {
            var valueChange = changes.value;
            if (valueChange) {
                refresh(me, valueChange.newValue);
            }
        }
        return false;
    };
    Rater.propertyValidator = {
        count: function (count) {
            count = toNumber(count, -1);
            if (count < 0) {
                this.error('count must be a number.');
            }
            return count;
        },
        minValue: function (minValue) {
            return toNumber(minValue, 0);
        },
        maxValue: function (maxValue) {
            return toNumber(maxValue, this.option('count'));
        }
    };
    function refresh(instance, value) {
        var items = instance.inner('main').find(instance.option('itemSelector'));
        var itemActiveClass = instance.option('itemActiveClass');
        var itemHalfClass = instance.option('itemHalfClass');
        traverse(value, instance.get('count'), function (index, value) {
            var element = items.eq(index);
            if (itemActiveClass) {
                element[value === 1 ? 'addClass' : 'removeClass'](itemActiveClass);
            }
            if (itemHalfClass) {
                element[value === 0.5 ? 'addClass' : 'removeClass'](itemHalfClass);
            }
        });
    }
    function traverse(value, count, callback) {
        for (var i = 0, result, item; i < count; i++) {
            result = value - (i + 1);
            if (result >= 0) {
                item = 1;
            } else if (result <= -1) {
                item = 0;
            } else {
                item = 0.5;
            }
            callback(i, item);
        }
    }
    return Rater;
});
define('cc/ui/ScrollBar', [
    'require',
    'exports',
    'module',
    '../function/ratio',
    '../function/isHidden',
    '../util/life',
    '../util/orientation',
    './Slider'
], function (require, exports, module) {
    'use strict';
    var getRaito = require('../function/ratio');
    var isHidden = require('../function/isHidden');
    var lifeUtil = require('../util/life');
    var orientationUtil = require('../util/orientation');
    var Slider = require('./Slider');
    function ScrollBar(options) {
        lifeUtil.init(this, options);
    }
    var proto = ScrollBar.prototype;
    proto.type = 'ScrollBar';
    proto.init = function () {
        var me = this;
        var orientation = me.option('orientation');
        var props = orientationUtil[orientation];
        var panelElement = me.option('panelElement');
        var slider = new Slider({
            minValue: 0,
            maxValue: 100,
            value: me.option('value'),
            mainElement: me.option('mainElement'),
            mainTemplate: me.option('mainTemplate'),
            orientation: orientation,
            scrollElement: panelElement,
            scrollStep: me.option('scrollStep'),
            scrollStepType: me.option('scrollStepType'),
            thumbSelector: me.option('thumbSelector'),
            draggingClass: me.option('draggingClass'),
            slideAnimation: function (options) {
                me.execute('scrollAnimation', options);
            },
            propertyChange: {
                value: function (value) {
                    var pixel = slider.valueToPixel(value);
                    panelElement.prop(props.scrollPosition, pixel * me.inner('ratio'));
                    me.set('value', value);
                    me.emit('scroll');
                }
            }
        });
        me.inner({
            main: slider.inner('main'),
            slider: slider
        });
        me.state({ hidden: me.option('hidden') });
        me.refresh();
    };
    proto.refresh = function () {
        var me = this;
        var slider = me.inner('slider');
        var orientation = me.option('orientation');
        var props = orientationUtil[orientation];
        var mainElement = me.inner('main');
        var panelElement = me.option('panelElement');
        var viewportSize = panelElement[props.innerSize]();
        var contentSize = panelElement.prop(props.scrollSize);
        var ratio = getRaito(viewportSize, contentSize);
        if (ratio > 0 && ratio < 1) {
            me.state('hidden', false);
            var trackElement = slider.inner('track');
            var thumbElement = slider.inner('thumb');
            var trackSize = trackElement[props.innerSize]();
            var thumbSize = trackSize * ratio;
            var minThumbSize = me.option(props.minSize);
            if (thumbSize < minThumbSize) {
                thumbSize = minThumbSize;
            }
            thumbElement[props.outerSize](Math.round(thumbSize));
            me.inner('ratio', getRaito(contentSize, trackSize));
        } else {
            me.state('hidden', true);
        }
        slider.refresh();
    };
    proto.dispose = function () {
        lifeUtil.dispose(this);
        this.inner('slider').dispose();
    };
    lifeUtil.extend(proto);
    ScrollBar.propertyUpdater = {
        value: function (value) {
            this.inner('slider').set('value', value);
        }
    };
    ScrollBar.stateUpdater = {
        hidden: function (hidden) {
            this.execute(hidden ? 'hideAnimation' : 'showAnimation', { mainElement: this.inner('main') });
        }
    };
    ScrollBar.stateValidator = {
        hidden: function (hidden) {
            if ($.type(hidden) !== 'boolean') {
                hidden = isHidden(this.inner('main'));
            }
            return hidden;
        }
    };
    return ScrollBar;
});
define('cc/ui/Slider', [
    'require',
    'exports',
    'module',
    '../function/plus',
    '../function/minus',
    '../function/divide',
    '../function/multiply',
    '../function/toNumber',
    '../function/restrain',
    '../function/contains',
    '../function/eventOffset',
    '../helper/Wheel',
    '../helper/Draggable',
    '../util/life',
    '../util/touch',
    '../util/orientation',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var plus = require('../function/plus');
    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var multiply = require('../function/multiply');
    var toNumber = require('../function/toNumber');
    var restrain = require('../function/restrain');
    var contains = require('../function/contains');
    var eventOffset = require('../function/eventOffset');
    var Wheel = require('../helper/Wheel');
    var Draggable = require('../helper/Draggable');
    var lifeUtil = require('../util/life');
    var touchUtil = require('../util/touch');
    var orientationUtil = require('../util/orientation');
    var document = require('../util/instance').document;
    function Slider(options) {
        lifeUtil.init(this, options);
    }
    var proto = Slider.prototype;
    proto.type = 'Slider';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var thumbElement = mainElement.find(me.option('thumbSelector'));
        var trackSelector = me.option('trackSelector');
        var trackElement = trackSelector ? mainElement.find(trackSelector) : mainElement;
        var barSelector = me.option('barSelector');
        var barElement;
        if (barSelector) {
            barElement = mainElement.find(barSelector);
        }
        var props = orientationUtil[me.option('orientation')];
        var reverse = me.option('reverse');
        var setPixel = function (pixel, action) {
            if ($.type(pixel) !== 'number') {
                pixel = toNumber(pixel, 0, 'float');
            }
            if (reverse) {
                pixel = me.inner('maxPixel') - pixel;
            }
            setValue(me.pixelToValue(pixel), action);
        };
        var setValue = function (value, action) {
            var options = { action: action };
            me.set('value', value, options);
        };
        var namespace = me.namespace();
        var drager = new Draggable({
            mainElement: thumbElement,
            containerElement: trackElement,
            containerDraggingClass: me.option('draggingClass'),
            axis: props.axis,
            context: me,
            bind: function (options) {
                $.each(touchUtil, function (type, item) {
                    if (!item.support) {
                        return;
                    }
                    thumbElement.on(item.down + namespace, function (e) {
                        if (!options.downHandler(e)) {
                            return;
                        }
                        document.off(namespace).on(item.move + namespace, options.moveHandler).on(item.up + namespace, function (e) {
                            options.upHandler(e);
                            document.off(namespace);
                        });
                    });
                });
            },
            dragAnimation: function (options) {
                setPixel(options.mainStyle[props.position], 'drag');
            }
        });
        trackElement.on('click' + namespace, function (e) {
            if (contains(thumbElement, e.target)) {
                return;
            }
            setPixel(eventOffset(e)[props.axis] - me.inner('thumbSize') / 2, 'click');
        });
        var scrollStep = me.option('scrollStep');
        var scrollStepType = me.option('scrollStepType');
        var scrollStepIsFunction = $.isFunction(scrollStep);
        var wheels;
        if (scrollStepIsFunction || scrollStep > 0) {
            wheels = [];
            var wheelHandler = function (e, data) {
                var delta = data.delta;
                var offset = scrollStepIsFunction ? scrollStep(delta) : delta * scrollStep;
                if (!offset) {
                    return;
                }
                if (reverse) {
                    offset *= -1;
                }
                var action = 'scroll';
                var value = me.get('value');
                if (scrollStepType === 'value') {
                    setValue(value + offset, action);
                } else {
                    setPixel(me.valueToPixel(value) + offset, action);
                }
            };
            wheels.push(new Wheel({
                watchElement: trackElement,
                onwheel: wheelHandler
            }));
            var scrollElement = me.option('scrollElement');
            if (scrollElement) {
                wheels.push(new Wheel({
                    watchElement: scrollElement,
                    onwheel: wheelHandler
                }));
            }
        }
        me.inner({
            main: mainElement,
            track: trackElement,
            thumb: thumbElement,
            bar: barElement,
            drager: drager,
            wheels: wheels
        });
        me.refresh();
        var value = me.option('value');
        if ($.type(value) === 'number') {
            setValue(value);
        } else {
            setPixel(thumbElement.css(props.position));
        }
    };
    proto.refresh = function () {
        var me = this;
        var props = orientationUtil[me.option('orientation')];
        var trackElement = me.inner('track');
        var thumbElement = me.inner('thumb');
        var thumbSize = thumbElement[props.outerSize](true);
        var maxPixel = trackElement[props.innerSize]() - thumbSize;
        var pixelToValue;
        var valueToPixel;
        var minValue = me.option('minValue');
        var maxValue = me.option('maxValue');
        var step = me.option('step');
        if ($.type(step) === 'number') {
            var stepPixel = divide(maxPixel, divide(minus(maxValue, minValue), step));
            pixelToValue = function (pixel) {
                return plus(minValue, Math.round(divide(pixel, stepPixel)));
            };
            valueToPixel = function (value) {
                return multiply(minus(value, minValue), stepPixel);
            };
        } else {
            pixelToValue = function (pixel) {
                return plus(minValue, multiply(minus(maxValue, minValue), divide(pixel, maxPixel)));
            };
            valueToPixel = function (value) {
                return multiply(minus(value, minValue), divide(maxPixel, minus(maxValue, minValue)));
            };
        }
        me.inner({
            thumbSize: thumbSize,
            maxPixel: maxPixel
        });
        me.pixelToValue = pixelToValue;
        me.valueToPixel = valueToPixel;
        var value = me.get('value');
        if ($.type(value) === 'number') {
            me.set('value', value, { force: true });
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        var namespace = me.namespace();
        document.off(namespace);
        me.inner('thumb').off(namespace);
        me.inner('track').off(namespace);
        me.inner('drager').dispose();
        var wheels = me.inner('wheels');
        if (wheels) {
            $.each(wheels, function (index, wheel) {
                wheel.dispose();
            });
        }
    };
    lifeUtil.extend(proto);
    Slider.propertyUpdater = {
        value: function (newValue, oldValue, changes) {
            var me = this;
            var props = orientationUtil[me.option('orientation')];
            var thumbElement = me.inner('thumb');
            var thumbSize = me.inner('thumbSize');
            var pixel = me.valueToPixel(newValue);
            var barStyle;
            var barElement = me.inner('bar');
            if (barElement) {
                barStyle = {};
                barStyle[props.size] = pixel + thumbSize / 2;
            }
            if (me.option('reverse')) {
                pixel = me.inner('maxPixel') - pixel - thumbSize;
            }
            var thumbStyle = {};
            thumbStyle[props.position] = pixel;
            var options = {
                thumbElement: thumbElement,
                thumbStyle: thumbStyle
            };
            if (barStyle) {
                options.barStyle = barStyle;
                options.barElement = barElement;
            }
            var change = changes.value;
            if (change.action) {
                options.action = change.action;
            }
            me.execute('slideAnimation', options);
        }
    };
    Slider.propertyValidator = {
        value: function (value) {
            var minValue = this.option('minValue');
            var maxValue = this.option('maxValue');
            value = toNumber(value, minValue);
            return restrain(value, minValue, maxValue);
        },
        minValue: function (minValue) {
            minValue = toNumber(minValue, null);
            if (minValue == null) {
                this.error('minValue must be a number.');
            }
            return minValue;
        },
        maxValue: function (maxValue) {
            maxValue = toNumber(maxValue, null);
            if (maxValue == null) {
                this.error('maxValue must be a number.');
            }
            return maxValue;
        }
    };
    return Slider;
});
define('cc/ui/SpinBox', [
    'require',
    'exports',
    'module',
    '../function/minus',
    '../function/divide',
    '../function/toNumber',
    '../helper/DOMIterator',
    '../util/life',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var minus = require('../function/minus');
    var divide = require('../function/divide');
    var toNumber = require('../function/toNumber');
    var Iterator = require('../helper/DOMIterator');
    var lifeUtil = require('../util/life');
    var document = require('../util/instance').document;
    function SpinBox(options) {
        lifeUtil.init(this, options);
    }
    var proto = SpinBox.prototype;
    proto.type = 'SpinBox';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var step = toNumber(me.option('step'), null);
        if (step == null) {
            me.error('step must be a number.');
        }
        var mainElement = me.option('mainElement');
        var inputElement = mainElement.find(me.option('inputSelector'));
        var iterator = new Iterator({
            watchElement: inputElement,
            index: me.option('value'),
            minIndex: me.option('minValue'),
            maxIndex: me.option('maxValue'),
            interval: me.option('interval'),
            step: step,
            prevKey: 'down',
            nextKey: 'up',
            propertyChange: {
                index: function (index) {
                    me.set('value', index);
                },
                minIndex: function (minIndex) {
                    me.set('minValue', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxValue', maxIndex);
                }
            }
        });
        var namespace = me.namespace();
        var upSelector = me.option('upSelector');
        var downSelector = me.option('downSelector');
        var mousedownType = 'mousedown' + namespace;
        var mouseupType = 'mouseup' + namespace;
        var blueType = 'focusout' + namespace;
        var mouseupHandler = function () {
            iterator.pause();
            document.off(namespace);
        };
        mainElement.on(mousedownType, upSelector, function () {
            iterator.next();
            iterator.start(false);
            document.on(mouseupType, mouseupHandler);
        }).on(mousedownType, downSelector, function () {
            iterator.prev();
            iterator.start(true);
            document.on(mouseupType, mouseupHandler);
        }).on(blueType, function () {
            var value = $.trim(inputElement.val());
            me.set('value', value);
        });
        me.inner({
            main: mainElement,
            input: inputElement,
            iterator: iterator
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('iterator').dispose();
        var namespace = me.namespace();
        document.off(namespace);
        me.inner('main').off(namespace);
    };
    lifeUtil.extend(proto);
    SpinBox.propertyUpdater = {
        value: function (value) {
            this.inner('input').val(value);
            this.inner('iterator').set('index', value);
        },
        minValue: function (minValue) {
            this.inner('iterator').set('minIndex', minValue);
        },
        maxValue: function (maxValue) {
            this.inner('iterator').set('maxIndex', maxValue);
        }
    };
    SpinBox.propertyValidator = {
        value: function (value, options) {
            var rawValue = value;
            var valid = false;
            var me = this;
            var minValue = me.get('minValue');
            var maxValue = me.get('maxValue');
            value = toNumber(value, '');
            if (value >= minValue && value <= maxValue) {
                var step = me.option('step');
                if (minus(value, minValue) % step === 0) {
                    valid = true;
                }
            }
            if (!valid) {
                var defaultValue = me.option('defaultValue');
                if (defaultValue != null) {
                    value = defaultValue;
                    options.force = true;
                } else {
                    value = rawValue;
                }
            }
            return value;
        },
        minValue: function (minValue) {
            var minValue = toNumber(minValue, null);
            if (minValue == null) {
                this.error('minValue must be a number.');
            }
            return minValue;
        },
        maxValue: function (maxValue) {
            var maxValue = toNumber(maxValue, null);
            if (maxValue == null) {
                this.error('maxValue must be a number.');
            }
            return maxValue;
        }
    };
    return SpinBox;
});
define('cc/ui/Tab', [
    'require',
    'exports',
    'module',
    '../util/life',
    '../helper/Switchable'
], function (require, exports, module) {
    'use strict';
    var lifeUtil = require('../util/life');
    var Switchable = require('../helper/Switchable');
    function Tab(options) {
        lifeUtil.init(this, options);
    }
    var proto = Tab.prototype;
    proto.type = 'Tab';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var navSelector = me.option('navSelector');
        var navActiveClass = me.option('navActiveClass');
        var switcher = new Switchable({
            mainElement: mainElement,
            index: me.option('index'),
            switchTrigger: me.option('navTrigger'),
            switchDelay: me.option('navDelay'),
            itemSelector: navSelector,
            itemActiveClass: navActiveClass,
            propertyChange: {
                index: function (toIndex, fromIndex) {
                    me.set('index', toIndex);
                    me.execute('navAnimation', {
                        mainElement: mainElement,
                        navSelector: navSelector,
                        navActiveClass: navActiveClass,
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });
                    me.execute('contentAnimation', {
                        mainElement: mainElement,
                        contentSelector: me.option('contentSelector'),
                        contentActiveClass: me.option('contentActiveClass'),
                        fromIndex: fromIndex,
                        toIndex: toIndex
                    });
                }
            }
        });
        me.inner({
            main: mainElement,
            switcher: switcher
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('switcher').dispose();
    };
    lifeUtil.extend(proto);
    Tab.propertyUpdater = {
        index: function (toIndex) {
            this.inner('switcher').set('index', toIndex);
        }
    };
    return Tab;
});
define('cc/ui/Tooltip', [
    'require',
    'exports',
    'module',
    '../function/split',
    '../util/position',
    '../function/toNumber',
    '../function/isHidden',
    '../function/debounce',
    '../function/pageWidth',
    '../function/pageHeight',
    '../function/offsetParent',
    '../helper/Popup',
    '../util/life',
    '../util/instance'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    var position = require('../util/position');
    var toNumber = require('../function/toNumber');
    var isHidden = require('../function/isHidden');
    var debounce = require('../function/debounce');
    var pageWidth = require('../function/pageWidth');
    var pageHeight = require('../function/pageHeight');
    var offsetParent = require('../function/offsetParent');
    var Popup = require('../helper/Popup');
    var lifeUtil = require('../util/life');
    var window = require('../util/instance').window;
    function Tooltip(options) {
        lifeUtil.init(this, options);
    }
    var proto = Tooltip.prototype;
    proto.type = 'Tooltip';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var triggerElement = me.option('triggerElement');
        var mainElement = me.option('mainElement');
        var popup = new Popup({
            layerElement: mainElement,
            triggerElement: triggerElement,
            triggerSelector: me.option('triggerSelector'),
            showLayerTrigger: me.option('showTrigger'),
            showLayerDelay: me.option('showDelay'),
            hideLayerTrigger: me.option('hideTrigger'),
            hideLayerDelay: me.option('hideDelay'),
            showLayerAnimation: function () {
                me.execute('showAnimation', { mainElement: mainElement });
            },
            hideLayerAnimation: function () {
                me.execute('hideAnimation', { mainElement: mainElement });
            }
        });
        var namespace = me.namespace();
        var dispatchEvent = function (e, type, data) {
            if (data && data.event) {
                e.type = type;
                me.emit(e, data);
            }
        };
        popup.before('open', function (e, data) {
            var event = data && data.event;
            if (!event) {
                return;
            }
            var currentTarget = event.currentTarget;
            var triggerElement;
            var skinAttribute = me.option('skinAttribute');
            if (skinAttribute) {
                var skinClass;
                triggerElement = mainElement[TRIGGER_ELEMENT_KEY];
                if (triggerElement) {
                    skinClass = triggerElement.attr(skinAttribute);
                    if (skinClass) {
                        mainElement.removeClass(skinClass);
                    }
                }
                triggerElement = mainElement[TRIGGER_ELEMENT_KEY] = $(currentTarget);
                skinClass = triggerElement.attr(skinAttribute);
                if (skinClass) {
                    mainElement.addClass(skinClass);
                }
            }
            var placement;
            var placementAttribute = me.option('placementAttribute');
            if (placementAttribute) {
                placement = triggerElement.attr(placementAttribute);
            }
            if (!placement) {
                placement = me.option('placement');
            }
            var placementList = getPlacementList(placement);
            placement = null;
            if (placementList.length > 0) {
                if (placementList.length === 1) {
                    placement = placementList[0];
                } else {
                    $.each(placementList, function (index, name) {
                        var tests = placementMap[name].test;
                        for (var i = 0, len = tests.length; i < len; i++) {
                            if (!tests[i].call(me)) {
                                return;
                            }
                        }
                        placement = name;
                        return false;
                    });
                }
            }
            if (!placement) {
                return false;
            }
            var updateTooltip = function () {
                dispatchEvent(e, 'beforeshow', data);
                if (e.isDefaultPrevented()) {
                    return;
                }
                var maxWidth;
                var maxWidthAttribute = me.option('maxWidthAttribute');
                if (maxWidthAttribute) {
                    maxWidth = triggerElement.attr(maxWidthAttribute);
                }
                if (!maxWidth) {
                    maxWidth = me.option('maxWidth');
                }
                if (maxWidth) {
                    mainElement.css('max-width', maxWidth);
                }
                me.pin(placement);
                window.on('resize' + namespace, debounce(function () {
                    if (me.$) {
                        me.pin(placement);
                    }
                }, 50));
            };
            var promise = me.execute('update', {
                mainElement: mainElement,
                triggerElement: triggerElement
            });
            if (promise && $.isFunction(promise.then)) {
                promise.then(updateTooltip);
            } else {
                updateTooltip();
            }
        }).after('open', function (e, data) {
            dispatchEvent(e, 'aftershow', data);
        }).before('hide', function (e, data) {
            dispatchEvent(e, 'beforehide', data);
        }).after('close', function (e, data) {
            window.off(namespace);
            dispatchEvent(e, 'afterhide', data);
        });
        me.inner({
            main: mainElement,
            popup: popup
        });
    };
    proto.show = function () {
        this.state('hidden', false);
    };
    proto._show = function () {
        if (!this.is('hidden')) {
            return false;
        }
    };
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto._hide = function () {
        if (this.is('hidden')) {
            return false;
        }
    };
    proto.pin = function (placement) {
        var me = this;
        var mainElement = me.inner('main');
        var placementClass = mainElement.data(PLACEMENT_CLASS_KEY);
        if (placementClass) {
            mainElement.removeClass(placementClass).removeData(PLACEMENT_CLASS_KEY);
        }
        placementClass = me.option(placement + 'Class');
        if (placementClass) {
            mainElement.addClass(placementClass).data(PLACEMENT_CLASS_KEY, placementClass);
        }
        var options = {
            element: mainElement,
            attachment: mainElement[TRIGGER_ELEMENT_KEY],
            offsetX: toNumber(me.option('gapX'), 0),
            offsetY: toNumber(me.option('gapY'), 0)
        };
        var target = placementMap[placement];
        if ($.isFunction(target.gap)) {
            target.gap(options);
        }
        var offset = placement + 'Offset';
        options.offsetX += toNumber(me.option(offset + 'X'), 0);
        options.offsetY += toNumber(me.option(offset + 'Y'), 0);
        position[target.name](options);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('popup').dispose();
        window.off(me.namespace());
    };
    lifeUtil.extend(proto);
    Tooltip.stateUpdater = {
        hidden: function (hidden) {
            var popup = this.inner('popup');
            if (hidden) {
                popup.close();
            } else {
                popup.open();
            }
        }
    };
    function testLeft() {
        var mainElement = this.inner('main');
        var triggerElement = mainElement[TRIGGER_ELEMENT_KEY];
        return triggerElement.offset().left > mainElement.outerWidth();
    }
    function testRight() {
        var mainElement = this.inner('main');
        var triggerElement = mainElement[TRIGGER_ELEMENT_KEY];
        return pageWidth() > triggerElement.offset().left + triggerElement.outerWidth() + mainElement.outerWidth();
    }
    function testTop() {
        var mainElement = this.inner('main');
        var triggerElement = mainElement[TRIGGER_ELEMENT_KEY];
        return triggerElement.offset().top > mainElement.outerHeight();
    }
    function testBottom() {
        var mainElement = this.inner('main');
        var triggerElement = mainElement[TRIGGER_ELEMENT_KEY];
        return pageHeight() > triggerElement.offset().top + triggerElement.outerHeight() + mainElement.outerHeight();
    }
    var placementMap = {
        bottom: {
            name: 'bottomCenter',
            test: [testBottom],
            gap: function (options) {
                options.offsetX = 0;
            }
        },
        top: {
            name: 'topCenter',
            test: [testTop],
            gap: function (options) {
                options.offsetY *= -1;
                options.offsetX = 0;
            }
        },
        right: {
            name: 'middleRight',
            test: [testRight],
            gap: function (options) {
                options.offsetY = 0;
            }
        },
        left: {
            name: 'middleLeft',
            test: [testLeft],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        },
        bottomLeft: {
            name: 'bottomLeft',
            test: [
                testBottom,
                testLeft
            ],
            gap: function (options) {
                options.offsetX *= -1;
            }
        },
        bottomRight: {
            name: 'bottomRight',
            test: [
                testBottom,
                testRight
            ]
        },
        topLeft: {
            name: 'topLeft',
            test: [
                testTop,
                testLeft
            ],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY *= -1;
            }
        },
        topRight: {
            name: 'topRight',
            test: [
                testTop,
                testRight
            ],
            gap: function (options) {
                options.offsetY *= -1;
            }
        }
    };
    var PLACEMENT_CLASS_KEY = '__placement_class__';
    var TRIGGER_ELEMENT_KEY = '__trigger_element__';
    function getPlacementList(placement) {
        var result = [];
        $.each(split(placement, ','), function (index, name) {
            if (placementMap[name]) {
                result.push(name);
            } else {
                $.each(placementMap, function (name, value) {
                    if ($.inArray(name, result) < 0) {
                        result.push(name);
                    }
                });
                return false;
            }
        });
        return result;
    }
    return Tooltip;
});
define('cc/ui/Tree', [
    'require',
    'exports',
    'module',
    '../function/toString',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var toString = require('../function/toString');
    var lifeUtil = require('../util/life');
    function Tree(options) {
        lifeUtil.init(this, options);
    }
    var proto = Tree.prototype;
    proto.type = 'Tree';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var clickType = 'click' + me.namespace();
        var labelSelector = me.option('labelSelector');
        if (labelSelector) {
            mainElement.on(clickType, labelSelector, function (e) {
                var nodeElement = findNodeElement(me, $(this));
                me.select(nodeElement.data('id'));
            });
        }
        var toggleSelector = me.option('toggleSelector');
        var nodeSelector = me.option('nodeSelector');
        if (toggleSelector) {
            var expandedClass = me.option('expandedClass');
            mainElement.on(clickType, toggleSelector, function (e) {
                var nodeElement = findNodeElement(me, $(this));
                if (nodeElement) {
                    var id = nodeElement.data('id');
                    if (nodeElement.hasClass(expandedClass)) {
                        me.collapse(id);
                    } else {
                        me.expand(id);
                    }
                }
            });
        }
        me.inner({ main: mainElement });
        me.set({
            data: me.option('data'),
            value: me.option('value')
        });
    };
    proto.render = function (id) {
        var me = this;
        var html = '';
        me.walk({
            leave: function (node, cache) {
                var childrenView = '';
                if (node.children) {
                    $.each(node.children, function (index, node) {
                        childrenView += cache[node.id].view;
                    });
                }
                var nodeCache = cache[node.id];
                nodeCache.view = me.execute('render', [
                    {
                        node: node,
                        cache: nodeCache,
                        childrenView: childrenView
                    },
                    me.option('nodeTemplate')
                ]);
                if (id == null) {
                    if (!nodeCache.level) {
                        html += nodeCache.view;
                    }
                } else if (id == node.id) {
                    html += nodeCache.view;
                    return false;
                }
            }
        });
        if (id == null) {
            me.inner('main').html(html);
        } else {
            var nodeElement = findNodeElement(me, id);
            if (nodeElement) {
                nodeElement.replaceWith(html);
            }
        }
    };
    proto.load = function (id) {
        var me = this;
        var deferred = $.Deferred();
        var target;
        me.walk({
            enter: function (node, cache) {
                if (node.id == id) {
                    target = node;
                    return false;
                }
            }
        });
        if (target) {
            me.execute('load', [
                target,
                function (error, data) {
                    if (error) {
                        deferred.reject(error);
                    } else {
                        deferred.resolve(data);
                    }
                }
            ]);
        } else {
            deferred.reject('node[' + id + '] is not found.');
        }
        return deferred;
    };
    proto.walk = function (data, options) {
        var me = this;
        if (arguments.length === 1) {
            options = data;
            data = me.get('data');
        }
        if (!$.isArray(data)) {
            data = [data];
        }
        var enter = options.enter || $.noop;
        var leave = options.leave || $.noop;
        var cache = {};
        $.each(data, function (index, node) {
            walkTree(node, null, function (node, parent) {
                var level = parent ? cache[parent.id].level + 1 : 0;
                cache[node.id] = {
                    level: level,
                    parent: parent
                };
                return enter(node, cache);
            }, function (node, parent) {
                return leave(node, cache);
            });
        });
    };
    proto.grep = function (id) {
        var result;
        this.walk({
            enter: function (node) {
                if (node.id == id) {
                    result = node;
                    return false;
                }
            }
        });
        return result;
    };
    proto.select = function (id) {
        this.set('value', id);
    };
    proto.unselect = function (id) {
        this.set('value', '');
    };
    proto.expand = function (id) {
        var me = this;
        me.grep(id).expanded = true;
        findNodeElement(me, id).removeClass(me.option('collapsedClass')).addClass(me.option('expandedClass'));
    };
    proto.collapse = function (id) {
        var me = this;
        me.grep(id).expanded = false;
        findNodeElement(me, id).removeClass(me.option('expandedClass')).addClass(me.option('collapsedClass'));
    };
    proto._select = proto._expand = proto._collapse = function (id) {
        var me = this;
        var nodeData = me.grep(id);
        if (nodeData && findNodeElement(me, id)) {
            return { node: nodeData };
        } else {
            return false;
        }
    };
    proto._render = function (id) {
        if (id != null) {
            var me = this;
            var nodeData = me.grep(id);
            if (nodeData && findNodeElement(me, id)) {
                return { node: nodeData };
            } else {
                return false;
            }
        }
    };
    proto.select_ = proto.expand_ = proto.collapse_ = function (id) {
        return { node: this.grep(id) };
    };
    proto.render_ = function (id) {
        if (id != null) {
            return { node: this.grep(id) };
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
    Tree.propertyUpdater = {
        data: function () {
            this.render();
        },
        value: function (newValue, oldValue) {
            var me = this;
            var activeClass = me.option('activeClass');
            if (!activeClass) {
                return;
            }
            var nodeData;
            var nodeElement;
            if (oldValue) {
                nodeData = me.grep(oldValue);
                nodeElement = findNodeElement(me, oldValue);
                if (nodeData && nodeElement) {
                    nodeData.active = false;
                    nodeElement.removeClass(activeClass);
                }
            }
            if (newValue) {
                nodeData = me.grep(newValue);
                nodeElement = findNodeElement(me, newValue);
                if (nodeData && nodeElement) {
                    nodeData.active = true;
                    nodeElement.addClass(activeClass);
                }
            }
        }
    };
    Tree.propertyValidator = {
        data: function (data) {
            return $.isArray(data) ? data : [];
        },
        value: function (value) {
            return toString(value);
        }
    };
    function findNodeElement(instance, id) {
        var mainElement = instance.inner('main');
        var nodeSelector = instance.option('nodeSelector');
        var nodeElement = id.jquery ? id : mainElement.find('[data-id="' + id + '"]');
        if (nodeElement.length === 1) {
            nodeElement = nodeElement.closest(nodeSelector);
            if (nodeElement.length === 1) {
                return nodeElement;
            }
        }
    }
    function walkTree(node, parent, enter, leave) {
        var status = enter(node, parent);
        if (status !== false) {
            if ($.isArray(node.children)) {
                $.each(node.children, function (index, child) {
                    return status = walkTree(child, node, enter, leave);
                });
            }
            if (status !== false) {
                status = leave(node, parent);
            }
        }
        return status;
    }
    return Tree;
});
define('cc/ui/Uploader', [
    'require',
    'exports',
    'module',
    '../helper/AjaxUploader',
    '../helper/FlashUploader'
], function (require, exports, module) {
    'use strict';
    function supportFileAPI() {
        return 'files' in $('<input type="file" />')[0];
    }
    function supportAjaxUploadProgressEvents() {
        if (!XMLHttpRequest) {
            return false;
        }
        var xhr = new XMLHttpRequest();
        return 'upload' in xhr && 'onprogress' in xhr.upload;
    }
    return supportFileAPI() && supportAjaxUploadProgressEvents() ? require('../helper/AjaxUploader') : require('../helper/FlashUploader');
});
define('cc/ui/Zoom', [
    'require',
    'exports',
    'module',
    '../function/imageDimension',
    '../helper/Draggable',
    '../util/instance',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var imageDimension = require('../function/imageDimension');
    var Draggable = require('../helper/Draggable');
    var document = require('../util/instance').document;
    var lifeUtil = require('../util/life');
    function Zoom(options) {
        lifeUtil.init(this, options);
    }
    var proto = Zoom.prototype;
    proto.type = 'Zoom';
    proto.init = function () {
        var me = this;
        var thumbnailElement = me.option('thumbnailElement');
        if (!thumbnailElement.is('img')) {
            me.error('thumbnailElement must be a <img />.');
        }
        var viewportElement = me.option('viewportElement');
        var finderElement = me.option('finderElement');
        var thumbnailWidth = thumbnailElement.prop('width');
        var thumbnailHeight = thumbnailElement.prop('height');
        var finderWidth = finderElement.outerWidth();
        ;
        var finderHeight = finderElement.outerHeight();
        var scaleX;
        var scaleY;
        var thumbnailOffset;
        var scaledImageReady = function () {
            var imageUrl = me.option('imageUrl');
            imageDimension(imageUrl, function (rawWidth, rawHeight) {
                scaleX = thumbnailWidth / rawWidth;
                scaleY = thumbnailHeight / rawHeight;
                viewportElement.css({
                    width: finderWidth / scaleX,
                    height: finderHeight / scaleY,
                    background: 'url(' + imageUrl + ') no-repeat'
                });
            });
        };
        var namespace = me.namespace();
        if (!thumbnailWidth && !thumbnailHeight) {
            thumbnailElement.one('load' + namespace, function () {
                thumbnailWidth = this.width;
                thumbnailHeight = this.height;
                scaledImageReady();
            });
        } else {
            scaledImageReady();
        }
        var dragger = new Draggable({
            mainElement: finderElement,
            containerElement: thumbnailElement,
            dragAnimation: function (options) {
                finderElement.css(options.mainStyle);
            },
            bind: function (options) {
                var enterType = 'mouseenter' + namespace;
                var leaveType = 'mouseleave' + namespace;
                var delayTimer;
                var clearTimer = function (e) {
                    if (delayTimer) {
                        clearTimeout(delayTimer);
                        delayTimer = null;
                    }
                };
                var leaveHandler = function (e) {
                    delayTimer = setTimeout(function () {
                        delayTimer = null;
                        options.upHandler(e);
                        document.off(namespace);
                    }, 50);
                };
                thumbnailElement.on(enterType, function (e) {
                    if (delayTimer) {
                        clearTimer();
                        return;
                    }
                    var offset = {
                        x: finderWidth / 2,
                        y: finderHeight / 2
                    };
                    if (!options.downHandler(e, offset)) {
                        return;
                    }
                    thumbnailOffset = thumbnailElement.position();
                    ;
                    document.off(namespace).on('mousemove' + namespace, options.moveHandler);
                }).on(leaveType, leaveHandler);
                finderElement.on(enterType, clearTimer).on(leaveType, leaveHandler);
            },
            onbeforedrag: function () {
                me.execute('showFinderAnimation', { finderElement: finderElement });
                me.execute('showViewportAnimation', { viewportElement: viewportElement });
            },
            onafterdrag: function () {
                me.execute('hideFinderAnimation', { finderElement: finderElement });
                me.execute('hideViewportAnimation', { viewportElement: viewportElement });
            },
            ondrag: function (e, data) {
                var left = (data.left - thumbnailOffset.left) / scaleX;
                var top = (data.top - thumbnailOffset.top) / scaleY;
                viewportElement.css({ 'background-position': '-' + left + 'px -' + top + 'px' });
            }
        });
        me.inner({ dragger: dragger });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('dragger').dispose();
        var namespace = me.namespace();
        document.off(namespace);
        me.option('thumbnailElement').off(namespace);
        me.option('finderElement').off(namespace);
    };
    lifeUtil.extend(proto);
    return Zoom;
});
define('cc/util/FiniteArray', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    function FiniteArray(options) {
        $.extend(this, FiniteArray.defaultOptions, options);
        this.init();
    }
    var proto = FiniteArray.prototype;
    proto.init = function () {
        this.list = [];
    };
    proto.push = function (item) {
        var me = this;
        var list = me.list;
        if (me.isFull()) {
            if (me.validate(item, list[0])) {
                list.shift();
            }
        }
        if (list.length < me.max) {
            list.push(item);
        }
    };
    proto.get = function (index) {
        return this.list[index];
    };
    proto.first = function () {
        return this.get(0);
    };
    proto.last = function () {
        return this.get(this.list.length - 1);
    };
    proto.isFull = function () {
        return this.list.length === this.max;
    };
    proto.each = function (fn) {
        $.each(this.list, function (index, item) {
            return fn(item, index);
        });
    };
    proto.size = function () {
        return this.list.length;
    };
    proto.clear = function () {
        this.list.length = 0;
    };
    FiniteArray.defaultOptions = {
        validate: function () {
            return true;
        }
    };
    return FiniteArray;
});
define('cc/util/Message', [
    'require',
    'exports',
    'module',
    '../function/guid',
    './url',
    './timer'
], function (require, exports, module) {
    'use strict';
    var guid = require('../function/guid');
    var urlUtil = require('./url');
    var timer = require('./timer');
    function Message(options) {
        $.extend(this, Message.defaultOptions, options);
        this.init();
    }
    var proto = Message.prototype;
    proto.type = 'Message';
    proto.init = function () {
        var me = this;
        me.id = guid();
        me.origin = urlUtil.getOrigin(me.agentUrl);
        me.timer = timer(function () {
            me.send(me.reader() || {});
        }, me.interval, me.interval);
        me.timer.start();
    };
    proto.send = $.isFunction(window.postMessage) && 'onmessage' in window ? function (data) {
        window.top.postMessage(data, this.origin);
    } : function (data) {
        var me = this;
        var iframe = $('#' + me.id);
        if (iframe.length === 0) {
            iframe = $('<iframe id="' + me.id + '"></iframe>');
            iframe.hide().appendTo('body');
        }
        iframe.prop('src', me.agentUrl + '#' + $.param(data));
    };
    proto.dispose = function () {
        var me = this;
        me.timer.stop();
        me.timer = null;
    };
    Message.defaultOptions = { interval: 100 };
    return Message;
});
define('cc/util/Queue', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    function Queue(options) {
        $.extend(this, options);
        this.init();
    }
    var proto = Queue.prototype;
    proto.init = function () {
        this.list = [];
    };
    proto.add = function (item) {
        var me = this;
        me.list.push(item);
        if (!$.isFunction(me.waiting)) {
            me.remove();
        }
    };
    proto.remove = function () {
        var me = this;
        var item = me.list.shift();
        if (item) {
            var waiting = me.waiting = function () {
                me.waiting = null;
                if (me.list) {
                    me.remove();
                }
            };
            me.process(item, waiting);
        }
    };
    proto.size = function () {
        return this.list.length;
    };
    proto.dispose = function () {
        var me = this;
        me.list = me.waiting = null;
    };
    return Queue;
});
define('cc/util/Range', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var isOldIE = !window.getSelection;
    function Range(element) {
        this.element = element;
    }
    var proto = Range.prototype;
    proto.getRange = isOldIE ? getIERange : getRange;
    proto.setRange = isOldIE ? setIERange : setRange;
    proto.getText = function () {
        var value = this.element.value;
        var range = this.getRange();
        return value.substring(range.start, range.end);
    };
    proto.setText = function (text) {
        var element = this.element;
        var value = element.value;
        var range = this.getRange();
        element.value = value.substring(0, range.start) + text + value.substr(range.end);
    };
    proto.dispose = function () {
        this.element = null;
    };
    isOldIE = null;
    function getRange() {
        var element = this.element;
        return {
            start: element.selectionStart,
            end: element.selectionEnd
        };
    }
    function setRange(start, end) {
        var element = this.element;
        element.focus();
        element.setSelectionRange(start, end);
    }
    function getIERange() {
        var element = this.element;
        element.focus();
        var bookmark = document.selection.createRange().getBookmark();
        var textRange = element.createTextRange();
        textRange.moveToBookmark(bookmark);
        var clone = textRange.duplicate();
        clone.setEndPoint('StartToStart', textRange);
        var value = element.value;
        for (var i = 0; clone.moveStart('character', -1) !== 0; i++) {
            if (value.charAt(i) === '\n') {
                i++;
            }
        }
        return {
            start: i,
            end: i + textRange.text.length
        };
    }
    function setIERange(start, end) {
        var element = this.element;
        if (element.value.length < end) {
            return;
        }
        var range = element.createTextRange();
        range.collapse(true);
        range.moveStart('character', start);
        range.moveEnd('character', end - 1);
        range.select();
    }
    return Range;
});
define('cc/util/browser', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var chromeExpr = /(chrome)[ \/]([\w.]+)/;
    var firefoxExpr = /(firefox)[ \/]([\w.]+)/;
    var operaExpr = /(opera)(?:.*version)?[ \/]([\w.]+)/;
    var safariExpr = /version[ \/]([\w.]+) safari/;
    var oldIEExpr = /msie ([\w.]+)/;
    var newIEExpr = /trident[ \/]([\w.]+)/;
    function parseUA(ua) {
        var match = parseIE(ua) || chromeExpr.exec(ua) || firefoxExpr.exec(ua) || parseSafari(ua) || operaExpr.exec(ua) || [];
        var os;
        if (/Android/i.test(ua)) {
            os = 'android';
        } else if (/iPhone/i.test(ua) || /iPad/i.test(ua) || /iTouch/i.test(ua)) {
            os = 'ios';
        } else if (/Windows/i.test(ua)) {
            os = 'windows';
        } else if (/Macintosh/i.test(ua)) {
            os = 'mac';
        } else if (/Linux/i.test(ua)) {
            os = 'linux';
        }
        return {
            name: match[1] || '',
            version: match[2] || '0',
            os: os || ''
        };
    }
    function parseIE(ua) {
        var version;
        var match = oldIEExpr.exec(ua);
        if (match) {
            version = match[1];
        } else {
            match = newIEExpr.exec(ua);
            if (match) {
                version = parseInt(match[1], 10) + 4 + '.0';
            }
        }
        if (version) {
            return [
                '',
                'ie',
                version
            ];
        }
    }
    function parseSafari(ua) {
        var match = safariExpr.exec(ua);
        if (match) {
            return [
                '',
                'safari',
                match[1]
            ];
        }
    }
    var result = parseUA(navigator.userAgent.toLowerCase());
    if (result.name) {
        result[result.name] = true;
    }
    return result;
});
define('cc/util/cookie', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var HOUR_TIME = 60 * 60 * 1000;
    function parse(cookieStr) {
        if (cookieStr.indexOf('"') === 0) {
            cookieStr = cookieStr.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        var result = {};
        try {
            cookieStr = decodeURIComponent(cookieStr.replace(/\+/g, ' '));
            $.each(cookieStr.split(';'), function (index, part) {
                var pair = part.split('=');
                var key = $.trim(pair[0]);
                var value = $.trim(pair[1]);
                if (key) {
                    result[key] = value;
                }
            });
        } catch (e) {
        }
        return result;
    }
    function setCookie(key, value, options) {
        var expires = options.expires;
        if ($.isNumeric(expires)) {
            var hours = expires;
            expires = new Date();
            expires.setTime(expires.getTime() + hours * HOUR_TIME);
        }
        document.cookie = [
            encodeURIComponent(key),
            '=',
            encodeURIComponent(value),
            expires ? ';expires=' + expires.toUTCString() : '',
            options.path ? ';path=' + options.path : '',
            options.domain ? ';domain=' + options.domain : '',
            options.secure ? ';secure' : ''
        ].join('');
    }
    exports.get = function (key) {
        var result = parse(document.cookie);
        return $.type(key) === 'string' ? result[key] : result;
    };
    exports.set = function (key, value, options) {
        if ($.isPlainObject(key)) {
            options = value;
            value = null;
        }
        options = $.extend({}, exports.defaultOptions, options);
        if (value === null) {
            $.each(key, function (key, value) {
                setCookie(key, value, options);
            });
        } else {
            setCookie(key, value, options);
        }
    };
    exports.remove = function (key, options) {
        if (key == null) {
            return;
        }
        options = options || {};
        options.expires = -1;
        setCookie(key, '', $.extend({}, exports.defaultOptions, options));
    };
    exports.defaultOptions = { path: '/' };
});
define('cc/util/detection', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var customElement = document.createElement('musicode');
    var customElementStyle = customElement.style;
    var prefixs = [
        'Webkit',
        'Moz',
        'O',
        'ms'
    ];
    function testCSS(property) {
        var upperCase = property.charAt(0).toUpperCase() + property.slice(1);
        var list = (property + ' ' + prefixs.join(upperCase + ' ') + upperCase).split(' ');
        var result = false;
        $.each(list, function (index, name) {
            if (name in customElementStyle) {
                result = true;
                return false;
            }
        });
        return result;
    }
    exports.supportAnimation = function () {
        return testCSS('animationName');
    };
    exports.supportBoxShadow = function () {
        return testCSS('boxShadow');
    };
    exports.supportWebSocket = function () {
        return typeof window.WebSocket !== 'undefined';
    };
    exports.supportFlexbox = function () {
        return testCSS('flexWrap');
    };
    exports.supportTransform = function () {
        return testCSS('transform');
    };
    exports.supportFlash = function () {
        var swf;
        var plugins = navigator.plugins;
        if (plugins && plugins.length > 0) {
            swf = plugins['Shockwave Flash'];
        } else if (document.all) {
            swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        }
        return !!swf;
    };
    exports.supportCanvas = function () {
        var canvas = document.createElement('canvas');
        return canvas && canvas.getContext;
    };
    exports.supportPlaceholder = function () {
        var element = $('<input type="text" />')[0];
        return 'placeholder' in element;
    };
    exports.supportInput = function () {
        var element = $('<input type="text" />')[0];
        return 'oninput' in element;
    };
});
define('cc/util/etpl', function () {
    function extend(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    }
    function Stack() {
        this.raw = [];
        this.length = 0;
    }
    Stack.prototype = {
        push: function (elem) {
            this.raw[this.length++] = elem;
        },
        pop: function () {
            if (this.length > 0) {
                var elem = this.raw[--this.length];
                this.raw.length = this.length;
                return elem;
            }
        },
        top: function () {
            return this.raw[this.length - 1];
        },
        bottom: function () {
            return this.raw[0];
        },
        find: function (condition) {
            var index = this.length;
            while (index--) {
                var item = this.raw[index];
                if (condition(item)) {
                    return item;
                }
            }
        }
    };
    var guidIndex = 178245;
    function generateGUID() {
        return '___' + guidIndex++;
    }
    function inherits(subClass, superClass) {
        var F = new Function();
        F.prototype = superClass.prototype;
        subClass.prototype = new F();
        subClass.prototype.constructor = subClass;
    }
    var HTML_ENTITY = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;'
    };
    function htmlFilterReplacer(c) {
        return HTML_ENTITY[c];
    }
    var DEFAULT_FILTERS = {
        html: function (source) {
            return source.replace(/[&<>"']/g, htmlFilterReplacer);
        },
        url: encodeURIComponent,
        raw: function (source) {
            return source;
        }
    };
    function stringLiteralize(source) {
        return '"' + source.replace(/\x5C/g, '\\\\').replace(/"/g, '\\"').replace(/\x0A/g, '\\n').replace(/\x09/g, '\\t').replace(/\x0D/g, '\\r') + '"';
    }
    function regexpLiteral(source) {
        return source.replace(/[\^\[\]\$\(\)\{\}\?\*\.\+]/g, function (c) {
            return '\\' + c;
        });
    }
    function stringFormat(source) {
        var args = arguments;
        return source.replace(/\{([0-9]+)\}/g, function (match, index) {
            return args[index - 0 + 1];
        });
    }
    var RENDER_STRING_DECLATION = 'var r="";';
    var RENDER_STRING_ADD_START = 'r+=';
    var RENDER_STRING_ADD_END = ';';
    var RENDER_STRING_RETURN = 'return r;';
    if (typeof navigator !== 'undefined' && /msie\s*([0-9]+)/i.test(navigator.userAgent) && RegExp.$1 - 0 < 8) {
        RENDER_STRING_DECLATION = 'var r=[],ri=0;';
        RENDER_STRING_ADD_START = 'r[ri++]=';
        RENDER_STRING_RETURN = 'return r.join("");';
    }
    function toGetVariableLiteral(name) {
        name = name.replace(/^\s*\*/, '');
        return stringFormat('gv({0},["{1}"])', stringLiteralize(name), name.replace(/\[['"]?([^'"]+)['"]?\]/g, function (match, name) {
            return '.' + name;
        }).split('.').join('","'));
    }
    function parseTextBlock(source, open, close, greedy, onInBlock, onOutBlock) {
        var closeLen = close.length;
        var texts = source.split(open);
        var level = 0;
        var buf = [];
        for (var i = 0, len = texts.length; i < len; i++) {
            var text = texts[i];
            if (i) {
                var openBegin = 1;
                level++;
                while (1) {
                    var closeIndex = text.indexOf(close);
                    if (closeIndex < 0) {
                        buf.push(level > 1 && openBegin ? open : '', text);
                        break;
                    }
                    level = greedy ? level - 1 : 0;
                    buf.push(level > 0 && openBegin ? open : '', text.slice(0, closeIndex), level > 0 ? close : '');
                    text = text.slice(closeIndex + closeLen);
                    openBegin = 0;
                    if (level === 0) {
                        break;
                    }
                }
                if (level === 0) {
                    onInBlock(buf.join(''));
                    onOutBlock(text);
                    buf = [];
                }
            } else {
                text && onOutBlock(text);
            }
        }
        if (level > 0 && buf.length > 0) {
            onOutBlock(open);
            onOutBlock(buf.join(''));
        }
    }
    function compileVariable(source, engine, forText) {
        var code = [];
        var options = engine.options;
        var toStringHead = '';
        var toStringFoot = '';
        var wrapHead = '';
        var wrapFoot = '';
        var defaultFilter;
        if (forText) {
            toStringHead = 'ts(';
            toStringFoot = ')';
            wrapHead = RENDER_STRING_ADD_START;
            wrapFoot = RENDER_STRING_ADD_END;
            defaultFilter = options.defaultFilter;
        }
        parseTextBlock(source, options.variableOpen, options.variableClose, 1, function (text) {
            if (forText && text.indexOf('|') < 0 && defaultFilter) {
                text += '|' + defaultFilter;
            }
            var filterCharIndex = text.indexOf('|');
            var variableName = (filterCharIndex > 0 ? text.slice(0, filterCharIndex) : text).replace(/^\s+/, '').replace(/\s+$/, '');
            var filterSource = filterCharIndex > 0 ? text.slice(filterCharIndex + 1) : '';
            var variableRawValue = variableName.indexOf('*') === 0;
            var variableCode = [
                variableRawValue ? '' : toStringHead,
                toGetVariableLiteral(variableName),
                variableRawValue ? '' : toStringFoot
            ];
            if (filterSource) {
                filterSource = compileVariable(filterSource, engine);
                var filterSegs = filterSource.split('|');
                for (var i = 0, len = filterSegs.length; i < len; i++) {
                    var seg = filterSegs[i];
                    if (/^\s*([a-z0-9_-]+)(\((.*)\))?\s*$/i.test(seg)) {
                        variableCode.unshift('fs["' + RegExp.$1 + '"](');
                        if (RegExp.$3) {
                            variableCode.push(',', RegExp.$3);
                        }
                        variableCode.push(')');
                    }
                }
            }
            code.push(wrapHead, variableCode.join(''), wrapFoot);
        }, function (text) {
            code.push(wrapHead, forText ? stringLiteralize(text) : text, wrapFoot);
        });
        return code.join('');
    }
    function TextNode(value, engine) {
        this.value = value;
        this.engine = engine;
    }
    TextNode.prototype = {
        getRendererBody: function () {
            var value = this.value;
            var options = this.engine.options;
            if (!value || options.strip && /^\s*$/.test(value)) {
                return '';
            }
            return compileVariable(value, this.engine, 1);
        },
        clone: function () {
            return this;
        }
    };
    function Command(value, engine) {
        this.value = value;
        this.engine = engine;
        this.children = [];
        this.cloneProps = [];
    }
    Command.prototype = {
        addChild: function (node) {
            this.children.push(node);
        },
        open: function (context) {
            var parent = context.stack.top();
            parent && parent.addChild(this);
            context.stack.push(this);
        },
        close: function (context) {
            if (context.stack.top() === this) {
                context.stack.pop();
            }
        },
        getRendererBody: function () {
            var buf = [];
            var children = this.children;
            for (var i = 0; i < children.length; i++) {
                buf.push(children[i].getRendererBody());
            }
            return buf.join('');
        },
        clone: function () {
            var Clazz = this.constructor;
            var node = new Clazz(this.value, this.engine);
            for (var i = 0, l = this.children.length; i < l; i++) {
                node.addChild(this.children[i].clone());
            }
            for (var i = 0, l = this.cloneProps.length; i < l; i++) {
                var prop = this.cloneProps[i];
                node[prop] = this[prop];
            }
            return node;
        }
    };
    function autoCloseCommand(context, CommandType) {
        var stack = context.stack;
        var closeEnd = CommandType ? stack.find(function (item) {
            return item instanceof CommandType;
        }) : stack.bottom();
        if (closeEnd) {
            var node;
            while ((node = stack.top()) !== closeEnd) {
                if (!node.autoClose) {
                    throw new Error(node.type + ' must be closed manually: ' + node.value);
                }
                node.autoClose(context);
            }
            closeEnd.close(context);
        }
        return closeEnd;
    }
    var RENDERER_BODY_START = '' + 'data=data||{};' + 'var v={},fs=engine.filters,hg=typeof data.get=="function",' + 'gv=function(n,ps){' + 'var p=ps[0],d=v[p];' + 'if(d==null){' + 'if(hg){return data.get(n);}' + 'd=data[p];' + '}' + 'for(var i=1,l=ps.length;i<l;i++)if(d!=null)d = d[ps[i]];' + 'return d;' + '},' + 'ts=function(s){' + 'if(typeof s==="string"){return s;}' + 'if(s==null){s="";}' + 'return ""+s;' + '};';
    function TargetCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*(\(\s*master\s*=\s*([a-z0-9\/_-]+)\s*\))?\s*/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.master = RegExp.$3;
        this.name = RegExp.$1;
        Command.call(this, value, engine);
        this.blocks = {};
    }
    inherits(TargetCommand, Command);
    function BlockCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        Command.call(this, value, engine);
        this.cloneProps = ['name'];
    }
    inherits(BlockCommand, Command);
    function ImportCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'state',
            'blocks'
        ];
        this.blocks = {};
    }
    inherits(ImportCommand, Command);
    function VarCommand(value, engine) {
        if (!/^\s*([a-z0-9_]+)\s*=([\s\S]*)$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        this.expr = RegExp.$2;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'expr'
        ];
    }
    inherits(VarCommand, Command);
    function FilterCommand(value, engine) {
        if (!/^\s*([a-z0-9_-]+)\s*(\(([\s\S]*)\))?\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        this.args = RegExp.$3;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'args'
        ];
    }
    inherits(FilterCommand, Command);
    function UseCommand(value, engine) {
        if (!/^\s*([a-z0-9\/_-]+)\s*(\(([\s\S]*)\))?\s*$/i.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.name = RegExp.$1;
        this.args = RegExp.$3;
        Command.call(this, value, engine);
        this.cloneProps = [
            'name',
            'args'
        ];
    }
    inherits(UseCommand, Command);
    function ForCommand(value, engine) {
        var rule = new RegExp(stringFormat('^\\s*({0}[\\s\\S]+{1})\\s+as\\s+{0}([0-9a-z_]+){1}\\s*(,\\s*{0}([0-9a-z_]+){1})?\\s*$', regexpLiteral(engine.options.variableOpen), regexpLiteral(engine.options.variableClose)), 'i');
        if (!rule.test(value)) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + value);
        }
        this.list = RegExp.$1;
        this.item = RegExp.$2;
        this.index = RegExp.$4;
        Command.call(this, value, engine);
        this.cloneProps = [
            'list',
            'item',
            'index'
        ];
    }
    inherits(ForCommand, Command);
    function IfCommand(value, engine) {
        Command.call(this, value, engine);
    }
    inherits(IfCommand, Command);
    function ElifCommand(value, engine) {
        IfCommand.call(this, value, engine);
    }
    inherits(ElifCommand, IfCommand);
    function ElseCommand(value, engine) {
        Command.call(this, value, engine);
    }
    inherits(ElseCommand, IfCommand);
    var TargetState = {
        READING: 1,
        READED: 2,
        APPLIED: 3,
        READY: 4
    };
    ImportCommand.prototype.applyMaster = TargetCommand.prototype.applyMaster = function (masterName) {
        if (this.state >= TargetState.APPLIED) {
            return 1;
        }
        var blocks = this.blocks;
        function replaceBlock(node) {
            var children = node.children;
            if (children instanceof Array) {
                for (var i = 0, len = children.length; i < len; i++) {
                    var child = children[i];
                    if (child instanceof BlockCommand && blocks[child.name]) {
                        child = children[i] = blocks[child.name];
                    }
                    replaceBlock(child);
                }
            }
        }
        var master = this.engine.targets[masterName];
        if (master && master.applyMaster(master.master)) {
            this.children = master.clone().children;
            replaceBlock(this);
            this.state = TargetState.APPLIED;
            return 1;
        }
    };
    TargetCommand.prototype.isReady = function () {
        if (this.state >= TargetState.READY) {
            return 1;
        }
        var engine = this.engine;
        var readyState = 1;
        function checkReadyState(node) {
            for (var i = 0, len = node.children.length; i < len; i++) {
                var child = node.children[i];
                if (child instanceof ImportCommand) {
                    var target = engine.targets[child.name];
                    readyState = readyState && target && target.isReady(engine);
                } else if (child instanceof Command) {
                    checkReadyState(child);
                }
            }
        }
        if (this.applyMaster(this.master)) {
            checkReadyState(this);
            readyState && (this.state = TargetState.READY);
            return readyState;
        }
    };
    TargetCommand.prototype.getRenderer = function () {
        if (this.renderer) {
            return this.renderer;
        }
        if (this.isReady()) {
            var realRenderer = new Function('data', 'engine', [
                RENDERER_BODY_START,
                RENDER_STRING_DECLATION,
                this.getRendererBody(),
                RENDER_STRING_RETURN
            ].join('\n'));
            var engine = this.engine;
            this.renderer = function (data) {
                return realRenderer(data, engine);
            };
            return this.renderer;
        }
        return null;
    };
    function addTargetToContext(target, context) {
        context.target = target;
        var engine = context.engine;
        var name = target.name;
        if (engine.targets[name]) {
            switch (engine.options.namingConflict) {
            case 'override':
                engine.targets[name] = target;
                context.targets.push(name);
            case 'ignore':
                break;
            default:
                throw new Error('Target exists: ' + name);
            }
        } else {
            engine.targets[name] = target;
            context.targets.push(name);
        }
    }
    TargetCommand.prototype.open = function (context) {
        autoCloseCommand(context);
        Command.prototype.open.call(this, context);
        this.state = TargetState.READING;
        addTargetToContext(this, context);
    };
    VarCommand.prototype.open = UseCommand.prototype.open = function (context) {
        context.stack.top().addChild(this);
    };
    BlockCommand.prototype.open = function (context) {
        Command.prototype.open.call(this, context);
        context.stack.find(function (node) {
            return node.blocks;
        }).blocks[this.name] = this;
    };
    ElifCommand.prototype.open = function (context) {
        var elseCommand = new ElseCommand();
        elseCommand.open(context);
        var ifCommand = autoCloseCommand(context, IfCommand);
        ifCommand.addChild(this);
        context.stack.push(this);
    };
    ElseCommand.prototype.open = function (context) {
        var ifCommand = autoCloseCommand(context, IfCommand);
        ifCommand.addChild(this);
        context.stack.push(this);
    };
    ImportCommand.prototype.open = function (context) {
        this.parent = context.stack.top();
        this.target = context.target;
        Command.prototype.open.call(this, context);
        this.state = TargetState.READING;
    };
    UseCommand.prototype.close = VarCommand.prototype.close = function () {
    };
    ImportCommand.prototype.close = function (context) {
        Command.prototype.close.call(this, context);
        this.state = TargetState.READED;
    };
    TargetCommand.prototype.close = function (context) {
        Command.prototype.close.call(this, context);
        this.state = this.master ? TargetState.READED : TargetState.APPLIED;
        context.target = null;
    };
    ImportCommand.prototype.autoClose = function (context) {
        var parentChildren = this.parent.children;
        parentChildren.push.apply(parentChildren, this.children);
        this.children.length = 0;
        for (var key in this.blocks) {
            this.target.blocks[key] = this.blocks[key];
        }
        this.blocks = {};
        this.close(context);
    };
    UseCommand.prototype.beforeOpen = ImportCommand.prototype.beforeOpen = VarCommand.prototype.beforeOpen = ForCommand.prototype.beforeOpen = FilterCommand.prototype.beforeOpen = BlockCommand.prototype.beforeOpen = IfCommand.prototype.beforeOpen = TextNode.prototype.beforeAdd = function (context) {
        if (context.stack.bottom()) {
            return;
        }
        var target = new TargetCommand(generateGUID(), context.engine);
        target.open(context);
    };
    ImportCommand.prototype.getRendererBody = function () {
        this.applyMaster(this.name);
        return Command.prototype.getRendererBody.call(this);
    };
    UseCommand.prototype.getRendererBody = function () {
        return stringFormat('{0}engine.render({2},{{3}}){1}', RENDER_STRING_ADD_START, RENDER_STRING_ADD_END, stringLiteralize(this.name), compileVariable(this.args, this.engine).replace(/(^|,)\s*([a-z0-9_]+)\s*=/gi, function (match, start, argName) {
            return (start || '') + stringLiteralize(argName) + ':';
        }));
    };
    VarCommand.prototype.getRendererBody = function () {
        if (this.expr) {
            return stringFormat('v[{0}]={1};', stringLiteralize(this.name), compileVariable(this.expr, this.engine));
        }
        return '';
    };
    IfCommand.prototype.getRendererBody = function () {
        return stringFormat('if({0}){{1}}', compileVariable(this.value, this.engine), Command.prototype.getRendererBody.call(this));
    };
    ElseCommand.prototype.getRendererBody = function () {
        return stringFormat('}else{{0}', Command.prototype.getRendererBody.call(this));
    };
    ForCommand.prototype.getRendererBody = function () {
        return stringFormat('' + 'var {0}={1};' + 'if({0} instanceof Array)' + 'for (var {4}=0,{5}={0}.length;{4}<{5};{4}++){v[{2}]={4};v[{3}]={0}[{4}];{6}}' + 'else if(typeof {0}==="object")' + 'for(var {4} in {0}){v[{2}]={4};v[{3}]={0}[{4}];{6}}', generateGUID(), compileVariable(this.list, this.engine), stringLiteralize(this.index || generateGUID()), stringLiteralize(this.item), generateGUID(), generateGUID(), Command.prototype.getRendererBody.call(this));
    };
    FilterCommand.prototype.getRendererBody = function () {
        var args = this.args;
        return stringFormat('{2}fs[{5}]((function(){{0}{4}{1}})(){6}){3}', RENDER_STRING_DECLATION, RENDER_STRING_RETURN, RENDER_STRING_ADD_START, RENDER_STRING_ADD_END, Command.prototype.getRendererBody.call(this), stringLiteralize(this.name), args ? ',' + compileVariable(args, this.engine) : '');
    };
    var commandTypes = {};
    function addCommandType(name, Type) {
        commandTypes[name] = Type;
        Type.prototype.type = name;
    }
    addCommandType('target', TargetCommand);
    addCommandType('block', BlockCommand);
    addCommandType('import', ImportCommand);
    addCommandType('use', UseCommand);
    addCommandType('var', VarCommand);
    addCommandType('for', ForCommand);
    addCommandType('if', IfCommand);
    addCommandType('elif', ElifCommand);
    addCommandType('else', ElseCommand);
    addCommandType('filter', FilterCommand);
    function Engine(options) {
        this.options = {
            commandOpen: '<!--',
            commandClose: '-->',
            commandSyntax: /^\s*(\/)?([a-z]+)\s*(?::([\s\S]*))?$/,
            variableOpen: '${',
            variableClose: '}',
            defaultFilter: 'html'
        };
        this.config(options);
        this.targets = {};
        this.filters = extend({}, DEFAULT_FILTERS);
    }
    Engine.prototype.config = function (options) {
        extend(this.options, options);
    };
    Engine.prototype.compile = Engine.prototype.parse = function (source) {
        if (source) {
            var targetNames = parseSource(source, this);
            if (targetNames.length) {
                return this.targets[targetNames[0]].getRenderer();
            }
        }
        return new Function('return ""');
    };
    Engine.prototype.getRenderer = function (name) {
        var target = this.targets[name];
        if (target) {
            return target.getRenderer();
        }
    };
    Engine.prototype.render = function (name, data) {
        var renderer = this.getRenderer(name);
        if (renderer) {
            return renderer(data);
        }
        return '';
    };
    Engine.prototype.addFilter = function (name, filter) {
        if (typeof filter === 'function') {
            this.filters[name] = filter;
        }
    };
    function parseSource(source, engine) {
        var commandOpen = engine.options.commandOpen;
        var commandClose = engine.options.commandClose;
        var commandSyntax = engine.options.commandSyntax;
        var stack = new Stack();
        var analyseContext = {
            engine: engine,
            targets: [],
            stack: stack,
            target: null
        };
        var textBuf = [];
        function flushTextBuf() {
            var text;
            if (textBuf.length > 0 && (text = textBuf.join(''))) {
                var textNode = new TextNode(text, engine);
                textNode.beforeAdd(analyseContext);
                stack.top().addChild(textNode);
                textBuf = [];
                if (engine.options.strip && analyseContext.current instanceof Command) {
                    textNode.value = text.replace(/^[\x20\t\r]*\n/, '');
                }
                analyseContext.current = textNode;
            }
        }
        var NodeType;
        parseTextBlock(source, commandOpen, commandClose, 0, function (text) {
            var match = commandSyntax.exec(text);
            if (match && (NodeType = commandTypes[match[2].toLowerCase()]) && typeof NodeType === 'function') {
                flushTextBuf();
                var currentNode = analyseContext.current;
                if (engine.options.strip && currentNode instanceof TextNode) {
                    currentNode.value = currentNode.value.replace(/\r?\n[\x20\t]*$/, '\n');
                }
                if (match[1]) {
                    currentNode = autoCloseCommand(analyseContext, NodeType);
                } else {
                    currentNode = new NodeType(match[3], engine);
                    if (typeof currentNode.beforeOpen === 'function') {
                        currentNode.beforeOpen(analyseContext);
                    }
                    currentNode.open(analyseContext);
                }
                analyseContext.current = currentNode;
            } else if (!/^\s*\/\//.test(text)) {
                textBuf.push(commandOpen, text, commandClose);
            }
            NodeType = null;
        }, function (text) {
            textBuf.push(text);
        });
        flushTextBuf();
        autoCloseCommand(analyseContext);
        return analyseContext.targets;
    }
    var etpl = new Engine();
    etpl.Engine = Engine;
    return etpl;
});
define('cc/util/fullScreen', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var doc = document.documentElement;
    var enter;
    var exit;
    var change;
    var noop = $.noop;
    if (doc.requestFullscreen) {
        enter = function () {
            doc.requestFullscreen();
        };
        exit = function () {
            document.exitFullscreen();
        };
        change = function (handler) {
            document.addEventListener('fullscreenchange', function () {
                handler(document.fullscreen);
            });
        };
    } else if (doc.webkitRequestFullScreen) {
        enter = function () {
            doc.webkitRequestFullScreen();
        };
        exit = function () {
            document.webkitCancelFullScreen();
        };
        change = function (handler) {
            document.addEventListener('webkitfullscreenchange', function () {
                handler(document.webkitIsFullScreen);
            });
        };
    } else if (doc.mozRequestFullScreen) {
        enter = function () {
            doc.mozRequestFullScreen();
        };
        exit = function () {
            document.mozCancelFullScreen();
        };
        change = function (handler) {
            document.addEventListener('mozfullscreenchange', function () {
                handler(document.mozFullScreen);
            });
        };
    } else {
        enter = exit = change = noop;
    }
    exports.enter = enter;
    exports.exit = exit;
    exports.change = change;
    exports.support = change !== noop;
});
define('cc/util/input', [
    'require',
    'exports',
    'module',
    '../function/around',
    './detection'
], function (require, exports, module) {
    'use strict';
    var around = require('../function/around');
    var detection = require('./detection');
    var namespace = '.cobble_util_input';
    var bindInput = $.noop;
    function bindPropertyChange(element) {
        var oldValue = element.val();
        var changeByVal = false;
        element.on('propertychange' + namespace, function (e) {
            if (changeByVal) {
                changeByVal = false;
                return;
            }
            if (e.originalEvent.propertyName === 'value') {
                var newValue = element.val();
                if (newValue !== oldValue) {
                    element.trigger('input');
                    oldValue = newValue;
                }
            }
        });
        around(element, 'val', function () {
            if (arguments.length !== 0) {
                changeByVal = true;
            }
        });
    }
    exports.init = detection.supportInput() ? bindInput : bindPropertyChange;
    exports.dispose = function (element) {
        element.off(namespace);
    };
});
define('cc/util/instance', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    exports.window = $(window);
    exports.document = $(document);
    exports.html = $(document.documentElement);
    exports.body = $(document.body);
});
define('cc/util/json', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    if (typeof JSON !== 'object') {
        JSON = {};
    }
    (function () {
        'use strict';
        function f(n) {
            return n < 10 ? '0' + n : n;
        }
        if (typeof Date.prototype.toJSON !== 'function') {
            Date.prototype.toJSON = function () {
                return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;
            };
            String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function () {
                return this.valueOf();
            };
        }
        var cx, escapable, gap, indent, meta, rep;
        function quote(string) {
            escapable.lastIndex = 0;
            return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' : '"' + string + '"';
        }
        function str(key, holder) {
            var i, k, v, length, mind = gap, partial, value = holder[key];
            if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }
            if (typeof rep === 'function') {
                value = rep.call(holder, key, value);
            }
            switch (typeof value) {
            case 'string':
                return quote(value);
            case 'number':
                return isFinite(value) ? String(value) : 'null';
            case 'boolean':
            case 'null':
                return String(value);
            case 'object':
                if (!value) {
                    return 'null';
                }
                gap += indent;
                partial = [];
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || 'null';
                    }
                    v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
                    gap = mind;
                    return v;
                }
                if (rep && typeof rep === 'object') {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof rep[i] === 'string') {
                            k = rep[i];
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                } else {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                }
                v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
                gap = mind;
                return v;
            }
        }
        if (typeof JSON.stringify !== 'function') {
            escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            meta = {
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            };
            JSON.stringify = function (value, replacer, space) {
                var i;
                gap = '';
                indent = '';
                if (typeof space === 'number') {
                    for (i = 0; i < space; i += 1) {
                        indent += ' ';
                    }
                } else if (typeof space === 'string') {
                    indent = space;
                }
                rep = replacer;
                if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
                    throw new Error('JSON.stringify');
                }
                return str('', { '': value });
            };
        }
        if (typeof JSON.parse !== 'function') {
            cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            JSON.parse = function (text, reviver) {
                var j;
                function walk(holder, key) {
                    var k, v, value = holder[key];
                    if (value && typeof value === 'object') {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = walk(value, k);
                                if (v !== undefined) {
                                    value[k] = v;
                                } else {
                                    delete value[k];
                                }
                            }
                        }
                    }
                    return reviver.call(holder, key, value);
                }
                text = String(text);
                cx.lastIndex = 0;
                if (cx.test(text)) {
                    text = text.replace(cx, function (a) {
                        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                    });
                }
                if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                    j = eval('(' + text + ')');
                    return typeof reviver === 'function' ? walk({ '': j }, '') : j;
                }
                throw new SyntaxError('JSON.parse');
            };
        }
    }());
    return JSON;
});
define('cc/util/keyboard', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var charKey = {
        a: 65,
        b: 66,
        c: 67,
        d: 68,
        e: 69,
        f: 70,
        g: 71,
        h: 72,
        i: 73,
        j: 74,
        k: 75,
        l: 76,
        m: 77,
        n: 78,
        o: 79,
        p: 80,
        q: 81,
        r: 82,
        s: 83,
        t: 84,
        u: 85,
        v: 86,
        w: 87,
        x: 88,
        y: 89,
        z: 90,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        '`': 192,
        '-': 173,
        '=': 61,
        '[': 219,
        ']': 221,
        '\\': 220,
        ';': 59,
        '\'': 222,
        ',': 188,
        '.': 190,
        '/': 191,
        '$0': 96,
        '$1': 97,
        '$2': 98,
        '$3': 99,
        '$4': 100,
        '$5': 101,
        '$6': 102,
        '$7': 103,
        '$8': 104,
        '$9': 105,
        '$.': 110,
        '$+': 107,
        '$-': 109,
        '$*': 106,
        '$/': 111,
        space: 32,
        tab: 9
    };
    var deleteKey = {
        backspace: 8,
        'delete': 46
    };
    var functionKey = {
        f1: 112,
        f2: 113,
        f3: 114,
        f4: 115,
        f5: 116,
        f6: 117,
        f7: 118,
        f8: 119,
        f9: 120,
        f10: 121,
        f11: 122,
        f12: 123,
        enter: 13,
        esc: 27,
        capslock: 20,
        insert: 45,
        home: 36,
        end: 35,
        pageup: 33,
        pagedown: 34,
        left: 37,
        right: 39,
        up: 38,
        down: 40
    };
    var combinationKey = {
        shift: 16,
        ctrl: 17,
        meta: 91,
        alt: 18
    };
    function reverse(obj) {
        var result = {};
        $.each(obj, function (key, value) {
            result[value] = key;
        });
        return result;
    }
    $.extend(exports, charKey, functionKey, combinationKey);
    exports.charKey = charKey;
    exports.deleteKey = deleteKey;
    exports.functionKey = functionKey;
    exports.combinationKey = combinationKey;
    exports.isCharKey = function (keyCode) {
        return keyCode in reverse(charKey);
    };
    exports.isDeleteKey = function (keyCode) {
        return keyCode in reverse(deleteKey);
    };
    exports.isFunctionKey = function (keyCode) {
        return keyCode in reverse(functionKey);
    };
    exports.isCombinationKey = function (keyCode) {
        return keyCode in reverse(combinationKey);
    };
});
define('cc/util/life', [
    'require',
    'exports',
    'module',
    '../function/guid',
    '../function/around',
    '../function/extend',
    '../function/ucFirst',
    '../function/nextTick',
    '../function/replaceWith',
    '../function/offsetParent',
    './instance'
], function (require, exports, module) {
    'use strict';
    var guid = require('../function/guid');
    var around = require('../function/around');
    var extend = require('../function/extend');
    var ucFirst = require('../function/ucFirst');
    var nextTick = require('../function/nextTick');
    var replaceWith = require('../function/replaceWith');
    var offsetParent = require('../function/offsetParent');
    var body = require('./instance').body;
    var instances = {};
    var UPDATE_ASYNC = 'updateAsync';
    function createEvent(event) {
        if (event && !event[$.expando]) {
            event = $.type(event) === 'string' || event.type ? $.Event(event) : $.Event(null, event);
        }
        return event || $.Event();
    }
    function createSettter(singular, complex, setter, getter, validate) {
        return function (name, value, options) {
            var me = this;
            if ($.isPlainObject(name)) {
                options = value;
                $.each(name, function (name, value) {
                    me[setter](name, value, options);
                });
                return;
            }
            options = options || {};
            var oldValue = me[getter](name);
            var validator = me.constructor[singular + 'Validator'];
            if (validator) {
                if ($.isFunction(validator[name])) {
                    value = validator[name].call(me, value, options);
                }
            }
            if ($.isFunction(validate)) {
                value = validate(me, value, options);
            }
            if (oldValue === value && !options.force) {
                return;
            }
            me[complex][name] = value;
            if (options.silent) {
                return;
            }
            var record = {};
            extend(record, options);
            record.newValue = me[getter](name);
            record.oldValue = oldValue;
            var changes = me.inner(singular + 'Changes');
            if (!changes) {
                changes = {};
                me.inner(singular + 'Changes', changes);
            }
            var oldRecord = changes[name];
            if (oldRecord) {
                if (oldRecord.oldValue === record.newValue) {
                    delete changes[name];
                    return;
                }
            }
            changes[name] = record;
            if (!me.inner(UPDATE_ASYNC)) {
                me.inner(UPDATE_ASYNC, true);
                nextTick($.proxy(me.sync, me));
            }
        };
    }
    var elementSharePool = {};
    var methods = {
        initStruct: function () {
            var me = this;
            var mainElement = me.option('mainElement');
            var mainTemplate = me.option('mainTemplate');
            if ($.type(mainTemplate) === 'string') {
                var share = me.option('share');
                var cacheKey = me.type + mainTemplate;
                if (share) {
                    mainElement = elementSharePool[cacheKey];
                }
                var tempElement;
                if (!mainElement) {
                    tempElement = $(mainTemplate);
                    if (share) {
                        elementSharePool[cacheKey] = tempElement;
                    }
                } else {
                    if (me.option('replace')) {
                        replaceWith(mainElement, tempElement = $(mainTemplate));
                    } else {
                        mainElement.html(mainTemplate);
                    }
                }
                if (tempElement) {
                    mainElement = tempElement;
                    me.option('mainElement', mainElement);
                }
            }
            if (me.option('underBody') && !offsetParent(mainElement).is('body')) {
                body.append(mainElement);
            }
            me.initStruct = function () {
                me.error('component.initStruct() can just call one time.');
            };
        },
        warn: function (msg) {
            if (typeof console !== 'undefined') {
                console.warn([
                    '[CC warn]',
                    this.type,
                    msg
                ].join(' '));
            }
        },
        error: function (msg) {
            throw new Error([
                '[CC error]',
                this.type,
                msg
            ].join(' '));
        },
        on: function (event, data, handler) {
            this.$.on(event, data, handler);
            return this;
        },
        once: function (event, data, handler) {
            this.$.one(event, data, handler);
            return this;
        },
        off: function (event, handler) {
            this.$.off(event, handler);
            return this;
        },
        emit: function (event, data) {
            var me = this;
            var context = me.option('context') || me;
            event = createEvent(event);
            event.cc = context;
            var args = [event];
            if ($.isPlainObject(data)) {
                args.push(data);
            }
            event.type = event.type.toLowerCase();
            context.$.trigger.apply(context.$, args);
            var ontype = 'on' + event.type;
            context.execute('ondebug', args);
            if (!event.isPropagationStopped() && context.execute(ontype, args) === false) {
                event.preventDefault();
                event.stopPropagation();
            }
            context.execute(ontype + '_', args);
            return event;
        },
        before: function (event, handler) {
            return this.on('before' + event.toLowerCase(), handler);
        },
        after: function (event, handler) {
            return this.on('after' + event.toLowerCase(), handler);
        },
        find: function (selector) {
            var mainElement = this.inner('main');
            if (mainElement) {
                var result = mainElement.find(selector);
                if (result.length) {
                    return result;
                }
            }
        },
        appendTo: function (target) {
            var element = this.inner('main');
            if (element) {
                element.appendTo(target);
            }
        },
        prependTo: function (target) {
            var element = this.inner('main');
            if (element) {
                element.prependTo(target);
            }
        },
        execute: function (name, args) {
            var me = this;
            var fn = name;
            if ($.type(name) === 'string') {
                fn = me.option(name);
            }
            if ($.isFunction(fn)) {
                var context = me.option('context') || me;
                if ($.isArray(args)) {
                    return fn.apply(context, args);
                } else {
                    return fn.call(context, args);
                }
            }
        },
        renderWith: function (data, template, element) {
            var me = this;
            if (!template) {
                template = me.option('mainTemplate');
            }
            if (!element) {
                element = me.option('mainElement');
            }
            var renderSelector = me.option('renderSelector');
            var renderTemplate = me.option('renderTemplate');
            var renderElement;
            if (!renderTemplate || !renderTemplate) {
                if (me.option('replace')) {
                    me.error('replace must be false if not configure renderSelector and renderTemplate.');
                }
                renderElement = element;
                renderTemplate = template;
            } else {
                renderElement = element.find(renderSelector);
            }
            var html;
            if ($.isPlainObject(data) || $.isArray(data)) {
                html = me.execute('render', [
                    data,
                    renderTemplate
                ]);
            } else if ($.type(data) === 'string') {
                html = data;
            }
            renderElement.html(html);
        },
        namespace: function () {
            return '.' + this.guid;
        },
        option: function (name, value) {
            var me = this;
            if (arguments.length === 1 && $.type(name) === 'string') {
                return me.options[name];
            } else {
                if ($.isPlainObject(name)) {
                    $.each(name, function (name, value) {
                        me.option(name, value);
                    });
                    return;
                }
                me.options[name] = value;
            }
        },
        inner: function (name, value) {
            var me = this;
            var inners = me.inners || {};
            if (arguments.length === 1 && $.type(name) === 'string') {
                return inners[name];
            } else {
                if ($.isPlainObject(name)) {
                    $.each(name, function (name, value) {
                        me.inner(name, value);
                    });
                    return;
                }
                inners[name] = value;
            }
        },
        is: function (name) {
            return this.states[name];
        },
        state: createSettter('state', 'states', 'state', 'is', function (instance, value) {
            if ($.type(value) !== 'boolean') {
                value = false;
            }
            return value;
        }),
        get: function (name) {
            return this.properties[name];
        },
        set: createSettter('property', 'properties', 'set', 'get'),
        sync: function () {
            var me = this;
            if (!me.inner(UPDATE_ASYNC)) {
                return;
            }
            var createUpdater = function (updater, changes) {
                return function (name, change) {
                    var fn = updater[name];
                    if ($.isFunction(fn)) {
                        return fn.call(me, change.newValue, change.oldValue, changes);
                    }
                };
            };
            $.each([
                'property',
                'state'
            ], function (index, key) {
                var changes = me.inner(key + 'Changes');
                if (changes) {
                    var staticUpdater = me.constructor[key + 'Updater'];
                    if (staticUpdater) {
                        $.each(changes, createUpdater(staticUpdater, changes));
                    }
                    var instanceUpdater = me.option(key + 'Change');
                    if (instanceUpdater) {
                        $.each(changes, createUpdater(instanceUpdater, changes));
                    }
                    me.inner(key + 'Changes', null);
                    me.emit(key + 'change', changes);
                }
            });
            me.inner(UPDATE_ASYNC, false);
            me.emit('sync');
        }
    };
    function executeAspect(instance, name, args, type, e) {
        var result;
        var aspect = type === 'before' ? '_' + name : name + '_';
        var method = instance[aspect];
        if ($.isFunction(method)) {
            result = method.apply(instance, args);
            if (result !== false && !$.isPlainObject(result)) {
                result = null;
            }
        }
        if (result === false) {
            return false;
        }
        if (e && e[$.expando]) {
            if (!result) {
                result = {};
            }
            result.event = e;
        }
        var event = instance.emit(createEvent(type + name), result);
        if (event.isDefaultPrevented()) {
            return false;
        }
    }
    exports.extend = function (proto) {
        $.each(proto, function (name, method) {
            var index = name.indexOf('_');
            if (!$.isFunction(method) || index === 0 || index === name.length - 1) {
                return;
            }
            var beforeHandler = function (e) {
                return executeAspect(this, name, arguments, 'before', e);
            };
            var afterHandler = function (e) {
                var me = this;
                var args = arguments;
                var emitAfterEvent = function () {
                    return executeAspect(me, name, args, 'after', e);
                };
                if (method.length + 1 === args.length) {
                    var executeResult = args[args.length - 1];
                    if (executeResult && $.isFunction(executeResult.then)) {
                        executeResult.then(emitAfterEvent);
                        return;
                    }
                }
                emitAfterEvent();
            };
            around(proto, name, beforeHandler, afterHandler);
        });
        extend(proto, methods);
    };
    exports.init = function (instance, options) {
        extend(options, instance.constructor.defaultOptions);
        options.onafterinit_ = function () {
            instance.state('inited', true);
        };
        options.onafterdispose_ = function () {
            instance.state('disposed', true);
            var mainElement = instance.inner('main');
            if (instance.option('removeOnDispose') && mainElement) {
                mainElement.remove();
            }
            delete instances[instance.guid];
            instance.properties = instance.options = instance.changes = instance.states = instance.inners = instance.guid = instance.$ = null;
        };
        instances[instance.guid = guid()] = instance;
        instance.properties = {};
        instance.options = options;
        instance.states = {};
        instance.inners = {};
        instance.$ = $({});
        instance.init();
        return instance;
    };
    exports.dispose = function (instance) {
        instance.sync();
        instance.$.off();
    };
});
define('cc/util/localStorage', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    function set(key, value) {
        if ($.isPlainObject(key)) {
            $.each(key, function (key, value) {
                exports.set(key, value);
            });
        } else {
            try {
                localStorage[key] = value;
            } catch (e) {
            }
        }
    }
    function get(key) {
        var result = '';
        try {
            result = localStorage[key];
        } catch (e) {
        }
        return result;
    }
    function remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
        }
    }
    if (localStorage) {
        exports.set = set;
        exports.get = get;
        exports.remove = remove;
    } else {
        exports.set = exports.get = exports.remove = $.noop;
    }
});
define('cc/util/mimeType', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return {
        html: 'text/html',
        htm: 'text/html',
        shtml: 'text/html',
        xml: 'text/xml',
        css: 'text/css',
        js: 'application/x-javascript',
        json: 'application/json',
        atom: 'application/atom+xml',
        rss: 'application/rss+xml',
        mml: 'text/mathml',
        txt: 'text/plain',
        jad: 'text/vnd.sun.j2me.app-descriptor',
        wml: 'text/vnd.wap.wml',
        htc: 'text/x-component',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        tif: 'image/tiff',
        tiff: 'image/tiff',
        wbmp: 'image/vnd.wap.wbmp',
        ico: 'image/x-icon',
        jng: 'image/x-jng',
        bmp: 'image/x-ms-bmp',
        svg: 'image/svg+xml',
        svgz: 'image/svg+xml',
        webp: 'image/webp',
        mp3: 'audio/mpeg',
        wma: 'audio/x-ms-wma',
        wav: 'audio/x-wav',
        mid: 'audio/midi',
        midd: 'audio/midi',
        kar: 'audio/midi',
        ogg: 'audio/ogg',
        m4a: 'audio/x-m4a',
        ra: 'audio/x-realaudio',
        ram: 'audio/x-pn-realaudio',
        mod: 'audio/mod',
        '3gp': 'video/3gpp',
        '3gpp': 'video/3gpp',
        mp4: 'video/mp4',
        mpeg: 'video/mpeg',
        mpg: 'video/mpeg',
        mov: 'video/quicktime',
        webm: 'video/webm',
        flv: 'video/x-flv',
        m4v: 'video/x-m4v',
        mng: 'video/x-mng',
        asx: 'video/x-ms-asf',
        asf: 'video/x-ms-asf',
        wmv: 'video/x-ms-wmv',
        avi: 'video/x-msvideo',
        rm: 'video/vnd.rn-realvideo',
        rmvb: 'video/vnd.rn-realvideo',
        ts: 'video/MP2T',
        dv: 'video/x-dv',
        mkv: 'video/x-matroska',
        jar: 'application/java-archive',
        war: 'application/java-archive',
        ear: 'application/java-archive',
        hqx: 'application/mac-binhex40',
        pdf: 'application/pdf',
        ps: 'application/postscript',
        eps: 'application/postscript',
        ai: 'application/postscript',
        rtf: 'application/rtf',
        wmlc: 'application/vnd.wap.wmlc',
        kml: 'application/vnd.google-earth.kml+xml',
        kmz: 'application/vnd.google-earth.kmz',
        '7z': 'application/x-7z-compressed',
        cco: 'application/x-cocoa',
        jardiff: 'application/x-java-archive-diff',
        jnlp: 'application/x-java-jnlp-file',
        run: 'application/x-makeself',
        pl: 'application/x-perl',
        pm: 'application/x-perl',
        prc: 'application/x-pilot',
        pdb: 'application/x-pilot',
        rar: 'application/x-rar-compressed',
        rpm: 'application/x-redhat-package-manager',
        sea: 'application/x-sea',
        swf: 'application/x-shockwave-flash',
        sit: 'application/x-stuffit',
        tcl: 'application/x-tcl',
        tk: 'application/x-tcl',
        der: 'application/x-x509-ca-cert',
        pem: 'application/x-x509-ca-cert',
        crt: 'application/x-x509-ca-cert',
        xpi: 'application/x-xpinstall',
        xhtml: 'application/xhtml+xml',
        zip: 'application/zip',
        bin: 'application/octet-stream',
        exe: 'application/octet-stream',
        dll: 'application/octet-stream',
        deb: 'application/octet-stream',
        dmg: 'application/octet-stream',
        eot: 'application/octet-stream',
        iso: 'application/octet-stream',
        img: 'application/octet-stream',
        msi: 'application/octet-stream',
        msp: 'application/octet-stream',
        msm: 'application/octet-stream',
        doc: 'application/msword',
        xls: 'application/vnd.ms-excel',
        ppt: 'application/vnd.ms-powerpoint',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
});
define('cc/util/orientation', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return {
        horizontal: {
            axis: 'x',
            position: 'left',
            scrollPosition: 'scrollLeft',
            size: 'width',
            minSize: 'minWidth',
            maxSize: 'maxWidth',
            innerSize: 'innerWidth',
            outerSize: 'outerWidth',
            scrollSize: 'scrollWidth'
        },
        vertical: {
            axis: 'y',
            position: 'top',
            scrollPosition: 'scrollTop',
            size: 'height',
            minSize: 'minHeight',
            maxSize: 'maxHeight',
            innerSize: 'innerHeight',
            outerSize: 'outerHeight',
            scrollSize: 'scrollHeight'
        }
    };
});
define('cc/util/position', [
    'require',
    'exports',
    'module',
    '../function/pin'
], function (require, exports, module) {
    'use strict';
    var pin = require('../function/pin');
    exports.pin = pin;
    exports.topLeft = function (options) {
        pin({
            element: options.element,
            x: 'right',
            y: 'bottom',
            attachment: {
                element: options.attachment,
                x: 'left',
                y: 'top'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.topCenter = function (options) {
        pin({
            element: options.element,
            x: 'center',
            y: 'bottom',
            attachment: {
                element: options.attachment,
                x: 'center',
                y: 'top'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.topRight = function (options) {
        pin({
            element: options.element,
            x: 'left',
            y: 'bottom',
            attachment: {
                element: options.attachment,
                x: 'right',
                y: 'top'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.middleLeft = function (options) {
        pin({
            element: options.element,
            x: 'right',
            y: 'middle',
            attachment: {
                element: options.attachment,
                x: 'left',
                y: 'middle'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.middleCenter = function (options) {
        pin({
            element: options.element,
            x: 'center',
            y: 'middle',
            attachment: {
                element: options.attachment,
                x: 'center',
                y: 'middle'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.middleRight = function (options) {
        pin({
            element: options.element,
            x: 'left',
            y: 'middle',
            attachment: {
                element: options.attachment,
                x: 'right',
                y: 'middle'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.bottomLeft = function (options) {
        pin({
            element: options.element,
            x: 'right',
            y: 'top',
            attachment: {
                element: options.attachment,
                x: 'left',
                y: 'bottom'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.bottomCenter = function (options) {
        pin({
            element: options.element,
            x: 'center',
            y: 'top',
            attachment: {
                element: options.attachment,
                x: 'center',
                y: 'bottom'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
    exports.bottomRight = function (options) {
        pin({
            element: options.element,
            x: 'left',
            y: 'top',
            attachment: {
                element: options.attachment,
                x: 'right',
                y: 'bottom'
            },
            offset: {
                x: options.offsetX,
                y: options.offsetY
            }
        });
    };
});
define('cc/util/redirect', [
    'require',
    'exports',
    'module',
    './url'
], function (require, exports, module) {
    'use strict';
    var urlUtil = require('./url');
    function createForm(url, charset) {
        var obj = urlUtil.parse(url);
        var html = '<form action="' + obj.origin + obj.pathname + '" target="_blank"';
        if (charset) {
            html += ' accept-charset="' + charset + '" onsubmit="document.charset=\'' + charset + '\';"';
        }
        html += '>';
        $.each(urlUtil.parseQuery(obj.search), function (key, value) {
            html += '<input type="hidden" name="' + key + '" value="' + value + '" />';
        });
        html += '</form>';
        return $(html);
    }
    exports.openForm = function (url, charset) {
        var form = createForm(url, charset);
        form.appendTo('body');
        form.submit();
    };
    exports.openLink = function (url) {
        var link = $('<a href="' + url + '" target="_blank"><b></b></a>');
        link.appendTo('body');
        try {
            link.find('b')[0].click();
        } catch (e) {
            exports.openForm(url);
        }
    };
});
define('cc/util/string', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    function getCharUTF8Length(x) {
        var code = x.charCodeAt(0);
        if ((code & ~127) === 0) {
            return 1;
        }
        if ((code & ~2047) === 0) {
            return 2;
        }
        if ((code & ~65535) === 0) {
            return 3;
        }
        return 4;
    }
    function traverse(str, callback) {
        var size = 0;
        for (var i = 0, len = str.length; i < len; i++) {
            size += Math.floor((getCharUTF8Length(str.charAt(i)) + 1) / 2);
            if (callback(size, i + 1) === false) {
                break;
            }
        }
    }
    exports.getLength = function (str) {
        var result = 0;
        if ($.type(str) === 'string') {
            traverse(str, function (length, index) {
                result = length;
            });
        }
        return result;
    };
    exports.truncate = function (str, length, suffix) {
        if ($.type(length) !== 'number' || exports.getLength(str) <= length) {
            return str;
        }
        var result = '';
        traverse(str, function (len, index) {
            if (len > length) {
                return false;
            }
            result = str.substr(0, index);
        });
        suffix = $.type(suffix) === 'string' ? suffix : '...';
        return result + suffix;
    };
    exports.encodeHTML = function (source) {
        return String(source).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
    exports.decodeHTML = function (source) {
        var str = String(source).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'');
        return str.replace(/&#([\d]+);/g, function ($0, $1) {
            return String.fromCharCode(parseInt($1, 10));
        });
    };
});
define('cc/util/supload/supload', [
    'require',
    'exports',
    'module',
    '../cookie',
    '../json'
], function (require, exports, module) {
    if (window.Supload === Supload) {
        return window.Supload;
    }
    var cookie = require('../cookie');
    var json = require('../json');
    function Supload(options) {
        $.extend(this, options);
        this.init();
    }
    Supload.prototype = {
        constructor: Supload,
        init: function () {
            var instanceId = createGuid();
            this.movieName = instanceId;
            var element = this.element;
            if ($.type(element) === 'string') {
                element = document.getElementById(element);
            }
            var data = this.data || (this.data = {});
            $.each(cookie.get(), function (key, value) {
                if ($.type(data[key]) === 'undefined') {
                    data[key] = value;
                }
            });
            var swf = Supload.createSWF(instanceId, this.flashUrl, this.getFlashVars());
            element.parentNode.replaceChild(swf, element);
            this.element = swf;
            this.onLog = function (data) {
                console.log(data);
            };
            Supload.instances[instanceId] = this;
        },
        getFlashVars: function () {
            var me = this;
            var result = [];
            $.each([
                'movieName',
                'action',
                'accept',
                'multiple',
                'fileName',
                'data',
                'ignoreError'
            ], function (index, key) {
                var value = me[key];
                if (value != null) {
                    if ($.isPlainObject(value)) {
                        value = json.stringify(value);
                    } else if ($.isArray(value)) {
                        value = value.join(',');
                    }
                    result.push(key + '=' + encodeURIComponent(value));
                }
            });
            result.push('projectName=' + Supload.projectName);
            return result.join('&amp;');
        },
        getFiles: function () {
            return this.element.getFiles && this.element.getFiles() || [];
        },
        setAction: function (action) {
            this.element.setAction && this.element.setAction(action);
        },
        setData: function (data) {
            this.element.setData && this.element.setData(data);
        },
        reset: function () {
            this.element.reset && this.element.reset();
        },
        upload: function () {
            this.element.upload && this.element.upload();
        },
        cancel: function () {
            this.element.cancel && this.element.cancel();
        },
        enable: function () {
            this.element.enable && this.element.enable();
        },
        disable: function () {
            this.element.disable && this.element.disable();
        },
        dispose: function () {
            this.element.dispose && this.element.dispose();
            Supload.instances[this.movieName] = null;
            window[this.movieName] = null;
        }
    };
    Supload.projectName = 'Supload';
    Supload.createSWF = function (id, flashUrl, flashVars) {
        var html = '<object id="' + id + '" class="' + Supload.projectName.toLowerCase() + '" type="application/x-shockwave-flash" data="' + flashUrl + '">' + '<param name="movie" value="' + flashUrl + '" />' + '<param name="allowscriptaccess" value="always" />' + '<param name="wmode" value="transparent" />' + '<param name="flashvars" value="' + flashVars + '" />' + '</object>';
        return $(html)[0];
    };
    Supload.instances = {};
    Supload.STATUS_WAITING = 0;
    Supload.STATUS_UPLOADING = 1;
    Supload.STATUS_UPLOAD_SUCCESS = 2;
    Supload.STATUS_UPLOAD_ERROR = 3;
    Supload.ERROR_CANCEL = 0;
    Supload.ERROR_SECURITY = 1;
    Supload.ERROR_IO = 2;
    var guidIndex = 178245;
    function createGuid() {
        return '_Supload_' + guidIndex++;
    }
    window.Supload = Supload;
    return Supload;
});
define('cc/util/swipe', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var namespace = '.cobble_util_swipe';
    function getPoint(e) {
        e = e.originalEvent;
        var touches = e.changedTouches || e.touches;
        if (touches.length === 1) {
            return touches[0];
        }
    }
    exports.init = function (element) {
        var trigger = function (type, point) {
            var x = point.pageX - start.x;
            var y = point.pageY - start.y;
            var event = $.Event(type, {
                x: x,
                y: y
            });
            element.trigger(event);
            return event;
        };
        var start = {};
        var eventGroup = {};
        var touchEndTimer;
        eventGroup['touchmove' + namespace] = function (e) {
            var point = getPoint(e);
            if (point) {
                var event = trigger('swiping', point);
                if (event.isDefaultPrevented()) {
                    e.preventDefault();
                }
                if (touchEndTimer) {
                    clearTimeout(touchEndTimer);
                }
                touchEndTimer = setTimeout(function () {
                    eventGroup['touchend' + namespace](e);
                }, 200);
            }
        };
        eventGroup['touchend' + namespace] = function (e) {
            if (touchEndTimer) {
                clearTimeout(touchEndTimer);
                touchEndTimer = null;
            }
            var point = getPoint(e);
            if (point) {
                trigger('swipe', point);
            }
            element.off(eventGroup);
        };
        element.on('touchstart' + namespace, function (e) {
            var point = getPoint(e);
            if (point) {
                start.x = point.pageX;
                start.y = point.pageY;
                start.time = +new Date();
                element.on(eventGroup);
            }
        });
    };
    exports.dispose = function (element) {
        element.off(namespace);
    };
});
define('cc/util/time', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    exports.parse = function (hour, minute, second) {
        var valid = false;
        if ($.isNumeric(hour) && $.isNumeric(minute)) {
            valid = true;
            if (!$.isNumeric(second)) {
                second = 0;
            }
        } else if (arguments.length === 1) {
            if ($.type(hour) === 'string') {
                var parts = hour.split(':');
                if (parts.length > 1 && parts.length < 4) {
                    valid = true;
                    hour = +$.trim(parts[0]);
                    minute = +$.trim(parts[1]);
                    second = +$.trim(parts[2]);
                }
            } else if ($.isPlainObject(hour)) {
                valid = true;
                second = hour.second || 0;
                minute = hour.minute || 0;
                hour = hour.hour;
            }
        }
        if (valid) {
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
                var result = new Date();
                result.setHours(hour);
                result.setMinutes(minute);
                result.setSeconds(second);
                return result;
            }
        }
    };
    exports.stringify = function (date, options) {
        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();
        if (hour < 10) {
            hour = '0' + hour;
        }
        if (minute < 10) {
            minute = '0' + minute;
        }
        if (second < 10) {
            second = '0' + second;
        }
        var list = [];
        if (!options) {
            options = {
                hour: true,
                minute: true
            };
        }
        if (options.hour) {
            list.push(hour);
        }
        if (options.minute) {
            list.push(minute);
        }
        if (options.second) {
            list.push(second);
        }
        return list.join(':');
    };
    exports.simplify = function (date) {
        return {
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds()
        };
    };
    exports.add = function (date, options) {
        var offset = 0;
        if ($.type(options.hour) === 'number') {
            offset += exports.HOUR * options.hour;
        }
        if ($.type(options.minute) === 'number') {
            offset += exports.MINUTE * options.minute;
        }
        if ($.type(options.second) === 'number') {
            offset += exports.SECOND * options.second;
        }
        return new Date(date.getTime() + offset);
    };
    exports.subtract = function (date, options) {
        var offset = 0;
        if ($.type(options.hour) === 'number') {
            offset += exports.HOUR * options.hour;
        }
        if ($.type(options.minute) === 'number') {
            offset += exports.MINUTE * options.minute;
        }
        if ($.type(options.second) === 'number') {
            offset += exports.SECOND * options.second;
        }
        return new Date(date.getTime() - offset);
    };
    exports.SECOND = 1000;
    exports.MINUTE = exports.SECOND * 60;
    exports.HOUR = exports.MINUTE * 60;
});
define('cc/util/timer', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (fn, interval, wait) {
        wait = $.type(wait) === 'number' ? wait : 0;
        var timer;
        var process = function () {
            timer = setTimeout(process, interval);
            fn();
        };
        var switcher = {
            start: function () {
                switcher.stop();
                timer = setTimeout(process, wait);
            },
            stop: function () {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            }
        };
        return switcher;
    };
});
define('cc/util/touch', [
    'require',
    'exports',
    'module',
    '../function/eventPage',
    '../function/eventOffset'
], function (require, exports, module) {
    'use strict';
    var eventPage = require('../function/eventPage');
    var eventOffset = require('../function/eventOffset');
    function getTouchObject(e) {
        return e.originalEvent.changedTouches[0];
    }
    var element = document.createElement('div');
    var touch = {
        support: 'ontouchend' in element,
        click: 'touchstart',
        down: 'touchstart',
        move: 'touchmove',
        up: 'touchend',
        page: function (e) {
            var touch = getTouchObject(e);
            return {
                x: touch.pageX,
                y: touch.pageY
            };
        },
        client: function (e) {
            var touch = getTouchObject(e);
            return {
                x: touch.clientX,
                y: touch.clientY
            };
        },
        offset: function (e) {
            var touch = getTouchObject(e);
            return {
                x: touch.offsetX,
                y: touch.offsetY
            };
        }
    };
    var mouse = {
        support: 'onclick' in element,
        click: 'click',
        down: 'mousedown',
        move: 'mousemove',
        up: 'mouseup',
        page: function (e) {
            return eventPage(e);
        },
        client: function (e) {
            return {
                x: e.clientX,
                y: e.clientY
            };
        },
        offset: function () {
            return eventOffset(e);
        }
    };
    element = null;
    return {
        touch: touch,
        mouse: mouse
    };
});
define('cc/util/trigger', [
    'require',
    'exports',
    'module',
    '../function/split'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    var delayTimer = 'delayTimer';
    function createHandler(options) {
        return function (e) {
            var delay = options.delay;
            var startDelay = options.startDelay;
            var endDelay = options.endDelay;
            var done = function () {
                options.handler.call(e.currentTarget, e);
            };
            if (delay > 0 && startDelay && endDelay) {
                var startTimer = function () {
                    options[delayTimer] = setTimeout(function () {
                        fn(delayTimer);
                    }, delay);
                };
                var clearTimer = function () {
                    clearTimeout(options[delayTimer]);
                    endDelay(fn, options);
                    options[delayTimer] = null;
                };
                var fn = function (value) {
                    if (options[delayTimer]) {
                        clearTimer();
                    }
                    if (delayTimer === value) {
                        done();
                    }
                };
                startDelay(fn, options);
                startTimer();
            } else {
                done();
            }
        };
    }
    exports = {
        focus: {
            type: 'focusin',
            handler: createHandler
        },
        blur: {
            type: 'focusout',
            handler: createHandler
        },
        click: {
            type: 'click',
            handler: createHandler
        },
        enter: {
            type: 'mouseenter',
            handler: createHandler
        },
        leave: {
            type: 'mouseleave',
            handler: createHandler
        },
        context: {
            type: 'contextmenu',
            handler: createHandler
        }
    };
    exports.parse = function (trigger, each) {
        var configs = {};
        if (trigger) {
            $.each(split(trigger, ','), function (index, trigger) {
                var config = exports[trigger];
                if (config) {
                    configs[trigger] = {
                        type: config.type,
                        handler: config.handler(each(trigger))
                    };
                }
            });
        }
        return configs;
    };
    return exports;
});
define('cc/util/url', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    exports.parseQuery = function (queryStr) {
        var result = {};
        if ($.type(queryStr) === 'string' && queryStr.length > 1) {
            var startIndex = 0;
            var firstChar = queryStr.charAt(0);
            if (firstChar === '?') {
                startIndex = 1;
            } else if (firstChar === '#') {
                startIndex = 1;
                var secondChar = queryStr.charAt(1);
                if (secondChar === '/') {
                    startIndex = 2;
                }
            }
            if (startIndex > 0) {
                queryStr = queryStr.substr(startIndex);
            }
            $.each(queryStr.split('&'), function (index, item) {
                var parts = item.split('=');
                if (parts.length === 2) {
                    var key = $.trim(parts[0]);
                    if (key) {
                        result[key] = decodeURIComponent($.trim(parts[1]));
                    }
                }
            });
        }
        return result;
    };
    exports.getOrigin = function (url) {
        if (!url) {
            url = document.URL;
        }
        return exports.parse(url).origin;
    };
    exports.parse = function (url) {
        var link = document.createElement('a');
        link.href = url;
        url = link.href;
        var origin = '';
        if (link.protocol && link.host) {
            origin = link.protocol + '//' + link.host;
        } else if (/^(http[s]?:\/\/[^/]+)(?=\/)/.test(url)) {
            origin = RegExp.$1;
        }
        var terms = origin.split(':');
        if (origin.indexOf('http:') === 0 && terms.length === 3 && terms[2] == 80) {
            terms.length = 2;
            origin = terms.join(':');
        }
        var pathname = link.pathname;
        if (pathname && pathname.charAt(0) !== '/') {
            pathname = '/' + pathname;
        }
        return {
            origin: origin,
            pathname: pathname,
            search: link.search
        };
    };
});
define('cc/util/visibility', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var prefix;
    function camelize(prefix, name) {
        if (!prefix) {
            return name;
        }
        return prefix + name.slice(0, 1).toUpperCase() + name.slice(1);
    }
    $.each([
        'webkit',
        'moz',
        'ms',
        'o',
        ''
    ], function (index, item) {
        if (camelize(item, 'hidden') in document) {
            prefix = item;
            return false;
        }
    });
    exports.support = prefix != null;
    exports.hidden = function () {
        return document[camelize(prefix, 'hidden')];
    };
    exports.state = function () {
        return document[camelize(prefix, 'visibilityState')];
    };
    exports.change = function (fn) {
        document.addEventListener(prefix + 'visibilitychange', fn);
    };
});