/**
 * @file 日历
 * @author zhujl
 */
define(function (require) {

    'use strict';

    /**
     * 90%
     *
     * 只有具有 data-value 属性的元素才支持点击选中
     */

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var dateUtil = require('../util/date');

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 主元素
     * @property {string=} options.value 选中的值，multiple 为 false 时才有意义，没处理多选的逻辑
     * @property {Date=} options.date 初始化时视图所在的日期，默认是浏览器的当天
     * @property {Date=} options.today 今天的日期，主要是为了服务器时间校正，默认是浏览器的当天
     * @property {number=} options.firstDay 一周的第一天，0 表示周日，1 表示周一，以此类推
     * @property {boolean=} options.multiple 是否可多选
     * @property {boolean=} options.toggle 是否 toggle 选中
     *
     * @property {string=} options.mode 视图类型，可选值包括 month, week
     * @property {string} options.activeClass 日期被选中的 className
     *
     * @property {string} options.prevSelector
     * @property {string} options.nextSelector
     *
     * @property {string} options.template
     * @property {Function} options.renderTemplate
     * @property {Function=} options.onBeforeRender 渲染开始前触发，可用于调整数据
     * @property {Function=} options.onAfterRender 渲染完成后触发，可用于初始化逻辑
     *
     * @property {Function} options.onPrev
     * @property {Function} options.onNext
     * @property {Function=} options.onChange
     */
    function Calendar(options) {
        return lifeCycle.init(this, options);
    }

    Calendar.prototype = {

        constructor: Calendar,

        type: 'Calendar',

        /**
         * 初始化
         */
        init: function () {

            var me = this;

            var date = me.date || new Date();
            var today = me.today || new Date();

            // 转成 00:00:00 便于比较大小
            var data = {
                date: date.setHours(0, 0, 0, 0),
                today: today.setHours(0, 0, 0, 0)
            };

            var conf = modeConfig[me.mode];
            var prev = conf.prev(data);
            var next = conf.next(data);
            var create = conf.create(data, me.firstDay);

            var refresh = function () {

                var list = create();

                return me.render(
                    $.extend(
                        dateUtil.simplify(data.date),
                        {
                            start: list[0],
                            end: list[ list.length - 1 ],
                            list: list
                        }
                    )
                );

            };

            refresh();

            var clickType = 'click' + namespace;
            var element = me.element;
            var activeClass = me.activeClass;

            element.on(
                clickType,
                '[data-value]',
                function (e) {

                    var target = $(e.currentTarget);
                    var isActive = target.hasClass(activeClass);

                    var value;

                    if (isActive) {
                        if (me.toggle) {
                            value = '';
                            target.removeClass(activeClass);
                        }
                        else {
                            return;
                        }
                    }
                    else {
                        value = target.data('value');
                    }

                    me.setValue(value);
                }
            );

            var prevSelector = me.prevSelector;
            if (prevSelector) {
                element.on(
                    clickType,
                    prevSelector,
                    function () {
                        prev();
                        me.emit(
                            'prev',
                            refresh()
                        );
                    }
                );
            }

            var nextSelector = me.nextSelector;
            if (nextSelector) {
                element.on(
                    clickType,
                    nextSelector,
                    function () {
                        next();
                        me.emit(
                            'next',
                            refresh()
                        );
                    }
                );
            }

        },

        /**
         * 设置选中的日期
         *
         * @param {string} value
         */
        setValue: function (value) {

            var me = this;
            var multiple = me.multiple;
            var element = me.element;
            var target = element.find('[data-value="' + value + '"]');

            if (target.length === 1) {

                var activeClass = me.activeClass;

                if (!multiple) {
                    element
                    .find('.' + activeClass)
                    .removeClass(activeClass);
                }

                target.addClass(activeClass);

            }
            else if (!multiple) {
                value = '';
            }

            if (me.value != value) {
                me.value = value;
                me.emit('change');
            }

        },

        /**
         * 渲染日历
         *
         * @param {Object} data 渲染需要使用的数据
         * @return {Object}
         */
        render: function (data) {

            var me = this;

            me.emit('beforeRender', data);

            me.element.html(
                me.renderTemplate(data, me.template)
            );

            var value = me.value;
            if (value) {
                me.value = null;
                me.setValue(value);
            }

            me.emit('afterRender', data);

            return data;
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.element.off(namespace);
            me.element = null;
        }

    };

    jquerify(Calendar.prototype);

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Calendar.defaultOptions = {
        firstDay: 1,
        mode: 'month',
        toggle: false,
        multiple: false,
        activeClass: 'active'
    };

    /**
     * jquery 事件命名空间
     */
    var namespace = '.cobble_ui_calendar';


    function getDatasource(start, end, today) {

        var data = [ ];

        for (var time = start, item; time <= end; time += dateUtil.DAY) {

            item = dateUtil.simplify(time);

            // 过去 or 现在 or 将来
            if (time > today) {
                item.phase = 'future';
            }
            else if (time < today) {
                item.phase = 'past';
            }
            else {
                item.phase = 'today';
            }

            data.push(item);
        }

        return data;
    }

    var modeConfig = {
        month: {
            prev: function (data) {
                return function () {
                    var prev = dateUtil.prevMonth(data.date);
                    data.date = prev.getTime();
                };
            },
            next: function (data) {
                return function () {
                    var next = dateUtil.nextMonth(data.date);
                    data.date = next.getTime();
                };
            },
            create: function (data, firstDay) {
                return function () {

                    var date = new Date(data.date);

                    var monthFirstDay = dateUtil.getMonthFirstDay(date);
                    var monthLastDay = dateUtil.getMonthLastDay(date);

                    var weekFirstDay = dateUtil.getWeekFirstDay(monthFirstDay, firstDay);
                    var weekLastDay = dateUtil.getWeekLastDay(monthLastDay, firstDay);

                    return getDatasource(
                        + weekFirstDay,
                        + weekLastDay,
                        data.today
                    );

                };
            }
        },
        week: {
            prev: function (data) {
                return function () {
                    data.date -= dateUtil.WEEK;
                };
            },
            next: function (data) {
                return function () {
                    data.date += dateUtil.WEEK;
                };
            },
            create: function (data, firstDay) {
                return function () {

                    var date = new Date(data.date);
                    var weekFirstDay = dateUtil.getWeekFirstDay(date, firstDay);
                    var weekLastDay = dateUtil.getWeekLastDay(date, firstDay);

                    return getDatasource(
                        + weekFirstDay,
                        + weekLastDay,
                        data.today
                    );

                };
            }
        }
    };


    return Calendar;

});