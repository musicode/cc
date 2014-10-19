/**
 * @file 星级评分
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    var jquerify = require('../function/jquerify');
    var lifeCycle = require('../function/lifeCycle');
    var debounce = require('../function/debounce');
    var eventOffset = require('../function/eventOffset');

    /**
     * 星级评分
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.element 主元素
     * @property {number} options.value 当前星级
     * @property {number=} options.count 星星总数
     * @property {number=} options.min 可选最小值，默认为 1
     * @property {number=} options.max 可选最大值，默认和 count 相同
     * @property {boolean=} options.half 是否允许半选中
     * @property {boolean=} options.readOnly 是否只读，不可改变星星的选中状态
     *
     * @property {string=} options.onClass 星星选中状态的图标 class
     * @property {string=} options.offClass 星星未选中状态的图标 class
     * @property {string=} options.halfClass 星星半选中状态的图标 class
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
     * @property {string} options.itemSelector
     * @property {string} options.itemTemplate
     *
     * @property {Function=} options.onChange 选中星星触发
     * @argument {Object} options.onChange.data
     * @property {number} options.onChange.data.value
     *
     * @example
     * var rater = new Rater({
     *     element: $('.rater'),
     *     value: 2,                        // 当前选中 2 颗星
     *     count: 5,                        // 总共有 5 颗星
     *     onClass: 'icon on',
     *     offClass: 'icon off',
     *     onChange: function (e, data) {
     *         console.log('select ' + data.value);
     *     }
     * });
     */
    function Rater(options) {
        return lifeCycle.init(this, options);
    }

    Rater.prototype = {

        constructor: Rater,

        type: 'Rater',

        /**
         * 初始化
         */
        init: function () {

            var me = this;
            var count = me.count;

            if ($.type(me.max) !== 'number') {
                me.max = count;
            }

            var html = '';
            var hint = me.hint || { };

            traverse(
                me.value,
                count,
                function (index, className) {

                    index++;

                    html += me.renderTemplate(
                                {
                                    'class': me[className],
                                    'value': index,
                                    'hint': hint[index]
                                },
                                me.itemTemplate
                            );
                }
            );

            var element = me.element;
            element.html(html);

            if (!me.readOnly) {

                var itemSelector = me.itemSelector;

                element
                .on('mouseenter' + namespace, itemSelector, me, previewValue)
                .on('mouseleave' + namespace, itemSelector, me, restoreValue)
                .on('click' + namespace, itemSelector, me, changeValue);
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
         */
        setValue: function (value) {

            var me = this;

            if (value === me.value || me.readOnly) {
                return;
            }

            refresh(me, value);
            me.value = value;

            me.emit(
                'change',
                {
                    value: value
                }
            );
        },

        /**
         * 销毁对象
         */
        dispose: function () {

            var me = this;

            lifeCycle.dispose(me);

            if (!me.readOnly) {
                me.element.off(namespace);
            }

            me.element = null;
        }
    };

    jquerify(Rater.prototype);

    /**
     * 默认参数
     *
     * @static
     * @type {Object}
     */
    Rater.defaultOptions = {
        min: 1,
        half: false,
        readOnly: false,
        itemSelector: 'i',
        itemTemplate: '<i class="${class}" data-value="${value}" title="${hint}"></i>',
        renderTemplate: function (data, tpl) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] != null ? data[$1] : '';
            });
        }
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

        var isMouseEnter = e.type === 'mouseenter';
        if (isMouseEnter) {
            rater.leave = false;
        }
        // 防止 debounce 在 mouseleave 之后执行最后一次
        else if (rater.leave) {
            rater.leave = null;
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

        if (value === rater.previewValue) {
            return;
        }

        if (half && isMouseEnter) {
            target.on(
                'mousemove' + namespace,
                rater,
                debounce(previewValue, 50)
            );
        }

        rater.previewValue = value;

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
        rater.previewValue = null;

        if (rater.half) {
            rater.leave = true;
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
        rater.setValue(rater.previewValue);
    }

    /**
     * 刷新星星的状态
     *
     * @inner
     * @param {Rater} rater
     * @param {value} value
     */
    function refresh(rater, value) {

        var items = rater.element.find(rater.itemSelector);

        traverse(
            value,
            rater.count,
            function (index, className) {
                items[index].className = rater[className];
            }
        );
    }

    /**
     * 遍历的策略提个方法出来
     *
     * @inner
     * @param {number} value
     * @param {number} count
     * @param {Function} callback
     */
    function traverse(value, count, callback) {

        for (var i = 0, result, className; i < count; i++) {

            result = value - (i + 1);

            if (result >= 0) {
                className = 'onClass';
            }
            else if (result <= -1) {
                className = 'offClass';
            }
            else {
                className = 'halfClass';
            }

            callback(i, className);
        }
    }


    return Rater;

});
