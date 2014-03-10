/**
 * @file 首页模块
 * @author zhujl
 */
define(function (require, exports) {

    var demoCache = { };

    var $doc = $(document);
    var $main = $('#main');

    /**
     * 渲染模块 demo 页
     *
     * @param {string} module
     */
    exports.renderDemo = function (module) {
        if (demoCache[module]) {
            $doc.trigger('moduleChanged');
            $main.html(demoCache[module]);
        }
        else {
            require(['text!../../' + module + '.html'], function (html) {
                demoCache[module] = html;
                $doc.trigger('moduleChanged');
                $main.html(html);
            });
        }
    };

    /**
     * 初始化页面逻辑
     */
    exports.init = function () {
        $('#sidebar').on('click', 'a', function (e) {
            var $target = $(e.target);
            var module = $target.data('mod');
            if (module) {
                exports.renderDemo(module);
            }
        });
    };

});
