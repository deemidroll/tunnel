var gulp = require('gulp'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    config = require('../config');

gulp.task('svg', function () {
    return gulp.src(config.svg.src)
        .pipe(svgmin())
        .pipe(svgstore({
            fileName: 'icons.svg',
            prefix: 'icon-',
            transformSvg: function ($svg, done) {
                $svg.attr('class', 'svg-icons');
                done(null, $svg);
            }
        }))
        .pipe(gulp.dest(config.svg.dest));
});