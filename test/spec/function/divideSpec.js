define(function (require, exports, module) {

    var divide = require('cobble/function/divide');

    describe('function/divide', function () {

        it('int', function () {

            expect(divide(15, 3)).toBe(5);
            expect(divide(5000, 2)).toBe(2500);

        });

        it('float', function () {

            expect(divide(6.6, 3)).toBe(2.2);
            expect(divide(99.9, 3)).toBe(33.3);
            expect(divide(99.99, 3.3)).toBe(30.3);

        });

    });
});