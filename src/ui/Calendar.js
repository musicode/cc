/**
 * @file 日历
 * @author musicode
 */
define(function (require) {

    'use strict';

    var split = require('../function/split');
    var createValues = require('../function/values');
    var weekOffset = require('../function/weekOffset');
    var monthOffset = require('../function/monthOffset');
    var weekFirst = require('../function/weekFirst');
    var weekLast = require('../function/weekLast');
    var monthFirst = require('../function/monthFirst');
    var monthLast = require('../function/monthLast');
    var parseDate = require('../function/parseDate');
    var simplifyDate = require('../function/simplifyDate');

    var lifeUtil = require('../util/life');

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string} options.mainTemplate
     *
     * @property {string=} options.value 选中的值，多选时以 , 分隔
     *
     * @property {Date=} options.today 今天的日期，可传入服务器时间用于校正，默认是浏览器的今天
     * @property {Date=} options.date 视图所在的日期，默认取 today
     * @property {number} options.firstDay 一周的第一天，0 表示周日，1 表示周一，以此类推
     * @property {string} options.mode 视图类型，可选值包括 month, week
     *
     * @property {boolean=} options.multiple 是否可多选
     * @property {boolean=} options.toggle 是否 toggle 反选
     * @property {boolean=} options.stable 是否稳定，当 mode 是 month 时可用
     *                                     月份的日期分布不同，有些 4 行，有些 5 行
     *                                     当 stable 为 true，所有月份都以 5 行显示
     *
     * @property {string} options.itemSelector 日期选择器
     * @property {string=} options.itemActiveClass 日期被选中时添加的 className
     *
     * @property {string} options.valueAttribute
     *
     * @property {string=} options.prevSelector 上月/上周 选择器
     * @property {string=} options.nextSelector 下月/下周 选择器
     *
     * @property {Function} options.render 渲染模板
     * @property {Function=} options.parse 把字符串类型的 value 解析成 Date 类型
     *
     */
    function Calendar(options) {
        lifeUtil.init(this, options);
    }

    var proto = Calendar.prototype;


    proto.type = 'Calendar';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        var clickType = 'click' + me.namespace();

        var itemSelector = me.option('itemSelector');
        if (itemSelector) {
            mainElement.on(
                clickType,
                itemSelector,
                function (e) {

                    var valueAttribute = me.option('valueAttribute');
                    if (!valueAttribute) {
                        me.error('ui/Calendar valueAttribute is missing.');
                    }

                    var itemValue = $(this).attr(valueAttribute);
                    if (!itemValue) {
                        me.error('ui/Calendar value is not found by valueAttribute.');
                    }

                    var oldValue = me.get('value');
                    var newValue = me.inner('values')(itemValue, true);

                    var oldCount = split(oldValue, ',').length;
                    var newCount = split(newValue, ',').length;

                    e.type = newCount < oldCount
                           ? 'unselect'
                           : 'select';

                    me.emit(e, { value: itemValue });

                    me.set('value', newValue, { action: 'click' });

                }
            );
        }

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
             ? weekOffset(date, -1)
             : monthOffset(date, -1);

        me.set({
            date: date,
            data: me.createRenderData(date)
        });

    };

    proto.next = function () {

        var me = this;
        var date = me.get('date');

        date = me.option('mode') === MODE_WEEK
             ? weekOffset(date, 1)
             : monthOffset(date, 1);

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

        return date >= parseDate(data.start)
            && date < (parseDate(data.end).getTime() + DAY);

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

            var monthFirstDay = monthFirst(date);
            var monthLastDay = monthLast(date);

            weekFirstDay = weekFirst(monthFirstDay, firstDay);
            weekLastDay = weekLast(monthLastDay, firstDay);

        }
        else {

            weekFirstDay = weekFirst(date, firstDay);
            weekLastDay = weekLast(date, firstDay);

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
                split(me.get('value'), ','),
                function (literal) {
                    if (literal) {
                        var date = me.execute('parse', literal);
                        if (date) {
                            return normalizeDate(date);
                        }
                    }
                }
            )
        );

        return $.extend(
            simplifyDate(date),
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
                'render',
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

        lifeUtil.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);


    var MODE_MONTH = 'month';
    var MODE_WEEK = 'week';

    Calendar.propertyUpdater = {

        date: function (date) {

            var me = this;

            if (me.inRange(date)) {
                return;
            }

            me.set('data', me.createRenderData(date));
            me.sync();

        },

        data: function () {
            this.render();
        },

        value: function (value) {

            var me = this;

            var valueAttribute = me.option('valueAttribute');
            var itemActiveClass = me.option('itemActiveClass');
            if (!valueAttribute || !itemActiveClass) {
                return;
            }

            var mainElement = me.inner('main');

            mainElement
            .find('.' + itemActiveClass)
            .removeClass(itemActiveClass);

            $.each(
                split(value, ','),
                function (index, value) {

                    if (!value) {
                        return;
                    }

                    mainElement
                    .find('[' + valueAttribute + '="' + value + '"]')
                    .addClass(itemActiveClass);

                }
            );

        }

    };

    Calendar.propertyValidator = {

        value: function (value) {

            var me = this;

            var values = createValues(
                value,
                me.option('multiple'),
                me.option('toggle'),
                function (a, b) {
                    if (a > b) {
                        return 1;
                    }
                    else if (a < b) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                }
            );

            this.inner('values', values);

            return values();

        }

    };

    var DAY = 24 * 60 * 60 * 1000;

    /**
     * 6 周才能稳定（跨度需要减一天，所以是 41 天）
     *
     * @inner
     * @type {number}
     */
    var stableDuration = 41 * DAY;

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

        for (var time = start, date, item; time <= end; time += DAY) {

            item = simplifyDate(time);

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