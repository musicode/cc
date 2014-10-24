define(function (require, exports, module) {

    var Input = require('cobble/helper/Input');
    var Keyboard = require('cobble/helper/Keyboard');

    describe('helper/Input', function () {

        var input;
        var instance;

        function down(keyCode) {
            input.trigger({
                type: 'keydown',
                keyCode: keyCode
            });
        }
        function up(keyCode) {
            input.trigger({
                type: 'keyup',
                keyCode: keyCode
            });
        }
        function press(keyCode) {
            down(keyCode);
            up(keyCode);
        }

        beforeEach(function () {
            document.body.innerHTML = '<input type="text" />';
            input = $('input');
        });

        afterEach(function () {
            instance.dispose();
        });

        it('keyDown keyUp', function () {


            var onKeyDown = jasmine.createSpy('onKeyDown');
            var onKeyUp = jasmine.createSpy('onKeyUp');

            instance = new Input({
                element: input,
                onKeyDown: onKeyDown,
                onKeyUp: onKeyUp
            });

            press(13);

            expect(onKeyDown).toHaveBeenCalled();
            expect(onKeyUp).toHaveBeenCalled();

            press(13);

            expect(onKeyDown.callCount).toBe(2);
            expect(onKeyUp.callCount).toBe(2);

        });

        it('longPress', function () {

            var onBeforeLongPress = jasmine.createSpy('onBeforeLongPress');
            var onAfterLongPress = jasmine.createSpy('onAfterLongPress');
            var onEnter = jasmine.createSpy('onEnter');

            instance = new Input({
                element: input,
                longPress: true,
                action: {
                    enter: onEnter
                },
                onBeforeLongPress: onBeforeLongPress,
                onAfterLongPress: onAfterLongPress
            });

            down(13);

            expect(onEnter.callCount).toBe(1);
            expect(onBeforeLongPress.callCount).toBe(0);
            expect(onAfterLongPress.callCount).toBe(0);

            down(13);

            expect(onEnter.callCount).toBe(2);
            expect(onBeforeLongPress.callCount).toBe(1);
            expect(onAfterLongPress.callCount).toBe(0);

            press(13);

            expect(onEnter.callCount).toBe(3);
            expect(onAfterLongPress.callCount).toBe(1);
        });



    });
});