define(function (require, exports, module) {

    var Tooltip = require('cobble/Tooltip');
    var position = require('cobble/position');

    function reset() {
        document.body.innerHTML = '<i id="icon1" title="tip1">?</i>'
                                + '<i id="icon2" title="tip2"></i>';
                                + '<i id="icon3" title=""></i>';
    }
    describe('Tooltip', function () {

        it('显示 && 隐藏', function () {
            reset();

            var icon = $('#icon1');

            var showCouter = 0;
            var hideCouter = 0;

            var beforeShowCounter = 0;
            var afterShowCounter = 0;
            var beforeHideCouter = 0;
            var afterHideCouter = 0;

            var instance = new Tooltip({
                element: icon,
                showBy: 'over,click',
                hideBy: 'out,blur',
                showDelay: 0,
                hideDelay: 0,
                show: function (tipElement) {
                    tipElement.show();
                    showCouter++;
                },
                hide: function (tipElement) {
                    tipElement.hide();
                    hideCouter++;
                },
                onBeforeShow: function () {
                    beforeShowCounter++;
                },
                onAfterShow: function () {
                    afterShowCounter++;
                },
                onBeforeHide: function () {
                    beforeHideCouter++;
                },
                onAfterHide: function () {
                    afterHideCouter++;
                }
            });

            var tipElement = $('.tooltip');

            icon.trigger('mouseenter');
            expect(showCouter).toBe(1);
            expect(beforeShowCounter).toBe(1);
            expect(afterShowCounter).toBe(1);
            expect(tipElement.css('display')).not.toBe('none');

            icon.trigger('mouseleave');
            expect(hideCouter).toBe(1);
            expect(beforeHideCouter).toBe(1);
            expect(afterHideCouter).toBe(1);
            expect(tipElement.css('display')).toBe('none');

            icon.trigger('click');
            expect(showCouter).toBe(2);
            expect(beforeShowCounter).toBe(2);
            expect(afterShowCounter).toBe(2);
            expect(tipElement.css('display')).not.toBe('none');

            $(document.body).trigger('click');
            expect(hideCouter).toBe(2);
            expect(beforeHideCouter).toBe(2);
            expect(afterHideCouter).toBe(2);
            expect(tipElement.css('display')).toBe('none');

            instance.dispose();
        });

        it('多个元素共享一个 tip 元素', function () {

            reset();

            var icon1 = $('#icon1');
            var icon2 = $('#icon2');

            var instance1 = new Tooltip({
                element: icon1,
                showBy: 'click',
                hideBy: 'blur',
                showDelay: 0,
                hideDelay: 0
            });
            var instance2 = new Tooltip({
                element: icon2,
                showBy: 'over',
                hideBy: 'out',
                showDelay: 0,
                hideDelay: 0
            });

            var tipElement = $('.tooltip');

            icon1.trigger('click');
            expect(tipElement.css('display')).not.toBe('none');

            $(document.body).trigger('click');
            expect(tipElement.css('display')).toBe('none');

            icon2.trigger('mouseenter');
            expect(tipElement.css('display')).not.toBe('none');

            icon2.trigger('mouseleave');
            expect(tipElement.css('display')).toBe('none');

            instance1.dispose();
            instance2.dispose();
        });

        it('多个元素共享一个 tip 元素 - 设置延时产生的连续显示', function () {

            reset();

            var icon1 = $('#icon1');
            var icon2 = $('#icon2');

            var instance1 = new Tooltip({
                element: icon1,
                showBy: 'over',
                hideBy: 'out',
                showDelay: 0,
                hideDelay: 1000
            });
            var instance2 = new Tooltip({
                element: icon2,
                showBy: 'over',
                hideBy: 'out',
                showDelay: 0,
                hideDelay: 1000
            });

            var tipElement = $('.tooltip');

            icon1.trigger('mouseenter');
            expect(tipElement.css('display')).not.toBe('none');
            expect(tipElement.html()).toBe('tip1');

            icon1.trigger('mouseleave');
            expect(tipElement.css('display')).not.toBe('none');
            expect(tipElement.html()).toBe('tip1');

            icon2.trigger('mouseenter');
            expect(tipElement.css('display')).not.toBe('none');
            expect(tipElement.html()).toBe('tip2');

            icon2.trigger('mouseleave');
            expect(tipElement.css('display')).not.toBe('none');
            expect(tipElement.html()).toBe('tip2');

            instance1.dispose();
            instance2.dispose();
        });

        it('内容为空的时候不显示 tip', function () {
            reset();

            var icon = $('#icon3');

            var instance = new Tooltip({
                element: icon,
                showBy: 'over',
                hideBy: 'out'
            });

            var tipElement = $('.tooltip');

            icon.trigger('mouseenter');
            expect(tipElement.css('display')).toBe('none');

            instance.dispose();
        });
    });
});