define(function (require, exports, module) {

    var split = require('cobble/function/split');

    describe('function/split', function () {

        it('split', function () {

            var result = split(', a, b, c ,  d  ,e,', ',');

            expect(result.length).toBe(5);
            expect(result[0]).toBe('a');
            expect(result[1]).toBe('b');
            expect(result[2]).toBe('c');
            expect(result[3]).toBe('d');
            expect(result[4]).toBe('e');

        });
    });
});