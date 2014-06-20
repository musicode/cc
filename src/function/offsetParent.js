/**
 * @file 向上寻找最近的非 static 定位元素
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * container 是否包含 element
     *
     * @param {jQuery} element
     * @return {?jQuery}
     */
    return function (element) {
        if (element.parent().length > 0) {
            var target = element.offsetParent();
            return target.is('html') ? $(document.body) : target;
        }
        else {
            return $([ ]);
        }
    };

});