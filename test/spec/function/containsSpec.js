define(function (require, exports, module) {

    var contains = require('cobble/function/contains');

    describe('function/contains', function () {

        it('contains', function () {

            var body = $(document.body);
            var element = $('<div></div>');

            expect(contains(body, element[0])).toBe(false);

            element.appendTo('body');

            expect(contains(body, element[0])).toBe(true);

            var child = $('<div></div>');

            expect(contains(element, child[0])).toBe(false);

            element.append(child);

            expect(contains(element, child[0])).toBe(true);
            expect(contains(element, element[0])).toBe(true);
        });
    });
});