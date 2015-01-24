/**
 * @file 兼容的 input 事件处理
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var around = require('./around');

    var input = $('<input type="text" />')[0];

    /**
     * 特性检测支持的 input 事件名称
     *
     * @inner
     * @type {string}
     */
    var support = 'oninput' in input
                ? 'input'
                : 'propertychange';

    input = null;

    var namespace = '.cobble_function_input';

    /**
     * 初始化 IE8- 的 propertychange 事件监听
     *
     * @inner
     * @param {jQuery} element
     */
    function bindPropertyChange(element) {

        // propertychange 事件在 IE67 下可能出现死循环，原因不明
        // 简单的判断 propertyName 是否为 value 不够
        // 必须跟上次的值比较一下
        var oldValue = element.val();

        // element.val('xxx') 在 IE 下会触发 propertychange
        // 这和标准浏览器的行为不一致
        // 这个并不能完美解决问题
        // 比如使用 element[0].value = 'xx' 无法检测到
        var changeByVal = false;

        element.on(
            support + namespace,
            function (e) {
                if (changeByVal) {
                    changeByVal = false;
                    return;
                }
                if (e.originalEvent.propertyName === 'value') {
                    var newValue = element.val();
                    if (newValue !== oldValue) {
                        element.trigger('input');
                        oldValue = newValue;
                    }
                }
            }
        );

        around(
            element,
            'val',
            function () {
                if (arguments.length !== 0) {
                    changeByVal = true;
                }
            }
        );
    }

    function unbindPropertyChange(element) {
        element.off(namespace);
    }

    return {

        init: support === 'input'
            ? $.noop
            : bindPropertyChange,

        dispose: support === 'input'
            ? $.noop
            : unbindPropertyChange

    }

});