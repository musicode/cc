/**
 * @file 鼠标事件，如果是移动平台，换为 touch 事件
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var eventPage = require('../function/eventPage');
    var eventOffset = require('../function/eventOffset');

    function getTouchObject(e) {
        return e.originalEvent.changedTouches[0];
    }

    var element = document.createElement('div');

    var touch = {
        support: 'ontouchend' in element,
        click: 'touchstart',
        down: 'touchstart',
        move: 'touchmove',
        up: 'touchend',
        page: function (e) {
            var touch = getTouchObject(e);
            return {
                x: touch.pageX,
                y: touch.pageY
            };
        },
        client: function (e) {
            var touch = getTouchObject(e);
            return {
                x: touch.clientX,
                y: touch.clientY
            };
        },
        offset: function (e) {
            var touch = getTouchObject(e);
            return {
                x: touch.offsetX,
                y: touch.offsetY
            };
        }
    };

    var mouse = {
        support: 'onclick' in element,
        click: 'click',
        down: 'mousedown',
        move: 'mousemove',
        up: 'mouseup',
        page: function (e) {
            return eventPage(e);
        },
        client: function (e) {
            return {
                x: e.clientX,
                y: e.clientY
            };
        },
        offset: function () {
            return eventOffset(e);
        }
    };

    element = null;

    return {
        touch: touch,
        mouse: mouse
    };

});