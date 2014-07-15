define(function (require, exports, module) {

    var cookie = require('cobble/util/cookie');

    describe('util/cookie', function () {

        beforeEach(function () {
            var data = cookie.get();
            for (var key in data) {
                cookie.remove(key);
            }
        });

        it('set', function () {
            cookie.set('project', 'cobble');
            expect(cookie.get('project')).toBe('cobble');
        });

        it('set by Object', function () {
            var obj = {
                a: 1,
                b: 2,
                c: '3'
            };
            cookie.set(obj);
            expect(cookie.get('a')).toBe('1');
        });

        it('remove cookie', function () {
            cookie.set('name', 'cobble');
            expect(cookie.get('name')).toBe('cobble');

            cookie.remove('name');
            expect(cookie.get('name')).toBe(undefined);
        });

    });
});