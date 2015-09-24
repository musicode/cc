/**
 * @file 文本输入框
 * @author musicode
 */
define(function (require, exports) {

    'use strict';

    var Input = require('../helper/Input');
    var Placeholder = require('../helper/Placeholder');

    var lifeCycle = require('../util/lifeCycle');


    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement
     *
     * @property {string} options.placeholderTemplate
     * @property {string} options.placeholderSelector
     * @property {boolean=} options.placeholderNativeFirst
     *
     * @property {Object=} options.shortcut 配置快捷键
     */
    function Text(options) {
        lifeCycle.init(this, options);
    }

    var proto = Text.prototype;

    proto.type = 'Text';

    proto.init = function () {

        var me = this;

        var mainElement = me.option('mainElement');

        var placeholder = new Placeholder({
            mainElement: mainElement,
            nativeFirst: me.option('placeholderNativeFirst'),
            placeholderSelector: me.option('placeholderSelector'),
            placeholderTemplate: me.option('placeholderTemplate'),
            propertyChange: {
                value: function (value) {
                    me.set('placeholder', value);
                }
            }
        });

        // mainElement 可能被 Placeholder 改写过
        mainElement = placeholder.inner('main');

        var input = new Input({
            mainElement: placeholder.inner('input'),
            shortcut: me.option('shortcut'),
            context: me,
            propertyChange: {
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

    proto.dispose = function () {

        var me = this;

        lifeCycle.dispose(me);

        me.inner('input').dispose();
        me.inner('placeholder').dispose();

    };


    lifeCycle.extend(proto);


    Text.defaultOptions = {
        placeholderNativeFirst: true
    };


    Text.propertyUpdater = {

        value: function (value) {

            var me = this;

            me.inner('input').set('value', value);
            me.inner('placeholder').render();

        },

        placeholder: function (placeholder) {

            this.inner('placeholder').set('value', placeholder);

        }

    };


    return Text;

});