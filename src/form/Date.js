/**
 * @file 表单日期选择器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * disablePast 还有改进空间
     */

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var contains = require('../function/contains');
    var lpad = require('../function/lpad');
    var init = require('../function/init');
    var replaceWith = require('../function/replaceWith');

    var Calendar = require('../ui/Calendar');
    var Popup = require('../helper/Popup');
    var dateUtil = require('../util/date');

    /**
     * 表单日期选择器
     *
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素，如果结构完整，也可传容器元素
     * @property {Date=} options.today 服务器时间校正，避免客户端时间不准
     * @property {Date=} options.date 打开面板所在月份
     * @property {string=} options.value 选中的日期
     * @property {RegExp=} options.pattern 日期的格式，默认是 YYYY-mm-dd
     *
     *                                     如果需要改写，请注意，正则必须包含三个分组（方便取值）
     *
     *                                     分组 1 表示年份
     *                                     分组 2 表示月份
     *                                     分组 3 表示日期
     *
     * @property {boolean=} options.disablePast 是否禁止选择过去时间，默认为 true
     * @property {string=} options.template 组件模板
     * @property {string=} options.calendarTemplate 日历模板
     * @property {string=} options.calendarSelector 日期选择器
     * @property {string=} options.prevSelector 上个月的按钮选择器
     * @property {string=} options.nextSelector 下个月的按钮选择器
     * @property {Function=} options.renderCalendarTemplate 渲染日历模板函数
     * @property {Function=} options.onChange
     */
    function Date(options) {
        return lifeCycle.init(this, options);
    }

    Date.prototype = {

        constructor: Date,

        type: 'Date',

        init: function () {

            var me = this;
            var element = me.element;
            var calendarSelector = me.calendarSelector;

            var faker;

            // 如果结构完整，不需要初始化模板
            if (element.find(calendarSelector).length === 1) {
                faker = element;
                element = me.element = faker.find(':text');
            }
            else {
                faker = $(me.template);
                replaceWith(element, faker);
                replaceWith(faker.find(':text'), element);
            }

            // 默认隐藏
            var calendarElement = faker.find(calendarSelector);
            if (calendarElement.is(':visible')) {
                calendarElement.hide();
            }

            // 必须有一个初始化的值，便于变化时对比
            if ($.type(me.value) !== 'string') {
                me.value = element.val();
            }

            me.calendar = new Calendar({
                element: calendarElement,
                mode: 'month',
                date: me.date,
                today: me.today,
                template: me.calendarTemplate,
                renderTemplate: $.proxy(me.renderCalendarTemplate, me),
                prevSelector: me.prevSelector,
                nextSelector: me.nextSelector,
                onChange: function () {
                    me.setValue(this.value);
                }
            });

            me.popup = new Popup({
                element: element,
                layer: calendarElement,
                show: {
                    trigger: 'focus'
                },
                hide: {
                    trigger: 'click'
                },
                onBeforeHide: function (e) {

                    if ('eventPhase' in e) {
                        var target = $(e.target);
                        if (target[0] === element[0]
                            || !contains(document, target) // 日历刷新后触发，所以元素没了
                            || contains(calendarElement, target)
                        ) {
                            return false;
                        }
                    }

                }
            });

            if (me.value) {
                me.setValue(
                    me.value,
                    {
                        force: true,
                        silence: true
                    }
               );
            }

        },

        /**
         * 打开日历面板
         */
        open: function () {
            this.popup.open();
        },

        /**
         * 关闭日历面板
         */
        close: function () {
            this.popup.close();
        },

        /**
         * 取值
         *
         * @returns {string}
         */
        getValue: function () {
            return this.value;
        },

        /**
         * 设值
         *
         * @param {string} value 日期，格式为 YYYY-mm-dd
         * @param {Object=} options 选项
         * @property {boolean=} options.force 是否强制执行，不判断是否跟旧值相同
         * @property {boolean=} options.silence 是否不触发 change 事件
         */
        setValue: function (value, options) {

            var me = this;

            value = $.type(value) === 'string'
                  ? $.trim(value)
                  : '';

            options = options || { };

            var date;
            var match = value.match(me.pattern);

            if (match) {

                if (match.length < 4) {
                    throw new Error('[form/Date]pattern 必须包含 3 个分组.');
                }

                date = dateUtil.parse(
                    parseInt(match[1], 10),
                    parseInt(match[2], 10),
                    parseInt(match[3], 10)
                );

            }
            else {
                value = '';
            }

            if (options.force || value !== me.value) {

                me.value = value;

                var calendar = me.calendar;

                if (date && !calendar.inRange(date)) {
                    calendar.render(date);
                }

                calendar.setValue(
                    value,
                    {
                        silence: true
                    }
                );

                me.element.val(value);
                me.popup.close();

                if (!options.silence) {
                    me.emit('change');
                }

            }

        },

        /**
         * 渲染日历
         *
         * @param {Date} date
         */
        render: function (date) {
            this.calendar.render(date);
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.calendar.dispose();
            me.popup.dispose();

            me.calendar =
            me.popup = null;

        }

    };

    jquerify(Date.prototype);


    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Date.defaultOptions = {

        template: '<div class="form-date">'
                +     '<input type="text" />'
                +     '<div class="calendar"></div>'
                + '</div>',

        disablePast: true,

        prevSelector: '.icon-chevron-left',
        nextSelector: '.icon-chevron-right',

        calendarSelector: '.calendar',

        calendarTemplate: '',

        pattern: /^(\d{4})-(\d{2})-(\d{2})$/,

        renderCalendarTemplate: function (data) {

            var disablePast = this.disablePast;

            $.each(
                data.list,
                function (index, item) {

                    item.text = [
                        item.year,
                        lpad(item.month),
                        lpad(item.date)
                    ].join('-');

                }
            );

            var html = [
                '<div class="calendar-header">',
                    '<i class="icon icon-chevron-left"></i>',
                    '<strong>', data.year, '年', data.month, '月</strong>',
                    '<i class="icon icon-chevron-right"></i>',
                '</div>',
                '<table>',
                      '<thead>',
                          '<tr>',
                              '<th>一</th>',
                              '<th>二</th>',
                              '<th>三</th>',
                              '<th>四</th>',
                              '<th>五</th>',
                              '<th>六</th>',
                              '<th>日</th>',
                          '</tr>',
                      '</thead>',
                      '<tbody>'
            ];

            $.each(
                data.list,
                function (index, item) {

                    if (index % 7 === 0) {
                        html.push(
                            index === 0 ? '<tr>' : '</tr>'
                        );
                    }

                    html.push('<td class="' + item.phase);

                    var enable = !disablePast || item.phase !== 'past';

                    if (!enable) {
                        html.push(' date-disabled');
                    }

                    html.push('"');

                    if (enable) {
                        html.push(' data-value="' + item.text + '"');
                    }

                    html.push(' data-year="' + item.year + '"');
                    html.push(' data-month="' + item.month + '"');
                    html.push(' data-date="' + item.date + '">');
                    html.push(item.date);
                    html.push('</td>');

                }
            );

            html.push('</tbody></table>');

            return html.join('');
        }
    };

    /**
     * 批量初始化
     *
     * @static
     * @param {jQuery} element
     * @param {Object=} options
     * @return {Array.<Date>}
     */
    Date.init = init(Date);


    return Date;

});