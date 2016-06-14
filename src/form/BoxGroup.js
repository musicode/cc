/**
 * @file BoxGroup
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeUtil = require('../util/life');
    var Value = require('../util/Value');

    var common = require('./common');
    var Box = require('./Box');

    /**
     * 单/复选框分组
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.mainTemplate 主元素若结构不完整，可传入模板
     * @property {string=} options.name
     * @property {string=} options.value
     * @property {boolean=} options.multiple 是否可多选
     * @property {boolean=} options.toggle 是否可反选
     * @property {string=} options.boxTemplate
     * @property {string} options.boxSelector
     * @property {string=} options.boxCheckedClass
     * @property {string=} options.boxDisabledClass
     */
    function BoxGroup(options) {
        lifeUtil.init(this, options);
    }

    var proto = BoxGroup.prototype;

    proto.type = 'BoxGroup';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var mainElement = me.option('mainElement');
        var boxElement = mainElement.find(
            me.option('boxSelector')
        );

        var boxes = [ ];

        $.each(
            boxElement,
            function (index) {

                boxes.push(
                    new Box({
                        mainElement: boxElement.eq(index),
                        mainTemplate: me.option('boxTemplate'),
                        checkedClass: me.option('boxCheckedClass'),
                        disabledClass: me.option('boxDisabledClass'),
                        toggle: me.option('toggle')
                    })
                );

            }
        );

        me.once('aftersync', function () {

            $.each(
                boxes,
                function (index, box) {
                    box.option(
                        'watchSync',
                        {
                            checked: function (checked) {

                                var valueUtil = me.inner('value');
                                var value = box.get('value');

                                if (checked) {
                                    valueUtil.add(value);
                                }
                                else {
                                    valueUtil.remove(value);
                                }

                                me.set(
                                    'value',
                                    valueUtil.get()
                                );

                            }
                        }
                    );
                }
            );

        });

        me.inner({
            main: mainElement,
            native: common.findNative(me, 'input[type="hidden"]'),
            boxes: boxes,
            value: new Value({
                multiple: me.option('multiple')
            })
        });

        me.set({
            name: me.option('name'),
            value: me.option('value')
        });

    };

    proto.dispose = function () {

        lifeUtil.dispose(this);

        $.each(
            this.inner('boxes'),
            function (index, box) {
                box.dispose();
            }
        );

    };

    lifeUtil.extend(proto);

    BoxGroup.propertyUpdater = {

        name: function (name) {
            common.prop(this, 'name', name);
        },
        value: function (value) {

            var me = this;

            common.prop(me, 'value', value);

            if (!value) {
                return;
            }

            var valueUtil = me.inner('value');

            $.each(
                me.inner('boxes'),
                function (index, box) {

                    box.state(
                        'checked',
                        valueUtil.has(box.get('value'))
                    );

                }
            );

        }

    };

    BoxGroup.propertyValidator = {

        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {

            if (value == null) {
                value = common.validateValue(this, value);
            }

            var valueUtil = this.inner('value');
            valueUtil.set(value);

            return valueUtil.get();

        }
    };


    return BoxGroup;

});