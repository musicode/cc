/**
 * @file BoxGroup
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var createValues = require('../function/values');
    var lifeUtil = require('../util/life');
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
     * @property {string} options.boxTemplate
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

        me.one('sync', function () {

            $.each(
                boxes,
                function (index, box) {
                    box.option(
                        'stateChange',
                        {
                            checked: function (checked) {

                                me.set(
                                    'value',
                                    me.inner('values')(
                                        box.get('value'),
                                        checked
                                    )
                                );

                            }
                        }
                    );
                }
            )
        });

        me.inner({
            main: mainElement,
            native: common.findNative(me, 'input:hidden'),
            boxes: boxes
        });

        me.set({
            name: me.option('name'),
            value: me.option('value')
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        $.each(
            me.inner('boxes'),
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

            $.each(
                me.inner('boxes'),
                function (index, box) {

                    if (box.get('value') === value) {
                        box.state('checked', true);
                    }
                    else if (!me.option('multiple')) {
                        box.state('checked', false);
                    }

                }
            );

        }

    };

    BoxGroup.propertyValidator = {

        name: function (name) {
            return common.validateName(this, name);
        },
        value: function (value) {

            var me = this;

            var values = createValues(
                common.validateValue(me, value),
                me.option('multiple'),
                me.option('toggle')
            );

            me.inner('values', values);

            return values();

        }
    };


    return BoxGroup;

});