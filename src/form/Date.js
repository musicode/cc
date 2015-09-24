/**
 * @file 表单日期选择器
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var contains = require('../function/contains');
    var replaceWith = require('../function/replaceWith');

    var Popup = require('../helper/Popup');
    var Calendar = require('../ui/Calendar');

    var dateUtil = require('../util/date');
    var lifeCycle = require('../util/lifeCycle');

    /**
     * 表单日期选择器
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.name
     * @property {string=} options.value
     *
     * @property {Date=} options.today 服务器时间校正，避免客户端时间不准
     * @property {Date=} options.date 打开面板所在月份
     * @property {string=} options.mode 视图类型，可选值包括 month, week
     * @property {boolean=} options.stable 是否稳定，即行数稳定，不会出现某月 4 行，某月 5 行的情况
     * @property {boolean=} options.multiple 是否可多选
     * @property {string=} options.value 选中的日期
     *
     * @property {string=} options.showCalendarTrigger 显示的触发方式
     * @property {number=} options.showCalendarDelay 显示延时
     * @property {Function=} options.showCalendarAnimate 显示动画
     *
     * @property {string=} options.hideCalendarTrigger 隐藏的触发方式
     * @property {number=} options.hideCalendarDelay 隐藏延时
     * @property {Function=} options.hideCalendarAnimate 隐藏动画
     *
     * @property {string=} options.mainTemplate 组件模板
     * @property {string=} options.calendarTemplate 日历模板
     *
     * @property {string=} options.inputSelector 输入框选择器
     * @property {string=} options.calendarSelector 日历选择器
     *
     * @property {string=} options.prevSelector 上个月的按钮选择器
     * @property {string=} options.nextSelector 下个月的按钮选择器
     *
     * @property {Function=} options.renderTemplate 渲染模板函数
     * @property {Function=} options.parseDate 把 value 解析成 Date
     */
    function Date(options) {
        lifeCycle.init(this, options);
    }

    var proto = Date.prototype;

    proto.type = 'Date';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');



        var inputSelector = me.option('inputSelector');
        var calendarSelector = me.option('calendarSelector');

        var inputElement = mainElement.find(inputSelector);
        var calendarElement = mainElement.find(calendarSelector);

        if (inputElement.length !== 1 || calendarElement.length !== 1) {

            mainElement.html(
                me.option('mainTemplate')
            );

            inputElement = mainElement.find(inputSelector);
            calendarElement = mainElement.find(calendarSelector);

        }

        inputElement.removeAttr('name');


        var calendar = new Calendar({
            mainElement: calendarElement,
            mainTemplate: me.option('calendarTemplate'),
            mode: me.option('mode'),
            date: me.option('date'),
            today: me.option('today'),
            stable: me.option('stable'),
            multiple: me.option('multiple'),
            itemActiveClass: me.option('itemActiveClass'),
            prevSelector: me.option('prevSelector'),
            nextSelector: me.option('nextSelector'),
            onselect: function () {
                popup.close();
            },
            renderTemplate: function (data, tpl) {
                calendarElement.html(
                    me.execute('renderTemplate', [ data, tpl ])
                );
            },
            propertyChange: {
                value: function (value) {
                    me.set('value', value);
                }
            }
        });


        var popup = new Popup({
            triggerElement: inputElement,
            layerElement: calendarElement,
            showLayerTrigger: me.option('showCalendarTrigger'),
            showLayerDelay: me.option('showCalendarDelay'),
            hideLayerTrigger: me.option('hideCalendarTrigger'),
            hideLayerDelay: me.option('hideCalendarDelay'),
            showLayerAnimate: function () {
                me.execute(
                    'showCalendarAnimate',
                    {
                        calendarElement: calendarElement
                    }
                );
            },
            hideLayerAnimate: function () {
                me.execute(
                    'hideCalendarAnimate',
                    {
                        calendarElement: calendarElement
                    }
                );
            }
        });

        var dispatchEvent = function (e) {
            if (e.target.tagName) {
                me.emit(e);
            }
        };

        popup
        .before('open', dispatchEvent)
        .after('open', dispatchEvent)
        .before('close', function (e) {

            var target = e.target;

            if (target.tagName) {

                if (!contains(document, target) // 日历刷新后触发，所以元素没了
                    || contains(inputElement, target)
                    || contains(calendarElement, target)
                ) {
                    return false;
                }

            }

            dispatchEvent(e);

        })
        .after('close', dispatchEvent);





        me.inner({
            main: mainElement,
            input: inputElement,
            popup: popup,
            calendar: calendar
        });

        me.set({
            name: me.option('name'),
            value: me.option('value')
        });


    };


    proto.open = function () {
        this.inner('popup').open();
    };

    proto._open = function () {
        if (!this.inner('popup').is('hidden')) {
            return false;
        }
    };


    proto.close = function () {
        this.inner('popup').close();
    };

    proto._close = function () {
        if (this.inner('popup').is('hidden')) {
            return false;
        }
    };


    proto.render = function () {
        this.inner('calendar').render();
    };


    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('calendar').dispose();
        me.inner('popup').dispose();

    };

    lifeCycle.extend(proto);

    Date.defaultOptions = {

        mainTemplate: '<div class="form-date">'
                    +     '<input type="text" />'
                    +     '<div class="calendar"></div>'
                    + '</div>',

        calendarTemplate: '',

        mode: 'week',

        prevSelector: '.icon-chevron-left',
        nextSelector: '.icon-chevron-right',

        inputSelector: ':text',
        calendarSelector: '.calendar',

        itemActiveClass: 'active',

        showCalendarTrigger: 'focus',
        hideCalendarTrigger: 'click',

        showCalendarAnimate: function (options) {
            options.calendarElement.show();
        },
        hideCalendarAnimate: function (options) {
            options.calendarElement.hide();
        },

        parseDate: dateUtil.parse

    };

    Date.propertyUpdater = {

        name: function (name) {

            this.inner('main').attr('name', name);

        },

        value: function (value) {

            this.inner('calendar').set('value', value);
            this.inner('input').val(value);

        }

    };

    Date.propertyValidator = {

        name: function (name) {

            if ($.type(name) !== 'string') {

                name = this.inner('main').attr('name');

                if ($.type(name) !== 'string') {
                    throw new Error('[CC Error] form/Date mainElement must have the name attribute.')
                }

            }

            return name;

        },

        value: function (value) {

            if ($.type(value) === 'string') {

                var list = [ ];

                $.each(
                    split(value, ','),
                    function (index, value) {
                        if (this.execute('parseDate', value)) {
                            list.push(value);
                        }
                    }
                );

                value = list.join(',');

            }
            else {
                value = '';
            }

            return value;

        }
    };



    return Date;

});