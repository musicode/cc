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

        it('onDragStart onDrag onDragEnd', function () {

            var onDragStart = jasmine.createSpy('onDragStart');
            var onDrag = jasmine.createSpy('onDrag');
            var onDragEnd = jasmine.createSpy('onDragEnd');

            instance = new Draggable({
                element: element,
                onDragStart: onDragStart,
                onDrag: onDrag,
                onDragEnd: onDragEnd
            });

            element.trigger({
                type: 'mousedown',
                clientX: 100,
                clientY: 200
            });
            expect(onDragStart.callCount).toBe(0);

            doc.trigger({
                type: 'mousemove',
                clientX: 100,
                clientY: 200
            });

            expect(onDragStart.callCount).toBe(0);
            expect(onDrag.callCount).toBe(0);

            doc.trigger({
                type: 'mousemove',
                clientX: 300,
                clientY: 200
            });
            expect(onDragStart.callCount).toBe(1);
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
            expect(onDragStart.callCount).toBe(1);
            expect(onDrag.callCount).toBe(3);
            expect(onDragEnd.callCount).toBe(0);

            doc.trigger('mouseup');
            expect(onDrag.callCount).toBe(3);
            expect(onDragEnd.callCount).toBe(1);
        });

        it('handle', function () {

            var element = $(template).appendTo(document.body);
            var onDragStart = jasmine.createSpy('onDragStart');

            instance = new Draggable({
                element: element,
                selector: {
                    handle: '.header'
                },
                onDragStart: onDragStart
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

            expect(onDragStart).not.toHaveBeenCalled();

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

            expect(onDragStart).toHaveBeenCalled();
        });

        it('cancel', function () {

            var element = $(template).appendTo(document.body);
            var onDragStart = jasmine.createSpy('onDragStart');

            instance = new Draggable({
                element: element,
                selector: {
                    cancel: '.body'
                },
                onDragStart: onDragStart
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
            expect(onDragStart).not.toHaveBeenCalled();


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
            expect(onDragStart).toHaveBeenCalled();
        });

    });
});