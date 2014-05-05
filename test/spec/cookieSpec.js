define(function (require, exports, module) {

    var cookie = require('cobble/util/cookie');

    describe('cookie', function () {

        function reset() {
            var data = cookie.get();
            for (var key in data) {
                cookie.remove(key);
            }
        }

        it('set cookie', function () {
            reset();
            cookie.set('project', 'cobble');
            expect(cookie.get('project')).toBe('cobble');
        });

        it('set cookie by Object', function () {
            reset();
            var obj = {
                a: 1,
                b: 2,
                c: '3'
            };
            cookie.set(obj);
            expect(cookie.get('a')).toBe('1');
        });

        it('remove cookie', function () {
            reset();
            cookie.set('name', 'cobble');
            expect(cookie.get('name')).toBe('cobble');

            cookie.remove('name');
            expect(cookie.get('name')).toBe(undefined);
        });

    });
});