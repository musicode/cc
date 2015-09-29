define(function (require, exports, module) {

    'use strict';

    var Calendar = require('cc/ui/Calendar');

    Calendar.defaultOptions = {
        firstDay: 1,
        mode: 'month',
        toggle: false,
        multiple: false,
        stable: true,
        itemSelector: '[data-value]',
        itemActiveClass: 'active',
        valueAttribute: 'data-value',
        parse: require('cc/function/parseDate')
    };

    return Calendar;

});