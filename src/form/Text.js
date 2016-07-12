/**
 * @file 文本输入框
 * @author musicode
 */
define(function (require, exports) {

    'use strict';

    var Input = require('../helper/Input');
    var Placeholder = require('../helper/Placeholder');

    var lifeUtil = require('../util/life');
    var common = require('./common');

    /**
     * @constructor
     * @param {Object} options
     * @property {jQuery} options.mainElement
     * @property {string=} options.name
     * @property {string=} options.value
     * @property {string=} options.placeholder
     * @property {boolean=} options.autoTrim
     *
     * @property {string} options.inputSelector
     * @property {string} options.labelSelector
     * @property {boolean=} options.nativeFirst
     *
     * @property {Object=} options.shortcut 配置快捷键
     */
    function Text(options) {
        lifeUtil.init(this, options);
    }

    var proto = Text.prototype;

    proto.type = 'Text';

    proto.init = function () {

        var me = this;

        me.initStruct();

        var placeholder = new Placeholder({
            mainElement: me.option('mainElement'),
            value: me.option('placeholder'),
            hidden: true,
            autoTrim: me.option('autoTrim'),
            nativeFirst: me.option('nativeFirst'),
            inputSelector: me.option('inputSelector'),
            labelSelector: me.option('labelSelector'),
            showAnimation: me.option('showPlaceholderAnimation'),
            hideAnimation: me.option('hidePlaceholderAnimation')
        });
        placeholder.sync();

        var inputElement = placeholder.inner('input');

        var input = new Input({
            mainElement: inputElement,
            shortcut: me.option('shortcut'),
            value: me.option('value')
        });
        input.sync();

        placeholder.option(
            'watchSync',
            {
                value: function (value) {
                    me.set('placeholder', value);
                }
            }
        );

        input.option(
            'watchSync',
            {
                value: function (value) {
                    me.set('value', value);
                }
            }
        );

        me.inner({
            main: placeholder.inner('main'),
            native: inputElement,
            input: input,
            placeholder: placeholder
        });

        me.set({
            name: me.option('name'),
            value: input.get('value'),
            placeholder: placeholder.get('value')
        });

    };

    proto.dispose = function () {

        var me = this;

        lifeUtil.dispose(me);

        me.inner('input').dispose();
        me.inner('placeholder').dispose();

    };

    lifeUtil.extend(proto);

    Text.propertyUpdater = {

        name: function (name) {
            common.prop(this, 'name', name);
        },

        value: function (value) {

            var input = this.inner('input');
            input.set('value', value);
            input.sync();

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