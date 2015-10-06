define(function (require, exports, module) {

    'use strict';

    var Date = require('cc/form/Date');

    Date.defaultOptions = {
        firstDay: 1,
        mode: 'month',
        toggle: false,
        multiple: false,
        stable: true,
        itemSelector: '[data-value]',
        itemActiveClass: 'active',
        valueAttribute: 'data-value',
        parse: require('cc/function/parseDate'),
        inputSelector: ':text',
        calendarSelector: '.calendar',
        showCalendarTrigger: 'focus',
        hideCalendarTrigger: 'blur',
        showCalendarAnimation: function (options) {
            options.calendarElement.show();
        },
        hideCalendarAnimation: function (options) {
            options.calendarElement.hide();
        }
    };

    return Date;

});