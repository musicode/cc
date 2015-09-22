/**
 * @file 拦截
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 在方法执行前后进行拦截
     *
     * 1. 可拦截对象的方法
     * 2. 可拦截单纯的函数
     * 3. 如果 before 返回 false，可阻止后续执行
     * 4. after 如果返回非 undefined 值，可改写返回值
     */

    /**
     * 在方法执行前后进行拦截
     *
     * @param {(Object|Function)} target 拦截的对象或函数
     * @param {?string} name 如果 target 是 Object，name 表示它的属性名
     * @param {Function} before
     * @param {Function} after
     * @return {?Function}
     */
    return function (target, name, before, after) {

        var isMethod = $.type(name) === 'string';
        var origin = isMethod ? target[name] : target;

        // 调整参数顺序
        if (!isMethod) {
            after = before;
            before = name;
        }

        var wrapper = function () {

            var result;
            var args = $.makeArray(arguments);

            if ($.isFunction(before)) {
                result = before.apply(this, args);
            }

            if (result !== false) {

                if ($.isFunction(origin)) {
                    result = origin.apply(this, args);
                }

                if ($.isFunction(after)) {

                    args.push(result);

                    var temp = after.apply(this, args);

                    // 覆盖返回值
                    if ($.type(temp) !== 'undefined') {
                        result = temp;
                    }

                }

                return result;

            }
        };

        return isMethod
             ? (target[name] = wrapper)
             : wrapper;

    };

});