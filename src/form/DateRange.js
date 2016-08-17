/**
 * @file 日期范围
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var split = require('../function/split');
    var contains = require('../function/contains');
    var isValidDate = require('../function/isValidDate');

    var Popup = require('../helper/Popup');
    var Calendar = require('../ui/Calendar');

    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');

    var common = require('./common');

    /**
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement
     * @property {string} options.inputSelector
     * @property {string} options.layerSelector
     * @property {string} options.separator
     *
     * @property {string=} options.showLayerTrigger 显示的触发方式
     * @property {number=} options.showLayerDelay 显示延时
     * @property {Function=} options.showLayerAnimation 显示动画
     *
     * @property {string=} options.hideLayerTrigger 隐藏的触发方式
     * @property {number=} options.hideLayerDelay 隐藏延时
     * @property {Function=} options.hideLayerAnimation 隐藏动画
     *
     * @property {string=} options.startCalendarSelector 开始日历选择器
     * @property {string=} options.endCalendarSelector 结束日历选择器
     *
     * @property {string=} options.calendarTemplate 日历模板
     *
     * @property {string=} options.prevSelector 日历元素中的上个月的按钮选择器
     * @property {string=} options.nextSelector 日历元素中的下个月的按钮选择器
     *
     * @property {string=} options.applySelector 确认按钮选择器
     * @property {string=} options.cancelSelector 取消按钮选择器
     *
     * @property {boolean=} options.renderOnClickAdjacency 点击相邻的日期是否要重新渲染
     *
     * @property {Function=} options.render 渲染模板函数
     * @property {Function=} options.parse 把 value 解析成 Date
     */
    function DateRange(options) {
        lifeUtil.init(this, options);
    }

    var proto = DateRange.prototype;

    proto.type = 'DateRange';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var inputElement = mainElement.find(
            me.option('inputSelector')
        );
        var layerElement = mainElement.find(
            me.option('layerSelector')
        );

        var startCalendar = createCalendar(
            me,
            layerElement.find(
                me.option('startCalendarSelector')
            ),
            'startDate'
        );
        startCalendar.on('valueadd', function (e, data) {
            var endDate = endCalendar.get('value');
            if (endDate) {
                var startDate = me.execute('parse', data.value);
                endDate = me.execute('parse', endDate);
                if (startDate > endDate) {
                    return false;
                }
            }
        });

        var endCalendar = createCalendar(
            me,
            layerElement.find(
                me.option('endCalendarSelector')
            ),
            'endDate'
        );
        endCalendar.on('valueadd', function (e, data) {
            var startDate = startCalendar.get('value');
            if (startDate) {
                var endDate = me.execute('parse', data.value);
                startDate = me.execute('parse', startDate);
                if (startDate > endDate) {
                    return false;
                }
            }
        });


        var popup = new Popup({
            triggerElement: inputElement,
            layerElement: layerElement,
            showLayerTrigger: me.option('showLayerTrigger'),
            showLayerDelay: me.option('showLayerDelay'),
            hideLayerTrigger: me.option('hideLayerTrigger'),
            hideLayerDelay: me.option('hideLayerDelay'),
            showLayerAnimation: function () {
                me.execute(
                    'showLayerAnimation',
                    {
                        layerElement: layerElement
                    }
                );
            },
            hideLayerAnimation: function () {
                me.execute(
                    'hideLayerAnimation',
                    {
                        layerElement: layerElement
                    }
                );
            }
        });

        inputUtil.init(inputElement);
        inputElement.on(inputUtil.INPUT, function () {
            me.set('value', this.value);
        });

        me.once('aftersync', function () {

            popup.option(
                'watchSync',
                {
                    opened: function (opened) {
                        if (opened) {
                            me.open();
                        }
                        else {
                            me.close();
                        }
                    }
                }
            );
            me.state('opened', popup.is('opened'));

        });

        popup
        .on('dispatch', function (e, data) {

            var event = e.originalEvent;
            if (event.type === 'beforeclose') {
                var originalEvent = event.originalEvent;
                var target = originalEvent.target;
                if (originalEvent.type === 'click' && target) {
                    if (!contains(document, target) // 日历刷新后触发，所以元素没了
                        || contains(inputElement, target)
                        || contains(layerElement, target)
                    ) {
                        return false;
                    }
                }
            }

            me.dispatch(
                me.emit(event, data),
                data
            );

        });


        var namespace = me.namespace();

        var applySelector = me.option('applySelector');
        if (applySelector) {
            layerElement.on(
                'click' + namespace,
                applySelector,
                function () {
                    var list = [
                        startCalendar.get('value'),
                        endCalendar.get('value')
                    ];
                    me.set('value', list.join(me.option('separator')));
                    me.close();
                }
            );
        }

        var cancelSelector = me.option('cancelSelector');
        if (cancelSelector) {
            layerElement.on(
                'click' + namespace,
                cancelSelector,
                function () {
                    me.close();
                }
            );
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
            value: me.option('value'),
            startDate: me.option('startDate'),
            endDate: me.option('endDate')
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
        inputUtil.dispose(
            me.inner('native')
        );

        me.inner('popup').dispose();
        me.inner('startCalendar').dispose();
        me.inner('endCalendar').dispose();

        me.inner('layer').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto, [ 'open', 'close' ]);

    DateRange.propertyUpdater = { };
    DateRange.propertyUpdater.name =
    DateRange.propertyUpdater.value =
    DateRange.propertyUpdater.startDate =
    DateRange.propertyUpdater.endDate = function (newValue, oldValue, changes) {

        var me = this;
        var separator = me.option('separator');

        var nameChange = changes.name;
        if (nameChange) {
            common.prop(me, 'name', nameChange.newValue);
        }

        var value;
        var oldValue;
        var startDate;
        var endDate;

        var valueChange = changes.value;
        if (valueChange) {
            value = valueChange.newValue;
            oldValue = valueChange.oldValue;
        }
        else {
            var startDateChange = changes.startDate;
            if (startDateChange) {
                startDate = startDateChange.newValue;
            }

            var endDateChange = changes.endDate;
            if (endDateChange) {
                endDate = endDateChange.newValue;
            }

            if ($.type(startDate) === 'string'
                || $.type(endDate) === 'string'
            ) {
                if (!startDate) {
                    startDate = me.get('startDate');
                }
                if (!endDate) {
                    endDate = me.get('endDate');
                }
                if (me.execute('parse', startDate) <= me.execute('parse', endDate)) {
                    value = [ startDate, endDate ].join(separator);
                }
            }
        }

        if ($.type(value) === 'string') {

            var terms = split(value, separator);
            if (terms.length === 2) {
                startDate = parseDate(me, terms[0]);
                endDate = parseDate(me, terms[1]);
                if (startDate && endDate) {
                    me.set({
                        startDate: startDate,
                        endDate: endDate
                    });
                }
                else {
                    value = '';
                }
            }
            else {
                value = '';
            }

            me.set('value', value, { silent: true });
            common.prop(this, 'value', value);

            if (!value && oldValue) {
                me.state('opened', true);
            }
        }

        return false;

    };

    DateRange.propertyValidator = {

        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {
            return common.validateValue(this, value);
        },
        startDate: function (startDate) {
            return parseDate(this, startDate);
        },
        endDate: function (endDate) {
            return parseDate(this, endDate);
        }

    };

    DateRange.stateUpdater = {

        opened: function (opened) {
            var popup = this.inner('popup');
            if (opened) {
                popup.open();
            }
            else {
                popup.close();
            }
        }

    };

    function parseDate(instance, date) {
        var obj = instance.execute('parse', date);
        return isValidDate(obj) ? date : '';
    }

    function createCalendar(instance, mainElement, propName) {

        var date = parseDate(instance, instance.get(propName));

        var calendar = new Calendar({
            mainElement: mainElement,
            mainTemplate: instance.option('calendarTemplate'),
            mode: instance.option('mode'),
            date: date ? date : null,
            parse: instance.option('parse'),
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
            renderOnClickAdjacency: instance.option('renderOnClickAdjacency'),
            render: function (data, tpl) {
                return instance.execute('render', [data, tpl]);
            }
        });
        instance.once('aftersync', function () {

            var watchSync = instance.option('watchSync') || { };
            watchSync[propName] = function (value) {
                // 值和视图要保存一致
                // 即值在几月，视图就要在几月
                var date = instance.execute('parse', value);
                if (isValidDate(date)) {
                    calendar.set({
                        date: date,
                        value: value
                    });
                }
            };
            instance.option({
                watchSync: watchSync
            });

            watchSync[propName](
                instance.get(propName)
            );
        });
        return calendar;
    }


    return DateRange;

});