var browserSync = require('browser-sync'),
    gulp = require('gulp'),
    config = require('../config');

gulp.task('browserSync', ['build'], function() {
    browserSync(config.browserSync);
});