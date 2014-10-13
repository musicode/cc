define(function (require, exports, module) {

    var call = require('cobble/function/call');

    describe('function/call', function () {

        it('scope', function () {

            var scope;

            function fn() {
                scope = this;
            }

            var tmp = { };

            call(fn, tmp);

            expect(scope).toBe(tmp);

        });

        it('apply', function () {

            var args;

            function fn() {
                args = arguments;
            }

            call(fn, null, [ 1, 2, 3 ]);

            expect(args.length).toBe(3);
            expect(args[0]).toBe(1);
            expect(args[1]).toBe(2);
            expect(args[2]).toBe(3);

        });

        it('call', function () {

            var args;

            function fn() {
                args = arguments;
            }

            call(fn, null, 1);

            expect(args.length).toBe(1);
            expect(args[0]).toBe(1);

        });

    });
});