/**
 * @file BoxGroup
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    var lifeCycle = require('../function/lifeCycle');

    var Checkbox = require('./Checkbox');
    var Radio = require('./Radio');

    /**
     * 单/复选框分组
     *
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement 主元素
     * @property {string=} options.mainTemplate 主元素若结构不完整，可传入模板
     * @property {boolean=} options.multiple 是否可以多选
     * @property {string} options.boxSelector
     * @property {string=} options.boxCheckedClass
     * @property {string=} options.boxDisabledClass
     */
    function BoxGroup(options) {
        lifeCycle.init(this, options);
    }

    var proto = BoxGroup.prototype;

    proto.type = 'BoxGroup';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');
        var boxSelector = me.option('boxSelector');

        var boxElement = mainElement.find(boxSelector);

        if (!boxElement.length) {

            mainElement.html(
                me.option('mainTemplate')
            );

            boxElement = mainElement.find(boxSelector);

        }

        var boxes = [ ];

        var multiple = me.option('multiple');
        var BoxClass = multiple ? Checkbox : Radio;

        $.each(
            boxElement,
            function (index) {

                var instance = new BoxClass({
                    mainElement: boxElement.eq(index),
                    checkedClass: me.option('boxCheckedClass'),
                    disabledClass: me.option('boxDisabledClass'),
                    propertyChange: {
                        checked: function (checked) {

                           // [TODO]


                            me.set('value', value);

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

        });

    };

    /**
     * 销毁对象
     */
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




    return BoxGroup;

});