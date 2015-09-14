/**
 * @file 日历
 * @author musicode
 */
define(function (require) {

    'use strict';

    /**
     * 90%
     *
     * 只有具有 data-value 属性的元素才支持点击选中
     *
     * 事件列表：
     *
     * 1. change
     * 2. prev - 点击 上月/上周 元素触发
     * 3. next - 点击 下月/下周 元素触发
     * 4. beforeRender - 渲染开始前触发，可用于调整数据
     * 5. afterRender - 渲染完成后触发，可用于初始化逻辑
     */

    var setValue = require('../function/setValue');
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
     * @property {boolean=} options.stable 是否稳定，即行数稳定，不会出现某月 4 行，某月 5 行的情况
     *
     * @property {string=} options.mode 视图类型，可选值包括 month, week
     * @property {string} options.activeClass 日期被选中的 className
     *
     * @property {string} options.prevSelector 上月/上周 选择器
     * @property {string} options.nextSelector 下月/下周 选择器
     *
     * @property {string} options.template
     * @property {Function} options.renderTemplate
     *
     */
    function Calendar(options) {
        return lifeCycle.init(this, options);
    }

    var proto = Calendar.prototype;


    proto.type = 'Calendar';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        me.today = me.today || new Date();

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

    };

    /**
     * 获得选中的日期
     *
     * @returns {string|*}
     */
    proto.getValue = function () {
        return this.value;
    };

    /**
     * 设置选中的日期（只能设置当前视图内的日期）
     *
     * @param {string} value
     * @param {Object=} options 选项
     * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
     * @property {boolean=} options.silence 是否不触发 change 事件
     */
    proto.setValue = function (value, options) {

        var me = this;

        var element = me.element;
        var target = element.find('[data-value="' + value + '"]');

        if (target.length !== 1) {
            value = '';
        }

        if (setValue(me, 'value', value, options)) {

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

        }

    };

    /**
     * 上月/周
     */
    proto.prev = function () {

        var me = this;
        var date = me.date;

        date = me.mode === 'week'
             ? dateUtil.prevWeek(date)
             : dateUtil.prevMonth(date);

        me.render(date);

        me.emit('prev');

    };

    /**
     * 下月/周
     */
    proto.next = function () {

        var me = this;
        var date = me.date;

        date = me.mode === 'week'
             ? dateUtil.nextWeek(date)
             : dateUtil.nextMonth(date);

        me.render(date);

        me.emit('next');

    };

    /**
     * date 是否在当前视图的数据区间内
     *
     * @param {Date} date
     * @return {boolean}
     */
    proto.inRange = function (date) {

        var data = this.data;

        return date >= dateUtil.parse(data.start)
            && date <= dateUtil.parse(data.end);

    };

    /**
     * 创建渲染日历需要的数据
     *
     * @param {Date} date
     * @return {Object}
     */
    proto.createData = function (date) {

        var me = this;
        var firstDay = me.firstDay;

        // 转成 00:00:00 便于比较大小
        date = date.setHours(0, 0, 0, 0);

        var weekFirstDay;
        var weekLastDay;

        var isMonthMode = me.mode === 'month';

        if (isMonthMode) {
            var monthFirstDay = dateUtil.getMonthFirstDay(date);
            var monthLastDay = dateUtil.getMonthLastDay(date);

            weekFirstDay = dateUtil.getWeekFirstDay(monthFirstDay, firstDay);
            weekLastDay = dateUtil.getWeekLastDay(monthLastDay, firstDay);
        }
        else {
            weekFirstDay = dateUtil.getWeekFirstDay(date, firstDay);
            weekLastDay = dateUtil.getWeekLastDay(date, firstDay);
        }

        weekFirstDay = + weekFirstDay;
        weekLastDay = + weekLastDay;

        if (isMonthMode && me.stable) {
            var duration = weekLastDay - weekFirstDay;
            var offset = stableTime - duration;
            if (offset > 0) {
                weekLastDay += offset;
            }
        }

        var list = getDatasource(
            weekFirstDay,
            weekLastDay,
            me.today.setHours(0, 0, 0, 0)
        );

        return $.extend(
            dateUtil.simplify(date),
            {
                start: list[0],
                end: list[ list.length - 1 ],
                list: list
            }
        );

    };

    /**
     * 渲染日历
     *
     * @param {Date} date
     */
    proto.render = function (date) {

        var me = this;

        me.date = date;

        var data =
        me.data = me.createData(date);

        me.emit('beforeRender', data);

        me.element.html(
            me.renderTemplate(data, me.template)
        );

        me.emit('afterRender', data);

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.element.off(namespace);
        me.element = null;

    };

    jquerify(proto);

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
        stable: true,
        activeClass: 'active'
    };

    /**
     * jquery 事件命名空间
     */
    var namespace = '.cobble_ui_calendar';

    /**
     * 6 周，也就是 6 行才能稳定（跨度需要减一天，所以是 41 天）
     *
     * @inner
     * @type {number}
     */
    var stableTime = 41 * dateUtil.DAY;

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