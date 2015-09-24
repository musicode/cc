/**
 * @file 表单日期选择器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');
    var contains = require('../function/contains');
    var setValue = require('../function/setValue');
    var isHidden = require('../function/isHidden');
    var lpad = require('../function/lpad');
    var replaceWith = require('../function/replaceWith');

    var Popup = require('../helper/Popup');
    var Calendar = require('../ui/Calendar');
    var dateUtil = require('../util/date');

    /**
     * 表单日期选择器
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {Date=} options.today 服务器时间校正，避免客户端时间不准
     * @property {Date=} options.date 打开面板所在月份
     * @property {string=} options.mode 视图类型，可选值包括 month, week
     * @property {boolean=} options.stable 是否稳定，即行数稳定，不会出现某月 4 行，某月 5 行的情况
     * @property {string=} options.value 选中的日期
     * @property {RegExp=} options.pattern 日期的格式，默认是 YYYY-mm-dd
     *
     *                                     如果需要改写，请注意，正则必须包含三个分组（方便取值）
     *
     *                                     分组 1 表示年份
     *                                     分组 2 表示月份
     *                                     分组 3 表示日期
     *
     * @property {string=} options.showCalendarTrigger 显示的触发方式
     * @property {number=} options.showCalendarDelay 显示延时
     * @property {Function=} options.showCalendarAnimate 显示动画
     *
     * @property {string=} options.hideCalendarTrigger 隐藏的触发方式
     * @property {number=} options.hideCalendarDelay 隐藏延时
     * @property {Function=} options.hideCalendarAnimate 隐藏动画
     *
     * @property {string=} options.mainTemplate 组件模板
     * @property {string=} options.calendarTemplate 日历模板
     *
     * @property {string=} options.inputSelector 输入框选择器
     * @property {string=} options.calendarSelector 日历选择器
     *
     * @property {string=} options.prevSelector 上个月的按钮选择器
     * @property {string=} options.nextSelector 下个月的按钮选择器
     *
     * @property {Function=} options.renderTemplate 渲染模板函数
     */
    function Date(options) {
        lifeCycle.init(this, options);
    }

    var proto = Date.prototype;

    proto.type = 'Date';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');



        var inputSelector = me.option('inputSelector');
        var calendarSelector = me.option('calendarSelector');

        var inputElement = mainElement.find(inputSelector);
        var calendarElement = mainElement.find(calendarSelector);

        if (inputElement.length !== 1 || calendarElement.length !== 1) {

            mainElement.html(
                me.option('mainTemplate')
            );

            inputElement = mainElement.find(inputSelector);
            calendarElement = mainElement.find(calendarSelector);

        }




        var value = me.option('value');

        if ($.type(value) !== 'string') {
            value = inputElement.val();
        }

        var calendar = new Calendar({
            mainElement: calendarElement,
            mainTemplate: me.option('calendarTemplate'),
            mode: me.option('mode'),
            date: me.option('date'),
            today: me.option('today'),
            stable: me.option('stable'),
            prevSelector: me.option('prevSelector'),
            nextSelector: me.option('nextSelector'),
            renderTemplate: function (data, tpl) {
                calendarElement.html(
                    me.execute('renderTemplate', [ data, tpl ])
                );
            },
            propertyChange: {
                value: function (newValue, oldValue, changes) {

                    me.set('value', value);

                    if (changes.value.action === 'click') {
                        me.close();
                    }

                }
            }
        });

        var popup = new Popup({
            triggerElement: inputElement,
            layerElement: calendarElement,
            hidden: true,
            showLayerTrigger: me.option('showCalendarTrigger'),
            showLayerDelay: me.option('showCalendarDelay'),
            hideLayerTrigger: me.option('hideCalendarTrigger'),
            hideLayerDelay: me.option('hideCalendarDelay'),
            showLayerAnimate: function () {
                me.execute(
                    'showCalendarAnimate',
                    {
                        calendarElement: calendarElement
                    }
                );
            },
            hideLayerAnimate: function () {
                me.execute(
                    'hideCalendarAnimate',
                    {
                        calendarElement: calendarElement
                    }
                );
            }
        });

        var dispatchEvent = function (e) {
            if (e.target.tagName) {
                me.emit(e);
            }
        };

        popup
        .before('open', dispatchEvent)
        .after('open', dispatchEvent)
        .before('close', function (e) {

            var target = e.target;

            if (target.tagName) {

                if (!contains(document, target) // 日历刷新后触发，所以元素没了
                    || contains(inputElement, target)
                    || contains(calendarElement, target)
                ) {
                    return false;
                }

            }

            dispatchEvent(e);

        })
        .after('close', dispatchEvent);

        me.inner({
            main: mainElement,
            input: inputElement,
            popup: popup,
            calendar: calendar
        });

        me.set({
            value: value
        });

    };

    /**
     * 打开日历面板
     */
    proto.open = function () {
        this.inner('popup').open();
    };

    /**
     * 关闭日历面板
     */
    proto.close = function () {
        this.inner('popup').close();
    };

    /**
     * 渲染日历
     */
    proto.render = function () {
        this.inner('calendar').render();
    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('calendar').dispose();
        me.inner('popup').dispose();

    };

    lifeCycle.extend(proto);


    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Date.defaultOptions = {

        mainTemplate: '<div class="form-date">'
                    +     '<input type="text" />'
                    +     '<div class="calendar"></div>'
                    + '</div>',

        calendarTemplate: '',

        mode: 'week',

        prevSelector: '.icon-chevron-left',
        nextSelector: '.icon-chevron-right',

        inputSelector: ':text',
        calendarSelector: '.calendar',

        pattern: /^(\d{4})-(\d{2})-(\d{2})$/,

        showCalendarTrigger: 'focus',
        hideCalendarTrigger: 'click',

        showCalendarAnimate: function (options) {
            options.calendarElement.show();
        },
        hideCalendarAnimate: function (options) {
            options.calendarElement.hide();
        }

    };

    Date.propertyUpdater = {

        value: function (value) {

            var me = this;

            var calendar = me.inner('calendar');

            var properties = {
                value: value
            };

            if (value) {

                var matches = value.match(
                    me.option('pattern')
                );

                var date = dateUtil.parse(
                    parseInt(matches[ 1 ], 10),
                    parseInt(matches[ 2 ], 10),
                    parseInt(matches[ 3 ], 10)
                );

                if (date && !calendar.inRange(date)) {
                    properties.date = date;
                    properties.data = calendar.createRenderData(date)
                }

            }

            calendar.set(properties);

            me.inner('input').val(value);

        }

    };

    Date.propertyValidator = {

        value: function (value) {

            value = $.type(value) === 'string'
                  ? $.trim(value)
                  : '';

            var matches = value.match(
                this.option('pattern')
            );

            return matches && matches.length === 4
                 ? value
                 : '';

        }
    };



    return Date;

});