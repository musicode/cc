/**
 * @file 向上寻找最近的非 static 定位元素
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    // 好像有个 offsetParent 属性？

    function test(element) {
        return element.is('body')
            || element.css('position') !== 'static';
    }

    /**
     * 向上寻找最近的非 static 定位元素
     *
     * jQuery 的 offsetParent 不靠谱
     *
     * @param {jQuery} element
     * @return {jQuery}
     */
    return function (element) {

        if (element.is('body')) {
            return element;
        }

        var target = element.parent();

        while (!test(target)) {
            target = target.parent();
        }

        return target;
    };

});