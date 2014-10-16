/**
 * @file advice
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 在方法执行前后进行拦截
     *
     * 1. 可拦截对象的方法，如 advice.before(obj, 'setValue', new Function());
     * 2. 可拦截单纯的函数，如 setValue = advice.before(setValue, new Function());
     * 3. 如果 before 返回 false，可阻止后续执行
     * 4. after 如果返回非 undefined 值，可改写返回值
     */

    'use strict';

    var around = require('../function/around');

    /**
     * 在方法执行前进行拦截
     *
     * @param {(Object|Function)} target 拦截的对象或函数
     * @param {?string} name 如果 target 是 Object，name 表示它的属性名
     * @param {Function} before
     * @return {?Function}
     */
    exports.before = function (target, name, before) {
        if ($.type(name) === 'string') {
            return around(target, name, before);
        }
        else {
            return around(target, name);
        }
    };

    /**
     * 在方法执行后进行拦截
     *
     * @param {(Object|Function)} target 拦截的对象或函数
     * @param {?string} name 如果 target 是 Object，name 表示它的属性名
     * @param {Function} after
     * @return {?Function}
     */
    exports.after = function (target, name, after) {
        if ($.type(name) === 'string') {
            return around(target, name, null, after);
        }
        else {
            return around(target, null, name);
        }
    };

    exports.around = around;

});
