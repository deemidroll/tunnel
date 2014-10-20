var gulp = require('gulp'),
    minifyHTML = require('gulp-minify-html'),
    header = require('gulp-header'),
    gulpif = require('gulp-if'),
    minimist = require('minimist'),
    config = require('../config'),
    banner = '<!-- ' + config.banner + ' -->\n';
    
var knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'dev' }
};
var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('markup', function() {
    var opts = {
        comments: true,
        spare: true,
        conditionals: true
    };
    return gulp.src(config.markup.src)
        // only minify in production
        .pipe(gulpif(options.env === 'prod', minifyHTML(opts)))
        .pipe(header(banner))
        .pipe(gulp.dest(config.markup.dest));
});