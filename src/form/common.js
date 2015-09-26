define(function (require, exports, module) {

    'use strict';

    /**
     * form/ 下的通用逻辑，比如
     *
     * 1. 检测是否包含 name attribute
     * 2. 检测是否包含一个原生表单元素
     * 3. 同步变化到原生表单元素
     */

    exports.prop = function (instance, name, value) {

        if ($.isPlainObject(name)) {
            $.each(
                name,
                function (name, value) {
                    exports.prop(instance, name, value);
                }
            );
        }
        else {

            var nativeElement = instance.inner('native');

            if (arguments.length === 2) {
                return nativeElement.prop(name);
            }
            else {
                nativeElement.prop(name, value);
            }
        }

    };

    exports.setClass = function (instance, className, action) {
        var classValue = instance.option(className);
        if (classValue) {
            instance.option('mainElement')[ action + 'Class' ](
                classValue
            );
        }
    };

    exports.findNative = function (instance, selector) {
        var nativeElement = instance.option('mainElement').find(selector);
        if (nativeElement.length !== 1) {
            throw new Error('[CC Error] form/' + instance.type + ' 必须包含一个 ' + selector + '.');
        }
        return nativeElement;
    };

    exports.validateName = function (instance, name) {

        if ($.type(name) !== 'string') {

            name = exports.prop(instance, 'name');

            if (!name || $.type(name) !== 'string') {
                throw new Error('[CC Error] form/' + instance.type + ' must have the name attribute.')
            }

        }

        return name;

    };

    exports.validateValue = function (instance, value) {

        var type = $.type(value);

        if (type === 'number') {
            type = '' + type;
        }
        else if (type !== 'string') {
            value = exports.prop(instance, 'value') || '';
        }

        return value;

    };

});