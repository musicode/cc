define(function (require, exports, module) {

    var Placeholder = require('cobble/helper/Placeholder');

    describe('helper/Placeholder', function () {

        var instance;
        var element;
        var value = 'hahahah';

        Placeholder.defaultOptions = {
            simple: true,
            attribute: {
                placeholder: 'data-test'
            },
            className: {
                simple: 'placeholder-active'
            },
            selector: {
                placeholder: 'div'
            },
            template: '<div class="placeholder-wrapper">'
                    +    '<div></div>'
                    + '</div>'
        };

        beforeEach(function () {
            document.body.innerHTML = '<input data-test="' + value + '"/>';
            element = $(':text');
        });
        afterEach(function () {
            instance.dispose();
        });

        it('input placeholder', function () {

            instance = new Placeholder({
                element: element
            });

            expect(instance.get()).toBe(value);
        });

        it('native', function () {

            document.body.innerHTML = '<input placeholder="' + value + '"/>';

            element = $(':text');
            instance = new Placeholder({
                element: element,
                attribute: {
                    placeholder: 'placeholder'
                }
            });

            expect(instance.get()).toBe(value);
            expect(element.attr('placeholder')).toBe(undefined);
        });

        it('simple mode', function () {

            instance = new Placeholder({
                element: element,
                simple: true
            });

            expect(instance.get()).toBe(value);

            element.focus();
            expect(instance.get()).toBe('');

            element.blur();
            expect(instance.get()).toBe(value);

            element.focus();
            element.val('1');
            element.blur();
            expect(instance.get()).toBe('');
            expect(element.val()).toBe('1');
        });

        it('complex mode', function () {

            instance = new Placeholder({
                element: element,
                simple: false
            });

            expect(instance.get()).toBe(value);

            element.focus();
            expect(instance.get()).toBe('');

            element.blur();
            expect(instance.get()).toBe(value);

            element.focus();
            element.val('1');
            element.blur();
            expect(instance.get()).toBe('');
            expect(element.val()).toBe('1');
        });

    });

});