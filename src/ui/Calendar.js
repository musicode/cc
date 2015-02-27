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
     * @property {string} options.prevSelector 上月/上周 选择器
     * @property {string} options.nextSelector 下月/下周 选择器
     *
     * @property {string} options.template
     * @property {Function} options.renderTemplate
     * @property {Function=} options.onBeforeRender 渲染开始前触发，可用于调整数据
     * @property {Function=} options.onAfterRender 渲染完成后触发，可用于初始化逻辑
     *
     * @property {Function} options.onPrev 点击 上月/上周 元素触发
     * @argument {Event} options.onPrev.event 事件对象
     * @argument {Object} options.onPrev.data 事件数据
     *
     * @property {Function} options.onNext 点击 下月/下周 元素触发
     * @argument {Event} options.onNext.event 事件对象
     * @argument {Object} options.onNext.data 事件数据
     *
     * @property {Function=} options.onChange
     * @argument {Event} options.onChange.event 事件对象
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

            var today = me.today || new Date();
            // 转成 00:00:00 便于比较大小
            me.today = today.setHours(0, 0, 0, 0);

            me.render(
                me.date || new Date()
            );

            if (me.value) {
                me.setValue(
                    me.value,
                    {
                        force: true,
                        silence: true
                    }
                );
            }

            var clickType = 'click' + namespace;
            var element = me.element;

            element.on(
                clickType,
                '[data-value]',
                function () {

                    var target = $(this);

                    var activeClass = me.activeClass;
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
                    $.proxy(me.prev, me)
                );
            }

            var nextSelector = me.nextSelector;
            if (nextSelector) {
                element.on(
                    clickType,
                    nextSelector,
                    $.proxy(me.next, me)
                );
            }

        },

        /**
         * 获得选中的日期
         *
         * @returns {string|*}
         */
        getValue: function () {
            return this.value;
        },

        /**
         * 设置选中的日期（只能设置当前视图内的日期）
         *
         * @param {string} value
         * @param {Object=} options 选项
         * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
         * @property {boolean=} options.silence 是否不触发 change 事件
         */
        setValue: function (value, options) {

            var me = this;

            var element = me.element;
            var target = element.find('[data-value="' + value + '"]');

            if (target.length !== 1) {
                value = '';
            }

            options = options || { };

            if (options.force || me.value != value) {

                me.value = value;

                var activeClass = me.activeClass;
                var activeElement = element.find('.' + activeClass);

                if (value) {
                    if (!me.multiple) {
                        activeElement.removeClass(activeClass);
                    }
                    target.addClass(activeClass);
                }
                else {
                    activeElement.removeClass(activeClass);
                }

                if (!options.silence) {
                    me.emit('change');
                }
            }

        },

        /**
         * 上月/周
         */
        prev: function () {

            var me = this;
            var date = me.date;

            date = me.mode === 'week'
                 ? dateUtil.prevWeek(date)
                 : dateUtil.prevMonth(date);

            me.render(date);

            me.emit('prev');

        },

        /**
         * 下月/周
         */
        next: function () {

            var me = this;
            var date = me.date;

            date = me.mode === 'week'
                 ? dateUtil.nextWeek(date)
                 : dateUtil.nextMonth(date);

            me.render(date);

            me.emit('next');

        },

        /**
         * date 是否在当前视图的数据区间内
         *
         * @param {Date} date
         * @return {boolean}
         */
        inRange: function (date) {

            var data = this.data;

            var start = dateUtil.parse(data.start);
            var end = dateUtil.parse(data.end);

            return date >= start && date <= end;

        },

        /**
         * 创建渲染日历需要的数据
         *
         * @param {Date} date
         * @return {Object}
         */
        createData: function (date) {

            var me = this;
            var firstDay = me.firstDay;

            // 转成 00:00:00 便于和 today 比较大小
            date = date.setHours(0, 0, 0, 0);

            var weekFirstDay;
            var weekLastDay;

            if (me.mode === 'week') {
                weekFirstDay = dateUtil.getWeekFirstDay(date, firstDay);
                weekLastDay = dateUtil.getWeekLastDay(date, firstDay);
            }
            else {
                var monthFirstDay = dateUtil.getMonthFirstDay(date);
                var monthLastDay = dateUtil.getMonthLastDay(date);

                weekFirstDay = dateUtil.getWeekFirstDay(monthFirstDay, firstDay);
                weekLastDay = dateUtil.getWeekLastDay(monthLastDay, firstDay);
            }

            var list = getDatasource(
                + weekFirstDay,
                + weekLastDay,
                me.today
            );

            return $.extend(
                dateUtil.simplify(date),
                {
                    start: list[0],
                    end: list[ list.length - 1 ],
                    list: list
                }
            );

        },

        /**
         * 渲染日历
         *
         * @param {Date} date
         */
        render: function (date) {

            var me = this;

            me.date = date;

            var data = me.data = me.createData(date);

            me.emit('beforeRender', data);

            me.element.html(
                me.renderTemplate(data, me.template)
            );

            me.emit('afterRender', data);

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

    /**
     * 获得渲染模板的数据
     *
     * @inner
     * @param {number} start 开始日期时间戳
     * @param {number} end 结束日期时间戳
     * @param {number} today 今天的时间戳
     * @return {Array.<Object>}
     */
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


    return Calendar;

});