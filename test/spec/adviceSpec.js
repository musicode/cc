define(function (require, exports, module) {

    var advice = require('cobble/util/advice');

    describe('test advice', function () {

        it('beforeFunction', function () {

            var i = 0;

            var foo = function () {
                i = 4;
            };
            var beforeFoo = function () {
                i++;
            };

            foo = advice.before(foo, beforeFoo);
            foo();

            expect(i).toBe(4);
        });

        // 用 before 拦截真正要执行的函数
        it('beforePreventFunction', function () {

            var i = 0;

            var foo = function () {
                i = 4;
            };
            var beforeFoo = function () {
                return false;
            };

            foo = advice.before(foo, beforeFoo);
            foo();

            expect(i).toBe(0);
        });

        it('beforeMethod', function () {

            var i = 0;

            var foo = {
                add: function () {
                    i = 4;
                }
            };

            var beforeAdd = function () {
                i++;
            };

            advice.before(foo, 'add', beforeAdd);
            foo.add();

            expect(i).toBe(4);
        });

        it('beforePreventMethod', function () {

            var i = 0;

            var foo = {
                add: function () {
                    i = 4;
                }
            };

            var beforeAdd = function () {
                return false;
            };

            advice.before(foo, 'add', beforeAdd);
            foo.add();

            expect(i).toBe(0);
        });

        it('afterFunction', function () {

            var i = 0;

            var foo = function () {
                i++;
            };
            var afterFoo = function () {
                i = 3;
            };

            foo = advice.after(foo, afterFoo);
            foo();

            expect(i).toBe(3);
        });

        it('afterOverrideFunction', function () {

            var foo = function () {
                return 1;
            };
            var afterFoo = function () {
                return 2;
            };

            foo = advice.after(foo, afterFoo);

            expect(foo()).toBe(2);
        });

        it('afterMethod', function () {

            var i = 0;

            var foo = {
                add: function () {
                    i++;
                }
            };
            var afterAdd = function () {
                i = 3;
            };

            advice.after(foo, 'add', afterAdd);
            foo.add();

            expect(i).toBe(3);
        });

        it('afterOverrideMethod', function () {

            var foo = {
                add: function () {
                    return 1;
                }
            };
            var afterAdd = function () {
                return 2;
            };

            advice.after(foo, 'add', afterAdd);

            expect(foo.add()).toBe(2);
        });
    });

});