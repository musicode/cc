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

        it('input placeholder', function () {

            instance = new Placeholder({
                element: element
            });

            instance.dispose();
        });

        it('native', function () {

            document.body.innerHTML = '<input placeholder="' + value + '"/>';

            element = $(':text');
            instance = new Placeholder({
                element: element,
                nativeFirst: false,
                placeholderAttr: 'placeholder'
            });

            expect(element.prop('placeholder')).toBe('');

            instance.dispose();
        });


        it('complex mode', function () {

            instance = new Placeholder({
                element: element,
                simple: false
            });

            instance.dispose();

        });

    });

});