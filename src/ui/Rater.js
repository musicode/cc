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
     * @property {number=} options.total 星星总数
     * @property {number=} options.min 可选最小值，默认为 1
     * @property {number=} options.max 可选最大值，默认和 total 相同
     * @property {boolean=} options.half 是否允许半选中
     * @property {boolean=} options.readOnly 是否只读
     *
     * @property {Object=} options.className
     * @property {string=} options.className.on 星星选中状态的图标 class
     * @property {string=} options.className.off 星星未选中状态的图标 class
     * @property {string=} options.className.half 星星半选中状态的图标 class
     *
     * @property {Object=} options.hint key 是星星对应的值，value 是提示文本，如下：
     *                                   {
     *                                       '1': '非常差',
     *                                       '2': '差',
     *                                       '3': '一般',
     *                                       '4': '好',
     *                                       '5': '非常好'
     *                                   }
     *                                   如果允许半选中，不可用此配置
     *
     * @property {Function=} options.onChange 选中星星触发
     * @example
     * var rater = new Rater({
     *     element: $('.rater'),
     *     value: 2,                        // 当前选中 2 颗星
     *     total: 5,                        // 总共有 5 颗星
     *     className: {
     *         on: 'icon on',
     *         off: 'icon off'
     *     },
     *     onChange: function (value) {
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

            var total = me.total;

            var max = me.max;
            if (!$.isNumeric(max)) {
                me.max = total;
            }

            var html = '';
            var hint = me.hint;
            var className = me.className;

            traverse(
                me.value,
                total,
                function (index, klass) {

                    index++;

                    html += '<i class="'+ className[klass] + '" data-value="' + index + '"';

                    if (hint && hint[index]) {
                        html += ' title="' + hint[index] + '"';
                    }

                    html += '></i>';
                }
            );

            var element = me.element;
            element.html(html);

            if (!me.readOnly) {
                element.on('mouseenter' + namespace, 'i', me, previewValue)
                       .on('mouseleave' + namespace, 'i', me, restoreValue)
                       .on('click' + namespace, 'i', me, changeValue);
            }

            if ($.isFunction(me.onChange)) {
                me.onChange(me.value);
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
         * @param {Object=} options
         * @property {boolean=} options.silence 是否不出发 onChange 事件，默认为 false
         */
        setValue: function (value, options) {

            var me = this;

            if (value === me.value || me.readOnly) {
                return;
            }

            refresh(me, value);
            me.value = value;

            options = options || { };
            if (!options.silence
                && $.isFunction(me.onChange)
            ) {
                me.onChange(value);
            }
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            if (!me.readOnly) {
                me.element.off(namespace);
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
        min: 1,
        half: false,
        readOnly: false
    };

    /**
     * jquery 事件命名空间
     *
     * @inner
     * @type {string}
     */
    var namespace = '.cobble_ui_rater';

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
        // 防止 debounce 在 mouseleave 之后执行最后一次
        else if (cache.leave) {
            return;
        }

        var target = $(e.target);
        var value = target.data('value');
        var half = rater.half;

        if (half) {
            if (eventOffset(e).x / target.width() <= 0.5) {
                value -= 0.5;
            }
        }

        var min = rater.min;
        var max = rater.max;

        if (value < min) {
            value = min;
        }
        else if (value > max) {
            value = max;
        }

        if (value === cache.value) {
            return;
        }

        if (half && isMouseEnter) {
            target.on(
                'mousemove' + namespace,
                rater,
                debounce(previewValue, 50)
            );
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
        var cache = rater.cache;
        cache.value = null;

        if (rater.half) {
            cache.leave = true;
            $(e.target).off(namespace);
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

        var items = rater.element.find('i');
        var className = rater.className;

        traverse(
            value,
            rater.total,
            function (index, klass) {
                items[index].className = className[klass];
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
                className = 'on';
            }
            else if (result <= -1) {
                className = 'off';
            }
            else {
                className = 'half';
            }

            callback(i, className);
        }
    }

    return Rater;

});
