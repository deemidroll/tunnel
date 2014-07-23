var gulp = require('gulp');

gulp.task('build', ['browserify', 'scss', 'img', 'copyhtml', 'collectDependencies']);
