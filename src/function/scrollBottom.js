/**
 * @file 相对于 scrollTop，设置和获取 scrollBottom 也是一种常见需求
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * scrollBottom 的 setter 和 getter 方法
     *
     * @param {jQuery} element
     * @param {number=} value 传值表示 setter
     * @return {number?}
     */
    return function (element, value) {

        var scrollHeight = element.prop('scrollHeight');
        var viewHeight = element.innerHeight();

        if (value != null) {
            element.prop(
                'scrollTop',
                scrollHeight
              - viewHeight
              - value
            );
        }
        else {
            return scrollHeight
                 - element.prop('scrollTop')
                 - viewHeight;
        }

    };

});