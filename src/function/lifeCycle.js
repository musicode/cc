/**
 * @file 组件生命周期管理
 * @author musicode
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

        $.extend(instance, constructor.defaultOptions, options);
        instance.$ = $({});
        instance.init();

        return instance;

    };

    /**
     * 销毁组件
     *
     * @param {*} instance 组件实例
     */
    exports.dispose = function (instance) {
        if (instance.$) {
            instance.$.off();
            instance.$ = null;
        }
    };

});