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

            var today = me.today;

            var calendar =
            me.calendar = new Calendar({
                element: calendarElement,
                date: today,
                today: today,
                template: me.calendarTemplate,
                renderTemplate: me.renderCalendarTemplate,
                prevSelector: me.prevSelector,
                nextSelector: me.nextSelector,
                onChange: function () {

                    var value = this.value;
                    if (value) {
                        element.val(this.value);
                        popup.close();
                    }
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

                    if (e.eventPhase) {
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

        },

        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            me.calendar =
            me.popup = null;

        }

    };

    jquerify(Date);

    Date.defaultOptions = {

        template: '<div class="form-date">'
                +     '<input type="text" />'
                +     '<div class="calendar">'
                +     '</div>'
                + '</div>',

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

        +                 '<td class="${item.phase} '
        +                 '<!-- if: ${item.month} != ${month} -->'
        +                 'adjacency-month'
        +                 '<!-- else -->'
        +                 'current-month'
        +                 '<!-- /if -->'
        +                 '" data-value="${item.year}-${item.month}-${item.date}"'
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