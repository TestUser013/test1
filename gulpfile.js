const gulp = require('gulp');
const del = require('del');
const syntaxes = require('./syntaxes/index');

function build() {
    return syntaxes.main();
}

function watch() {
    return gulp.watch([
        './syntaxes/oe-abl.tmLanguage.yaml',
        './syntaxes/keywords.csv',
        './syntaxes/kwlist.txt',
        './syntaxes/index.js',
    ]).on('change', () => {
        console.log(`${(new Date()).toISOString()} - rebuild`);
        try {
            syntaxes.main();
        } catch (error) {
            console.error(error);
        }
    });
}

function clean() {
    return del([
            './syntaxes/oe-abl.tmLanguage.json'
        ], {
            force: true
        });
}

gulp.task('build', build);
gulp.task('clean', clean);
gulp.task('watch', watch);

exports.default = gulp.series(['clean', 'build', 'watch']);
