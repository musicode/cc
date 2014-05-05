define(function (require, exports, module) {

    var ContextMenu = require('cobble/ui/ContextMenu');

    var instance;

    var menuId = 'context-menu';
    var template = '<div id="' + menuId + '">'
                 +    '<a class="copy">复制</a>'
                 +    '<a class="paste">粘贴</a>'
                 +    '<a class="refresh">刷新</a>'
                 + '</div>';

    afterEach(function () {
        if (instance) {
            instance.dispose();
            instance = null;
        }
        document.body.innerHTML = '';
    });

    describe('ContextMenu', function () {

        it('通过 HTML 模版创建菜单', function () {
            var body = $(document.body);

            instance = new ContextMenu({
                element: template,
                container: body
            });

            var menu = $('#' + menuId);

            // 初始化时不会创建元素
            expect(menu.length).toBe(0);

            // 触发 contextmenu 事件后创建元素
            body.trigger({
                type: 'contextmenu',
                pageX: 100,
                pageY: 100
            });

            menu = $('#' + menuId);
            expect(menu.length).toBe(1);

            // 元素的父级是 body
            expect(menu.parent().prop('tagName')).toBe('BODY');
            // 菜单应该是显示状态
            expect(menu.css('display')).not.toBe('none');

        });

        it('通过 HTMLElement 创建菜单', function () {
            var body = $(document.body);
            body.css({
                margin: 0
            });

            instance = new ContextMenu({
                element: $(template),
                container: body
            });

            var menu = $('#' + menuId);

            // 初始化会把元素扔进文档树
            expect(menu.length).toBe(1);
            // 元素默认是隐藏的
            expect(menu.css('display')).toBe('none');
            // 元素的父级是 body
            expect(menu.parent().prop('tagName')).toBe('BODY');

            // 触发 contextmenu 事件后显示元素
            body.trigger({
                type: 'contextmenu',
                pageX: 321,
                pageY: 123
            });
            expect(menu.css('display')).not.toBe('none');

            // 元素可以定位
            expect(menu.css('position')).toBe('absolute');
            expect(menu.css('left')).toBe('321px');
            expect(menu.css('top')).toBe('123px');
        });

        it('菜单失焦隐藏', function () {
            var body = $(document.body);
            var link = $('<a>trigger</a>');
            var menu = $(template);

            link.appendTo(body);

            instance = new ContextMenu({
                element: menu,
                container: body
            });

            // 触发 contextmenu 事件后显示元素
            body.trigger('contextmenu');
            expect(menu.css('display')).not.toBe('none');

            // 点击菜单内部不会隐藏
            menu.find('.copy').trigger('click');
            expect(menu.css('display')).not.toBe('none');

            // 失焦隐藏
            link.trigger('click');
            expect(menu.css('display')).toBe('none');
        });

        it('clickEvents & hide()', function () {
            var body = $(document.body);
            var onCopy = jasmine.createSpy('onCopy');

            instance = new ContextMenu({
                element: $(template),
                container: body,
                clickEvents: {
                    '.copy': onCopy,
                    '.paste': function () {
                        this.hide();
                    }
                }
            });

            // 触发显示
            body.trigger('contextmenu');

            var menu = $('#' + menuId);
            // 测试是否调用 onCopy
            menu.find('.copy').trigger('click');
            expect(onCopy).toHaveBeenCalled();

            // 测试 hide() 是否会隐藏菜单
            menu.find('.paste').trigger('click');
            expect(menu.css('display')).toBe('none');
        });
    });
});