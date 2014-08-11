/* scss task
   ---------------
*/

var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    prefix = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    minifycss = require('gulp-minify-css'),
    handleErrors = require('../util/handleErrors'),
    header = require('gulp-header'),
    banner = '/* Made by 5_ | 2014 */';

gulp.task('scss', function() {
    gulp.src([
        './src/scss/**/*.scss'
        ])
        .on('error', handleErrors)
        .pipe(sass({style: 'compressed'}))
        .pipe(prefix('last 3 version'))
        .pipe(minifycss())
        .pipe(concat('app.css'))
        .pipe(header(banner))
        .pipe(gulp.dest('build/css'));
});
