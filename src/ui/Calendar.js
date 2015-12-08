/**
 * @file 日历
 * @author musicode
 */
define(function (require) {

    'use strict';

    var split = require('../function/split');
    var createValues = require('../function/values');
    var offsetWeek = require('../function/offsetWeek');
    var offsetMonth = require('../function/offsetMonth');
    var firstDateInWeek = require('../function/firstDateInWeek');
    var lastDateInWeek = require('../function/lastDateInWeek');
    var firstDateInMonth = require('../function/firstDateInMonth');
    var lastDateInMonth = require('../function/lastDateInMonth');
    var parseDate = require('../function/parseDate');
    var simplifyDate = require('../function/simplifyDate');

    var lifeUtil = require('../util/life');

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string} options.mainTemplate 因为要动态刷新，所以必须要传模板
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

        me.initStruct();

        var mainElement = me.option('mainElement');
        var clickType = 'click' + me.namespace();

        var itemSelector = me.option('itemSelector');
        if (itemSelector) {

            var valueAttribute = me.option('valueAttribute');
            if (!valueAttribute) {
                me.error('valueAttribute is missing.');
            }

            mainElement.on(clickType, itemSelector, function (e) {

                var itemValue = $(this).attr(valueAttribute);
                if (!itemValue) {
                    me.error('value is not found by valueAttribute.');
                }

                var oldValue = me.get('value');
                var newValue = me.inner('values')(itemValue, true);

                var oldCount = split(oldValue, ',').length;
                var newCount = split(newValue, ',').length;

                e.type = newCount < oldCount
                       ? 'unselect'
                       : 'select';

                me.emit(e, { value: itemValue });

                me.set('value', newValue);

            });
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
        offsetCalendar(this, -1);
    };

    proto.next = function () {
        offsetCalendar(this, 1);
    };

    /**
     * date 是否在当前视图的数据区间内
     *
     * @param {Date} date
     * @return {boolean}
     */
    proto.inRange = function (date) {

        var data = this.get('data');

        return data
            && date >= parseDate(data.start)
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

        var weekFirstDate;
        var weekLastDate;

        var isMonthMode = me.option('mode') === MODE_MONTH;
        if (isMonthMode) {
            weekFirstDate = firstDateInWeek(firstDateInMonth(date), firstDay);
            weekLastDate = lastDateInWeek(lastDateInMonth(date), firstDay);
        }
        else {
            weekFirstDate = firstDateInWeek(date, firstDay);
            weekLastDate = lastDateInWeek(date, firstDay);
        }

        weekFirstDate = normalizeDate(weekFirstDate);
        weekLastDate = normalizeDate(weekLastDate);

        if (isMonthMode && me.option('stable')) {

            var duration = weekLastDate - weekFirstDate;
            var offset = stableDuration - duration;

            if (offset > 0) {
                weekLastDate += offset;
            }

        }

        var values = [ ];

        $.each(
            split(me.get('value'), ','),
            function (index, literal) {
                if (literal) {
                    var date = me.execute('parse', literal);
                    if (date) {
                        values.push(
                            normalizeDate(date)
                        );
                    }
                }
            }
        );

        var list = createDatasource(
            weekFirstDate,
            weekLastDate,
            normalizeDate(me.get('today')),
            values
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
        this.renderWith(
            this.get('data')
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

    Calendar.propertyUpdater = { };

    Calendar.propertyUpdater.data =
    Calendar.propertyUpdater.date =
    Calendar.propertyUpdater.value = function (newValue, oldValue, change) {

        var me = this;

        var needRender;

        if (change.date) {
            var date = change.date.newValue;
            if (!me.inRange(date)) {
                needRender = true;
                me.set(
                    'data',
                    me.createRenderData(date),
                    {
                        silent: true
                    }
                );
            }
        }

        if (!needRender && change.data) {
            needRender = true;
        }

        if (needRender) {
            me.render();
        }

        if (!needRender && !change.value) {
            return;
        }




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
            split(me.get('value'), ','),
            function (index, value) {

                if (!value) {
                    return;
                }

                mainElement
                    .find('[' + valueAttribute + '="' + value + '"]')
                    .addClass(itemActiveClass);

            }
        );

    };

    Calendar.propertyValidator = {

        value: function (value) {

            var me = this;

            var values = createValues(
                value,
                me.option('multiple'),
                me.option('toggle')
            );

            this.inner('values', values);

            return values();

        }

    };

    var MODE_MONTH = 'month';
    var MODE_WEEK = 'week';

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
     * @param {Array.<number>} values
     * @return {Array.<Object>}
     */
    function createDatasource(start, end, today, values) {

        var data = [ ];

        for (var time = start, item; time <= end; time += DAY) {

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

            if ($.inArray(time, values) >= 0) {
                item.active = true;
            }

            data.push(item);

        }

        return data;

    }

    /**
     * 日期偏移
     *
     * @inner
     * @param {Calendar} instance
     * @param {number} offset
     */
    function offsetCalendar(instance, offset) {

        var date = instance.get('date');

        date = instance.option('mode') === MODE_WEEK
             ? offsetWeek(date, offset)
             : offsetMonth(date, offset);

        instance.set({
            date: date,
            data: instance.createRenderData(date)
        });

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