var gulp = require('gulp'),
    concat = require('gulp-concat'),
    handleErrors = require('../util/handleErrors');

gulp.task('collectDependencies', function() {
    gulp.src([
        './src/js/globalVendorDependencies/*.js',
        './src/js/modifiersForVendorDependencies/*.js',
        './src/js/myDependencies/*.js',
        ])
        .on('error', handleErrors)
        .pipe(concat('dependencies.js'))
        .pipe(gulp.dest('build/js'));
});
