define(function (require, exports, module) {

    var minus = require('cobble/function/minus');

    describe('function/minus', function () {

        it('int', function () {

            expect(minus(5, 3)).toBe(2);
            expect(minus(5000, 1)).toBe(4999);

        });

        it('float', function () {
console.log(minus);
            expect(minus(5.1, 5.12)).toBe(-0.02);
            expect(minus(1.123, 2.321)).toBe(-1.198);
            expect(minus(1.1001, 2.0001)).toBe(-0.9);

        });

    });
});