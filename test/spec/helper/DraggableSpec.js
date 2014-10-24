define(function (require, exports, module) {

    var Draggable = require('cobble/helper/Draggable');

    describe('helper/Draggable', function () {

        var elementId = 'draggable';
        var template = '<div id="' + elementId + '">'
                     +     '<div class="header">header</div>'
                     +     '<div class="body">body</div>'
                     + '</div>';

        var instance;

        var element;
        var doc = $(document.documentElement);

        beforeEach(function () {
            document.body.innerHTML = template;
            element = $('#' + elementId);
        });

        afterEach(function () {
            instance.dispose();
            instance = null;
        });

        it('onBeforeDrag onDrag onAfterDrag', function () {

            var onBeforeDrag = jasmine.createSpy('onBeforeDrag');
            var onDrag = jasmine.createSpy('onDrag');
            var onAfterDrag = jasmine.createSpy('onAfterDrag');

            instance = new Draggable({
                element: element,
                onBeforeDrag: onBeforeDrag,
                onDrag: onDrag,
                onAfterDrag: onAfterDrag
            });

            element.trigger({
                type: 'mousedown',
                clientX: 100,
                clientY: 200
            });
            expect(onBeforeDrag.callCount).toBe(0);

            doc.trigger({
                type: 'mousemove',
                clientX: 100,
                clientY: 200
            });

            expect(onBeforeDrag.callCount).toBe(0);
            expect(onDrag.callCount).toBe(0);

            doc.trigger({
                type: 'mousemove',
                clientX: 300,
                clientY: 200
            });
            expect(onBeforeDrag.callCount).toBe(1);
            expect(onDrag.callCount).toBe(1);

            doc.trigger({
                type: 'mousemove',
                clientX: 400,
                clientY: 300
            });
            doc.trigger({
                type: 'mousemove',
                clientX: 500,
                clientY: 400
            });
            expect(onBeforeDrag.callCount).toBe(1);
            expect(onDrag.callCount).toBe(3);
            expect(onAfterDrag.callCount).toBe(0);

            doc.trigger('mouseup');
            expect(onDrag.callCount).toBe(3);
            expect(onAfterDrag.callCount).toBe(1);
        });

        it('handle', function () {

            var element = $(template).appendTo(document.body);
            var onBeforeDrag = jasmine.createSpy('onBeforeDrag');

            instance = new Draggable({
                element: element,
                handleSelector: '.header',
                onBeforeDrag: onBeforeDrag
            });

            element.find('.body').trigger({
                type: 'mousedown',
                clientX: 100,
                clientY: 200
            });
            element.trigger({
                type: 'mousemove',
                clientX: 200,
                clientY: 300
            });
            element.trigger('mouseup');

            expect(onBeforeDrag).not.toHaveBeenCalled();

            element.find('.header').trigger({
                type: 'mousedown',
                clientX: 100,
                clientY: 200
            });
            element.trigger({
                type: 'mousemove',
                clientX: 200,
                clientY: 300
            });
            element.trigger('mouseup');

            expect(onBeforeDrag).toHaveBeenCalled();
        });

        it('cancel', function () {

            var element = $(template).appendTo(document.body);
            var onBeforeDrag = jasmine.createSpy('onBeforeDrag');

            instance = new Draggable({
                element: element,
                cancelSelector: '.body',
                onBeforeDrag: onBeforeDrag
            });

            element.find('.body').trigger({
                type: 'mousedown',
                clientX: 100,
                clientY: 200
            });
            element.trigger({
                type: 'mousemove',
                clientX: 200,
                clientY: 300
            });
            element.trigger('mouseup');
            expect(onBeforeDrag).not.toHaveBeenCalled();


            element.find('.header').trigger({
                type: 'mousedown',
                clientX: 100,
                clientY: 200
            });
            element.trigger({
                type: 'mousemove',
                clientX: 200,
                clientY: 300
            });
            element.trigger('mouseup');
            expect(onBeforeDrag).toHaveBeenCalled();
        });

    });
});