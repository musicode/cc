/**
 * @file 单例
 * @author musicode
 */
define(function (require, exports, module) {

    /**
     * 全局使用的单例，没必要重复包装 jQuery 对象
     */

    exports.window = $(window);

    exports.document = $(document);

    exports.html = $(document.documentElement);

    exports.body = $(document.body);

});