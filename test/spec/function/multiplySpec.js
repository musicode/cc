define(function (require, exports, module) {

    var multiply = require('cobble/function/multiply');

    describe('function/multiply', function () {

        it('int', function () {

            expect(multiply(5, 3)).toBe(15);
            expect(multiply(5000, 1)).toBe(5000);

        });

        it('float', function () {

            expect(multiply(5.1, 5.12)).toBe(26.112);
            expect(multiply(1.123, 2.321)).toBe(2.606483);
            expect(multiply(1.1001, 2.0001)).toBe(2.20031001);

        });

    });
});