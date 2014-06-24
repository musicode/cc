/**
 * @file 获得网页元素
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var instance = require('../util/instance');

    /**
     * 获得网页元素
     *
     * @return {jQuery}
     */
    return function () {
        if (instance.body.prop('clientHeight') < instance.documentElement.prop('clientHeight')) {
            return instance.documentElement;
        }
        else {
            return instance.body;
        }
    };

});