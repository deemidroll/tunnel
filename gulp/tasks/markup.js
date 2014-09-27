var gulp = require('gulp'),
    config = require('../config').markup;

gulp.task('markup', function() {
    return gulp.src(config.src)
        .pipe(gulp.dest(config.dest));
});