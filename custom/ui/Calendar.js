define(function (require, exports, module) {

    'use strict';

    var Calendar = require('cc/ui/Calendar');
    var parseDate = require('cc/function/parseDate');

    Calendar.defaultOptions = {
        firstDay: 1,
        mode: 'month',
        toggle: false,
        multiple: false,
        stable: true,
        itemSelector: '[data-value]',
        itemActiveClass: 'active',
        valueAttribute: 'data-value',
        parse: function (value) {
            return parseDate(value, '-');
        }
    };

    return Calendar;

});