/**
 * @file 文本输入框
 * @author musicode
 */
define(function (require, exports) {

    'use strict';

    var Input = require('../helper/Input');
    var Placeholder = require('../helper/Placeholder');

    var lifeCycle = require('../function/lifeCycle');


    /**
     * 文本输入框构造函数
     *
     * @param {Object} options
     * @property {jQuery} options.mainElement
     *
     * @property {string} options.placeholderTemplate
     * @property {string} options.placeholderSelector
     * @property {boolean=} options.placeholderNativeFirst
     * @property {boolean=} options.placeholderSimple
     *
     * @property {Object=} options.action 键盘事件
     */
    function Text(options) {
        lifeCycle.init(this, options);
    }

    var proto = Text.prototype;

    proto.type = 'Text';

    /**
     * 初始化
     */
    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var placeholder = new Placeholder({
            mainElement: mainElement,
            simple: me.option('placeholderSimple'),
            nativeFirst: me.option('placeholderNativeFirst'),
            placeholderSelector: me.option('placeholderSelector'),
            complexTemplate: me.option('placeholderTemplate')
        });

        var input = new Input({
            mainElement: mainElement,
            action: me.option('action'),
            context: me,
            change: {
                value: function (value) {
                    me.set('value', value);
                }
            }
        });

        me.inner({
            main: mainElement,
            input: input,
            placeholder: placeholder
        });

    };

    /**
     * 销毁对象
     */
    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('input').dispose();
        me.inner('placeholder').dispose();

    };


    lifeCycle.extend(proto);


    Text.defaultOptions = {
        placeholderSimple: false,
        placeholderNativeFirst: true,
        placeholderSelector: '.placeholder',
        placeholderTemplate: '<div class="placeholder-wrapper">'
                           +    '<div class="placeholder"></div>'
                           + '</div>'
    };


    Text.propertyUpdater = {

        value: function (value) {

            var me = this;

            me.inner('input').set('value', value);
            me.inner('placeholder').refresh();

        }
    };


    return Text;

});