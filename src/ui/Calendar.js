/**
 * @file 日历
 * @author musicode
 */
define(function (require) {

    'use strict';

    var offsetWeek = require('../function/offsetWeek');
    var offsetMonth = require('../function/offsetMonth');
    var firstDateInWeek = require('../function/firstDateInWeek');
    var lastDateInWeek = require('../function/lastDateInWeek');
    var firstDateInMonth = require('../function/firstDateInMonth');
    var lastDateInMonth = require('../function/lastDateInMonth');
    var isValidDate = require('../function/isValidDate');
    var parseDate = require('../function/parseDate');
    var simplifyDate = require('../function/simplifyDate');

    var lifeUtil = require('../util/life');
    var Value = require('../util/Value');

    /**
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string} options.renderTemplate 因为要动态刷新，所以必须要传模板
     *
     * @property {string=} options.value 选中的值，多选时以 `,` 分隔
     *
     * @property {Date=} options.today 今天的日期，可传入服务器时间用于校正，默认是浏览器的今天
     * @property {Date=} options.date 视图所在的日期，默认取 today
     * @property {number} options.firstDay 一周的第一天，0 表示周日，1 表示周一，以此类推
     * @property {string} options.mode 视图类型，可选值包括 month, week
     *
     * @property {boolean=} options.multiple 是否可多选，多选时，value 以 `,` 分隔
     * @property {boolean=} options.toggle 是否 toggle 反选
     * @property {boolean=} options.stable 视图是否稳定，当 mode 是 month 时可用
     *                                     月份的日期分布不同，有些 4 行，有些 5 行
     *                                     当 stable 为 true，所有月份都以 5 行显示
     *
     * @property {string} options.itemSelector 日期项选择器
     * @property {string=} options.itemActiveClass 日期项元素选中时的 className
     *
     * @property {string} options.valueAttribute 从日期项元素读取 value 的属性名称
     *
     * @property {string=} options.prevSelector 上月/上周 选择器
     * @property {string=} options.nextSelector 下月/下周 选择器
     *
     * @property {boolean=} options.renderOnClickAdjacency 点击相邻的日期是否要重新渲染
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

            mainElement.on(clickType, itemSelector, function () {

                var value = $(this).attr(valueAttribute);

                var event;
                var date;

                var valueUtil = me.inner('value');
                if (valueUtil.has(value)) {
                    if (me.option('toggle')) {
                        event = 'valuedel';
                        valueUtil.remove(value);
                    }
                }
                else {
                    event = 'valueadd';
                    if (valueUtil.add(value)) {
                        if (me.option('renderOnClickAdjacency')) {
                            date = me.execute('parse', value);
                            if (inSameRange(me, date, me.get('date'))) {
                                date = null;
                            }
                        }
                    }
                }

                if (event) {
                    event = me.emit(event, { value: value });
                    if (!event.isDefaultPrevented()) {
                        var properties = {
                            value: valueUtil.get()
                        };
                        if (date) {
                            properties.date = date;
                        }
                        me.set(properties);
                        me.sync();
                    }
                }

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
            main: mainElement,
            value: new Value({
                multiple: me.option('multiple'),
                validate: function (value) {
                    return isValidDate(
                        me.execute('parse', value)
                    );
                }
            })
        });

        var today = me.option('today') || new Date();

        me.set({
            today: today,
            date: me.option('date') || today,
            value: me.option('value')
        });

    };

    /**
     * 上月/上周
     */
    proto.prev = function () {
        offsetCalendar(this, -1);
    };

    /**
     * 下月/下周
     */
    proto.next = function () {
        offsetCalendar(this, 1);
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

        me.inner('value').dispose();

    };

    lifeUtil.extend(proto);

    Calendar.propertyUpdater = { };

    Calendar.propertyUpdater.data =
    Calendar.propertyUpdater.date =
    Calendar.propertyUpdater.value = function (newValue, oldValue, change) {

        // 渲染视图由 data 驱动
        // 如果 date 变化了，而 data 没变
        // 则由 date 推算出该日期对应的渲染数据

        // 渲染完视图的过程中，因为选中的日期数据会带有 active 为 true 的属性
        // 因此我们可以约定渲染完之后，视图已经是包含选中状态的了

        // 以上，重新渲染是最大的杀器

        var me = this;

        // 是否需要重新渲染
        var needRender;

        var renderByDate = function (date) {
            needRender = true;
            me.set(
                'data',
                createRenderData(me, date),
                {
                    silent: true
                }
            );
        };

        if (change.data) {
            needRender = change.data.newValue;
        }

        if (!needRender && change.date) {
            renderByDate(change.date.newValue);
        }

        // 从没渲染过
        if (!needRender && !me.get('data')) {
            renderByDate(
                me.get('date')
            );
        }

        if (needRender) {
            me.render();
            return;
        }
        else if (!change.value) {
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

        me.inner('value').each(
            function (literal) {
                if (literal) {
                    mainElement
                        .find('[' + valueAttribute + '="' + literal + '"]')
                        .addClass(itemActiveClass);
                }
            }
        );

        return false;

    };

    Calendar.propertyValidator = {

        value: function (value) {

            var valueUtil = this.inner('value');

            valueUtil.set(value);

            return valueUtil.get();

        }

    };

    var MODE_MONTH = 'month';
    var DAY = 24 * 60 * 60 * 1000;

    /**
     * 6 周才能稳定（跨度需要减一天，所以是 41 天）
     *
     * @inner
     * @type {number}
     */
    var stableDuration = 41 * DAY;

    /**
     * 创建渲染日历需要的数据
     *
     * @inner
     * @param {Calendar} instance
     * @param {Date} date
     * @return {Object}
     */
    function createRenderData(instance, date) {

        var firstDay = instance.option('firstDay');
        var today = normalizeDate(instance.get('today'));

        var startDate;
        var endDate;

        var isMonthMode = instance.option('mode') === MODE_MONTH;
        if (isMonthMode) {
            startDate = firstDateInWeek(firstDateInMonth(date), firstDay);
            endDate = lastDateInWeek(lastDateInMonth(date), firstDay);
        }
        else {
            startDate = firstDateInWeek(date, firstDay);
            endDate = lastDateInWeek(date, firstDay);
        }

        startDate = normalizeDate(startDate);
        endDate = normalizeDate(endDate);

        if (isMonthMode && instance.option('stable')) {

            var duration = endDate - startDate;
            var offset = stableDuration - duration;

            if (offset > 0) {
                endDate += offset;
            }

        }

        var values = { };

        instance.inner('value').each(
            function (literal) {
                if (literal) {
                    var date = instance.execute('parse', literal);
                    values[ normalizeDate(date) ] = 1;
                }
            }
        );

        var list = createDatasource(startDate, endDate, today, values);

        return $.extend(
            simplifyDate(date),
            {
                start: list[ 0 ],
                end: list[ list.length - 1 ],
                list: list
            }
        );

    }

    /**
     * 获得渲染模板的数据
     *
     * @inner
     * @param {number} start 开始日期时间戳
     * @param {number} end 结束日期时间戳
     * @param {number} today 今天的时间戳
     * @param {Object} values
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

            if (values[ time ]) {
                item.active = true;
            }

            data.push(item);

        }

        return data;

    }

    /**
     * date 是否在当前视图的数据区间内
     *
     * @inner
     * @param {Calendar} instance
     * @param {Date} date
     * @return {boolean}
     */
    function inViewRange(instance, date) {

        var data = instance.get('data');

        return data
            && date >= parseDate(data.start)
            && date < (parseDate(data.end).getTime() + DAY);

    }

    /**
     * date 是否在当前真实的日期范围内
     *
     * @inner
     * @param {Calendar} instance
     * @param {Date} newDate
     * @param {Date=} oldDate
     * @return {boolean}
     */
    function inSameRange(instance, newDate, oldDate) {

        if (!oldDate) {
            return false;
        }

        var startDate;
        var endDate;

        if (instance.option('mode') === MODE_MONTH) {
            startDate = firstDateInMonth(oldDate);
            endDate = lastDateInMonth(oldDate);
        }
        else {
            var firstDay = instance.option('firstDay');
            startDate = firstDateInWeek(oldDate, firstDay);
            endDate = lastDateInWeek(oldDate, firstDay);
        }

        return newDate >= startDate
            && newDate < (endDate.getTime() + DAY);
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

        date = instance.option('mode') === MODE_MONTH
             ? offsetMonth(date, offset)
             : offsetWeek(date, offset);

        instance.set({
            date: date,
            data: createRenderData(instance, date)
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