/**
 * @file advice
 * @author zhujl
 */
define(function (require, exports, module) {

    /**
     * 在方法执行前后进行拦截
     *
     * 1. 可拦截对象的方法，如 before(obj, 'setValue', new Function());
     * 2. 可拦截单纯的函数，如 setValue = before(setValue, new Function());
     * 3. 如果 before 返回 false，可阻止后续执行
     * 4. after 如果返回非 undefined 值，可改写返回值
     */

     'use strict';

    /**
     * 在方法执行前进行拦截
     *
     * @param {(Object|Function)} target 拦截的对象或函数
     * @param {?string} name 如果 target 是 Object，name 表示它的属性名
     * @param {Function} before
     * @return {?Function}
     */
    exports.before = function (target, name, before) {
        return exports.around(target, name, before);
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
        return exports.around(target, name, null, after);
    };

    /**
     * 在方法执行前后进行拦截
     *
     * @param {(Object|Function)} target 拦截的对象或函数
     * @param {?string} name 如果 target 是 Object，name 表示它的属性名
     * @param {Function} before
     * @param {Function} after
     * @return {?Function}
     */
    exports.around = function (target, name, before, after) {
        var origin;

        if (typeof target === 'function') {
            after = before;
            before = name;
            origin = target;
        }
        else {
            origin = target[name];
        }

        var fake = function () {
            var result;
            if (typeof before === 'function') {
                result = before.apply(this, arguments);
            }
            if (result !== false) {
                result = origin.apply(this, arguments);
                if (typeof after === 'function') {
                    var temp = after.apply(this, arguments);
                    if (temp !== undefined) {
                        result = temp;
                    }
                }
            }
            return result;
        };

        if (typeof target === 'function') {
            return fake;
        }
        else {
            return (target[name] = fake);
        }
    };

});
