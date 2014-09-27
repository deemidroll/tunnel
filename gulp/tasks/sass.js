/* scss task
   ---------------
*/

var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    prefix = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    minifycss = require('gulp-minify-css'),
    handleErrors = require('../util/handleErrors'),
    config = require('../config').sass,
    header = require('gulp-header'),
    banner = '/* Made by 5_ | 2014 */';

gulp.task('sass', function() {
    gulp.src(config.src)
        .pipe(sass({
            style: 'compressed'
        }))
        .pipe(prefix('last 3 version'))
        .pipe(minifycss())
        .pipe(concat('app.css'))
        .pipe(header(banner))
        .on('error', handleErrors)
        .pipe(gulp.dest(config.dest));
});