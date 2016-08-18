/**
 * @file 表单日期选择器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var contains = require('../function/contains');
    var isValidDate = require('../function/isValidDate');

    var Popup = require('../helper/Popup');
    var Calendar = require('../ui/Calendar');

    var lifeUtil = require('../util/life');
    var inputUtil = require('../util/input');

    var common = require('./common');

    /**
     * 表单日期选择器
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.name
     * @property {string=} options.value
     *
     * @property {Date=} options.today 服务器时间校正，避免客户端时间不准
     * @property {Date=} options.date 打开面板所在月份
     * @property {string} options.mode 视图类型，可选值包括 month, week
     * @property {boolean=} options.stable 是否稳定，即行数稳定，不会出现某月 4 行，某月 5 行的情况
     * @property {boolean=} options.multiple 是否可多选
     *
     * @property {string} options.showLayerTrigger 显示的触发方式
     * @property {number=} options.showLayerDelay 显示延时
     * @property {Function} options.showLayerAnimation 显示动画
     *
     * @property {string=} options.hideLayerTrigger 隐藏的触发方式
     * @property {number=} options.hideLayerDelay 隐藏延时
     * @property {Function=} options.hideLayerAnimation 隐藏动画
     *
     * @property {string=} options.inputSelector 输入框选择器
     * @property {string=} options.layerSelector 浮层选择器
     * @property {string=} options.calendarSelector 浮层中的日历选择器，不传表示 layer 就是日历
     * @property {string=} options.calendarTemplate 日历模板
     *
     * @property {string=} options.prevSelector 上个月的按钮选择器
     * @property {string=} options.nextSelector 下个月的按钮选择器
     *
     * @property {boolean=} options.renderOnClickAdjacency 点击相邻的日期是否要重新渲染
     *
     * @property {Function=} options.render 渲染模板函数
     * @property {Function=} options.parse 把 value 解析成 Date
     */
    function Date(options) {
        lifeUtil.init(this, options);
    }

    var proto = Date.prototype;

    proto.type = 'Date';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var layerElement = mainElement.find(
            me.option('layerSelector')
        );

        var calendarSelector = me.option('calendarSelector');
        var calendarElement = calendarSelector
                            ? layerElement.find(calendarSelector)
                            : layerElement;

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
            renderOnClickAdjacency: me.option('renderOnClickAdjacency'),
            render: function (data, tpl) {
                return me.execute('render', [ data, tpl ]);
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

        var inputElement = mainElement.find(
            me.option('inputSelector')
        );

        inputUtil.init(inputElement);
        inputElement.on(inputUtil.INPUT, function () {
            me.set('value', this.value);
        });

        me.once('aftersync', function () {

            calendar.option(
                'watchSync',
                {
                    value: function (value) {
                        me.set('value', value);
                        popup.close();
                    }
                }
            );
            calendar.set('value', me.get('value'));

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
        inputUtil.dispose(
            me.inner('native')
        );

        me.inner('popup').dispose();
        me.inner('calendar').dispose();

    };

    lifeUtil.extend(proto, [ 'open', 'close' ]);

    Date.propertyUpdater = {

        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value, oldValue) {
            var me = this;
            common.prop(me, 'value', value);
            var date = me.execute('parse', value);
            if (isValidDate(date)) {
                me.inner('calendar').set({
                    value: value,
                    date: date
                });
            }
            if (!value && oldValue) {
                me.state('opened', true);
            }
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
            }
            else {
                popup.close();
            }
        }

    };


    return Date;

});