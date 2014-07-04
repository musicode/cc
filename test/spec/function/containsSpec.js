define(function (require, exports, module) {

    var contains = require('cobble/function/contains');

    describe('function/contains', function () {

        it('contains', function () {

            var element = $('<div></div>');

            expect(contains(document.body, element[0])).toBe(false);

            element.appendTo('body');

            expect(contains(document.body, element[0])).toBe(true);

            var child = $('<div></div>');

            expect(contains(element[0], child[0])).toBe(false);

            element.append(child);

            expect(contains(element[0], child[0])).toBe(true);
            expect(contains(element[0], element[0])).toBe(true);
        });
    });
});