/**
 * @file 获得网页元素
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var instance = require('cobble/util/instance');

    /**
     * 获得网页元素
     *
     * @return {jQuery}
     */
    return function () {
        if (instance.body.prop('clientHeight') < instance.html.prop('clientHeight')) {
            return instance.html;
        }
        else {
            return instance.body;
        }
    };

});