/**
 * @file 星级评分
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var debounce = require('../function/debounce');
    var restrain = require('../function/restrain');
    var toNumber = require('../function/toNumber');
    var eventOffset = require('../function/eventOffset');

    var lifeCycle = require('../util/lifeCycle');

    /**
     * 星级评分
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {number} options.value 当前星级
     * @property {number=} options.count 星星总数
     * @property {number=} options.minValue 可选最小值，默认为 1
     * @property {number=} options.maxValue 可选最大值，默认和 count 相同
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
     * @example
     * var rater = new Rater({
     *     mainElement: $('.rater'),
     *     value: 2,                        // 当前选中 2 颗星
     *     count: 5,                        // 总共有 5 颗星
     *     onClass: 'icon on',
     *     offClass: 'icon off',
     *     propertyChange: {
     *         value: function (value) {
     *             console.log('value change');
     *         }
     *     }
     * });
     */
    function Rater(options) {
        lifeCycle.init(this, options);
    }

    var proto = Rater.prototype;

    proto.type = 'Rater';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        if (!me.option('readOnly')) {

            var supportHalf = me.option('half');
            var itemSelector = me.option('itemSelector');
            var itemElement;

            var namespace = me.namespace();

            var pickValue = function (e, target) {

                var value = target.data('value');

                if (supportHalf) {
                    if (eventOffset(e).x / target.width() < 0.5) {
                        value -= 0.5;
                    }
                }

                return restrain(
                    value,
                    me.option('minValue'),
                    me.option('maxValue')
                );

            };

            var moveHandler = function (e) {

                // 防止 debounce 在 mouseleave 之后执行最后一次
                if (!itemElement) {
                    return;
                }

                me.preview(
                    pickValue(e, itemElement)
                );

            };

            mainElement
            .on('mouseenter' + namespace, itemSelector, function (e) {

                itemElement = $(this);

                if (supportHalf) {
                    itemElement.on(
                        'mousemove' + namespace,
                        debounce(moveHandler, 50)
                    );
                }

                me.preview(
                    pickValue(e, itemElement)
                );

            })
            .on('mouseleave' + namespace, itemSelector, function (e) {

                if (supportHalf) {
                    itemElement.off(namespace);
                }

                itemElement = null;

                me.preview();

            })
            .on('click' + namespace, itemSelector, function (e) {

                me.set(
                    'value',
                    pickValue(e, itemElement || $(this))
                );

            });

        }

        me.inner({
            main: mainElement
        });

        me.set({
            count: me.option('count'),
            value: me.option('value'),
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue')
        });

    };

    proto.render = function () {

        var me = this;

        var html = '';
        var hint = me.option('hint') || { };

        traverse(
            me.get('value'),
            me.get('count'),
            function (index, className) {

                index++;

                html += me.execute(
                            'render',
                            [
                                {
                                    'class': me.option(className),
                                    'value': index,
                                    'hint': hint[ index ]
                                },
                                me.option('itemTemplate')
                            ]
                        );

            }
        );

        me.inner('main').html(html);

    };

    /**
     * 预览值
     *
     * @param {number} value
     */
    proto.preview = function (value) {

        var me = this;

        me.inner('previewValue', value);

        if ($.type(value) !== 'number') {
            value = me.get('value');
        }

        refresh(me, value);

    };

    proto._preview = function (value) {
        if (value === this.inner('previewValue')) {
            return false;
        }
        return {
            value: value
        };
    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeCycle.extend(proto);

    Rater.defaultOptions = {
        minValue: 1,
        half: false,
        readOnly: false,
        itemSelector: 'i',
        itemTemplate: '<i class="${class}" data-value="${value}" title="${hint}"></i>',
        render: function (data, tpl) {
            return tpl.replace(/\${(\w+)}/g, function ($0, $1) {
                return data[$1] != null ? data[$1] : '';
            });
        }
    };

    Rater.propertyUpdater = { };

    Rater.propertyUpdater.value =
    Rater.propertyUpdater.count = function (newValue, oldValue, changes) {

        var me = this;

        var countChange = changes.count;
        var valueChange = changes.value;

        if (countChange) {
            me.render();
        }
        else if (valueChange) {
            refresh(me, valueChange.newValue);
        }

        return false;

    };

    Rater.propertyValidator = {

        maxValue: function (maxValue) {
            return toNumber(
                maxValue,
                this.option('count')
            );
        }

    };

    /**
     * 刷新星星的状态
     *
     * @inner
     * @param {Rater} rater
     * @param {value} value
     */
    function refresh(rater, value) {

        var items = rater.inner('main').find(
            rater.option('itemSelector')
        );

        traverse(
            value,
            rater.get('count'),
            function (index, className) {
                items[ index ].className = rater.option(className);
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
