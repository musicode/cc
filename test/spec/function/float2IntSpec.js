define(function (require, exports, module) {

    var float2Int = require('cobble/function/float2Int');

    describe('function/float2Int', function () {

        it('int', function () {

            expect(float2Int(15)).toBe(15);
            expect(float2Int('15')).toBe(15);

            expect(float2Int(15.01)).toBe(1501);
            expect(float2Int('15.010')).toBe(15010);

            expect(float2Int(15.01, 3)).toBe(15010);
            expect(float2Int('15.010', 4)).toBe(150100);

        });

    });
});