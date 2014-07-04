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

            expect(onKeyDown.calls.count()).toBe(2);
            expect(onKeyUp.calls.count()).toBe(2);

        });

        it('longPress', function () {

            var onLongPressStart = jasmine.createSpy('onLongPressStart');
            var onLongPressEnd = jasmine.createSpy('onLongPressEnd');
            var onEnter = jasmine.createSpy('onEnter');

            instance = new Input({
                element: input,
                longPress: true,
                action: {
                    enter: onEnter
                },
                onLongPressStart: onLongPressStart,
                onLongPressEnd: onLongPressEnd
            });

            down(13);

            expect(onEnter.calls.count()).toBe(1);
            expect(onLongPressStart.calls.count()).toBe(0);
            expect(onLongPressEnd.calls.count()).toBe(0);

            down(13);

            expect(onEnter.calls.count()).toBe(2);
            expect(onLongPressStart.calls.count()).toBe(1);
            expect(onLongPressEnd.calls.count()).toBe(0);

            press(13);

            expect(onEnter.calls.count()).toBe(3);
            expect(onLongPressEnd.calls.count()).toBe(1);
        });


        it('scope', function () {

            var downScope;
            var upScope;
            var startScope;
            var endScope;
            var actionScope;

            var scope = { };

            instance = new Input({
                element: input,
                scope: scope,
                onKeyDown: function () {
                    downScope = this;
                },
                onKeyUp: function () {
                    upScope = this;
                },
                onLongPressStart: function () {
                    startScope = this;
                },
                onLongPressEnd: function () {
                    endScope = this;
                },
                action: {
                    enter: function () {
                        actionScope = this;
                    }
                }
            });

            down(13);
            down(13);
            down(13);
            down(13);
            down(13);
            up(13);


            expect(downScope).toBe(scope);
            expect(upScope).toBe(scope);
            expect(startScope).toBe(scope);
            expect(endScope).toBe(scope);
            expect(actionScope).toBe(scope);

        });

    });
});