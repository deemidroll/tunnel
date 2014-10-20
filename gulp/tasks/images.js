var changed = require('gulp-changed'),
    gulp = require('gulp'),
    imagemin = require('gulp-imagemin'),
    config = require('../config');

gulp.task('images', function() {
    return gulp.src(config.images.src)
        .pipe(changed(config.images.dest)) // Ignore unchanged files
        .pipe(imagemin()) // Optimize
        .pipe(gulp.dest(config.images.dest));
});