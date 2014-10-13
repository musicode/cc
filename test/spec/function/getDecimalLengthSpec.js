define(function (require, exports, module) {

    var getDecimalLength = require('cobble/function/getDecimalLength');

    describe('function/getDecimalLength', function () {

        it('int', function () {

            expect(getDecimalLength(5), 0);
            expect(getDecimalLength('5'), 0);

        });

        it('float', function () {

            expect(getDecimalLength(5.1), 1);
            expect(getDecimalLength('5.1'), 1);
        });

    });
});