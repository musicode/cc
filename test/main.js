(function () {

    var testFiles = [];

    var pathToModule = function(path) {
        return path.replace(/^\/base\//, '').replace(/\.js$/, '');
    };

    for (var file in window.__karma__.files) {
        if (/Spec.js$/.test(file)) {
            testFiles.push(pathToModule(file));
        }
    }

    require.config({
        // Karma serves files under /base, which is the basePath from your config file
        baseUrl: '/base',

        paths: {
            cobble: './src'
        },

        // dynamically load all test files
        deps: testFiles,

        // we have to kickoff jasmine, as it is asynchronous
        callback: window.__karma__.start
    });

})();