/**
 * @file 调用对象的某个方法
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 调用对象的某个方法
     *
     * @param {Function=} fn
     * @param {Object} scope 方法执行的 this
     * @param {*} args 方法执行参数
     * @return {*}
     */
    return function (fn, scope, args) {
        if ($.isFunction(fn)) {
            var name = $.isArray(args) ? 'apply' : 'call';
            return fn[name](scope, args);
        }
    };

});