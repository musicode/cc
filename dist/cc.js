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
        mainElement.on('click' + me.namespace(), debounce(function () {
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
            native: common.findNative(me, toggle ? 'input[type="checkbox"]' : 'input[type="radio"]')
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
    '../util/life',
    '../util/Value',
    './common',
    './Box'
], function (require, exports, module) {
    'use strict';
    var lifeUtil = require('../util/life');
    var Value = require('../util/Value');
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
        me.once('aftersync', function () {
            $.each(boxes, function (index, box) {
                box.option('watchSync', {
                    checked: function (checked) {
                        var valueUtil = me.inner('value');
                        var value = box.get('value');
                        if (checked) {
                            valueUtil.add(value);
                        } else {
                            valueUtil.remove(value);
                        }
                        me.set('value', valueUtil.get());
                    }
                });
            });
        });
        me.inner({
            main: mainElement,
            native: common.findNative(me, 'input[type="hidden"]'),
            boxes: boxes,
            value: new Value({ multiple: me.option('multiple') })
        });
        me.set({
            name: me.option('name'),
            value: me.option('value')
        });
    };
    proto.dispose = function () {
        lifeUtil.dispose(this);
        $.each(this.inner('boxes'), function (index, box) {
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
            var valueUtil = this.inner('value');
            valueUtil.set(value);
            return valueUtil.get();
        }
    };
    return BoxGroup;
});
define('cc/form/Date', [
    'require',
    'exports',
    'module',
    '../function/contains',
    '../function/replaceWith',
    '../helper/Popup',
    '../ui/Calendar',
    '../util/life',
    '../util/input',
    './common'
], function (require, exports, module) {
    'use strict';
    var contains = require('../function/contains');
    var replaceWith = require('../function/replaceWith');
    var Popup = require('../helper/Popup');
    var Calendar = require('../ui/Calendar');
    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');
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
            render: function (data, tpl) {
                return me.execute('render', [
                    data,
                    tpl
                ]);
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
            }
        });
        popup.on('dispatch', function (e, data) {
            var event = e.originalEvent;
            if (event.type === 'beforeclose') {
                var target = event.originalEvent.target;
                if (target) {
                    if (!contains(document, target) || contains(inputElement, target) || contains(layerElement, target)) {
                        return false;
                    }
                }
            }
            me.emit(event, data, true);
        });
        var inputElement = mainElement.find(me.option('inputSelector'));
        inputUtil.init(inputElement);
        inputElement.on(inputUtil.INPUT, function () {
            me.set('value', this.value);
        });
        me.once('aftersync', function () {
            calendar.option('watchSync', {
                value: function (value) {
                    me.set('value', value);
                    popup.close();
                }
            });
            calendar.set('value', me.get('value'));
            popup.option('watchSync', {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            });
            me.state('opened', popup.is('opened'));
        });
        me.inner({
            main: mainElement,
            native: inputElement,
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
    proto.close = function () {
        this.state('opened', false);
    };
    proto.render = function () {
        this.inner('calendar').render();
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        inputUtil.dispose(me.inner('native'));
        me.inner('popup').dispose();
        me.inner('calendar').dispose();
    };
    lifeUtil.extend(proto, [
        'open',
        'close'
    ]);
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
            return common.validateValue(this, value);
        }
    };
    Date.stateUpdater = {
        opened: function (opened) {
            var popup = this.inner('popup');
            if (opened) {
                popup.open();
            } else {
                popup.close();
            }
        }
    };
    return Date;
});
define('cc/form/DateRange', [
    'require',
    'exports',
    'module',
    '../function/split',
    '../function/contains',
    '../helper/Popup',
    '../ui/Calendar',
    '../util/life',
    '../util/input',
    './common'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    var contains = require('../function/contains');
    var Popup = require('../helper/Popup');
    var Calendar = require('../ui/Calendar');
    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');
    var common = require('./common');
    function DateRange(options) {
        lifeUtil.init(this, options);
    }
    var proto = DateRange.prototype;
    proto.type = 'DateRange';
    proto.init = function () {
        var me = this;
        me.initStruct();
        var mainElement = me.option('mainElement');
        var inputElement = mainElement.find(me.option('inputSelector'));
        var layerElement = mainElement.find(me.option('layerSelector'));
        var startCalendar = createCalendar(me, layerElement.find(me.option('startCalendarSelector')), 'startDate');
        var endCalendar = createCalendar(me, layerElement.find(me.option('endCalendarSelector')), 'endDate');
        var popup = new Popup({
            triggerElement: inputElement,
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
            }
        });
        inputUtil.init(inputElement);
        inputElement.on(inputUtil.INPUT, function () {
            me.set('value', this.value);
        });
        me.once('aftersync', function () {
            popup.option('watchSync', {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            });
            me.state('opened', popup.is('opened'));
        });
        popup.on('dispatch', function (e, data) {
            var event = e.originalEvent;
            if (event.type === 'beforeclose') {
                var target = event.originalEvent.target;
                if (target) {
                    if (!contains(document, target) || contains(inputElement, target) || contains(layerElement, target)) {
                        return false;
                    }
                }
            }
            me.emit(event, data, true);
        });
        var namespace = me.namespace();
        var applySelector = me.option('applySelector');
        if (applySelector) {
            layerElement.on('click' + namespace, applySelector, function () {
                var list = [
                    startCalendar.get('value'),
                    endCalendar.get('value')
                ];
                me.set('value', list.join(SEPRATOR));
                me.close();
            });
        }
        var cancelSelector = me.option('cancelSelector');
        if (cancelSelector) {
            layerElement.on('click' + namespace, cancelSelector, function () {
                me.close();
            });
        }
        me.inner({
            main: mainElement,
            layer: layerElement,
            native: inputElement,
            popup: popup,
            startCalendar: startCalendar,
            endCalendar: endCalendar
        });
        me.set({
            name: me.option('name'),
            value: me.option('value')
        });
    };
    proto.open = function () {
        this.state('opened', true);
    };
    proto.close = function () {
        this.state('opened', false);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        inputUtil.dispose(me.inner('native'));
        me.inner('popup').dispose();
        me.inner('startCalendar').dispose();
        me.inner('endCalendar').dispose();
        me.inner('layer').off(me.namespace());
    };
    lifeUtil.extend(proto, [
        'open',
        'close'
    ]);
    DateRange.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {
            var me = this;
            common.prop(me, 'value', value);
            var terms = split(value, SEPRATOR);
            me.inner('startCalendar').set('value', terms[0]);
            me.inner('endCalendar').set('value', terms[1]);
        }
    };
    DateRange.propertyValidator = {
        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            return common.validateValue(this, value);
        }
    };
    DateRange.stateUpdater = {
        opened: function (opened) {
            var popup = this.inner('popup');
            if (opened) {
                popup.open();
            } else {
                popup.close();
            }
        }
    };
    function createCalendar(instance, mainElement, propName) {
        var calendar = new Calendar({
            mainElement: mainElement,
            mainTemplate: instance.option('calendarTemplate'),
            mode: instance.option('mode'),
            parse: instance.option('parse'),
            date: instance.option('startDate'),
            today: instance.option('today'),
            stable: instance.option('stable'),
            firstDay: instance.option('firstDay'),
            renderSelector: instance.option('renderSelector'),
            renderTemplate: instance.option('renderTemplate'),
            prevSelector: instance.option('prevSelector'),
            nextSelector: instance.option('nextSelector'),
            itemSelector: instance.option('itemSelector'),
            itemActiveClass: instance.option('itemActiveClass'),
            valueAttribute: instance.option('valueAttribute'),
            render: function (data, tpl) {
                return instance.execute('render', [
                    data,
                    tpl
                ]);
            }
        });
        instance.once('aftersync', function () {
            calendar.set('value', instance.get(propName));
            calendar.option('watchSync', {
                value: function (value) {
                    instance.set(propName, value);
                }
            });
        });
        return calendar;
    }
    var SEPRATOR = ' - ';
    return DateRange;
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
            step: me.option('step')
        });
        me.once('aftersync', function () {
            spinbox.option('watchSync', {
                value: function (value) {
                    me.set('value', value);
                },
                minValue: function (minValue) {
                    me.set('minValue', minValue);
                },
                maxValue: function (maxValue) {
                    me.set('maxValue', maxValue);
                }
            });
            spinbox.set({
                value: me.get('value'),
                minValue: me.get('minValue'),
                maxValue: me.get('maxValue')
            });
        });
        me.inner({
            main: mainElement,
            native: spinbox.inner('input'),
            spinbox: spinbox
        });
        me.set({
            name: me.option('name'),
            value: me.option('value'),
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue')
        });
    };
    proto.dispose = function () {
        lifeUtil.dispose(this);
        this.inner('spinbox').dispose();
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
            }
        });
        me.once('aftersync', function () {
            combobox.option('watchSync', {
                value: function (value) {
                    me.set('value', value);
                },
                opened: function (opened) {
                    me.state('opened', opened);
                }
            });
            combobox.set('value', me.get('value'));
            me.state('opened', combobox.is('opened'));
        });
        var nativeElement = common.findNative(me, '> input[type="hidden"]');
        combobox.on('dispatch', function (e, data) {
            var event = e.originalEvent;
            switch (event.type) {
            case 'afteropen':
                nativeElement.trigger('focusin');
                break;
            case 'afterclose':
                nativeElement.trigger('focusout');
                break;
            }
            me.emit(event, data, true);
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
    proto.close = function () {
        this.state('opened', false);
    };
    proto.dispose = function () {
        lifeUtil.dispose(this);
        this.inner('combobox').dispose();
    };
    lifeUtil.extend(proto, [
        'open',
        'close'
    ]);
    Select.propertyUpdater = {
        name: function (name) {
            common.prop(this, 'name', name);
        }
    };
    Select.propertyUpdater.data = Select.propertyUpdater.value = function (newValue, oldValue, change) {
        var me = this;
        var properties = {};
        var valueChange = change.value;
        if (valueChange) {
            var value = valueChange.newValue;
            common.prop(me, 'value', value);
            properties.value = value;
        }
        var dataChange = change.data;
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
            var combobox = this.inner('combobox');
            if (opened) {
                combobox.open();
            } else {
                combobox.close();
            }
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
            hideAnimation: me.option('hideAnimation')
        });
        var inputElement = placeholder.inner('input');
        var input = new Input({
            mainElement: inputElement,
            shortcut: me.option('shortcut'),
            value: me.option('value')
        });
        me.once('aftersync', function () {
            placeholder.option('watchSync', {
                value: function (value) {
                    me.set('placeholder', value);
                }
            });
            placeholder.set('placeholder', me.get('placeholder'));
            input.option('watchSync', {
                value: function (value) {
                    me.set('value', value);
                }
            });
            input.set('value', me.get('value'));
        });
        me.inner({
            main: placeholder.inner('main'),
            native: inputElement,
            input: input,
            placeholder: placeholder
        });
        me.set({
            name: me.option('name'),
            value: me.option('value')
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
            var input = this.inner('input');
            input.set('value', value);
            input.sync();
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
    '../function/debounce',
    '../util/life',
    '../util/validator'
], function (require, exports, module) {
    'use strict';
    var isHidden = require('../function/isHidden');
    var nextTick = require('../function/nextTick');
    var debounce = require('../function/debounce');
    var lifeUtil = require('../util/life');
    var validator = require('../util/validator');
    function Validator(options) {
        lifeUtil.init(this, options);
    }
    var proto = Validator.prototype;
    proto.type = 'Validator';
    proto.init = function () {
        var me = this;
        var mainElement = me.option('mainElement');
        var namespace = me.namespace();
        mainElement.on('focusin' + namespace, function (e) {
            var target = $(e.target);
            var groupElement = target.closest(me.option('groupSelector'));
            if (groupElement.length === 1) {
                var errorAttribute = me.option('errorAttribute');
                var name = target.prop('name');
                var errorElement = groupElement.find('[' + errorAttribute + '="' + name + '"]');
                if (errorElement.length === 1) {
                    me.execute('hideErrorAnimation', {
                        errorElement: errorElement,
                        fieldElement: target
                    });
                }
            }
        });
        mainElement.on('focusout' + namespace, debounce(function (e) {
            var name = e.target.name;
            if (name && me.$) {
                var config = me.option('fields')[name];
                if (config) {
                    var local = config.validateOnBlur;
                    var global = me.option('validateOnBlur');
                    if (local === true || local == null && global) {
                        me.validate(name);
                    }
                }
            }
        }, 180));
        me.inner({ main: mainElement });
    };
    proto.validate = function (fields, autoScroll) {
        var me = this;
        var mainElement = me.option('mainElement');
        var groupSelector = me.option('groupSelector');
        if ($.type(fields) === 'string') {
            fields = [fields];
        } else if (!$.isArray(fields)) {
            if ($.type(fields) === 'boolean') {
                autoScroll = fields;
            }
            fields = [];
            $.each(me.option('fields'), function (name) {
                fields.push(name);
            });
        }
        var data = {};
        $.each(fields, function (index, name) {
            var fieldElement = mainElement.find('[name="' + name + '"]');
            if (!fieldElement.length || fieldElement.prop('disabled')) {
                return;
            }
            var groupElement = fieldElement.closest(groupSelector);
            if (isHidden(groupElement)) {
                return;
            }
            data[name] = {
                name: name,
                value: $.trim(fieldElement.val()),
                fieldElement: fieldElement,
                groupElement: groupElement
            };
        });
        var result = validator.validate(data, me.option('fields'));
        var errors = [];
        var validateComplete = function () {
            var errorAttribute = me.option('errorAttribute');
            var errorTemplate = me.option('errorTemplate');
            $.each(result, function (index, item) {
                var errorElement = item.groupElement.find('[' + errorAttribute + '=' + item.name + ']');
                if (item.error) {
                    errors.push(item);
                    var html = me.execute('render', [
                        { error: item.error },
                        errorTemplate
                    ]);
                    errorElement.html(html);
                    me.execute('showErrorAnimation', {
                        errorElement: errorElement,
                        fieldElement: item.fieldElement
                    });
                } else {
                    me.execute('hideErrorAnimation', {
                        errorElement: errorElement,
                        fieldElement: item.fieldElement
                    });
                }
            });
            if (autoScroll && errors.length > 0) {
                var fieldElement = errors[0].fieldElement;
                if (fieldElement.is('input[type="hidden"]')) {
                    fieldElement = fieldElement.parent();
                }
                var top = fieldElement.offset().top;
                var scrollOffset = me.option('scrollOffset');
                if ($.type(scrollOffset) === 'number') {
                    top += scrollOffset;
                }
                window.scrollTo(window.scrollX, top);
            }
            nextTick(function () {
                if (me.$) {
                    me.emit('validatecomplete', {
                        fields: result,
                        errors: errors
                    });
                }
            });
        };
        if (result.then) {
            result.then(function (data) {
                result = data;
                validateComplete();
            });
        } else {
            validateComplete();
            return errors.length === 0;
        }
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('main').off(me.namespace());
    };
    lifeUtil.extend(proto);
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
        if (nativeElement.length === 0) {
            instance.error('form/' + instance.type + ' 必须包含一个 [' + selector + '].');
        }
        return nativeElement.eq(0);
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
define('cc/function/createEvent', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (event) {
        if (event && !event[$.expando]) {
            event = $.type(event) === 'string' || event.type ? $.Event(event) : $.Event(null, event);
        }
        return event || $.Event();
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
define('cc/function/decodeHTML', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (source) {
        var str = String(source).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'');
        return str.replace(/&#([\d]+);/g, function ($0, $1) {
            return String.fromCharCode(parseInt($1, 10));
        });
    };
});
define('cc/function/disableSelection', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    if (document.selection) {
        return function () {
            document.body.onselectstart = function () {
                return false;
            };
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
            includeSelector: options.includeSelector,
            excludeSelector: options.excludeSelector,
            dragAnimation: options.dragAnimation,
            init: function (options) {
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
    if (document.selection) {
        return function () {
            document.body.onselectstart = null;
        };
    }
    return $.noop;
});
define('cc/function/encodeHTML', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (source) {
        return String(source).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
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
define('cc/function/firstDateInMonth', [
    'require',
    'exports',
    'module',
    './offsetDate'
], function (require, exports, module) {
    'use strict';
    var offsetDate = require('./offsetDate');
    return function (date) {
        if ($.type(date) === 'number') {
            date = new Date(date);
        }
        return offsetDate(date, 1 - date.getDate());
    };
});
define('cc/function/firstDateInWeek', [
    'require',
    'exports',
    'module',
    './offsetDate'
], function (require, exports, module) {
    'use strict';
    var offsetDate = require('./offsetDate');
    return function (date, firstDay) {
        if ($.type(date) === 'number') {
            date = new Date(date);
        }
        var day = date.getDay();
        day = day >= firstDay ? day : day + 7;
        return offsetDate(date, -1 * (day - firstDay));
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
define('cc/function/isActiveElement', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (element) {
        if (element.jquery) {
            element = element[0];
        }
        return document.activeElement === element;
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
define('cc/function/lastDateInMonth', [
    'require',
    'exports',
    'module',
    './offsetDate',
    './offsetMonth',
    './firstDateInMonth'
], function (require, exports, module) {
    'use strict';
    var offsetDate = require('./offsetDate');
    var offsetMonth = require('./offsetMonth');
    var firstDateInMonth = require('./firstDateInMonth');
    return function (date) {
        return offsetDate(firstDateInMonth(offsetMonth(date, 1)), -1);
    };
});
define('cc/function/lastDateInWeek', [
    'require',
    'exports',
    'module',
    './firstDateInWeek',
    './offsetDate'
], function (require, exports, module) {
    'use strict';
    var firstDateInWeek = require('./firstDateInWeek');
    var offsetDate = require('./offsetDate');
    return function (date, firstDay) {
        return offsetDate(firstDateInWeek(date, firstDay), 6);
    };
});
define('cc/function/lpad', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (num, length) {
        if (length == null) {
            length = 2;
        }
        var arr = new Array(length - ('' + num).length + 1);
        return arr.join('0') + num;
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
    'module'
], function (require, exports, module) {
    'use strict';
    return function (fn) {
        var timer = setTimeout(fn, 0);
        return function () {
            clearTimeout(timer);
        };
    };
});
define('cc/function/offsetDate', [
    'require',
    'exports',
    'module',
    './offsetHour'
], function (require, exports, module) {
    'use strict';
    var offsetHour = require('./offsetHour');
    return function (date, offset) {
        return offsetHour(date, offset * 24);
    };
});
define('cc/function/offsetHour', [
    'require',
    'exports',
    'module',
    './offsetMinute'
], function (require, exports, module) {
    'use strict';
    var offsetMinute = require('./offsetMinute');
    return function (date, offset) {
        return offsetMinute(date, offset * 60);
    };
});
define('cc/function/offsetMinute', [
    'require',
    'exports',
    'module',
    './offsetSecond'
], function (require, exports, module) {
    'use strict';
    var offsetSecond = require('./offsetSecond');
    return function (date, offset) {
        return offsetSecond(date, offset * 60);
    };
});
define('cc/function/offsetMonth', [
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
define('cc/function/offsetSecond', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (date, offset) {
        if ($.type(date) === 'date') {
            date = date.getTime();
        }
        return new Date(date + offset * 1000);
    };
});
define('cc/function/offsetWeek', [
    'require',
    'exports',
    'module',
    './offsetDate'
], function (require, exports, module) {
    'use strict';
    var offsetDate = require('./offsetDate');
    return function (date, offset) {
        return offsetDate(date, offset * 7);
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
            if ($.isPlainObject(year)) {
                valid = true;
                date = year.date;
                month = year.month;
                year = year.year;
            }
        } else if (arguments.length === 2) {
            if ($.type(year) === 'string') {
                valid = true;
                var parts = year.split(month || '-');
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
define('cc/function/parseTime', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (hour, minute, second) {
        var valid = false;
        if ($.isNumeric(hour) && $.isNumeric(minute)) {
            valid = true;
            if (!$.isNumeric(second)) {
                second = 0;
            }
        } else if (arguments.length === 1) {
            if ($.isPlainObject(hour)) {
                valid = true;
                second = hour.second;
                minute = hour.minute;
                hour = hour.hour;
            } else if ($.type(hour) === 'string') {
                var parts = hour.split(':');
                if (parts.length > 1 && parts.length < 4) {
                    valid = true;
                    hour = +$.trim(parts[0]);
                    minute = +$.trim(parts[1]);
                    second = +$.trim(parts[2]);
                }
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
        if (options.silent) {
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
            silent: true,
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
define('cc/function/scrollBottom', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (element, value) {
        var scrollHeight = element.prop('scrollHeight');
        var viewHeight = element.innerHeight();
        if (value != null) {
            element.prop('scrollTop', scrollHeight - viewHeight - value);
        } else {
            return scrollHeight - element.prop('scrollTop') - viewHeight;
        }
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
define('cc/function/simplifyTime', [
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
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds()
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
define('cc/function/supportCanvas', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        var canvas = document.createElement('canvas');
        return canvas && canvas.getContext ? true : false;
    };
});
define('cc/function/supportFlash', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        var swf;
        var plugins = navigator.plugins;
        if (plugins && plugins.length > 0) {
            swf = plugins['Shockwave Flash'];
        } else if (document.all) {
            swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        }
        return !!swf;
    };
});
define('cc/function/supportInput', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        var element = $('<input type="text" />')[0];
        return 'oninput' in element;
    };
});
define('cc/function/supportLocalStorage', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        return typeof window.localStorage !== 'undefined';
    };
});
define('cc/function/supportPlaceholder', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        var element = $('<input type="text" />')[0];
        return 'placeholder' in element;
    };
});
define('cc/function/supportWebSocket', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function () {
        return typeof window.WebSocket !== 'undefined';
    };
});
define('cc/function/toBoolean', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    return function (value, defaultValue) {
        if ($.type(value) !== 'boolean') {
            if (arguments.length === 1) {
                defaultValue = !!value;
            }
            value = defaultValue;
        }
        return value;
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
define('cc/helper/AjaxUploader', [
    'require',
    'exports',
    'module',
    '../function/ratio',
    '../function/restrain',
    '../util/life',
    '../util/mimeType'
], function (require, exports, module) {
    'use strict';
    var getRatio = require('../function/ratio');
    var restrain = require('../function/restrain');
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
    AjaxUploader.ERROR_CHUNK_SIZE = -1;
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
        var fileSize = fileItem.file.size;
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
        if (end > fileSize) {
            end = fileSize;
        }
        chunkInfo.uploading = end - start;
        if (chunkInfo.uploading <= 0) {
            setTimeout(function () {
                uploader.emit('uploadError', {
                    fileItem: fileItem,
                    errorCode: AjaxUploader.ERROR_CHUNK_SIZE
                });
            });
            return;
        }
        var range = 'bytes ' + (start + 1) + '-' + end + '/' + fileSize;
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
                    if (chunkInfo.uploaded < fileItem.file.size) {
                        var event = uploader.emit('chunkuploadsuccess', data);
                        if (!event.isDefaultPrevented()) {
                            chunkInfo.index++;
                            chunkInfo.uploaded += chunkInfo.uploading;
                            if (chunkInfo.uploaded < fileItem.file.size) {
                                uploader.upload();
                            }
                        }
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
                    percent: 100 * restrain(getRatio(uploaded, total), 0, 1) + '%'
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
            watchSync: {
                index: function (index) {
                    me.set('index', index);
                },
                minIndex: function (minIndex) {
                    me.set('minIndex', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxIndex', maxIndex);
                }
            }
        });
        var dispatchEvent = function (e, data) {
            me.emit(e, data);
        };
        $.each(exclude, function (index, name) {
            iterator.before(name, dispatchEvent).after(name, dispatchEvent);
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
        var mainElement = me.option('mainElement');
        var keyboard = new Keyboard({
            mainElement: mainElement,
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
                me.start(reserve);
            }
        }).after('longpress', function () {
            if (playing) {
                playing = false;
                me.pause();
            }
        });
        if (mainElement.is('input[type="text"]')) {
            keyboard.on('keydown', function (e) {
                if (e.keyCode === keyboardUtil.up) {
                    return false;
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
    var exclude = [
        'start',
        'pause',
        'stop',
        'prev',
        'next'
    ];
    lifeUtil.extend(proto, exclude);
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
        var bodyDraggingClass = me.option('bodyDraggingClass');
        var beforeDragHandler = function (e) {
            var coord;
            var isEvent = e[$.expando];
            if (isEvent) {
                var includeSelector = me.option('includeSelector');
                var excludeSelector = me.option('excludeSelector');
                var target = e.target;
                if (includeSelector && !hitTarget(mainElement, includeSelector, target) || excludeSelector && hitTarget(mainElement, excludeSelector, target)) {
                    return;
                }
                $.each(globalCoord, function (key, value) {
                    if (e.type.indexOf(key) === 0) {
                        coord = value;
                        return false;
                    }
                });
            } else if (e.type) {
                coord = globalCoord[e.type];
            }
            if (!coord) {
                coord = globalCoord.mouse;
            }
            var style = position(mainElement);
            var isFixed = style.position === 'fixed';
            var mainOuterOffset = outerOffset(mainElement);
            var rectInnerOffset = innerOffset(rectElement);
            var offsetX;
            var offsetY;
            if (isEvent) {
                offsetX = coord.absoluteX(e) - mainOuterOffset.x;
                offsetY = coord.absoluteY(e) - mainOuterOffset.y;
            } else {
                offsetX = e.offsetX;
                offsetY = e.offsetY;
            }
            var rectContainsElement = contains(rectElement, mainElement);
            if (rectContainsElement) {
                offsetX += rectInnerOffset.x;
                offsetY += rectInnerOffset.y;
                if (!isFixed) {
                    offsetX -= rectElement.scrollLeft();
                    offsetY -= rectElement.scrollTop();
                }
            }
            point.left = style.left;
            point.top = style.top;
            var x = rectContainsElement ? 0 : rectInnerOffset.x;
            var y = rectContainsElement ? 0 : rectInnerOffset.y;
            var width;
            var height;
            var vHeight = viewportHeight();
            if (isFixed) {
                var byViewport = !containerElement || containerElement.is('body');
                if (byViewport) {
                    width = viewportWidth();
                    height = vHeight;
                }
            }
            if ($.type(width) !== 'number') {
                if (rectContainsElement) {
                    width = rectElement.prop('scrollWidth');
                    height = rectElement.prop('scrollHeight');
                } else {
                    width = rectElement.innerWidth();
                    height = rectElement.innerHeight();
                }
            }
            if (height < vHeight) {
                if (rectElement.is('body') || rectElement.is('html')) {
                    height = vHeight;
                }
            }
            width = Math.max(0, width - mainElement.outerWidth(true));
            height = Math.max(0, height - mainElement.outerHeight(true));
            var axis = me.option('axis');
            xCalculator = axis === 'y' ? calculator.constant(style.left) : calculator.variable(coord[isFixed ? 'fixedX' : 'absoluteX'], offsetX, x, x + width);
            yCalculator = axis === 'x' ? calculator.constant(style.top) : calculator.variable(coord[isFixed ? 'fixedY' : 'absoluteY'], offsetY, y, y + height);
            counter = 0;
            return true;
        };
        var dragHandler = function (e) {
            point.left = xCalculator(e);
            point.top = yCalculator(e);
            var event;
            if (counter === 0) {
                event = me.emit('beforedrag', point);
                if (event.isDefaultPrevented()) {
                    return;
                }
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
            }
            counter++;
            event = me.emit('drag', point);
            if (!event.isDefaultPrevented()) {
                me.execute('dragAnimation', {
                    mainElement: mainElement,
                    mainStyle: point
                });
            }
        };
        var afterDragHandler = function () {
            if (counter > 0) {
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
                me.emit('afterdrag', point);
            }
            counter = xCalculator = yCalculator = null;
        };
        me.execute('init', {
            mainElement: mainElement,
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
            mainElement: mainElement,
            shortcut: me.option('shortcut')
        });
        var isLongPress;
        var updateValue = function (value) {
            if ($.type(value) !== 'string') {
                value = mainElement.val();
            }
            me.set('value', value);
        };
        keyboard.on('dispatch', function (e, data) {
            var event = e.originalEvent;
            switch (event.type) {
            case 'beforelongpress':
                isLongPress = true;
                break;
            case 'afterlongpress':
                isLongPress = false;
                var keyCode = data.keyCode;
                if (keyboardUtil.isCharKey(keyCode) || keyboardUtil.isDeleteKey() || mainElement.is('textarea') && keyCode === keyboardUtil.enter) {
                    updateValue();
                }
                break;
            }
            me.emit(event, data, true);
        });
        var namespace = me.namespace();
        mainElement.on('blur' + namespace, updateValue).on(inputUtil.INPUT + namespace, function () {
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
        value: function (newValue, oldValue, changes) {
            var inputElement = this.inner('main');
            if (inputElement.val() !== newValue || changes.value.force) {
                inputElement.val(newValue);
            }
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
    '../util/Timer',
    '../util/life'
], function (require, exports, module) {
    'use strict';
    var toNumber = require('../function/toNumber');
    var Timer = require('../util/Timer');
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
            timer.dispose();
        }
        var fn = reverse ? me.prev : me.next;
        var interval = me.option('interval');
        if ($.type(interval) !== 'number') {
            me.error('interval must be a number.');
        }
        timer = new Timer({
            task: $.proxy(fn, me),
            interval: interval
        });
        timer.startDelay(interval);
        me.inner('timer', timer);
    };
    proto.pause = function () {
        var me = this;
        me.inner('timer').dispose();
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
        me.set('index', toNumber(index, 0));
    };
    proto._prev = function () {
        var me = this;
        if (!me.option('loop') && me.get('index') - me.option('step') < me.get('minIndex')) {
            return false;
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
        me.set('index', toNumber(index, 0));
    };
    proto._next = function () {
        var me = this;
        if (!me.option('loop') && me.get('index') + me.option('step') > me.get('maxIndex')) {
            return false;
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
        me.option('mainElement').on('keydown' + namespace, function (e) {
            var currentKeyCode = e.keyCode;
            if (prevKeyCode === currentKeyCode && pressCounter > 0) {
                if (pressCounter === longPressCounterDefine) {
                    me.emit('beforelongpress', { keyCode: currentKeyCode }, true);
                }
                pressCounter++;
            } else {
                prevKeyCode = currentKeyCode;
                pressCounter = 1;
            }
            me.emit(e, true);
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
                me.emit('afterlongpress', { keyCode: e.keyCode }, true);
            }
            pressCounter = 0;
            prevKeyCode = null;
            me.emit(e, true);
        });
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.option('mainElement').off(me.namespace());
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
    '../function/supportPlaceholder',
    '../util/life',
    '../util/input'
], function (require, exports, module) {
    'use strict';
    var isHidden = require('../function/isHidden');
    var toString = require('../function/toString');
    var supportPlaceholder = require('../function/supportPlaceholder')();
    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');
    function Placeholder(options) {
        lifeUtil.init(this, options);
    }
    var proto = Placeholder.prototype;
    proto.type = 'Placeholder';
    proto.init = function () {
        var me = this;
        me.initStruct();
        me.inner({ proxy: me.option('nativeFirst') && supportPlaceholder ? nativeProxy : fakeProxy });
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
            var inputSelector = instance.option('inputSelector');
            var tagName = mainElement.prop('tagName');
            instance.inner({
                main: mainElement,
                input: tagName === 'INPUT' || tagName === 'TEXTAREA' ? mainElement : mainElement.find(inputSelector)
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
            var inputSelector = instance.option('inputSelector');
            var labelSelector = instance.option('labelSelector');
            var inputElement = mainElement.find(inputSelector);
            instance.inner({
                main: mainElement,
                input: inputElement,
                label: mainElement.find(labelSelector)
            });
            inputUtil.init(inputElement);
            var namespace = instance.namespace();
            mainElement.on('click' + namespace, labelSelector, function () {
                inputElement.focus();
            }).on(inputUtil.INPUT + namespace, inputSelector, function () {
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
            if ($.trim(inputElement.val())) {
                instance.hide();
            } else {
                instance.show();
            }
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
                handler: curry(showLayerTrigger, 'handler'),
                beforeHandler: function (e) {
                    var action = function () {
                        me.inner({
                            trigger: getTriggerElement(me, e),
                            layer: getLayerElement(me, e)
                        });
                    };
                    if (me.is('opened')) {
                        var promise = $.Deferred();
                        promise.then(action);
                        me.inner(HIDE_PROMISE_KEY, promise);
                        return promise;
                    } else {
                        action();
                    }
                }
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
                    nextTick(bindHideEvent);
                } else {
                    unbindHideEvent();
                    bindShowEvent();
                }
            }
        };
        me.before('dispose', function () {
            me.off('statechange', stateChangeHandler);
            unbindShowEvent();
            unbindHideEvent();
            me.close();
        }).on('statechange', stateChangeHandler);
        me.inner({
            trigger: getTriggerElement(me),
            layer: getLayerElement(me)
        });
        me.state({ opened: me.option('opened') });
    };
    proto.open = function () {
        this.state('opened', true);
    };
    proto._open = function (e) {
        var me = this;
        if (me.is('opened')) {
            var layerElement = me.inner('layer');
            var currTriggerElement = me.inner('trigger');
            var prevTriggerElement = layerElement.data(TRIGGER_ELEMENT_KEY);
            if (currTriggerElement && prevTriggerElement && currTriggerElement[0] !== prevTriggerElement[0]) {
                layerElement.data(POPUP_KEY).close();
                nextTick(function () {
                    if (me.$) {
                        me.open(e);
                    }
                });
            }
            return false;
        }
        return { dispatch: true };
    };
    proto.open_ = function () {
        var me = this;
        var layerElement = me.inner('layer');
        if (layerElement) {
            var data = {};
            data[TRIGGER_ELEMENT_KEY] = me.inner('trigger');
            data[POPUP_KEY] = me;
            layerElement.data(data);
        }
        return { dispatch: true };
    };
    proto.close = function () {
        this.state('opened', false);
    };
    proto._close = function () {
        if (!this.is('opened')) {
            return false;
        }
        return { dispatch: true };
    };
    proto.close_ = function () {
        var me = this;
        var layerElement = me.inner('layer');
        if (layerElement) {
            layerElement.removeData(POPUP_KEY).removeData(TRIGGER_ELEMENT_KEY);
        }
        return { dispatch: true };
    };
    proto.dispose = function () {
        lifeUtil.dispose(this);
    };
    lifeUtil.extend(proto);
    Popup.stateUpdater = {
        opened: function (opened) {
            var layerElement = this.inner('layer');
            if (layerElement) {
                this.execute(opened ? 'showLayerAnimation' : 'hideLayerAnimation', { layerElement: layerElement });
            }
        }
    };
    Popup.stateValidator = {
        opened: function (opened) {
            if ($.type(opened) !== 'boolean') {
                var layerElement = this.inner('layer');
                if (layerElement) {
                    opened = !isHidden(layerElement);
                }
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
            var promise = instance.inner(HIDE_PROMISE_KEY);
            if (promise) {
                instance.sync();
                promise.resolve();
            }
        };
    }
    function onElement(element, type, handler, selector) {
        if (element) {
            element.on(type, selector, handler);
        }
    }
    function offElement(element, type, handler) {
        if (element) {
            element.off(type, handler);
        }
    }
    function onTrigger(instance, config) {
        onElement(instance.option('triggerElement') || instanceUtil.body, config.type, config.handler, instance.option('triggerSelector'));
    }
    function offTrigger(instance, config) {
        offElement(instance.option('triggerElement') || instanceUtil.body, config.type, config.handler);
    }
    function onDocument(instance, config) {
        onElement(instanceUtil.document, config.type, config.handler);
    }
    function offDocument(instance, config) {
        offElement(instanceUtil.document, config.type, config.handler);
    }
    function createDocumentHideHandler(instance) {
        return createHideHandler(instance, function (e) {
            return !contains(instance.inner('layer'), e.target);
        });
    }
    function getTriggerElement(instance, event) {
        var triggerElement = instance.option('triggerElement');
        var triggerSelector = instance.option('triggerSelector');
        if (triggerElement && !triggerSelector) {
            return triggerElement;
        }
        if (event) {
            return $(event.currentTarget);
        }
    }
    function getLayerElement(instance, event) {
        var layerElement = instance.option('layerElement');
        if (layerElement && layerElement.jquery && layerElement.length) {
            return layerElement;
        }
        if (event && $.isFunction(layerElement)) {
            layerElement = instance.execute(layerElement, event);
            if (layerElement && layerElement.tagName) {
                layerElement = $(layerElement);
            }
            return layerElement;
        }
    }
    var POPUP_KEY = '__prev_popup__';
    var TRIGGER_ELEMENT_KEY = '__trigger_element__';
    var HIDE_PROMISE_KEY = '__hide_promise__';
    var enterType = triggerUtil.enter.type;
    var leaveType = triggerUtil.leave.type;
    var triggers = {
        show: {
            focus: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler
            },
            click: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler
            },
            enter: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler,
                startDelay: function (instance) {
                    return function (handler) {
                        onElement(instance.inner('trigger'), leaveType, handler);
                    };
                },
                endDelay: function (instance) {
                    return function (handler) {
                        offElement(instance.inner('trigger'), leaveType, handler);
                    };
                }
            },
            context: {
                on: onTrigger,
                off: offTrigger,
                handler: createShowHandler
            }
        },
        hide: {
            blur: {
                on: onTrigger,
                off: offTrigger,
                handler: createHideHandler
            },
            click: {
                on: onDocument,
                off: offDocument,
                handler: createDocumentHideHandler
            },
            leave: {
                on: function (instance, config) {
                    onElement(instance.inner('trigger'), config.type, config.handler);
                    onElement(instance.inner('layer'), config.type, config.handler);
                },
                off: function (instance, config) {
                    offElement(instance.inner('trigger'), config.type, config.handler);
                    offElement(instance.inner('layer'), config.type, config.handler);
                },
                handler: createHideHandler,
                startDelay: function (instance) {
                    return function (handler) {
                        onElement(instance.inner('trigger'), enterType, handler);
                        onElement(instance.inner('layer'), enterType, handler);
                    };
                },
                endDelay: function (instance) {
                    return function (handler) {
                        offElement(instance.inner('trigger'), enterType, handler);
                        offElement(instance.inner('layer'), enterType, handler);
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
define('cc/main', [
    'require',
    'exports',
    'module',
    './form/Box',
    './form/BoxGroup',
    './form/Date',
    './form/DateRange',
    './form/Number',
    './form/Select',
    './form/Text',
    './form/Validator',
    './function/around',
    './function/autoScrollDown',
    './function/autoScrollUp',
    './function/contains',
    './function/offsetDate',
    './function/debounce',
    './function/decimalLength',
    './function/decodeHTML',
    './function/disableSelection',
    './function/divide',
    './function/dragGlobal',
    './function/enableSelection',
    './function/encodeHTML',
    './function/eventOffset',
    './function/eventPage',
    './function/extend',
    './function/float2Int',
    './function/guid',
    './function/offsetHour',
    './function/imageDimension',
    './function/innerOffset',
    './function/isActiveElement',
    './function/isHidden',
    './function/lpad',
    './function/minus',
    './function/offsetMinute',
    './function/firstDateInMonth',
    './function/lastDateInMonth',
    './function/offsetMonth',
    './function/multiply',
    './function/nextTick',
    './function/offsetParent',
    './function/outerOffset',
    './function/page',
    './function/pageHeight',
    './function/pageScrollLeft',
    './function/pageScrollTop',
    './function/pageWidth',
    './function/parseDate',
    './function/parsePercent',
    './function/parseTime',
    './function/pin',
    './function/pinGlobal',
    './function/plus',
    './function/position',
    './function/ratio',
    './function/replaceWith',
    './function/restrain',
    './function/scrollBottom',
    './function/offsetSecond',
    './function/simplifyDate',
    './function/simplifyTime',
    './function/toNumber',
    './function/toString',
    './function/ucFirst',
    './function/viewport',
    './function/viewportHeight',
    './function/viewportWidth',
    './function/firstDateInWeek',
    './function/lastDateInWeek',
    './function/offsetWeek',
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
    './util/etpl',
    './util/FiniteArray',
    './util/fullScreen',
    './util/input',
    './util/instance',
    './util/json',
    './util/keyboard',
    './util/life',
    './util/localStorage',
    './util/mimeType',
    './util/newTab',
    './util/orientation',
    './util/position',
    './util/Queue',
    './util/Range',
    './util/string',
    './util/support',
    './util/swipe',
    './util/Timer',
    './util/touch',
    './util/trigger',
    './util/url',
    './util/validator',
    './util/Value',
    './util/visibility',
    './util/wheel',
    './util/supload/supload'
], function (require, exports, module) {
    'use strict';
    require('./form/Box');
    require('./form/BoxGroup');
    require('./form/Date');
    require('./form/DateRange');
    require('./form/Number');
    require('./form/Select');
    require('./form/Text');
    require('./form/Validator');
    require('./function/around');
    require('./function/autoScrollDown');
    require('./function/autoScrollUp');
    require('./function/contains');
    require('./function/offsetDate');
    require('./function/debounce');
    require('./function/decimalLength');
    require('./function/decodeHTML');
    require('./function/disableSelection');
    require('./function/divide');
    require('./function/dragGlobal');
    require('./function/enableSelection');
    require('./function/encodeHTML');
    require('./function/eventOffset');
    require('./function/eventPage');
    require('./function/extend');
    require('./function/float2Int');
    require('./function/guid');
    require('./function/offsetHour');
    require('./function/imageDimension');
    require('./function/innerOffset');
    require('./function/isActiveElement');
    require('./function/isHidden');
    require('./function/lpad');
    require('./function/minus');
    require('./function/offsetMinute');
    require('./function/firstDateInMonth');
    require('./function/lastDateInMonth');
    require('./function/offsetMonth');
    require('./function/multiply');
    require('./function/nextTick');
    require('./function/offsetParent');
    require('./function/outerOffset');
    require('./function/page');
    require('./function/pageHeight');
    require('./function/pageScrollLeft');
    require('./function/pageScrollTop');
    require('./function/pageWidth');
    require('./function/parseDate');
    require('./function/parsePercent');
    require('./function/parseTime');
    require('./function/pin');
    require('./function/pinGlobal');
    require('./function/plus');
    require('./function/position');
    require('./function/ratio');
    require('./function/replaceWith');
    require('./function/restrain');
    require('./function/scrollBottom');
    require('./function/offsetSecond');
    require('./function/simplifyDate');
    require('./function/simplifyTime');
    require('./function/toNumber');
    require('./function/toString');
    require('./function/ucFirst');
    require('./function/viewport');
    require('./function/viewportHeight');
    require('./function/viewportWidth');
    require('./function/firstDateInWeek');
    require('./function/lastDateInWeek');
    require('./function/offsetWeek');
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
    require('./util/etpl');
    require('./util/FiniteArray');
    require('./util/fullScreen');
    require('./util/input');
    require('./util/instance');
    require('./util/json');
    require('./util/keyboard');
    require('./util/life');
    require('./util/localStorage');
    require('./util/mimeType');
    require('./util/newTab');
    require('./util/orientation');
    require('./util/position');
    require('./util/Queue');
    require('./util/Range');
    require('./util/string');
    require('./util/support');
    require('./util/swipe');
    require('./util/Timer');
    require('./util/touch');
    require('./util/trigger');
    require('./util/url');
    require('./util/validator');
    require('./util/Value');
    require('./util/visibility');
    require('./util/wheel');
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
        var updateItemActiveClass = function (action) {
            if (itemActiveClass) {
                processIndex(activeIndex, function (itemElement) {
                    if (itemElement[0] !== inputElement[0]) {
                        itemElement[action](itemActiveClass);
                    }
                });
            }
        };
        var updateInputValue = function () {
            processIndex(activeIndex, function (itemElement, itemData) {
                inputElement.val(itemData.text);
            });
        };
        var updateScrollPosition = function (fn) {
            processIndex(activeIndex, function (itemElement) {
                fn(menuElement, itemElement);
            });
        };
        var iterator = new Iterator({
            mainElement: inputElement,
            minIndex: me.option('includeInput') ? 0 : 1,
            defaultIndex: 0,
            step: 1,
            loop: me.option('loop'),
            prevKey: 'up',
            nextKey: 'down',
            interval: me.option('interval'),
            watchSync: {
                index: function (newIndex) {
                    updateItemActiveClass('removeClass');
                    activeIndex = newIndex;
                    updateItemActiveClass('addClass');
                }
            }
        });
        iterator.after('prev', function () {
            updateInputValue();
            updateScrollPosition(autoScrollUp);
        }).after('next', function () {
            updateInputValue();
            updateScrollPosition(autoScrollDown);
        });
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
            shortcut: {
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
            },
            watchSync: {
                value: function (value) {
                    iteratorData[0].data.text = value;
                    suggest();
                }
            }
        });
        var popup;
        var showMenuTrigger = me.option('showMenuTrigger');
        var hideMenuTrigger = me.option('hideMenuTrigger');
        if (showMenuTrigger && hideMenuTrigger) {
            popup = new Popup({
                triggerElement: inputElement,
                layerElement: menuElement,
                showLayerTrigger: showMenuTrigger,
                showLayerDelay: me.option('showMenuDelay'),
                hideLayerTrigger: hideMenuTrigger,
                hideLayerDelay: me.option('hideMenuDelay'),
                showLayerAnimation: function () {
                    me.execute('showMenuAnimation', { menuElement: menuElement });
                },
                hideLayerAnimation: function () {
                    me.execute('hideMenuAnimation', { menuElement: menuElement });
                },
                watchSync: {
                    opened: function (opened) {
                        this.state('opened', opened);
                    }
                }
            });
            popup.on('dispatch', function (e, data) {
                var event = e.originalEvent;
                var target = event.originalEvent.target;
                if (target) {
                    switch (event.type) {
                    case 'beforeopen':
                        if (contains(inputElement, target)) {
                            suggest();
                            return false;
                        }
                        break;
                    case 'beforeclose':
                        if (contains(inputElement, target) || contains(menuElement, target)) {
                            return false;
                        }
                        break;
                    }
                }
                me.emit(event, data, true);
            });
        } else {
            inputElement.on('blur', function () {
                iterator.stop();
            });
        }
        me.after('open', function () {
            iterator.set('maxIndex', iteratorData.length - 1);
        }).after('close', function () {
            iterator.stop();
            iterator.set('maxIndex', 0);
            mouseEnterElement = null;
        }).before('render', function () {
            iterator.stop();
        }).after('render', function () {
            iteratorData.length = 1;
            var maxIndex = 0;
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
                updateInputValue();
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
    proto.close = function () {
        this.state('opened', false);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('iterator').dispose();
        me.inner('input').dispose();
        var popup = me.inner('popup');
        if (popup) {
            popup.dispose();
        }
        me.option('menuElement').off(me.namespace());
    };
    lifeUtil.extend(proto, [
        'open',
        'close'
    ]);
    AutoComplete.propertyUpdater = {
        data: function () {
            this.render();
        }
    };
    AutoComplete.stateUpdater = {
        opened: function (opened) {
            var popup = this.inner('popup');
            if (popup) {
                if (opened) {
                    popup.open();
                } else {
                    popup.close();
                }
            }
        }
    };
    var ITEM_INDEX = '__index__';
    return AutoComplete;
});
define('cc/ui/Calendar', [
    'require',
    '../function/offsetWeek',
    '../function/offsetMonth',
    '../function/firstDateInWeek',
    '../function/lastDateInWeek',
    '../function/firstDateInMonth',
    '../function/lastDateInMonth',
    '../function/parseDate',
    '../function/simplifyDate',
    '../util/life',
    '../util/Value'
], function (require) {
    'use strict';
    var offsetWeek = require('../function/offsetWeek');
    var offsetMonth = require('../function/offsetMonth');
    var firstDateInWeek = require('../function/firstDateInWeek');
    var lastDateInWeek = require('../function/lastDateInWeek');
    var firstDateInMonth = require('../function/firstDateInMonth');
    var lastDateInMonth = require('../function/lastDateInMonth');
    var parseDate = require('../function/parseDate');
    var simplifyDate = require('../function/simplifyDate');
    var lifeUtil = require('../util/life');
    var Value = require('../util/Value');
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
            mainElement.on(clickType, itemSelector, function () {
                var value = $(this).attr(valueAttribute);
                var valueUtil = me.inner('value');
                if (valueUtil.has(value)) {
                    if (me.option('toggle')) {
                        valueUtil.remove(value);
                    }
                } else {
                    valueUtil.add(value);
                }
                me.set('value', valueUtil.get());
                me.sync();
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
        me.inner({
            main: mainElement,
            value: new Value({
                multiple: me.option('multiple'),
                validate: function (value) {
                    var date = me.execute('parse', value);
                    return $.type(date) === 'date';
                }
            })
        });
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
        me.inner('value').dispose();
    };
    lifeUtil.extend(proto);
    Calendar.propertyUpdater = {};
    Calendar.propertyUpdater.data = Calendar.propertyUpdater.date = Calendar.propertyUpdater.value = function (newValue, oldValue, change) {
        var me = this;
        var needRender;
        if (change.date) {
            var date = change.date.newValue;
            if (!inRange(me, date)) {
                needRender = true;
                me.set('data', createRenderData(me, date), { silent: true });
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
        me.inner('value').each(function (literal) {
            if (literal) {
                mainElement.find('[' + valueAttribute + '="' + literal + '"]').addClass(itemActiveClass);
            }
        });
        return false;
    };
    Calendar.propertyValidator = {
        value: function (value) {
            var valueUtil = this.inner('value');
            valueUtil.set(value);
            return valueUtil.get();
        }
    };
    var MODE_MONTH = 'month';
    var DAY = 24 * 60 * 60 * 1000;
    var stableDuration = 41 * DAY;
    function createRenderData(instance, date) {
        var firstDay = instance.option('firstDay');
        var today = normalizeDate(instance.get('today'));
        var startDate;
        var endDate;
        var isMonthMode = instance.option('mode') === MODE_MONTH;
        if (isMonthMode) {
            startDate = firstDateInWeek(firstDateInMonth(date), firstDay);
            endDate = lastDateInWeek(lastDateInMonth(date), firstDay);
        } else {
            startDate = firstDateInWeek(date, firstDay);
            endDate = lastDateInWeek(date, firstDay);
        }
        startDate = normalizeDate(startDate);
        endDate = normalizeDate(endDate);
        if (isMonthMode && instance.option('stable')) {
            var duration = endDate - startDate;
            var offset = stableDuration - duration;
            if (offset > 0) {
                endDate += offset;
            }
        }
        var values = {};
        instance.inner('value').each(function (literal) {
            if (literal) {
                var date = instance.execute('parse', literal);
                values[normalizeDate(date)] = 1;
            }
        });
        var list = createDatasource(startDate, endDate, today, values);
        return $.extend(simplifyDate(date), {
            start: list[0],
            end: list[list.length - 1],
            list: list
        });
    }
    function createDatasource(start, end, today, values) {
        var data = [];
        for (var time = start, item; time <= end; time += DAY) {
            item = simplifyDate(time);
            if (time > today) {
                item.phase = 'future';
            } else if (time < today) {
                item.phase = 'past';
            } else {
                item.phase = 'today';
            }
            if (values[time]) {
                item.active = true;
            }
            data.push(item);
        }
        return data;
    }
    function inRange(instance, date) {
        var data = instance.get('data');
        return data && date >= parseDate(data.start) && date < parseDate(data.end).getTime() + DAY;
    }
    function offsetCalendar(instance, offset) {
        var date = instance.get('date');
        date = instance.option('mode') === MODE_MONTH ? offsetMonth(date, offset) : offsetWeek(date, offset);
        instance.set({
            date: date,
            data: createRenderData(instance, date)
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
        if (me.option('autoPlay') && me.option('pauseOnHover')) {
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
                watchSync: {
                    index: function (index) {
                        me.set('index', index);
                    }
                }
            });
        }
        var iterator = new Iterator({
            interval: me.option('interval'),
            step: me.option('step'),
            loop: me.option('loop'),
            watchSync: {
                index: function (index) {
                    me.set('index', index);
                },
                minIndex: function (minIndex) {
                    me.set('minIndex', minIndex);
                },
                maxIndex: function (maxIndex) {
                    me.set('maxIndex', maxIndex);
                }
            }
        });
        var dispatchEvent = function (e, data) {
            me.emit(e, data);
        };
        $.each(exclude, function (index, name) {
            iterator.before(name, dispatchEvent).after(name, dispatchEvent);
        });
        me.inner({
            main: mainElement,
            switcher: switcher,
            iterator: iterator
        });
        me.set({
            index: me.option('index'),
            minIndex: me.option('minIndex'),
            maxIndex: me.option('maxIndex')
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
    var exclude = [
        'prev',
        'next',
        'play',
        'pause'
    ];
    lifeUtil.extend(proto, exclude);
    Carousel.propertyUpdater = {
        index: function (index, oldIndex) {
            var me = this;
            var mainElement = me.inner('main');
            me.inner('iterator').set('index', index);
            var switcher = me.inner('switcher');
            if (switcher) {
                switcher.set('index', index);
                me.execute('navAnimation', {
                    mainElement: mainElement,
                    navSelector: me.option('navSelector'),
                    navActiveClass: me.option('navActiveClass'),
                    fromIndex: oldIndex,
                    toIndex: index
                });
            }
            me.execute('itemAnimation', {
                mainElement: mainElement,
                itemSelector: me.option('itemSelector'),
                itemActiveClass: me.option('itemActiveClass'),
                fromIndex: oldIndex,
                toIndex: index
            });
            if (me.option('autoPlay')) {
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
                var items = this.inner('main').find(this.option('itemSelector'));
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
            showLayerAnimation: function () {
                me.execute('showMenuAnimation', { menuElement: menuElement });
            },
            hideLayerAnimation: function () {
                me.execute('hideMenuAnimation', { menuElement: menuElement });
            },
            watchSync: {
                opened: function (opened) {
                    me.state('opened', opened);
                }
            }
        });
        popup.on('dispatch', function (e, data) {
            me.emit(e.originalEvent, data, true);
        });
        var menuActiveClass = me.option('menuActiveClass');
        if (menuActiveClass) {
            var element = mainElement || menuElement;
            popup.after('open', function () {
                element.addClass(menuActiveClass);
            }).after('close', function () {
                element.removeClass(menuActiveClass);
            });
        }
        var itemSelector = me.option('itemSelector');
        var valueAttribute = me.option('valueAttribute');
        menuElement.on('click' + me.namespace(), itemSelector, function (e) {
            if (me.is('opened')) {
                me.close(e);
            }
            if (e.isDefaultPrevented()) {
                return;
            }
            me.set('value', $(this).attr(valueAttribute));
            var event = $.Event(e.originalEvent);
            event.type = 'select';
            me.emit(event, true);
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
    proto.close = function () {
        this.state('opened', false);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('popup').dispose();
        me.option('menuElement').off(me.namespace());
    };
    lifeUtil.extend(proto, [
        'open',
        'close'
    ]);
    ComboBox.propertyUpdater = {};
    ComboBox.propertyUpdater.data = ComboBox.propertyUpdater.value = function (newValue, oldValue, change) {
        var me = this;
        var menuElement = me.option('menuElement');
        var itemActiveClass = me.option('itemActiveClass');
        var textAttribute = me.option('textAttribute');
        var valueAttribute = me.option('valueAttribute');
        if (change.data) {
            this.render();
        } else if (change.value && itemActiveClass) {
            menuElement.find('.' + itemActiveClass).removeClass(itemActiveClass);
        }
        var text;
        var value = toString(me.get('value'), null);
        if (value != null) {
            var getText = function (element) {
                text = element.attr(textAttribute);
                if (text == null) {
                    text = element.html();
                }
                return text;
            };
            if (value !== '') {
                var itemElement = menuElement.find('[' + valueAttribute + '="' + value + '"]');
                switch (itemElement.length) {
                case 1:
                    if (itemActiveClass) {
                        itemElement.addClass(itemActiveClass);
                    }
                    text = getText(itemElement);
                    break;
                case 0:
                    break;
                default:
                    me.error('value repeated.');
                    break;
                }
            } else {
                menuElement.find('[' + valueAttribute + ']').each(function () {
                    var target = $(this);
                    var value = target.attr(valueAttribute);
                    if (value === '') {
                        text = getText(target);
                        return false;
                    }
                });
            }
        }
        me.execute('setText', {
            buttonElement: me.option('buttonElement'),
            text: text || me.option('defaultText')
        });
        return false;
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
            var popup = this.inner('popup');
            if (opened) {
                popup.open();
            } else {
                popup.close();
            }
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
    var body = require('../util/instance').body;
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
            opened: false,
            layerElement: mainElement,
            hideLayerTrigger: 'click,context',
            showLayerAnimation: function () {
                me.execute('showAnimation', { mainElement: mainElement });
            },
            hideLayerAnimation: function () {
                me.execute('hideAnimation', { mainElement: mainElement });
            },
            watchSync: {
                opened: function (opened) {
                    me.state('hidden', !opened);
                }
            }
        });
        popup.on('dispatch', function (e, data) {
            var event = e.originalEvent;
            var type = event.type;
            switch (type) {
            case 'beforeopen':
                type = 'beforeshow';
                break;
            case 'afteropen':
                type = 'aftershow';
                break;
            case 'beforeclose':
                type = 'beforehide';
                break;
            case 'afterclose':
                type = 'afterhide';
                break;
            }
            event.type = type;
            me.emit(event, data, true);
        });
        me.inner({
            popup: popup,
            main: mainElement
        });
        var containerElement = me.option('containerElement') || body;
        containerElement.on('contextmenu' + namespace, function (e) {
            if (activeMenu) {
                activeMenu.inner('popup').close(e);
            }
            contextEvent = e;
            activeMenu = me;
            popup.open(e);
            var pos = eventPage(e);
            pin({
                element: mainElement,
                x: 0,
                y: 0,
                attachment: {
                    element: body,
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
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto.dispose = function () {
        var me = this;
        lifeUtil.dispose(me);
        me.inner('popup').dispose();
        me.option('containerElement').off(me.namespace());
        if (activeMenu === me) {
            activeMenu = null;
        }
    };
    lifeUtil.extend(proto, [
        'show',
        'hide'
    ]);
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
        $.each([
            'content',
            'footer'
        ], function (index, name) {
            var value = me.option(name);
            var selector = me.option(name + 'Selector');
            if (value) {
                mainElement.find(selector).html(value);
            } else if (removeOnEmpty) {
                mainElement.find(selector).remove();
            }
        });
        var title = me.option('title');
        if (title) {
            mainElement.find(me.option('titleSelector')).html(title);
        } else if (removeOnEmpty) {
            mainElement.find(me.option('headerSelector')).remove();
        }
        var closeSelector = me.option('closeSelector');
        if (me.option('removeClose')) {
            mainElement.find(closeSelector).remove();
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
        if (closeSelector) {
            mainElement.on(clickType, closeSelector, hideHandler);
        }
        if (me.option('disposeOnHide')) {
            me.on('statechange', function (e, change) {
                var hidden = change.hidden;
                if (hidden && hidden.newValue === true && hidden.oldValue === false) {
                    me.dispose();
                }
            });
        }
        if (maskElement) {
            if (me.option('hideOnClickMask')) {
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
        var hidden = me.option('hidden');
        if (hidden) {
            me.hide();
        } else {
            me.show();
        }
    };
    proto.show = function () {
        this.state('hidden', false);
    };
    proto._show = function () {
        if (this.is('hidden') === false) {
            return false;
        }
    };
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto._hide = function () {
        if (this.is('hidden') === true) {
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
            if (me.option('removeOnDispose')) {
                maskElement.remove();
            }
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
                        includeSelector: me.option('draggableIncludeSelector'),
                        excludeSelector: me.option('draggableExcludeSelector'),
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
            mainElement.on('click' + me.namespace(), pageSelector, function (e) {
                var page = $(this).attr(pageAttribute);
                if (page >= FIRST_PAGE) {
                    me.set('page', page);
                    var event = $.Event(e.originalEvent);
                    event.type = 'select';
                    me.emit(event, true);
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
        var ellipsisTemplate = me.option('ellipsisTemplate');
        var datasource = [];
        var start = Math.max(FIRST_PAGE, page - Math.ceil(showCount / 2));
        var end = Math.min(count, start + showCount - 1);
        if (end === count && end - start < showCount) {
            start = Math.max(FIRST_PAGE, end - showCount + 1);
        }
        datasource.push({
            range: [
                start,
                end
            ],
            tpl: pageTemplate
        });
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
        var html = $.map(datasource, function (item) {
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
        this.set('page', this.get('page') - 1);
    };
    proto._prev = function () {
        if (this.get('page') > FIRST_PAGE) {
        } else {
            return false;
        }
    };
    proto.next = function () {
        this.set('page', this.get('page') + 1);
    };
    proto._next = function () {
        if (this.get('page') < this.get('count')) {
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
            this.execute(hidden ? 'hideAnimation' : 'showAnimation', { mainElement: this.inner('main') });
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
            var value = target.attr(me.option('valueAttribute'));
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
        value = toNumber(value, -1);
        if (value < 0) {
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
    Rater.propertyUpdater.value = Rater.propertyUpdater.count = function (newValue, oldValue, change) {
        var me = this;
        if (change.count) {
            me.render();
        } else {
            var value = change.value;
            if (value) {
                refresh(me, value.newValue);
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
        traverse(value, instance.get('count'), function (index, score) {
            var element = items.eq(index);
            if (itemActiveClass) {
                element[score === 1 ? 'addClass' : 'removeClass'](itemActiveClass);
            }
            if (itemHalfClass) {
                element[score === 0.5 ? 'addClass' : 'removeClass'](itemHalfClass);
            }
        });
    }
    function traverse(value, count, callback) {
        for (var i = 0, result, score; i < count; i++) {
            result = value - (i + 1);
            if (result >= 0) {
                score = 1;
            } else if (result <= -1) {
                score = 0;
            } else {
                score = 0.5;
            }
            callback(i, score);
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
            watchSync: {
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
    '../helper/Draggable',
    '../util/life',
    '../util/wheel',
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
    var Draggable = require('../helper/Draggable');
    var lifeUtil = require('../util/life');
    var wheelUtil = require('../util/wheel');
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
            init: function (options) {
                $.each(touchUtil, function (type, item) {
                    if (!item.support) {
                        return;
                    }
                    thumbElement.on(item.down + namespace, function (e) {
                        if (!options.downHandler(e)) {
                            return;
                        }
                        document.off(namespace).on(item.move + namespace, options.moveHandler).on(item.up + namespace, function () {
                            options.upHandler();
                            document.off(namespace);
                        });
                    });
                });
            },
            dragAnimation: function (options) {
                setPixel(options.mainStyle[props.position], 'drag');
            }
        });
        var dispatchEvent = function (e, data) {
            me.emit(e, data);
        };
        drager.on('beforedrag', dispatchEvent).on('drag', dispatchEvent).on('afterdrag', dispatchEvent);
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
            var addWheel = function (element) {
                wheelUtil.init(element);
                element.on(wheelUtil.WHEEL, wheelHandler);
                wheels.push(element);
            };
            addWheel(trackElement);
            var scrollElement = me.option('scrollElement');
            if (scrollElement) {
                addWheel(scrollElement);
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
            $.each(wheels, function (index, element) {
                wheelUtil.dispose(element);
            });
        }
    };
    lifeUtil.extend(proto);
    Slider.propertyUpdater = {
        value: function (newValue, oldValue, change) {
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
            var value = change.value;
            if (value.action) {
                options.action = value.action;
            }
            me.execute('slideAnimation', options);
        }
    };
    Slider.propertyValidator = {
        value: function (value) {
            var minValue = this.option('minValue');
            var maxValue = this.option('maxValue');
            return restrain(toNumber(value, minValue), minValue, maxValue);
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
            mainElement: inputElement,
            index: me.option('value'),
            minIndex: me.option('minValue'),
            maxIndex: me.option('maxValue'),
            interval: me.option('interval'),
            step: step,
            prevKey: 'down',
            nextKey: 'up',
            watchSync: {
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
            watchSync: {
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
        var mainElement = me.option('mainElement');
        var triggerElement = me.option('triggerElement');
        var triggerSelector = me.option('triggerSelector');
        if (!triggerElement && !triggerSelector) {
            me.error('triggerElement\u3001triggerSelector 至少传一个吧\uFF01');
        }
        var popup = new Popup({
            layerElement: mainElement,
            triggerElement: triggerElement,
            triggerSelector: triggerSelector,
            showLayerTrigger: me.option('showTrigger'),
            showLayerDelay: me.option('showDelay'),
            hideLayerTrigger: me.option('hideTrigger'),
            hideLayerDelay: me.option('hideDelay'),
            showLayerAnimation: function () {
                me.execute('showAnimation', { mainElement: mainElement });
            },
            hideLayerAnimation: function () {
                me.execute('hideAnimation', { mainElement: mainElement });
            },
            watchSync: {
                opened: function (opened) {
                    me.state('hidden', !opened);
                }
            }
        });
        var namespace = me.namespace();
        popup.on('dispatch', function (e, data) {
            var event = e.originalEvent;
            var type = event.type;
            switch (type) {
            case 'beforeopen':
                return false;
                break;
            case 'afteropen':
                type = 'aftershow';
                break;
            case 'beforeclose':
                type = 'beforehide';
                break;
            case 'afterclose':
                type = 'afterhide';
                window.off(namespace);
                break;
            }
            event.type = type;
            me.emit(event, data, true);
        }).before('open', function (e, data) {
            var event = data && data.event;
            if (!event) {
                return;
            }
            var skinClass = me.inner('skinClass');
            if (skinClass) {
                mainElement.removeClass(skinClass);
            }
            var placement = me.inner('placement');
            if (placement) {
                mainElement.removeClass(me.option(placement + 'Class'));
            }
            var maxWidth = me.inner('maxWidth');
            if (maxWidth) {
                mainElement.css('max-width', '');
            }
            triggerElement = $(event.currentTarget);
            me.inner('trigger', triggerElement);
            var skinAttribute = me.option('skinAttribute');
            var placementAttribute = me.option('placementAttribute');
            var maxWidthAttribute = me.option('maxWidthAttribute');
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
            var clean = function () {
                me.inner({
                    skinClass: null,
                    placement: null,
                    maxWidth: null
                });
            };
            if (!placement) {
                clean();
                return false;
            }
            var update = function () {
                var event = $.Event(data.event.originalEvent);
                event.type = 'beforeshow';
                me.emit(event, true);
                if (event.isDefaultPrevented()) {
                    clean();
                    return;
                }
                mainElement.addClass(me.option(placement + 'Class'));
                skinClass = '';
                if (skinAttribute) {
                    skinClass = triggerElement.attr(skinAttribute);
                    if (skinClass) {
                        mainElement.addClass(skinClass);
                    }
                }
                maxWidth = '';
                if (maxWidthAttribute) {
                    maxWidth = triggerElement.attr(maxWidthAttribute);
                }
                if (!maxWidth) {
                    maxWidth = me.option('maxWidth');
                }
                if (maxWidth) {
                    mainElement.css('max-width', maxWidth);
                }
                me.inner({
                    skinClass: skinClass,
                    placement: placement,
                    maxWidth: maxWidth
                });
                me.pin();
                window.on('resize' + namespace, debounce(function () {
                    if (me.$) {
                        me.pin();
                    }
                }, 50));
            };
            var promise = me.execute('update', {
                mainElement: mainElement,
                triggerElement: triggerElement
            });
            if (promise && $.isFunction(promise.then)) {
                promise.then(update);
            } else {
                update();
            }
        });
        me.inner({
            main: mainElement,
            popup: popup
        });
    };
    proto.show = function () {
        this.state('hidden', false);
    };
    proto.hide = function () {
        this.state('hidden', true);
    };
    proto.pin = function () {
        var me = this;
        var mainElement = me.inner('main');
        var options = {
            element: mainElement,
            attachment: me.inner('trigger'),
            offsetX: toNumber(me.option('gapX'), 0),
            offsetY: toNumber(me.option('gapY'), 0)
        };
        var placement = me.inner('placement');
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
    lifeUtil.extend(proto, [
        'show',
        'hide'
    ]);
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
        var triggerElement = this.inner('trigger');
        return triggerElement.offset().left > mainElement.outerWidth();
    }
    function testRight() {
        var mainElement = this.inner('main');
        var triggerElement = this.inner('trigger');
        return pageWidth() > triggerElement.offset().left + triggerElement.outerWidth() + mainElement.outerWidth();
    }
    function testTop() {
        var mainElement = this.inner('main');
        var triggerElement = this.inner('trigger');
        return triggerElement.offset().top > mainElement.outerHeight();
    }
    function testBottom() {
        var mainElement = this.inner('main');
        var triggerElement = this.inner('trigger');
        return pageHeight() > triggerElement.offset().top + triggerElement.outerHeight() + mainElement.outerHeight();
    }
    var placementMap = {
        bottom: {
            name: 'bottom',
            test: [testBottom],
            gap: function (options) {
                options.offsetX = 0;
            }
        },
        top: {
            name: 'top',
            test: [testTop],
            gap: function (options) {
                options.offsetY *= -1;
                options.offsetX = 0;
            }
        },
        right: {
            name: 'right',
            test: [testRight],
            gap: function (options) {
                options.offsetY = 0;
            }
        },
        left: {
            name: 'left',
            test: [testLeft],
            gap: function (options) {
                options.offsetX *= -1;
                options.offsetY = 0;
            }
        }
    };
    function getPlacementList(placement) {
        var result = [];
        $.each(split(placement, ','), function (index, name) {
            if (placementMap[name]) {
                result.push(name);
            } else if (name === 'auto') {
                $.each(placementMap, function (name) {
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
        var idAttribute = instance.option('idAttribute');
        var labelSelector = me.option('labelSelector');
        if (labelSelector) {
            mainElement.on(clickType, labelSelector, function () {
                var nodeElement = findNodeElement(me, $(this));
                me.select(nodeElement.attr(idAttribute));
            });
        }
        var toggleSelector = me.option('toggleSelector');
        var nodeSelector = me.option('nodeSelector');
        if (toggleSelector) {
            var expandedClass = me.option('expandedClass');
            mainElement.on(clickType, toggleSelector, function () {
                var nodeElement = findNodeElement(me, $(this));
                if (nodeElement) {
                    var id = nodeElement.attr(idAttribute);
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
    proto.unselect = function () {
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
        var nodeElement;
        if (id.jquery) {
            nodeElement = id;
        } else {
            var idAttribute = instance.option('idAttribute');
            if (id || id === 0) {
                nodeElement = mainElement.find('[' + idAttribute + '="' + id + '"]');
            } else {
                mainElement.find('[' + idAttribute + ']').each(function () {
                    var target = $(this);
                    var value = target.attr(idAttribute);
                    if (value === '') {
                        nodeElement = target;
                        return false;
                    }
                });
            }
        }
        if (nodeElement && nodeElement.length === 1) {
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
            init: function (options) {
                var enterType = 'mouseenter' + namespace;
                var leaveType = 'mouseleave' + namespace;
                var delayTimer;
                var clearTimer = function () {
                    if (delayTimer) {
                        clearTimeout(delayTimer);
                        delayTimer = null;
                    }
                };
                var leaveHandler = function () {
                    delayTimer = setTimeout(function () {
                        delayTimer = null;
                        options.upHandler();
                        document.off(namespace);
                    }, 50);
                };
                thumbnailElement.on(enterType, function () {
                    if (delayTimer) {
                        clearTimer();
                        return;
                    }
                    var data = {
                        offsetX: finderWidth / 2,
                        offsetY: finderHeight / 2
                    };
                    if (!options.downHandler(data)) {
                        return;
                    }
                    thumbnailOffset = thumbnailElement.position();
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
        $.extend(this, options);
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
            list.shift();
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
    return FiniteArray;
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
        var list = me.list;
        list.push(item);
        if (!$.isFunction(me.waiting)) {
            var waiting = function () {
                me.waiting = null;
                remove();
            };
            var remove = function () {
                if (me.list) {
                    var item = list.shift();
                    if (item) {
                        me.waiting = waiting;
                        me.process(item, waiting);
                    }
                }
            };
            remove();
        }
    };
    proto.size = function () {
        return this.list.length;
    };
    proto.clear = function () {
        this.list.length = 0;
    };
    proto.dispose = function () {
        this.list = this.waiting = null;
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
    function Range(options) {
        var element = options.element;
        if (element.jquery) {
            element = element[0];
        }
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
        range.moveEnd('character', end - start);
        range.select();
    }
    return Range;
});
define('cc/util/Timer', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    function Timer(options) {
        $.extend(this, options);
    }
    var proto = Timer.prototype;
    proto.start = function () {
        var me = this;
        me.stop();
        var interval = me.interval;
        var next = function () {
            me.task();
            me.timer = setTimeout(next, interval);
        };
        me.timer = setTimeout(next, interval);
    };
    proto.startDelay = function (delay) {
        var me = this;
        setTimeout(function () {
            if (me.task) {
                me.start();
            }
        }, delay);
    };
    proto.stop = function () {
        var me = this;
        if (me.timer) {
            clearTimeout(me.timer);
            me.timer = null;
        }
    };
    proto.dispose = function () {
        var me = this;
        me.stop();
        me.task = me.interval = null;
    };
    return Timer;
});
define('cc/util/Value', [
    'require',
    'exports',
    'module',
    '../function/split'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    function Value(options) {
        $.extend(this, Value.defaultOptions, options);
        this.init();
    }
    var proto = Value.prototype;
    proto.init = function () {
        this.list = [];
    };
    proto.get = function () {
        return this.list.join(this.sep);
    };
    proto.set = function (value) {
        var me = this;
        me.list.length = 0;
        $.each(split(value, me.sep), function (index, literal) {
            me.add(literal);
        });
    };
    proto.add = function (value) {
        var me = this;
        var list = me.list;
        var index = $.inArray(value, list);
        if (index < 0) {
            if (!me.validate || me.validate(value)) {
                list.push(value);
            } else {
                return;
            }
        } else {
            return;
        }
        if (list.length > 1) {
            if (!me.multiple) {
                list[0] = list.pop();
                list.length = 1;
            } else if (me.sort) {
                list.sort(me.sort);
            }
        }
    };
    proto.remove = function (value) {
        var list = this.list;
        var index = $.inArray(value, list);
        if (index >= 0) {
            list.splice(index, 1);
        }
    };
    proto.has = function (value) {
        return $.inArray(value, this.list) >= 0;
    };
    proto.each = function (fn) {
        $.each(this.list, function (index, value) {
            return fn(value, index);
        });
    };
    proto.dispose = function () {
        this.list = null;
    };
    Value.defaultOptions = {
        sep: ',',
        sort: function (a, b) {
            if (a > b) {
                return 1;
            } else if (a < b) {
                return -1;
            } else {
                return 0;
            }
        }
    };
    return Value;
});
define('cc/util/browser', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var list = [
        [
            'ie',
            /iemobile[ \/]([\d_.]+)/
        ],
        [
            'ie',
            /msie[ \/]([\d_.]+)/
        ],
        [
            'ie',
            /trident[ \/]([\d_.]+)/,
            4
        ],
        [
            'chrome',
            /chrome[ \/]([\d_.]+)/
        ],
        [
            'firefox',
            /firefox[ \/]([\d_.]+)/
        ],
        [
            'opera',
            /opera(?:.*version)?[ \/]([\d_.]+)/
        ],
        [
            'safari',
            /version[ \/]([\d_.]+) safari/
        ]
    ];
    function parseUA(ua) {
        var name;
        var version;
        $.each(list, function (index, item) {
            var match = item[1].exec(ua);
            if (match) {
                name = item[0];
                version = match[1];
                if (version) {
                    version = version.replace(/_/g, '.');
                    if (item[2]) {
                        version = parseInt(version, 10) + item[2] + '.0';
                    }
                }
                return false;
            }
        });
        return {
            name: name || '',
            version: version || ''
        };
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
    'module',
    '../function/split',
    '../function/offsetDate'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    var offsetHour = require('../function/offsetDate');
    function parse(cookieStr) {
        if (cookieStr.indexOf('"') === 0) {
            cookieStr = cookieStr.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        var result = {};
        try {
            cookieStr = decodeURIComponent(cookieStr.replace(/\+/g, ' '));
            $.each(split(cookieStr, ';'), function (index, part) {
                var terms = split(part, '=');
                var key = terms[0];
                var value = terms[1];
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
            expires = offsetHour(new Date(), expires);
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
        options = options || {};
        options.expires = -1;
        setCookie(key, '', $.extend({}, exports.defaultOptions, options));
    };
    exports.defaultOptions = {};
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
    '../function/guid',
    '../function/around',
    '../function/supportInput'
], function (require, exports, module) {
    'use strict';
    var guid = require('../function/guid');
    var around = require('../function/around');
    var supportInput = require('../function/supportInput');
    var DATA_KEY = 'cc-util-input';
    var EVENT_INPUT = 'cc-input';
    function bindInput(element) {
        var namespace = '.' + guid();
        element.data(DATA_KEY, namespace).on('input' + namespace, function (e) {
            e.type = EVENT_INPUT;
            element.trigger(e);
        });
    }
    function bindPropertyChange(element) {
        var oldValue = element.val();
        var changeByVal = false;
        var namespace = '.' + guid();
        element.data(DATA_KEY, namespace).on('propertychange' + namespace, function (e) {
            if (changeByVal) {
                changeByVal = false;
                return;
            }
            if (e.originalEvent.propertyName === 'value') {
                var newValue = element.val();
                if (newValue !== oldValue) {
                    e.type = EVENT_INPUT;
                    element.trigger(e);
                    if (!e.isDefaultPrevented()) {
                        oldValue = newValue;
                    }
                }
            }
        });
        around(element, 'val', function () {
            if (arguments.length !== 0) {
                changeByVal = true;
            }
        });
    }
    exports.INPUT = EVENT_INPUT;
    exports.init = supportInput() ? bindInput : bindPropertyChange;
    exports.dispose = function (element) {
        var namespace = element.data(DATA_KEY);
        if (namespace) {
            element.removeData(DATA_KEY).off(namespace);
        }
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
        var rx_one = /^[\],:{}\s]*$/, rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, rx_four = /(?:^|:|,)(?:\s*\[)+/g, rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        function f(n) {
            return n < 10 ? '0' + n : n;
        }
        function this_value() {
            return this.valueOf();
        }
        if (typeof Date.prototype.toJSON !== 'function') {
            Date.prototype.toJSON = function () {
                return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;
            };
            Boolean.prototype.toJSON = this_value;
            Number.prototype.toJSON = this_value;
            String.prototype.toJSON = this_value;
        }
        var gap, indent, meta, rep;
        function quote(string) {
            rx_escapable.lastIndex = 0;
            return rx_escapable.test(string) ? '"' + string.replace(rx_escapable, function (a) {
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
                rx_dangerous.lastIndex = 0;
                if (rx_dangerous.test(text)) {
                    text = text.replace(rx_dangerous, function (a) {
                        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                    });
                }
                if (rx_one.test(text.replace(rx_two, '@').replace(rx_three, ']').replace(rx_four, ''))) {
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
    '../function/toBoolean',
    '../function/createEvent',
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
    var toBoolean = require('../function/toBoolean');
    var createEvent = require('../function/createEvent');
    var replaceWith = require('../function/replaceWith');
    var offsetParent = require('../function/offsetParent');
    var body = require('./instance').body;
    var instances = {};
    var UPDATE_ASYNC = '__update_async__';
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
            record.newValue = value;
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
            var watchSync = me.option('watchSync');
            if (watchSync && watchSync[name]) {
                me.execute(watchSync[name], [
                    value,
                    oldValue,
                    record
                ]);
            }
            if (!me.inner(UPDATE_ASYNC)) {
                me.inner(UPDATE_ASYNC, nextTick(function () {
                    me.sync(UPDATE_ASYNC);
                }));
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
            var parentSelector = me.option('parentSelector');
            if (parentSelector && !mainElement.parent().is(parentSelector)) {
                mainElement.appendTo(parentSelector);
            }
            me.initStruct = function () {
                me.error('initStruct() can just call one time.');
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
        live: function (event, selector, handler) {
            var me = this;
            var mainElement = me.inner('main');
            if (mainElement) {
                mainElement.on(event + me.namespace(), selector, handler);
            }
            return me;
        },
        emit: function (event, data, dispatch) {
            var me = this;
            var context = me.option('context') || me;
            event = createEvent(event);
            event.cc = context;
            var args = [event];
            if ($.isPlainObject(data)) {
                args.push(data);
            } else if (data === true && arguments.length === 2) {
                data = null;
                dispatch = true;
            }
            event.type = event.type.toLowerCase();
            context.$.trigger.apply(context.$, args);
            var ontype = 'on' + event.type;
            if (event.type !== 'dispatch') {
                context.execute('ondebug', args);
            }
            if (!event.isPropagationStopped() && context.execute(ontype, args) === false) {
                event.preventDefault();
                event.stopPropagation();
            }
            context.execute(ontype + '_', args);
            if (dispatch && !event.isPropagationStopped()) {
                if (!event.originalEvent) {
                    event.originalEvent = {
                        preventDefault: $.noop,
                        stopPropagation: $.noop
                    };
                }
                var dispatchEvent = $.Event(event);
                dispatchEvent.type = 'dispatch';
                me.emit(dispatchEvent, data);
                if (dispatchEvent.isPropagationStopped()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
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
            if (!renderSelector || !renderTemplate) {
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
            return toBoolean(value, false);
        }),
        get: function (name) {
            return this.properties[name];
        },
        set: createSettter('property', 'properties', 'set', 'get')
    };
    var aspectMethods = {
        sync: function () {
            var me = this;
            var update = function (changes, updater, complex) {
                $.each(changes, function (name, change) {
                    me.execute(updater[name], [
                        change.newValue,
                        change.oldValue,
                        complex ? changes : change
                    ]);
                });
            };
            $.each([
                'property',
                'state'
            ], function (index, key) {
                var changes = me.inner(key + 'Changes');
                if (changes) {
                    me.inner(key + 'Changes', null);
                    var staticUpdater = me.constructor[key + 'Updater'];
                    if (staticUpdater) {
                        update(changes, staticUpdater, true);
                    }
                    var watch = me.option('watch');
                    if (watch) {
                        update(changes, watch);
                    }
                    me.emit(key + 'change', changes);
                }
            });
            if (arguments[0] !== UPDATE_ASYNC) {
                me.inner(UPDATE_ASYNC)();
            }
            me.inner(UPDATE_ASYNC, false);
        },
        _sync: function () {
            if (!this.inner(UPDATE_ASYNC)) {
                return false;
            }
        }
    };
    function executeAspect(instance, name, args, type, event) {
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
        var dispatch = false;
        if (result && result.dispatch) {
            dispatch = true;
            delete result.dispatch;
        }
        event = $.Event(event);
        event.type = type + name;
        instance.emit(event, result, dispatch);
        if (event.isDefaultPrevented()) {
            return false;
        }
    }
    exports.extend = function (proto, exclude) {
        extend(proto, aspectMethods);
        $.each(proto, function (name, method) {
            var index = name.indexOf('_');
            if (!$.isFunction(method) || index === 0 || index === name.length - 1) {
                return;
            }
            if ($.isArray(exclude) && $.inArray(name, exclude) >= 0) {
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
            nextTick(function () {
                delete instances[instance.guid];
                instance.properties = instance.options = instance.changes = instance.states = instance.inners = instance.guid = instance.$ = null;
            });
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
        var mainElement = instance.inner('main');
        if (mainElement) {
            mainElement.off();
        }
    };
});
define('cc/util/localStorage', [
    'require',
    'exports',
    'module',
    '../function/supportLocalStorage'
], function (require, exports, module) {
    'use strict';
    var support = require('../function/supportLocalStorage')();
    function set(key, value) {
        if ($.isPlainObject(key)) {
            $.each(key, set);
        } else {
            try {
                localStorage[key] = value;
            } catch (e) {
            }
        }
    }
    function get(key) {
        var result;
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
    if (support) {
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
define('cc/util/newTab', [
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
    exports.byForm = function (url, charset) {
        var formElement = createForm(url, charset);
        formElement.appendTo('body').submit().remove();
    };
    exports.byLink = function (url) {
        var linkElement = $('<a href="' + url + '" target="_blank"></a>');
        linkElement.appendTo('body');
        try {
            linkElement[0].click();
        } catch (e) {
            exports.openForm(url);
        }
        linkElement.remove();
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
    exports.top = function (options) {
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
    exports.left = function (options) {
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
    exports.center = function (options) {
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
    exports.right = function (options) {
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
    exports.bottom = function (options) {
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
    exports.size = function (str) {
        var result = 0;
        if ($.type(str) === 'string') {
            traverse(str, function (length) {
                result = length;
            });
        }
        return result;
    };
    exports.cut = function (str, length, suffix) {
        if ($.type(length) !== 'number' || exports.size(str) <= length) {
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
define('cc/util/support', [
    'require',
    'exports',
    'module',
    '../function/supportWebSocket',
    '../function/supportLocalStorage',
    '../function/supportFlash',
    '../function/supportCanvas',
    '../function/supportPlaceholder',
    '../function/supportInput'
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
    exports.animation = function () {
        return testCSS('animationName');
    };
    exports.boxShadow = function () {
        return testCSS('boxShadow');
    };
    exports.flexbox = function () {
        return testCSS('flexWrap');
    };
    exports.transform = function () {
        return testCSS('transform');
    };
    exports.webSocket = require('../function/supportWebSocket');
    exports.localStorage = require('../function/supportLocalStorage');
    exports.flash = require('../function/supportFlash');
    exports.canvas = require('../function/supportCanvas');
    exports.placeholder = require('../function/supportPlaceholder');
    exports.input = require('../function/supportInput');
});
define('cc/util/swipe', [
    'require',
    'exports',
    'module',
    '../function/guid'
], function (require, exports, module) {
    'use strict';
    var guid = require('../function/guid');
    var DATA_KEY = 'cc-util-swipe';
    var EVENT_SWIPE = 'cc-swipe';
    var EVENT_SWIPING = 'cc-swiping';
    function getPoint(e) {
        e = e.originalEvent;
        var touches = e.changedTouches || e.touches;
        if (touches.length === 1) {
            return touches[0];
        }
    }
    exports.SWIPE = EVENT_SWIPE;
    exports.SWIPING = EVENT_SWIPING;
    exports.init = function (element) {
        var namespace = '.' + guid();
        var trigger = function (e, type, point) {
            var x = point.pageX - start.x;
            var y = point.pageY - start.y;
            e.type = type;
            element.trigger(e, {
                x: x,
                y: y
            });
        };
        var start = {};
        var eventGroup = {};
        var touchEndTimer;
        eventGroup['touchmove' + namespace] = function (e) {
            var point = getPoint(e);
            if (point) {
                trigger(e, EVENT_SWIPING, point);
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
                trigger(e, EVENT_SWIPE, point);
            }
            element.off(eventGroup);
        };
        element.data(DATA_KEY, namespace).on('touchstart' + namespace, function (e) {
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
        var namespace = element.data(DATA_KEY);
        if (namespace) {
            element.removeData(DATA_KEY).off(namespace);
        }
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
            var action = function () {
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
            var beforeHandler = options.beforeHandler;
            if ($.isFunction(beforeHandler)) {
                var result = beforeHandler.call(e.currentTarget, e);
                if (result === false) {
                    return;
                } else if (result && $.isFunction(result.then)) {
                    result.then(action);
                    return;
                }
            }
            action();
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
    'module',
    '../function/split'
], function (require, exports, module) {
    'use strict';
    var split = require('../function/split');
    exports.parseQuery = function (queryStr) {
        var result = {};
        if ($.type(queryStr) === 'string' && queryStr.indexOf('=') >= 0) {
            var startIndex = queryStr.charAt(0) === '?' ? 1 : 0;
            if (startIndex > 0) {
                queryStr = queryStr.substr(startIndex);
            }
            queryStr = queryStr.split('#')[0];
            $.each(split(queryStr, '&'), function (index, item) {
                var terms = split(item, '=');
                if (terms.length === 2) {
                    var key = terms[0];
                    if (key) {
                        result[key] = decodeURIComponent(terms[1]);
                    }
                }
            });
        }
        return result;
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
            search: link.search,
            hash: link.hash
        };
    };
});
define('cc/util/validator', [
    'require',
    'exports',
    'module'
], function (require, exports, module) {
    'use strict';
    var buildInRules = {
        required: function (data, rules) {
            if (data.value) {
                return true;
            } else if (rules.required) {
                return false;
            }
        },
        pattern: function (data, rules) {
            var pattern = rules.pattern;
            if ($.type(pattern) === 'string') {
                pattern = buildInPatterns[pattern];
            }
            if (pattern instanceof RegExp) {
                return pattern.test(data.value);
            }
        },
        minlength: function (data, rules) {
            if ($.isNumeric(rules.minlength)) {
                return data.value.length >= +rules.minlength;
            }
        },
        maxlength: function (data, rules) {
            if ($.isNumeric(rules.maxlength)) {
                return data.value.length <= +rules.maxlength;
            }
        },
        min: function (data, rules) {
            if ($.isNumeric(rules.min)) {
                return data.value >= +rules.min;
            }
        },
        max: function (data, rules) {
            if ($.isNumeric(rules.max)) {
                return data.value <= +rules.max;
            }
        },
        step: function (data, rules) {
            var min = rules.min;
            var step = rules.step;
            if ($.isNumeric(min) && $.isNumeric(step)) {
                return (data.value - min) % step === 0;
            }
        },
        equals: function (data, rules, all) {
            var equals = rules.equals;
            if (equals) {
                return data.value === all[equals].value;
            }
        }
    };
    var buildInPatterns = {
        int: /^\d+$/,
        number: /^-?[\d.]*$/,
        positive: /^[\d.]*$/,
        negative: /^-[\d.]*$/,
        char: /^[\w\u2E80-\u9FFF]+$/,
        url: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        tel: /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/,
        mobile: /^1[3-9]\d{9}$/,
        email: /^(?:[a-z0-9]+[_\-+.]+)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i
    };
    function resolvePromises(promises) {
        var deferred = $.Deferred();
        $.when.apply($, promises).done(function () {
            deferred.resolve(arguments);
        });
        return deferred;
    }
    exports.validate = function (data, rules) {
        var list = [];
        var promises = [];
        $.each(data, function (key, item) {
            var rule = rules[key];
            if (!rule) {
                return;
            }
            var result = $.extend({}, item);
            if ($.isFunction(rule.before) && rule.before(data) === false) {
                list.push(result);
                return;
            }
            var failedRule;
            var promiseNames = [];
            var promiseValues = [];
            var validate = function (name, value) {
                if (!$.isFunction(value)) {
                    value = buildInRules[name];
                }
                if ($.isFunction(value)) {
                    var validateComplete = function (result) {
                        if (result === false) {
                            failedRule = name;
                        } else if (result && $.isFunction(result.then)) {
                            result.then(validateComplete);
                            promiseNames.push(name);
                            promiseValues.push(result);
                        } else if ($.type(result) !== 'boolean') {
                            result = false;
                        }
                        return result;
                    };
                    return validateComplete(value(item, rule.rules, data));
                }
            };
            if ($.isArray(rule.sequence)) {
                $.each(rule.sequence, function (index, name) {
                    return validate(name, rule.rules[name]);
                });
            } else {
                $.each(rule.rules, function (name, value) {
                    return validate(name, value);
                });
            }
            var extend = function () {
                if (failedRule) {
                    result.error = rule.errors[failedRule];
                }
                if ($.isFunction(rule.after)) {
                    rule.after(result);
                }
            };
            var index;
            if (promiseValues.length) {
                var promise = resolvePromises(promiseValues).then(function (values) {
                    $.each(values, function (index, value) {
                        if (value === false) {
                            failedRule = promiseNames[index];
                            return false;
                        }
                    });
                    extend();
                    list[index - 1] = result;
                });
                index = list.push(promise);
                promises.push(promise);
            } else {
                extend();
                list.push(result);
            }
        });
        if (promises.length) {
            return resolvePromises(promises).then(function () {
                return list;
            });
        }
        return list;
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
define('cc/util/wheel', [
    'require',
    'exports',
    'module',
    '../function/guid'
], function (require, exports, module) {
    'use strict';
    var guid = require('../function/guid');
    var DATA_KEY = 'cc-util-wheel';
    var EVENT_WHEEL = 'cc-wheel';
    var support = 'onmousewheel' in document.body ? 'mousewheel' : 'DOMMouseScroll';
    exports.WHEEL = EVENT_WHEEL;
    exports.init = function (element) {
        var namespace = '.' + guid();
        element.data(DATA_KEY, namespace).on(support + namespace, function (e) {
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
            e.type = EVENT_WHEEL;
            element.trigger(e, { delta: delta });
        });
    };
    exports.dispose = function (element) {
        var namespace = element.data(DATA_KEY);
        if (namespace) {
            element.removeData(DATA_KEY).off(namespace);
        }
    };
});