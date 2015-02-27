/**
 * @file 组件生命周期管理
 * @author zhujl
 */
define(function (require, exports) {

    'use strict';

    /**
     * 初始化组件
     *
     * @param {*} instance 组件实例对象
     * @param {Object} options 初始化组件所用的配置
     * @return {*} 组件实例
     */
    exports.init = function (instance, options) {

        var constructor = instance.constructor;

        var dataKey = '__cobble__' + constructor.prototype.type;

        // 避免重复初始化
        var element = options.element;

        if (element && element.data(dataKey)) {
            instance = element.data(dataKey);
        }
        else {

            $.extend(instance, constructor.defaultOptions, options);
            instance.init();

            if (element) {
                element.data(dataKey, instance);
            }
        }

        return instance;

    };

    /**
     * 销毁组件
     *
     * @param {*} instance 组件实例
     */
    exports.dispose = function (instance) {

        var dataKey = '__cobble__' + instance.constructor.prototype.type;

        var element = instance.element;
        if (element) {
            element.removeData(dataKey);
        }
    };

});