var gulp = require('gulp');

gulp.task('copyhtml', function() {
    return gulp.src('src/html/**')
        .pipe(gulp.dest('build'));
});
