define(function (require, exports, module) {

    var plus = require('cobble/function/plus');

    describe('function/plus', function () {

        it('int', function () {

            expect(plus(5, 3)).toBe(8);
            expect(plus(5000, 1)).toBe(5001);

        });

        it('float', function () {

            expect(plus(5.1, 5.12)).toBe(10.22);
            expect(plus(1.123, 2.321)).toBe(3.444);
            expect(plus(1.1001, 2.0001)).toBe(3.1002);

        });

    });
});