/**
 * @file 列表向下滚动时，保持当前列表项的可见性
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * list 向下滚动时，保持 item 元素可见性
     *
     * @param {jQuery} list
     * @param {jQuery} item
     */
    return function (list, item) {

        var listHeight = list.height();

        // item 在 list 视窗区域不需要滚动
        var min = list.scrollTop();
        var max = min + listHeight;

        var top = item.prop('offsetTop') + item.outerHeight(true);

        if (top < min || top > max) {
            list.scrollTop(
                top - listHeight
            );
        }

    };

});