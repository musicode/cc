/**
 * @file 向上寻找最近的非 static 定位元素
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    // 好像有个 offsetParent 属性？

    /**
     * 向上寻找最近的非 static 定位元素
     *
     * jQuery 的 offsetParent 不靠谱
     *
     * @param {jQuery} element
     * @return {?jQuery}
     */
    return function (element) {

        element = element.parent();

        if (element.length > 0) {

            while (!element.is('body')
                && element.css('position') === 'static'
            ) {
                element = element.parent();
            }
        }

        return element;
    };

});