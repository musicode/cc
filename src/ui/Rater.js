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

    var lifeUtil = require('../util/life');

    /**
     * 星级评分
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {jQuery} options.mainTemplate 主元素模板，render 时会用到
     *
     *
     * @property {number} options.value 当前星级
     * @property {number} options.count 星星总数
     * @property {number} options.minValue 可选最小值，默认是 0
     * @property {number=} options.maxValue 可选最大值，默认和 count 相同
     * @property {boolean=} options.half 是否允许半选中
     * @property {boolean=} options.readOnly 是否只读，不可改变星星的选中状态
     * @property {Object=} options.hint value 对应的提示信息，如
     *                                  {
     *                                      '1': '很差',
     *                                      '2': '较差',
     *                                      '3': '一般',
     *                                      '4': '较好',
     *                                      '5': '很好'
     *                                  }
     *
     * @property {string} options.itemActiveClass 星星选中状态的图标 className
     * @property {string} options.itemHalfClass 星星半选中状态的图标 className
     *
     * @property {string} options.itemSelector
     *
     * @example
     * var rater = new Rater({
     *     mainElement: $('.rater'),
     *     value: 2,                        // 当前选中 2 颗星
     *     count: 5,                        // 总共有 5 颗星
     *     itemActiveClass: 'icon on',
     *     propertyChange: {
     *         value: function (value) {
     *             console.log('value change');
     *         }
     *     }
     * });
     */
    function Rater(options) {
        lifeUtil.init(this, options);
    }

    var proto = Rater.prototype;

    proto.type = 'Rater';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        me.inner({
            main: mainElement
        });

        me.set({
            count: me.option('count'),
            value: me.option('value'),
            minValue: me.option('minValue'),
            maxValue: me.option('maxValue')
        });

        if (me.option('readOnly')) {
            return;
        }

        var itemSelector = me.option('itemSelector');
        if (!itemSelector) {
            me.error('itemSelector is missing.');
        }

        var activeItemElement;

        var supportHalf = me.option('half');
        var namespace = me.namespace();

        var getValueByItem = function (e, target) {

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
            if (!activeItemElement) {
                return;
            }

            me.preview(
                getValueByItem(e, activeItemElement)
            );

        };

        mainElement
        .on('mouseenter' + namespace, itemSelector, function (e) {

            activeItemElement = $(this);

            if (supportHalf) {
                activeItemElement.on(
                    'mousemove' + namespace,
                    debounce(moveHandler, 50)
                );
            }

            me.preview(
                getValueByItem(e, activeItemElement)
            );

        })
        .on('mouseleave' + namespace, itemSelector, function (e) {

            if (supportHalf) {
                activeItemElement.off(namespace);
            }

            activeItemElement = null;

            me.preview();

        })
        .on('click' + namespace, itemSelector, function (e) {

            me.set(
                'value',
                getValueByItem(e, activeItemElement || $(this))
            );

        });

    };

    proto.render = function () {

        var me = this;

        var data = [ ];
        var hint = me.option('hint') || { };

        traverse(
            me.get('value'),
            me.get('count'),
            function (index, value) {

                index += 1;

                var className;

                switch (value) {
                    case 1:
                        className = me.option('itemActiveClass');
                        break;
                    case 0.5:
                        className = me.option('itemHalfClass');
                        break;
                }

                data.push({
                    'value': index,
                    'class': className || '',
                    'hint': hint[ index ] || ''
                });

            }
        );

        me.inner('main').html(
            me.execute(
                'render',
                [
                    data,
                    me.option('mainTemplate')
                ]
            )
        );

    };

    proto.preview = function (value) {

        var me = this;

        me.inner('value', value);

        if ($.type(value) !== 'number') {
            value = me.get('value');
        }

        refresh(me, value);

    };

    proto._preview = function (value) {
        if (value === this.inner('value')) {
            return false;
        }
        return {
            value: value
        };
    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('main').off(
            me.namespace()
        );

    };

    lifeUtil.extend(proto);

    Rater.propertyUpdater = { };

    Rater.propertyUpdater.value =
    Rater.propertyUpdater.count = function (newValue, oldValue, changes) {

        var me = this;

        if (changes.count) {
            me.render();
        }
        else {
            var valueChange = changes.value;
            if (valueChange) {
                refresh(me, valueChange.newValue);
            }
        }

        return false;

    };

    Rater.propertyValidator = {

        count: function (count) {
            count = toNumber(count, -1);
            if (count < 0) {
                this.error('count must be a number.');
            }
            return count;
        },

        minValue: function (minValue) {
            return toNumber(
                minValue,
                0
            );
        },

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
     * @param {Rater} instance
     * @param {value} value
     */
    function refresh(instance, value) {

        var items = instance.inner('main').find(
            instance.option('itemSelector')
        );

        var itemActiveClass = instance.option('itemActiveClass');
        var itemHalfClass = instance.option('itemHalfClass');

        traverse(
            value,
            instance.get('count'),
            function (index, value) {

                var element = items.eq(index);

                if (itemActiveClass) {
                    element[ value === 1 ? 'addClass' : 'removeClass' ](
                        itemActiveClass
                    );
                }
                if (itemHalfClass) {
                    element[ value === 0.5 ? 'addClass' : 'removeClass' ](
                        itemHalfClass
                    );
                }

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

        for (var i = 0, result, item; i < count; i++) {

            result = value - (i + 1);

            if (result >= 0) {
                item = 1;
            }
            else if (result <= -1) {
                item = 0;
            }
            else {
                item = 0.5;
            }

            callback(i, item);

        }

    }


    return Rater;

});
