define(function (require, exports, module) {

    var decimalLength = require('cobble/function/decimalLength');

    describe('function/decimalLength', function () {

        it('int', function () {

            expect(decimalLength(5), 0);
            expect(decimalLength('5'), 0);

        });

        it('float', function () {

            expect(decimalLength(5.1), 1);
            expect(decimalLength('5.1'), 1);
        });

    });
});