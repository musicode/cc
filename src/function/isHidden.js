/**
 * @file 元素是否隐藏
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 元素是否隐藏不能用 element.is(':hidden')
     *
     * 这样太暴力了，当调用者需要做动画时，它可以是 opacity: 0 或是 visibility: hidden
     */

    return function (element) {

        var display = element.css('display');

        return element.css('display') === 'none'
            || element.css('opacity') == 0
            || element.css('visibility') === 'hidden';

    };

});