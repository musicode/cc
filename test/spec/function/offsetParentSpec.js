define(function (require, exports, module) {

    var offsetParent = require('cobble/function/offsetParent');

    describe('function/offsetParent', function () {

        it('offsetParent', function () {

            var element = $('<div></div>').appendTo('body')

            expect(offsetParent(element).is('body')).toBe(true);

            var child = $('<div></div>').appendTo(element);

            expect(offsetParent(child).is('body')).toBe(true);

            element.css('position', 'relative');
            expect(offsetParent(child).is(element)).toBe(true);

            child.hide();
            expect(offsetParent(child).is(element)).toBe(true);
        });
    });
});