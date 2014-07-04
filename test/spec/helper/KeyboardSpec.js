define(function (require, exports, module) {

    var Keyboard = require('cobble/helper/Keyboard');

    describe('helper/Keyboard', function () {

        var doc = $(document);
        var instance;

        function down(keyCode) {
            doc.trigger({
                type: 'keydown',
                keyCode: keyCode
            });
        }
        function up(keyCode) {
            doc.trigger({
                type: 'keyup',
                keyCode: keyCode
            });
        }
        function press(keyCode) {
            down(keyCode);
            up(keyCode);
        }

        afterEach(function () {
            instance.dispose();
        });

        it('keyDown keyUp', function () {


            var onKeyDown = jasmine.createSpy('onKeyDown');
            var onKeyUp = jasmine.createSpy('onKeyUp');

            instance = new Keyboard({
                element: doc,
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

            instance = new Keyboard({
                element: doc,
                onLongPressStart: onLongPressStart,
                onLongPressEnd: onLongPressEnd
            });

            down(32);

            expect(onLongPressStart.calls.count()).toBe(0);
            expect(onLongPressEnd.calls.count()).toBe(0);

            down(32);

            expect(onLongPressStart.calls.count()).toBe(1);
            expect(onLongPressEnd.calls.count()).toBe(0);

            press(32);

            expect(onLongPressEnd.calls.count()).toBe(1);
        });

        it('action', function () {

            var onEnter = jasmine.createSpy('onEnter');
            var onCtrlEnter = jasmine.createSpy('onCtrlEnter');
            var onShiftCtrlEnter = jasmine.createSpy('onShiftCtrlEnter');

            instance = new Keyboard({
                element: doc,
                action: {
                    'enter': onEnter,
                    'ctrl + enter': onCtrlEnter,
                    'shift + ctrl+enter': onShiftCtrlEnter
                }
            });

            press(13);

            expect(onEnter.calls.count()).toBe(1);
            expect(onCtrlEnter.calls.count()).toBe(0);
            expect(onShiftCtrlEnter.calls.count()).toBe(0);


            doc.trigger({
                type: 'keydown',
                keyCode: 13,
                ctrlKey: true
            });

            expect(onEnter.calls.count()).toBe(1);
            expect(onCtrlEnter.calls.count()).toBe(1);
            expect(onShiftCtrlEnter.calls.count()).toBe(0);

            up(13);

            doc.trigger({
                type: 'keydown',
                keyCode: 13,
                ctrlKey: true,
                shiftKey: true
            });

            expect(onEnter.calls.count()).toBe(1);
            expect(onCtrlEnter.calls.count()).toBe(1);
            expect(onShiftCtrlEnter.calls.count()).toBe(1);

            up(13);
        });

        it('keypad', function () {

            var onFive = jasmine.createSpy('onFive');
            var onDot = jasmine.createSpy('onDot');
            var onPlus = jasmine.createSpy('onPlus');
            var onMinus = jasmine.createSpy('onMinus');

            instance = new Keyboard({
                element: doc,
                action: {
                    '$5': onFive,
                    '$.': onDot,
                    '$+': onPlus,
                    '$-': onMinus
                }
            });

            press(Keyboard.map['$5']);
            expect(onFive).toHaveBeenCalled();

            press(Keyboard.map['$.']);
            expect(onDot).toHaveBeenCalled();

            press(Keyboard.map['$+']);
            expect(onPlus).toHaveBeenCalled();

            press(Keyboard.map['$-']);
            expect(onMinus).toHaveBeenCalled();
        });


        it('scope', function () {

            var downScope;
            var upScope;
            var startScope;
            var endScope;
            var actionScope;

            instance = new Keyboard({
                element: doc,
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

            down(Keyboard.map.enter);
            down(Keyboard.map.enter);
            down(Keyboard.map.enter);
            down(Keyboard.map.enter);
            down(Keyboard.map.enter);
            up(Keyboard.map.enter);


            expect(downScope).toBe(instance);
            expect(upScope).toBe(instance);
            expect(startScope).toBe(instance);
            expect(endScope).toBe(instance);
            expect(actionScope).toBe(instance);


        });

        it('action => keydown', function () {

            // action 和 keydown 的执行顺序
            var i = 0;

            instance = new Keyboard({
                element: doc,
                onKeyDown: function () {
                    i = 1;
                },
                action: {
                    enter: function () {
                        i = 2;
                    }
                }
            });

            press(13);

            expect(i).toBe(1);

        });

    });
});