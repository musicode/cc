define(function (require, exports, module) {

    var restrain = require('cobble/function/restrain');

    describe('function/restrain', function () {

        it('restrain', function () {

            var value = 10;
            var min = 1;
            var max = 20;

            expect(restrain(value, min, max)).toBe(value);
            expect(restrain(-1, min, max)).toBe(min);
            expect(restrain(100, min, max)).toBe(max);

        });
    });
});