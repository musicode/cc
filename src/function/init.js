/**
 * @file 批量初始化实例
 * @author zhujl
 */
define(function (require, exports, module) {

    'use strict';

    /**
     * 批量初始化实例工厂
     *
     * @param {Function} Class 类
     * @return {Function}
     */
    return function (Class) {

        /**
         * 批量初始化实例
         *
         * @param {jQuery} element 通过 jQ 找到的元素集
         * @param {Object=} options 配置项
         * @return {Array}
         */
        return function (element, options) {

            var result = [ ];

            element.each(
                function () {
                    result.push(
                        new Class(
                            $.extend(
                                {
                                    element: $(this)
                                },
                                options
                            )
                        )
                    );
                }
            );

            return result;
        };
    };

});