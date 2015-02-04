/**
 * @file 鼠标事件，如果是移动平台，换为 touch 事件
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var touch = {
        click: 'touchstart',
        mousedown: 'touchstart',
        mousemove: 'touchmove',
        mouseup: 'touchend',
        pageX: function (e) {
            return e.originalEvent.touches[0].pageX;
        },
        pageY: function (e) {
            return e.originalEvent.touches[0].pageY;
        },
        clientX: function (e) {
            return e.originalEvent.touches[0].clientX;
        },
        clientY: function (e) {
            return e.originalEvent.touches[0].clientY;
        }
    };

    var mouse = {
        click: 'click',
        mousedown: 'mousedown',
        mousemove: 'mousemove',
        mouseup: 'mouseup',
        pageX: function (e) {
            return e.pageX;
        },
        pageY: function (e) {
            return e.pageY;
        },
        clientX: function (e) {
            return e.clientX;
        },
        clientY: function (e) {
            return e.clientY;
        }
    };

    /**
     * 类似超极本这种设备同时支持两种方式，应优先使用鼠标
     *
     * 但是不好判断 mouse-only touch-only mouse-touch，讨论如下：
     *
     * https://github.com/Modernizr/Modernizr/issues/869
     *
     * 所以换个判断方式
     */

    return 'onorientationchange' in window ? touch : mouse;

});