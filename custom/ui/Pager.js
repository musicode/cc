define(function (require, exports, module) {

    'use strict';

    var Pager = require('cc/ui/Pager');

    Pager.defaultOptions = {
        showCount: 4,
        startCount: 2,
        endCount: 1,
        pageAttribute: 'data-page',
        pageSelector: '[data-page]'
    };

    return Pager;

});