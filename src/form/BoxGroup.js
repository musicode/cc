/**
 * @file BoxGroup
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var createValues = require('../function/values');
    var lifeCycle = require('../util/lifeCycle');
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
     * @property {string} options.boxSelector
     * @property {string=} options.boxCheckedClass
     * @property {string=} options.boxDisabledClass
     */
    function BoxGroup(options) {
        lifeCycle.init(this, options);
    }

    var proto = BoxGroup.prototype;

    proto.type = 'BoxGroup';

    proto.init = function () {

        var me = this;

        me.initStructure();

        var mainElement = me.option('mainElement');
        var boxElement = mainElement.find(
            me.option('boxSelector')
        );

        var boxes = [ ];

        $.each(
            boxElement,
            function (index) {

                var instance = new Box({
                    mainElement: boxElement.eq(index),
                    toggle: me.option('toggle'),
                    checkedClass: me.option('boxCheckedClass'),
                    disabledClass: me.option('boxDisabledClass'),
                    stateChange: {
                        checked: function (checked) {

                            if (checked && !me.option('multiple')) {

                                $.each(
                                    boxes,
                                    function (index, box) {
                                        if (box !== instance) {
                                            box.state('checked', false);
                                        }
                                    }
                                );

                            }

                            me.set(
                                'value',
                                me.inner('values')(
                                    instance.get('value'),
                                    checked
                                )
                            );

                        }
                    }
                });

                boxes.push(instance);

            }
        );

        me.inner({
            main: mainElement,
            boxes: boxes
        });

        me.set({
            name: me.option('name'),
            value: me.option('value')
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        $.each(
            me.inner('boxes'),
            function (index, box) {
                box.dispose();
            }
        );

    };

    lifeCycle.extend(proto);

    BoxGroup.propertyUpdater = {

        name: function (name) {
            this.inner('main').attr('name', name);
        },

        value: function (value) {
            this.inner('main').attr('value', value);
        }

    };

    BoxGroup.propertyValidator = {

        name: function (name) {

            if ($.type(name) !== 'string') {
                name = this.inner('main').attr('name');
                if (name == null) {
                    throw new Error('[CC Error] BoxGroup name is missing.');
                }
            }

            return name;

        },

        value: function (value) {

            var type = $.type(value);
            if (type !== 'string' && type !== 'number') {
                value = '';
            }

            var me = this;
            var values = createValues(
                value,
                me.option('multiple'),
                me.option('toggle'),
                function (a, b) {
                    if (a > b) {
                        return 1;
                    }
                    else if (a < b) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                }
            );

            me.inner('values', values);

            return values();

        }
    };


    return BoxGroup;

});