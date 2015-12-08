/**
 * @file 特性检测
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 思路从 Modernizr 抄来的
     *
     * 下面是常用的一些检测，key 是特性名称，value 是需要检测的属性
     *
     * flexbox: flexWrap
     * flexbox legacy: boxDirection
     * background size: backgroundSize
     * border image: borderImage
     * border radius: borderRadius
     * box shadow: boxShadow
     * css animations: animationName
     * css columns: columnCount
     * css reflections: boxReflect
     * css transforms: transform
     * css transitions: transition
     */

    /**
     * 自定义元素
     *
     * @inner
     * @type {HTMLElement}
     */
    var customElement = document.createElement('musicode');

    var customElementStyle = customElement.style;

    /**
     * 厂商前缀
     *
     * @inner
     * @type {Array.<string>}
     */
    var prefixs = ['Webkit', 'Moz', 'O', 'ms'];

    /**
     * 检测某个 css 特性是否存在
     *
     * @inner
     * @param {string} property
     * @return {boolean}
     */
    function testCSS(property) {

        var upperCase = property.charAt(0).toUpperCase()
                      + property.slice(1);

        var list = (property
                  + ' '
                  + prefixs.join(upperCase + ' ')
                  + upperCase).split(' ');

        var result = false;

        $.each(
            list,
            function (index, name) {
                if (name in customElementStyle) {
                    result = true;
                    return false;
                }
            }
        );

        return result;

    }

    /**
     * 是否支持 css3 动画
     *
     * @return {boolean}
     */
    exports.animation = function () {
        return testCSS('animationName');
    };

    /**
     * 是否支持 box shadow
     *
     * @return {boolean}
     */
    exports.boxShadow = function () {
        return testCSS('boxShadow');
    };

    /**
     * 是否支持 flexbox 布局
     *
     * @return {boolean}
     */
    exports.flexbox = function () {
        return testCSS('flexWrap');
    };

    /**
     * 是否支持 transform
     *
     * @return {boolean}
     */
    exports.transform = function () {
        return testCSS('transform');
    };

    /**
     * 是否支持 web socket
     *
     * @return {boolean}
     */
    exports.webSocket = require('../function/supportWebSocket');

    /**
     * 是否支持 local storage
     *
     * @return {boolean}
     */
    exports.localStorage = require('../function/supportLocalStorage');

    /**
     * 是否支持 flash
     *
     * @return {boolean}
     */
    exports.flash = require('../function/supportFlash');

    /**
     * 是否支持 canvas
     *
     * @return {boolean}
     */
    exports.canvas = require('../function/supportCanvas');

    /**
     * 输入框是否支持 placeholder
     *
     * @return {boolean}
     */
    exports.placeholder = require('../function/supportPlaceholder');

    /**
     * 输入框是否支持 input 事件
     *
     * @return {boolean}
     */
    exports.input = require('../function/supportInput');

});