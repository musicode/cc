/**
 * @file 拦截
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

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

        var isMethod = typeof name === 'string';
        var origin = isMethod ? target[name] : target;

        // 调整参数顺序
        if (!isMethod) {
            after = before;
            before = name;
        }

        var wrapper = function () {

            var result;

            if (typeof before === 'function') {
                result = before.apply(this, arguments);
            }

            if (result !== false) {

                if (typeof origin === 'function') {
                    result = origin.apply(this, arguments);
                }

                if (typeof after === 'function') {
                    var temp = after.apply(this, arguments);
                    // 覆盖返回值
                    if (typeof temp !== 'undefined') {
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