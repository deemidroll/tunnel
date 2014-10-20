/* scss task
   ---------------
*/

var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    prefix = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    minifycss = require('gulp-minify-css'),
    handleErrors = require('../util/handleErrors'),
    config = require('../config'),
    header = require('gulp-header'),
    gulpif = require('gulp-if'),
    minimist = require('minimist'),
    banner = '/* ' + config.banner + ' */\n';

var knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'dev' }
};
var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('sass', function() {
    gulp.src(config.sass.src)
        .pipe(sass({
            style: 'compressed'
        }))
        .pipe(prefix('last 3 version'))
        // only minify in production
        .pipe(gulpif(options.env === 'prod', minifycss()))
        .pipe(concat('app.css'))
        .pipe(header(banner))
        .on('error', handleErrors)
        .pipe(gulp.dest(config.sass.dest));
});