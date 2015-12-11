/**
 * @file 日期范围
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 点击一个按钮弹出一个有两个日历组件的面板
     *
     * 主元素需要包含两个 <input type="hidden" />
     * 一个是 startDate 一个是 endDate
     *
     * 选择日期，会改写相应的 input
     */

    var split = require('../function/split');
    var contains = require('../function/contains');

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
     *
     * @property {string=} options.showLayerTrigger 显示的触发方式
     * @property {number=} options.showLayerDelay 显示延时
     * @property {Function=} options.showLayerAnimation 显示动画
     *
     * @property {string=} options.hideLayerTrigger 隐藏的触发方式
     * @property {number=} options.hideLayerDelay 隐藏延时
     * @property {Function=} options.hideLayerAnimation 隐藏动画
     *
     * @property {string=} options.calendarSelector 日历选择器，layerElement 应该有两个日历元素
     * @property {string=} options.calendarTemplate 日历模板
     *
     * @property {string=} options.prevSelector 日历元素中的上个月的按钮选择器
     * @property {string=} options.nextSelector 日历元素中的下个月的按钮选择器
     *
     * @property {string=} options.applySelector 确认按钮选择器
     * @property {string=} options.cancelSelector 取消按钮选择器
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
        var endCalendar = createCalendar(
            me,
            layerElement.find(
                me.option('endCalendarSelector')
            ),
            'endDate'
        );


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
                        me.state('opened', opened);
                    }
                }
            );
            me.state('opened', popup.is('opened'));

        });

        popup
        .on('dispatch', function (e, data) {

            var event = e.originalEvent;
            if (event.type === 'beforeclose') {
                var target = event.originalEvent.target;
                if (target) {
                    if (!contains(document, target) // 日历刷新后触发，所以元素没了
                        || contains(inputElement, target)
                        || contains(layerElement, target)
                    ) {
                        return false;
                    }
                }
            }

            me.emit(event, data, true);

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
                    me.set('value', list.join(SEPRATOR));
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
            }
            else {
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
                return instance.execute('render', [data, tpl]);
            }
        });
        instance.once('aftersync', function () {

            calendar.set('value', instance.get(propName));
            calendar.option(
                'watchSync',
                {
                    value: function (value) {
                        instance.set(propName, value);
                    }
                }
            );

        });
        return calendar;
    }

    var SEPRATOR = ' - ';

    return DateRange;

});