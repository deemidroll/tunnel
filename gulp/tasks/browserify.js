/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   If the watch task is running, this uses watchify instead
   of browserify for faster bundling using caching.
*/
var gulp = require('gulp'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    uglify = require('gulp-uglify'),
    streamify = require('gulp-streamify'),
    bundleLogger = require('../util/bundleLogger'),
    handleErrors = require('../util/handleErrors'),
    source = require('vinyl-source-stream'),
    config = require('../config'),
    header = require('gulp-header'),
    banner = '/* ' + config.banner + ' */\n',
    gulpif = require('gulp-if'),
    minimist = require('minimist');

var knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'dev' }
};
var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('browserify', function() {
    var bundleMethod = global.isWatching ? watchify : browserify;

    var bundler = bundleMethod({
        // Specify the entry point of your app
        entries: ['./src/js/main.js']
    });

    var bundle = function() {
        // Log when bundling starts
        bundleLogger.start('app.js');

        return bundler
            // Enable source maps!
            .bundle({debug: true})
            // Report compile errors
            .on('error', handleErrors)
            // Use vinyl-source-stream to make the
            // stream gulp compatible. Specifiy the
            // desired output filename here.
            .pipe(source('app.js'))
            // only minify in production
            .pipe(gulpif(options.env === 'prod', streamify(uglify())))
            // Specify the output destination
            .pipe(header(banner))
            .pipe(gulp.dest('./build/js/'))
            // Log when bundling completes!
            .on('end', function () {
                bundleLogger.end('app.js');
            });
    };

    if(global.isWatching) {
        // Rebundle with watchify on changes.
        bundler.on('update', bundle);
    }

    return bundle();
});
