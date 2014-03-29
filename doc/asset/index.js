/**
 * @file 首页模块
 * @author zhujl
 */
define(function (require, exports) {

    /**
     * 存储页面模版
     *
     * @private
     * @type {Object}
     */
    var pageCache = { };

    /**
     * 侧边栏，用于导航
     *
     * @private
     * @type {jQuery}
     */
    var $sidebar = $('sidebar');

    /**
     * 主元素区域，用于导航切换页面
     *
     * @private
     * @type {jQuery}
     */
    var $main = $('#main');

    /**
     * 当前激活状态的 class
     *
     * @private
     * @type {string}
     */
    var activeClass = 'active';

    /**
     * 当前的域名
     *
     * @private
     * @type {String}
     */
    var domain = document.location.protocol
               + '//'
               + document.location.host;

    /**
     * 收集 codemirror 实例，便于销毁
     *
     * @private
     * @type {Array}
     */
    var editors = [ ];

    // 配置 codemirror
    var defaultOptions = CodeMirror.defaults;
    defaultOptions.mode = 'javascript';
    defaultOptions.indentUnit = 4;
    defaultOptions.lineNumbers = true;
    defaultOptions.theme = 'mbo';

    /**
     * 渲染模块页面
     *
     * @private
     * @param {string} html 模版
     */
    function renderPage(html) {

        $.each(editors, function (index, editor) {
            //editor.codeMirror.destroy();
        });
        editors.length = 0;

        $main.html(html);

        $('textarea').each(function () {
            var $textarea = $(this);

            var width = $textarea.data('width');
            var height = $textarea.data('height');
            var mode = $textarea.data('mode');

            var data = { };
            if (mode) {
                data.mode = mode;
            }

            var codeMirror = CodeMirror.fromTextArea(this, data);
            if (width || height) {
                codeMirror.setSize(
                    width || 'auto',
                    height || 'auto'
                );
            }

            editors.push({
                codeMirror: codeMirror,
                textarea: $textarea[0]
            });
        });
    }

    /**
     * 获得新开 demo 页的模版
     *
     * @private
     * @param {string=} html
     * @param {string=} css
     * @param {string=} js
     * @return {string}
     */
    function getDemoTpl(html, css, js) {
        return [
                '<!DOCTYPE html>',
                '<html>',
                    '<head>',
                        '<meta charset="utf-8" />',
                        '<link rel="stylesheet" href="' + domain + '/doc/asset/css/normalize.css" />',
                        '<style>',
                            'body { font-size: 13px; }',
                            css || '',
                        '</style>',
                    '</head>',
                    '<body>',
                        html || '',
                        '<script src="' + domain + '/doc/asset/lib/jquery.js"></script>',
                        '<script src="' + domain + '/doc/asset/esl/esl.js"></script>',
                        '<script src="' + domain + '/doc/asset/esl/config.js"></script>',
                        '<script>',
                        js || '',
                        '</script>',
                    '</body>',
                '</html>'
            ].join('');
    }

    /**
     * 从 selector 指定的元素中读取代码
     *
     * @private
     * @param {string=} selector
     * @return {string}
     */
    function readCode(selector) {
        var codeMirror;
        if (selector) {
            var textarea = $(selector)[0];
            var target = $.grep(editors, function (editor) {
                return textarea === editor.textarea;
            });
            if (target.length > 0) {
                codeMirror = target[0].codeMirror;
            }
        }
        return codeMirror ? codeMirror.getValue() : '';
    }

    /**
     * 新开窗口运行代码
     *
     * @private
     * @param {string=} html
     * @param {string=} css
     * @param {string=} js
     */
    function runCode(html, css, js) {
        var win = window.open('', '_blank', '');
        var doc = win.document;
        doc.open('text/html', 'replace');
        win.opener = null;
        doc.write(getDemoTpl(html, css, js));
        doc.close();
    }

    /**
     * 跳转到某个模块页面
     *
     * @param {string} module
     */
    exports.redirect = function (module) {

        var $newer = $sidebar.find('a[data-mod="' + module + '"]');
        if ($newer.size() > 0) {

            var $older = $sidebar.find('a.' + activeClass);
            if ($older.data('mod') === module) {
                return;
            }

            $older.removeClass(activeClass);
            $newer.addClass(activeClass);

            if (pageCache[module]) {
                renderPage(pageCache[module]);
            }
            else {
                require(
                    ['text!../' + module + '.html'],
                    function (html) {
                        pageCache[module] = html;
                        renderPage(html);
                    }
                );
            }
        }
    };

    /**
     * 初始化页面逻辑
     */
    exports.init = function (module) {

        var hash = window.location.hash;
        if (hash.length > 0) {
            hash = hash.substr(1);
            exports.redirect(hash);
        }
        else {
            exports.redirect(module);
        }

        // 处理导航
        $sidebar.on('click', 'a', function (e) {
            exports.redirect($(e.target).data('mod'));
        });

        // 处理 tab 切换
        $main.on('click', '.nav-item:not(.active)', function (e) {
            var tab = $(e.target).data('tab');

            $('.nav-item.' + activeClass).removeClass(activeClass);
            $('.content-item.' + activeClass).removeClass(activeClass);

            $('.nav-item[data-tab="' + tab + '"]').addClass(activeClass);
            $('.content-item[data-tab="' + tab + '"]').addClass(activeClass);

            $.each(editors, function (index, editor) {
                editor.codeMirror.refresh();
            });
        });

        // 处理运行代码
        $main.on('click', '.run-code', function (e) {
            var $target = $(e.currentTarget);

            var html = readCode($target.data('html'));
            var css = readCode($target.data('css'));
            var js = readCode($target.data('js'));

            runCode(html, css, js);
        });
    };

});
