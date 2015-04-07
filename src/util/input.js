/**
 * @file 兼容的 input 事件处理
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 血淋淋的教训：
     *
     * 企图处理中文输入法的同学都洗洗睡吧，这里坑太多了
     *
     * 之前我的做法是监听 keydown 的 keyCode 是否是 0 或 229，如果是表示开始输入中文，
     *
     * 相应的也需要结束输入的标识。在开始和结束之间的所有输入，都不能触发 input 事件。
     *
     * 这里的坑如下：
     *
     *     1.keydown 告知是中文输入后，某些浏览器不会触发 keyup。
     *       天知道是什么浏览器，奇葩无处不在
     *
     *     2.keyup 的 keyCode 在某些浏览器下是正常值，如空格是 32。
     *       但在个别浏览器下，它也可能是 0 或 229
     *
     * 我曾以为我能控制这个复杂度，但我错了，用一个词概括就是防不胜防。。。
     */

    var around = require('../function/around');

    var input = $('<input type="text" />')[0];

    /**
     * 特性检测是否支持 input 事件
     *
     * @inner
     * @type {boolean}
     */
    var supportInput = 'oninput' in input;

    input = null;

    var namespace = '.cobble_util_input';

    function bindInput() {
        // 空函数
    }

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
            'propertychange' + namespace,
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

    exports.init = supportInput
                 ? bindInput
                 : bindPropertyChange;

    exports.dispose = function (element) {
        element.off(namespace);
    };


});