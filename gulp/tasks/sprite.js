var gulp = require('gulp'),
    spritesmith = require('gulp.spritesmith'),
    config = require('../config');

gulp.task('sprite', function () {
    var spriteData = gulp.src(config.sprite.src).pipe(spritesmith({
        imgName: config.sprite.imgName,
        cssName: config.sprite.cssName,
        imgPath: config.sprite.imgPath,
        cssFormat: config.sprite.cssFormat
    }));
    spriteData.img.pipe(gulp.dest(config.sprite.destImg));
    spriteData.css.pipe(gulp.dest(config.sprite.destCss));
});