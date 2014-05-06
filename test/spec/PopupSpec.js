define(function (require, exports, module) {

    var Popup = require('cobble/helper/Popup');

    function reset() {

        document.body.innerHTML = '<div id="ui-select">'
                                +     '<span id="select-trigger">'
                                +         '<b>请选择</b>'
                                +         '<i class="icon-arrow-down"></i>'
                                +     '</span>'
                                +     '<ul id="select-layer">'
                                +         '<li>11111111111</li>'
                                +         '<li>22222222222</li>'
                                +         '<li>33333333333</li>'
                                +         '<li>44444444444</li>'
                                +     '</ul>'
                                + '</div>'
                                + '<a id="blur-button">xxx</a>'
    }

    function sleep(time) {
        for (var i = 0; i < time; i++) { }
    }

    describe('Popup', function () {

        it('初始化时是显示状态', function () {

            reset();

            var instance = new Popup({
                element: $('#select-layer'),
                trigger: $('#select-trigger'),
                showBy: 'click',
                hideBy: 'blur'
            });

            // 因为没设置样式，默认是显示的
            expect(instance.element.css('display')).not.toBe('none');

            // 失焦隐藏
            $('#blur-button').trigger('click');
            expect(instance.element.css('display')).toBe('none');

            instance.dispose();
        });

        it('showByClick & hideByBlur', function () {

            reset();

            var trigger = $('#select-trigger');
            var layer = $('#select-layer').hide();

            var instance = new Popup({
                element: layer,
                trigger: trigger,
                showBy: 'click',
                hideBy: 'blur'
            });

            // 点击显示
            trigger.trigger('click');
            expect(layer.css('display')).not.toBe('none');

            // 失焦隐藏
            $('#blur-button').trigger('click');
            expect(layer.css('display')).toBe('none');

            // 再次点击显示
            trigger.trigger('click');
            expect(layer.css('display')).not.toBe('none');

            // 模拟鼠标再次点击的延时
            sleep(100000);

            // 再次点击 trigger 会隐藏
            trigger.trigger('click');
            expect(layer.css('display')).toBe('none');

            instance.dispose();
        });

        it('showByOver & hideByOut', function () {

            reset();

            var trigger = $('#select-trigger');
            var layer = $('#select-layer').hide();

            var instance = new Popup({
                element: layer,
                trigger: trigger,
                showBy: 'over',
                hideBy: 'out'
            });

            // 鼠标移入显示
            trigger.trigger('mouseenter');
            expect(layer.css('display')).not.toBe('none');

            // 鼠标移出隐藏
            trigger.trigger('mouseleave');
            expect(layer.css('display')).toBe('none');

            // 鼠标移入显示
            trigger.trigger('mouseenter');
            expect(layer.css('display')).not.toBe('none');

            // 鼠标移出隐藏
            layer.trigger('mouseleave');
            expect(layer.css('display')).toBe('none');

            instance.dispose();
        });

        it('showByOver & hideByOut', function () {

            reset();

            var trigger = $('#select-trigger');
            var layer = $('#select-layer').hide();

            var instance = new Popup({
                element: layer,
                trigger: trigger,
                showBy: 'over',
                hideBy: 'out'
            });

            // 鼠标移入显示
            trigger.trigger('mouseenter');
            expect(layer.css('display')).not.toBe('none');

            // 鼠标移出隐藏
            trigger.trigger('mouseleave');
            expect(layer.css('display')).toBe('none');

            // 鼠标移入显示
            trigger.trigger('mouseenter');
            expect(layer.css('display')).not.toBe('none');

            // 鼠标移出隐藏
            layer.trigger('mouseleave');
            expect(layer.css('display')).toBe('none');

            instance.dispose();
        });

        it('onBeforeXX & onAfterXX', function () {

            reset();

            var trigger = $('#select-trigger');
            var layer = $('#select-layer').hide();

            var onBeforeShow = 0;
            var onAfterShow = 0;
            var onBeforeHide = 0;
            var onAfterHide = 0;

            var instance = new Popup({
                element: layer,
                trigger: trigger,
                showBy: 'click',
                hideBy: 'blur',
                showDelay: 0,
                hideDelay: 0,
                show: function () {
                    this.element.show();
                },
                hide: function () {
                    this.element.hide();
                },
                onBeforeShow: function () {
                    onBeforeShow++;
                },
                onAfterShow: function () {
                    onAfterShow++;
                },
                onBeforeHide: function () {
                    onBeforeHide++;
                },
                onAfterHide: function () {
                    onAfterHide++;
                }
            });

            trigger.trigger('click');
            expect(onBeforeShow).toBe(1);
            expect(onAfterShow).toBe(1);
            expect(layer.css('display')).not.toBe('none');

            sleep(1000000);

            $('#blur-button').trigger('click');
            expect(onBeforeHide).toBe(1);
            expect(onAfterHide).toBe(1);
            expect(layer.css('display')).toBe('none');

            // 阻止显示
            instance.onBeforeShow = function () {
                return false;
            };

            trigger.trigger('click');
            expect(onBeforeShow).toBe(1);
            expect(onAfterShow).toBe(1);
            expect(layer.css('display')).toBe('none');

            instance.onBeforeShow = null;

            trigger.trigger('click');
            expect(onBeforeShow).toBe(1);
            expect(onAfterShow).toBe(2);
            expect(layer.css('display')).not.toBe('none');

            // 阻止隐藏
            instance.onBeforeHide = function () {
                return false;
            };

            $('#blur-button').trigger('click');
            expect(onBeforeHide).toBe(1);
            expect(onAfterHide).toBe(1);
            expect(layer.css('display')).not.toBe('none');

            instance.onBeforeHide = null;

            sleep(1000000);

            $('#blur-button').trigger('click');
            expect(onBeforeHide).toBe(1);
            expect(onAfterHide).toBe(2);
            expect(layer.css('display')).toBe('none');

            instance.dispose();
        });



    });
});