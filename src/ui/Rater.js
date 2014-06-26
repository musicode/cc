/**
 * @file 星级评分
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var debounce = require('../function/debounce');
    var eventOffset = require('../function/eventOffset');

    /**
     * 星级评分
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 主元素
     * @property {number} options.value 当前星级
     * @property {number} options.total 星星总数
     * @property {string} options.onIcon 星星选中状态的图标 class
     * @property {string} options.offIcon 星星未选中状态的图标 class
     * @property {string} options.halfIcon 星星半选中状态的图标 class
     * @property {Object=} options.hints key 是星星对应的值，value 是提示文本，如下：
     *                                   {
     *                                       '1': '非常差',
     *                                       '2': '差',
     *                                       '3': '一般',
     *                                       '4': '好',
     *                                       '5': '非常好'
     *                                   }
     *                                   如果允许半选中，不可用此配置
     *
     * @property {boolean=} options.half 是否允许半选中
     * @property {boolean=} options.readOnly 是否只读
     * @property {Function=} options.onSelect 选中星星触发
     * @example
     * var rater = new Rater({
     *     element: $('.rater'),
     *     value: 2,                      // 当前选中 2 颗星
     *     total: 5,                      // 总共有 5 颗星
     *     onIcon: 'icon on',
     *     offIcon: 'icon off',
     *     onSelect: function (value) {
     *         console.log('select ' + value);
     *     }
     * });
     */
    function Rater(options) {
        $.extend(this, Rater.defaultOptions, options);
        this.init();
    }

    Rater.prototype = {

        constructor: Rater,

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            me.cache = { };

            var html = '';
            var hints = me.hints;

            traverse(
                me.value,
                me.total,
                function (index, className) {

                    index++;

                    html += '<i class="'+ me[className] + '" data-value="' + index + '"';

                    if (hints && hints[index]) {
                        html += ' title="' + hints[index] + '"';
                    }

                    html += '></i>';
                }
            );

            var element = me.element;
            element.html(html);

            if (!me.readOnly) {
                element.on('mouseenter', 'i', me, previewValue)
                       .on('mouseleave', 'i', me, restoreValue)
                       .on('click', 'i', me, changeValue);
            }

            if (typeof me.onSelect === 'function') {
                me.onSelect(me.value);
            }
        },

        /**
         * 获得当前星级
         *
         * @return {number}
         */
        getValue: function () {
            return this.value || 0;
        },

        /**
         * 设置当前星级
         *
         * @param {number} value
         * @param {boolean=} silence 是否不出发 onChange 事件，默认为 false
         */
        setValue: function (value, silence) {

            var me = this;

            if (value === me.value || me.readOnly) {
                return;
            }

            refresh(me, value);
            me.value = value;

            if (!silence && $.isFunction(me.onSelect)) {
                me.onSelect(value);
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            if (!me.readOnly) {
                me.element
                  .off('mouseenter', previewValue)
                  .off('mouseleave', restoreValue)
                  .off('click', changeValue);
            }

            me.element =
            me.cache = null;
        }
    };

    /**
     * 默认参数
     *
     * @static
     * @type {Object}
     */
    Rater.defaultOptions = {
        half: false,
        readOnly: false
    };


    /**
     * 鼠标移入
     *
     * @inner
     * @param {Event} e
     */
    function previewValue(e) {

        var rater = e.data;
        var cache = rater.cache;

        var isMouseEnter = e.type === 'mouseenter';
        if (isMouseEnter) {
            cache.leave = false;
        }
        else if (cache.leave) {
            return;
        }

        var target = $(e.target);
        var value = target.data('value');

        if (rater.half) {

            if (eventOffset(e).x / target.width() <= 0.5) {
                value -= 0.5;
            }

            if (isMouseEnter) {
                target.on(
                    'mousemove',
                    rater,
                    debounce(previewValue, 50)
                );
            }
        }

        cache.value = value;

        refresh(rater, value);
    }

    /**
     * 鼠标移出
     *
     * @inner
     * @param {Event} e
     */
    function restoreValue(e) {
        var rater = e.data;
        if (rater.half) {
            rater.cache.leave = true;
            $(e.target).off('mousemove');
        }
        refresh(rater, rater.value);
    }

    /**
     * 鼠标点击
     *
     * @inner
     * @param {Event} e
     */
    function changeValue(e) {
        var rater = e.data;
        rater.setValue(rater.cache.value);
    }

    /**
     * 刷新星星的状态
     *
     * @inner
     * @param {Rater} rater
     * @param {value} value
     */
    function refresh(rater, value) {

        var elements = rater.element.find('i');

        traverse(
            value,
            rater.total,
            function (index, className) {
                elements[index].className = rater[className];
            }
        );
    }

    /**
     * 遍历的策略提个方法出来
     *
     * @inner
     * @param {number} value
     * @param {number} total
     * @param {Function} callback
     */
    function traverse(value, total, callback) {

        for (var i = 0, result, className; i < total; i++) {

            result = value - (i + 1);

            if (result >= 0) {
                className = 'onIcon';
            }
            else if (result <= -1) {
                className = 'offIcon';
            }
            else {
                className = 'halfIcon';
            }

            callback(i, className);
        }
    }

    return Rater;

});
