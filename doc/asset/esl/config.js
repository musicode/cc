require.config({
    baseUrl: '/',
    paths: {
        text: './doc/asset/esl/text'
    },
    packages: [
        {
            name: 'cobble',
            location: './src',
            main: 'main'
        }
    ]
});
