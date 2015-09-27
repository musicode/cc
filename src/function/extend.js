/**
 * @file 复制属性
 * @author musicode
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 从 from 复制属性到 to
     *
     * 如果 to 已经存在某属性，则跳过
     *
     * @param {Object} to
     * @param {Object} from
     */
    return function (to, from) {

        if ($.isPlainObject(from)) {
            $.each(
                from,
                function (name, fn) {
                    if (!(name in to)) {
                        to[ name ] = fn;
                    }
                }
            );
        }

    };

});