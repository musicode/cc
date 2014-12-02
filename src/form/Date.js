/**
 * @file 表单日期选择器
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var contains = require('../function/contains');

    var Calendar = require('../ui/Calendar');
    var Popup = require('../helper/Popup');
    var etpl = require('../util/etpl');

    /**
     * 表单日期选择器
     *
     * @param {Object} options
     * @property {jQuery} options.element 输入框元素，如果结构完整，也可传容器元素
     * @property {Date=} options.today 服务器时间校正，避免客户端时间不准
     * @property {Date=} options.date 打开面板所在月份
     * @property {string=} options.value 选中的日期
     * @property {boolean=} options.disablePast 是否禁止选择过去时间，默认为 true
     * @property {string=} options.template 模板
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

            var faker;

            // 如果结构完整，不需要初始化模板
            if (element.find(me.calendarSelector).length === 1) {
                faker = element;
                element = me.element = faker.find(':text');
            }
            else {
                faker = $(me.template);
                element.replaceWith(faker);
                faker.find(':text').replaceWith(element);
            }

            var calendarElement = faker.find(me.calendarSelector);
            if (calendarElement.is(':visible')) {
                calendarElement.hide();
            }

            if (!me.value) {
                me.value = element.val();
            }

            var today = me.today;

            var calendar =
            me.calendar = new Calendar({
                element: calendarElement,
                date: me.date,
                value: me.value,
                today: today,
                template: me.calendarTemplate,
                renderTemplate: me.renderCalendarTemplate,
                prevSelector: me.prevSelector,
                nextSelector: me.nextSelector,
                onBeforeRender: function (e, data) {

                    data.disablePast = me.disablePast;

                    $.each(
                        data.list,
                        function (index, item) {

                            item.text = [
                                item.year,
                                (item.month < 10 ? '0' : '') + item.month,
                                (item.date < 10 ? '0' : '') + item.date
                            ].join('-');

                        }
                    )

                },
                onChange: function () {

                    me.setValue(this.value);

                }
            });

            var popup =
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

            element.blur(
                function () {

                    setTimeout(
                        function () {
                            if (me.popup) {
                                me.setValue(this.value);
                            }
                        },
                        300
                    );

                }
            );

        },

        open: function () {
            this.popup.open();
        },

        close: function () {
            this.popup.close();
        },

        getValue: function () {
            return this.value;
        },

        setValue: function (value) {

            var me = this;

            value = $.type(value) === 'string'
                  ? $.trim(value)
                  : '';

            if (!DATE_EXPR.test(value)) {
                value = '';
            }

            if (value) {
                me.element.val(value);
                me.popup && me.popup.close();
            }

            if (value !== me.value) {
                me.value = value;
                me.emit('change');
            }

        },

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

    var DATE_EXPR = /^\d{4}-\d{2}-\d{2}$/;

    /**
     * 默认配置
     *
     * @static
     * @type {Object}
     */
    Date.defaultOptions = {

        template: '<div class="form-date">'
                +     '<input type="text" />'
                +     '<div class="calendar">'
                +     '</div>'
                + '</div>',

        disablePast: true,

        prevSelector: '.icon-chevron-left',
        nextSelector: '.icon-chevron-right',

        calendarSelector: '.calendar',

        calendarTemplate: etpl.compile(
            '<div class="calendar-header">'
        +       '<i class="icon icon-chevron-left"></i>'
        +       '<strong>${year}年${month}月</strong>'
        +       '<i class="icon icon-chevron-right"></i>'
        +   '</div>'
        +   '<table>'
        +         '<thead>'
        +             '<tr>'
        +                 '<th>一</th>'
        +                 '<th>二</th>'
        +                 '<th>三</th>'
        +                 '<th>四</th>'
        +                 '<th>五</th>'
        +                 '<th>六</th>'
        +                 '<th>日</th>'
        +             '</tr>'
        +         '</thead>'
        +         '<tbody>'
        +             '<!-- for: ${list} as ${item}, ${index} -->'
        +                 '<!-- if: ${index} % 7 === 0 -->'

        +                 '<!-- if: ${index} === 0 -->'
        +                 '<tr>'
        +                 '<!-- else -->'
        +                 '</tr><tr>'
        +                 '<!-- /if -->'

        +                 '<!-- /if -->'

        +                 '<!-- var: enable = !${disablePast} || ${item.phase} != "past" -->'

        +                 '<td class="${item.phase}<!-- if: !${enable} --> date-disabled<!-- /if -->"'

        +                 '<!-- if: ${enable} -->'
        +                 ' data-value="${item.text}"'
        +                 '<!-- /if -->'

        +                 ' data-year="${item.year}" data-month="${item.month}" data-date="${item.date}">'
        +                 '${item.date}</td>'

        +             '<!-- /for -->'
        +         '</tbody>'
        +     '</table>'
        ),

        renderCalendarTemplate: function (data, tpl) {
            return tpl(data);
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
    Date.init = function (element, options) {

        var result = [ ];

        element.each(
            function () {
                result.push(
                    new Date(
                        $.extend(
                            {
                                element: $(this)
                            },
                            options
                        )
                    )
                );
            }
        );

        return result;
    };

    return Date;

});