/**
 * @file 鼠标事件，如果是移动平台，换为 touch 事件
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    function getTouchObject(e) {
        return e.originalEvent.changedTouches[0];
    }

    var touch = {
        support: 'ontouchend' in window,
        click: 'touchstart',
        mousedown: 'touchstart',
        mousemove: 'touchmove',
        mouseup: 'touchend',
        pageX: function (e) {
            return getTouchObject(e).pageX;
        },
        pageY: function (e) {
            return getTouchObject(e).pageY;
        },
        clientX: function (e) {
            return getTouchObject(e).clientX;
        },
        clientY: function (e) {
            return getTouchObject(e).clientY;
        }
    };

    var mouse = {
        support: 'onclick' in window,
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

    return {
        touch: touch,
        mouse: mouse
    };

});