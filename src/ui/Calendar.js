/**
 * @file 日历
 * @author zhujl
 */
define(function (require) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');
    var dateUtil = require('../util/date');

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 主元素
     * @property {string=} options.value 选中的值，multiple 为 false 时才有意义，没处理多选的逻辑
     * @property {Date=} options.date 初始化时视图所在的日期，默认是当天
     * @property {Date=} options.today 今天的日期，主要是为了服务器时间校正
     * @property {number=} options.firstDay 一周的第一天，0 表示周日，1 表示周一，以此类推
     * @property {boolean=} options.multiple 是否可多选
     * @property {boolean=} options.toggle 是否 toggle 选中
     *
     * @property {string=} options.type 视图类型，可选值包括 month, week
     * @property {string} options.activeClass 日期被选中的 className
     * @property {string=} options.valueAttr 只有包含 valueAttr 的元素才能通过点击事件选择日期
     *
     * @property {string} options.prevSelector
     * @property {string} options.nextSelector
     *
     * @property {Function} options.onPrev
     * @property {Function} options.onNext
     *
     * @property {string} options.template
     * @property {Function} options.renderTemplate
     * @property {Function=} options.onBeforeRender
     * @property {Function=} options.onAfterRender
     *
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

            var conf = typeConfig[me.type];

            var date = copyDate(me.date);
            var today = copyDate(me.today);

            var prev = conf.prev(date);
            var next = conf.next(date);
            var create = conf.create(date, me.firstDay, today);

            var refresh = function () {
                return me.render(create());
            };

            refresh();

            var valueAttr = me.valueAttr;

            var clickType = 'click' + namespace;
            var element = me.element;
            var activeClass = me.activeClass;

            if (me.value) {
                me.setValue(me.value);
            }

            element.on(
                clickType,
                '[' + valueAttr + ']',
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
                        value = target.attr(valueAttr);
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
                        var data = refresh();
                        if ($.isFunction(me.onPrev)) {
                            me.onPrev(data);
                        }
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
                        var data = refresh();
                        if ($.isFunction(me.onNext)) {
                            me.onNext(data);
                        }
                    }
                );
            }

        },

        /**
         * 设置选中的日期
         *
         * @param {string|Array.<string>} value
         */
        setValue: function (value) {

            var me = this;
            var multiple = me.multiple;
            var element = me.element;
            var target = element.find('[' + me.valueAttr + '="' + value + '"]');

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
                if ($.isFunction(me.onChange)) {
                    me.onChange();
                }
            }

        },

        render: function (data) {

            var me = this;

            if ($.isFunction(me.onBeforeRender)) {
                me.onBeforeRender(data);
            }

            me.element.html(
                me.renderTemplate(data)
            );

            if ($.isFunction(me.onAfterRender)) {
                me.onAfterRender(data);
            }

            var value = me.value;
            if (value) {
                me.value = null;
                me.setValue(value);
            }

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

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Calendar.defaultOptions = {
        firstDay: 1,
        type: 'month',
        toggle: false,
        multiple: false,
        activeClass: 'active',
        valueAttr: 'data-value'
    };

    /**
     * jquery 事件命名空间
     */
    var namespace = '.cobble_ui_calendar';

    function copyDate(date) {
        return date
             ? new Date(date.getTime())
             : new Date();
    }

    function getDatasource(startDate, endDate, today) {

        var data = [ ];

        resetDate(today);
        resetDate(startDate);
        resetDate(endDate);

        for (var time = startDate.getTime(), item; time <= endDate; time += dateUtil.DAY) {

            item = dateUtil.simplify(new Date(time));

            // 过去 or 现在 or 将来
            if (time > today) {
                item.phase = 'future';
            }
            else if (time < today) {
                item.phase = 'pass';
            }
            else {
                item.phase = 'today';
            }

            data.push(item);
        }

        return data;
    }

    /**
     * 把日期时间重置为 00:00 00:00
     *
     * @param {Date} date
     */
    function resetDate(date) {
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
    }

    var typeConfig = {
        month: {
            prev: function (date) {
                return function () {
                    date.setDate(1);
                    date.setTime(
                        date.getTime() - dateUtil.WEEK
                    );
                };
            },
            next: function (date) {
                return function () {
                    date.setDate(28);
                    date.setTime(
                        date.getTime() + dateUtil.WEEK
                    );
                };
            },
            create: function (date, firstDay, today) {
                return function () {
                    var monthFirstDay = dateUtil.getMonthFirstDay(date);
                    var monthLastDay = dateUtil.getMonthLastDay(date);

                    var list = getDatasource(
                        dateUtil.getWeekFirstDay(monthFirstDay, firstDay),
                        dateUtil.getWeekLastDay(monthLastDay, firstDay),
                        new Date(today.getTime())
                    );

                    return {
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        start: list[0],
                        end: list[ list.length - 1 ],
                        list: list
                    };
                };
            }
        },
        week: {
            prev: function (date) {
                return function () {
                    date.setTime(
                        date.getTime() - dateUtil.WEEK
                    );
                };
            },
            next: function (date) {
                return function () {
                    date.setTime(
                        date.getTime() + dateUtil.WEEK
                    );
                };
            },
            create: function (date, firstDay, today) {
                return function () {
                    var list = getDatasource(
                        dateUtil.getWeekFirstDay(date, firstDay),
                        dateUtil.getWeekLastDay(date, firstDay),
                        new Date(today.getTime())
                    );

                    return {
                        year: date.getFullYear(),
                        month: date.getMonth() + 1,
                        start: list[0],
                        end: list[ list.length - 1 ],
                        list: list
                    };
                };
            }
        }
    };


    return Calendar;

});