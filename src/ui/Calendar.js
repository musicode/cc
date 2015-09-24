/**
 * @file 日历
 * @author musicode
 */
define(function (require) {

    'use strict';

    /**
     * 只有具有 data-value 属性的元素才支持点击选中
     *
     */

    var split = require('../function/split');
    var lpad = require('../function/lpad');

    var dateUtil = require('../util/date');
    var lifeCycle = require('../util/lifeCycle');

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string} options.mainTemplate
     *
     * @property {string=} options.value 选中的值，多选时以 , 分隔
     *
     * @property {Date=} options.today 今天的日期，主要是为了服务器时间校正，默认是浏览器的当天
     * @property {Date=} options.date 初始化时视图所在的日期，默认取 today
     * @property {number=} options.firstDay 一周的第一天，0 表示周日，1 表示周一，以此类推
     *
     * @property {boolean=} options.multiple 是否可多选
     * @property {boolean=} options.toggle 是否 toggle 选中
     * @property {boolean=} options.stable 是否稳定，即行数稳定，不会出现某月 4 行，某月 5 行的情况
     *
     * @property {string=} options.mode 视图类型，可选值包括 month, week
     * @property {string} options.itemActiveClass 日期被选中的 className
     *
     * @property {string} options.prevSelector 上月/上周 选择器
     * @property {string} options.nextSelector 下月/下周 选择器
     *
     * @property {Function} options.renderTemplate
     * @property {Function=} options.parseDate 把字符串类型的 value 解析成 Date 类型
     *
     */
    function Calendar(options) {
        lifeCycle.init(this, options);
    }

    var proto = Calendar.prototype;


    proto.type = 'Calendar';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        var clickType = 'click' + me.namespace();

        mainElement.on(
            clickType,
            '[' + ATTR_VALUE + ']',
            function () {

                var value = me.get('value');

                var list = splitValue(value);
                var item = $(this).attr(ATTR_VALUE);

                var index = $.inArray(item, list);

                if (item
                    && index >= 0
                    && me.option('toggle')
                ) {
                    list.splice(index, 1);
                }
                else {
                    list.push(item);
                }

                me.set(
                    'value',
                    joinValues(list, me.option('multiple')),
                    { action: 'click' }
                );

            }
        );

        var prevSelector = me.option('prevSelector');
        if (prevSelector) {
            mainElement.on(
                clickType,
                prevSelector,
                $.proxy(me.prev, me)
            );
        }

        var nextSelector = me.option('nextSelector');
        if (nextSelector) {
            mainElement.on(
                clickType,
                nextSelector,
                $.proxy(me.next, me)
            );
        }


        me.inner({
            main: mainElement
        });


        var today = me.option('today') || new Date();

        me.set({
            today: today,
            date: me.option('date') || today,
            value: me.option('value')
        });

    };

    proto.prev = function () {

        var me = this;
        var date = me.get('date');

        date = me.option('mode') === MODE_WEEK
             ? dateUtil.prevWeek(date)
             : dateUtil.prevMonth(date);

        me.set({
            date: date,
            data: me.createRenderData(date)
        });

    };

    proto.next = function () {

        var me = this;
        var date = me.get('date');

        date = me.option('mode') === MODE_WEEK
             ? dateUtil.nextWeek(date)
             : dateUtil.nextMonth(date);

        me.set({
            date: date,
            data: me.createRenderData(date)
        });

    };

    /**
     * date 是否在当前视图的数据区间内
     *
     * @param {Date} date
     * @return {boolean}
     */
    proto.inRange = function (date) {

        var data = this.get('data');

        if (!data) {
            return false;
        }

        return date >= dateUtil.parse(data.start)
            && date < dateUtil.parse(data.end) + dateUtil.DAY;

    };

    /**
     * 创建渲染日历需要的数据
     *
     * @param {Date} date
     * @return {Object}
     */
    proto.createRenderData = function (date) {

        var me = this;

        var firstDay = me.option('firstDay');

        var weekFirstDay;
        var weekLastDay;

        var isMonthMode = me.option('mode') === MODE_MONTH;

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

        weekFirstDay = normalizeDate(weekFirstDay);
        weekLastDay = normalizeDate(weekLastDay);

        if (isMonthMode && me.option('stable')) {

            var duration = weekLastDay - weekFirstDay;
            var offset = stableDuration - duration;

            if (offset > 0) {
                weekLastDay += offset;
            }

        }

        var list = getDatasource(
            weekFirstDay,
            weekLastDay,
            normalizeDate(me.get('today')),
            $.map(
                splitValue(me.get('value')),
                function (literal) {
                    if (literal) {
                        var date = me.execute('parseDate', literal);
                        if (date) {
                            return normalizeDate(date);
                        }
                    }
                }
            )
        );

        return $.extend(
            dateUtil.simplify(date),
            {
                start: list[ 0 ],
                end: list[ list.length - 1 ],
                list: list
            }
        );

    };

    proto.render = function () {

        var me = this;

        me.inner('main').html(
            me.execute(
                'renderTemplate',
                [
                    me.get('data'),
                    me.option('mainTemplate')
                ]
            )
        );

    };

    proto._render = function () {
        if (!this.get('data')) {
            return false;
        }
    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);


    var MODE_MONTH = 'month';
    var MODE_WEEK = 'week';

    var ATTR_VALUE = 'data-value';

    Calendar.defaultOptions = {
        firstDay: 1,
        mode: MODE_MONTH,
        toggle: false,
        multiple: false,
        stable: true,
        itemActiveClass: 'active',
        parseDate: dateUtil.parse
    };


    Calendar.propertyUpdater = { };

    Calendar.propertyUpdater.date =
    Calendar.propertyUpdater.data =
    Calendar.propertyUpdater.value = function (newValue, oldValue, changes) {

        var me = this;

        var silentOptions = {
            silent: true
        };

        // 如果是  render 就一次成型，不需要一个个去选中
        var needRender = false;

        if (changes.date) {

            var date = changes.date.newValue;

            if (!me.inRange(date)) {
                needRender = true;
                me.set('data', me.createRenderData(date), silentOptions);
            }

        }

        if (!needRender && changes.data) {
            needRender = true;
        }

        if (needRender) {
            me.render();
        }
        else if (changes.value) {

            var itemActiveClass = me.option('itemActiveClass');
            if (itemActiveClass) {

                var mainElement = me.inner('main');

                mainElement
                .find('.' + itemActiveClass + '[' + ATTR_VALUE + ']')
                .removeClass(itemActiveClass);

                $.each(
                    splitValue(changes.value.newValue),
                    function (index, value) {

                        if (!value) {
                            return;
                        }

                        mainElement
                        .find('[' + ATTR_VALUE + '="' + value + '"]')
                        .addClass(itemActiveClass);

                    }
                );

            }

        }

        return false;

    };

    Calendar.propertyValidator = {
        value: function (value) {
            return joinValues(
                splitValue(value),
                this.option('multiple')
            );
        }
    };

    /**
     * 6 周才能稳定（跨度需要减一天，所以是 41 天）
     *
     * @inner
     * @type {number}
     */
    var stableDuration = 41 * dateUtil.DAY;

    /**
     * 多选值分隔符
     *
     * @inner
     * @type {string}
     */
    var VALUE_SEPARATE = ',';

    /**
     * 按 , 拆分 value
     *
     * @inner
     * @param {string} value
     * @return {Array}
     */
    function splitValue(value) {
        return split(value, VALUE_SEPARATE);
    }

    /**
     * 组合 values
     *
     * @inner
     * @param {Array} values
     * @param {boolean} multiple
     * @return {string}
     */
    function joinValues(values, multiple) {

        if (!multiple) {
            return values.pop();
        }

        values.sort(function (a, b) {
            if (a > b) {
                return 1;
            }
            else if (a < b) {
                return -1;
            }
            else {
                return 0;
            }
        });

        return values.join(VALUE_SEPARATE);

    }

    /**
     * 获得渲染模板的数据
     *
     * @inner
     * @param {number} start 开始日期时间戳
     * @param {number} end 结束日期时间戳
     * @param {number} today 今天的时间戳
     * @return {Array.<Object>}
     */
    function getDatasource(start, end, today, selected) {

        var data = [ ];

        for (var time = start, date, item; time <= end; time += dateUtil.DAY) {

            item = dateUtil.simplify(time);

            item.month = lpad(item.month);
            item.date = lpad(item.date);

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

            if ($.inArray(time, selected) >= 0) {
                item.active = true;
            }

            data.push(item);

        }

        return data;

    }

    /**
     * 获取 00:00:00 时间戳
     *
     * @inner
     * @param {Date} date
     * @return {number}
     */
    function normalizeDate(date) {
        return date.setHours(0, 0, 0, 0);
    }


    return Calendar;

});