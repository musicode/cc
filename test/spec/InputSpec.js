define(function (require, exports, module) {

    var Input = require('cobble/helper/Input');

    function reset() {
        document.body.innerHTML = '<input type="text" />';
    }

    function pressKey(element, keyCode) {
        element.trigger({
            type: 'keydown',
            keyCode: keyCode
        });
        element.trigger({
            type: 'keyup',
            keyCode: keyCode
        });
    }

    describe('Input', function () {

        it('键盘事件触发 onChange', function () {
            reset();

            var element = $('input');
            var onChange = jasmine.createSpy('onChange');

            var instance = new Input({
                element: element,
                onChange: onChange
            });

            pressKey(element, 80);

            expect(onChange).toHaveBeenCalled();

            // delete
            pressKey(element, 46);
            expect(onChange.calls.count()).toBe(2);

            // backspace
            pressKey(element, 8);
            expect(onChange.calls.count()).toBe(3);

            instance.dispose();
        });

        it('长按不触发 onChange', function () {
            reset();

            var element = $('input');
            var onChange = jasmine.createSpy('onChange');
            var onLongPressStart = jasmine.createSpy('onLongPressStart');
            var onLongPressEnd = jasmine.createSpy('onLongPressEnd');

            var instance = new Input({
                element: element,
                longPress: false,
                onLongPressStart: onLongPressStart,
                onLongPressEnd: onLongPressEnd,
                onChange: onChange
            });

            // 模拟长按
            for (var i = 0; i < 100; i++) {
                element.trigger({
                    type: 'keydown',
                    keyCode: 70
                });
            }

            expect(onLongPressStart).toHaveBeenCalled();
            expect(onLongPressEnd).not.toHaveBeenCalled();
            expect(onChange).not.toHaveBeenCalled();

            element.trigger({
                type: 'keyup',
                keyCode: 70
            });

            expect(onLongPressStart.calls.count()).toBe(1);
            expect(onLongPressEnd.calls.count()).toBe(1);
            expect(onChange.calls.count()).toBe(1);

            // 开启长按触发
            instance.longPress = true;

            // 模拟长按
            for (var i = 0; i < 100; i++) {
                element.trigger({
                    type: 'keydown',
                    keyCode: 70
                });
            }

            // 不是 101，因为第一次按下会视为非长按，所以长按触发从第二次开始
            expect(onChange.calls.count()).toBe(100);
            expect(onLongPressStart.calls.count()).toBe(2);
            expect(onLongPressEnd.calls.count()).toBe(1);

            element.trigger({
                type: 'keyup',
                keyCode: 70
            });

            expect(onChange.calls.count()).toBe(101);
            expect(onLongPressEnd.calls.count()).toBe(2);

            instance.dispose();
        });

        it('keyEvents', function () {

            reset();

            var element = $('input');
            var onUpPress = jasmine.createSpy('onUpPress');
            var onEnter = jasmine.createSpy('onEnter');

            var instance = new Input({
                element: element,
                onEnter: onEnter,
                keyEvents: {
                    '43': onUpPress,
                    '13': onEnter
                }
            });

            pressKey(element, 43);

            expect(onUpPress).toHaveBeenCalled();
            expect(onEnter).not.toHaveBeenCalled();

            pressKey(element, 13);
            expect(onEnter.calls.count()).toBe(2);

            instance.dispose();

        });

    });
});