/**
 * @file 点击事件，如果是移动平台，换为 touch 事件
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

    var click = {
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

    return 'ontouchstart' in document.body ? touch : click;

});