/**
 * @file 调用对象的某个方法
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 调用对象的某个方法
     *
     * @param {Object} target 目标对象
     * @param {string} name 方法名称
     * @param {Object} scope 方法执行的 this
     * @param {*} args 方法执行参数
     * @return {*}
     */
    return function (target, name, scope, args) {
        var method = target[name];
        if ($.isFunction(method)) {
            name = $.isArray(args) ? 'apply' : 'call';
            return method[name](scope || target, args);
        }
    };

});