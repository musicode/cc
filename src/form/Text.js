/**
 * @file 文本输入框
 * @author musicode
 */
define(function (require, exports) {

    'use strict';

    var Input = require('../helper/Input');
    var Placeholder = require('../helper/Placeholder');

    var lifeCycle = require('../util/lifeCycle');
    var common = require('./common');

    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement
     * @property {string=} options.name
     * @property {string=} options.value
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

        var placeholder = new Placeholder({
            mainElement: me.option('mainElement'),
            nativeFirst: me.option('placeholderNativeFirst'),
            placeholderSelector: me.option('placeholderSelector'),
            placeholderTemplate: me.option('placeholderTemplate'),
            propertyChange: {
                value: function (value) {
                    me.set('placeholder', value);
                }
            }
        });

        var inputElement = placeholder.inner('input');

        var input = new Input({
            mainElement: inputElement,
            shortcut: me.option('shortcut'),
            context: me,
            propertyChange: {
                value: function (value) {
                    me.set('value', value);
                }
            }
        });

        me.inner({
            // mainElement 可能被 Placeholder 改写过
            main: placeholder.inner('main'),
            native: inputElement,
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


    Text.defaultOptions = { };


    Text.propertyUpdater = {

        name: function (name) {
            common.prop(this, 'name', name);
        },

        value: function (value) {
            this.inner('input').set('value', value);
            this.inner('placeholder').render();
        },

        placeholder: function (placeholder) {
            this.inner('placeholder').set('value', placeholder);
        }

    };

    Text.propertyValidator = {

        name: function (name) {
            return common.validateName(this, name);
        }

    };


    return Text;

});