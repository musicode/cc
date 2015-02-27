/**
 * @file 列表向上滚动时，保持当前列表项的可见性
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * list 向上滚动时，保持 item 元素可见性
     *
     * @param {jQuery} list
     * @param {jQuery} item
     */
    return function (list, item) {

        // item 在 menu 视窗区域不需要滚动
        var min = list.scrollTop();
        var max = min + list.height();

        var top = item.prop('offsetTop');

        if (top < min || top > max) {
            list.scrollTop(top);
        }
    };

});