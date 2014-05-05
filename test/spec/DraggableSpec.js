define(function (require, exports, module) {

    var Draggable = require('cobble/base/Draggable');

    var elementId = 'draggable';
    var template = '<div id="' + elementId + '">'
                 +     '<div class="header">header</div>'
                 +     '<div class="body">body</div>'
                 + '</div>';
    var instance;

    afterEach(function () {
        document.body.innerHTML = '';
        if (instance) {
            instance.dispose();
            instance = null;
        }
    });

    describe('Draggable', function () {

        it('onDragStart onDrag onDragEnd', function () {

            var doc = $(document.documentElement);
            var element = $(template).appendTo(document.body);

            var onDragStart = jasmine.createSpy('onDragStart');
            var onDrag = jasmine.createSpy('onDrag');
            var onDragEnd = jasmine.createSpy('onDragEnd');

            instance = new Draggable({
                element: element,
                onDragStart: onDragStart,
                onDrag: onDrag,
                onDragEnd: onDragEnd
            });

            element.trigger('mousedown');
            expect(onDragStart).toHaveBeenCalled();

            doc.trigger('mousemove');
            expect(onDrag).toHaveBeenCalled();

            doc.trigger('mousemove');
            doc.trigger('mousemove');
            doc.trigger('mousemove');
            expect(onDragStart.calls.count()).toBe(1);
            expect(onDrag.calls.count()).toBe(4);
            expect(onDragEnd.calls.count()).toBe(0);

            doc.trigger('mouseup');
            expect(onDrag.calls.count()).toBe(4);
            expect(onDragEnd.calls.count()).toBe(1);
        });

        it('onDragXXX args', function () {

            var dragStartArgs;
            var dragArgs;
            var dragEndArgs;

            var doc = $(document.documentElement);
            var element = $(template).appendTo(document.body);

            instance = new Draggable({
                element: element,
                onDragStart: function (data) {
                    dragStartArgs = data;
                },
                onDrag: function (data) {
                    dragArgs = data;
                },
                onDragEnd: function (data) {
                    dragEndArgs = data;
                }
            });

            element.trigger('mousedown');
            expect(typeof dragStartArgs.left).toBe('number');
            expect(typeof dragStartArgs.top).toBe('number');

            doc.trigger('mousemove');
            expect(typeof dragArgs.left).toBe('number');
            expect(typeof dragArgs.top).toBe('number');

            doc.trigger('mouseup');
            expect(typeof dragEndArgs.left).toBe('number');
            expect(typeof dragEndArgs.top).toBe('number');
        });

        it('handle', function () {

            var element = $(template).appendTo(document.body);
            var onDragStart = jasmine.createSpy('onDragStart');

            instance = new Draggable({
                element: element,
                handle: '.header',
                onDragStart: onDragStart
            });

            element.find('.body').trigger('mousedown');
            expect(onDragStart).not.toHaveBeenCalled();

            element.trigger('mouseup');

            element.find('.header').trigger('mousedown');
            expect(onDragStart).toHaveBeenCalled();
        });

        it('cancel', function () {

            var element = $(template).appendTo(document.body);
            var onDragStart = jasmine.createSpy('onDragStart');

            instance = new Draggable({
                element: element,
                cancel: '.body',
                onDragStart: onDragStart
            });

            element.find('.body').trigger('mousedown');
            expect(onDragStart).not.toHaveBeenCalled();

            element.trigger('mouseup');

            element.find('.header').trigger('mousedown');
            expect(onDragStart).toHaveBeenCalled();
        });

    });
});