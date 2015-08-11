/**
 * @file 特性检测
 * @author zhujl
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
     * @type {Array}
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
    exports.supportAnimation = function () {
        return testCSS('animationName');
    };

    /**
     * 是否支持 box shadow
     *
     * @return {boolean}
     */
    exports.supportBoxShadow = function () {
        return testCSS('boxShadow');
    };

    /**
     * 是否支持 web socket
     *
     * @return {boolean}
     */
    exports.supportWebSocket = function () {
        return typeof window.WebSocket !== 'undefined';
    };

    /**
     * 是否支持 flexbox
     *
     * @return {boolean}
     */
    exports.supportFlexbox = function () {
        return testCSS('flexWrap');
    };

    /**
     * 是否支持 transform
     *
     * @return {boolean}
     */
    exports.supportTransform = function () {
        return testCSS('transform');
    };

    /**
     * 是否支持 flash
     *
     * @return {boolean}
     */
    exports.supportFlash = function () {

        var swf;
        var plugins = navigator.plugins;

        if (plugins && plugins.length > 0) {
            swf = plugins['Shockwave Flash'];
        }
        else if (document.all) {
            swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        }

        return !!swf;

    };

    /**
     * 是否支持 canvas
     *
     * @return {boolean}
     */
    exports.supportCanvas = function () {
        var canvas = document.createElement('canvas');
        return canvas && canvas.getContext;
    };

});