var path = require('path');

var del = require('del');

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var flatten = require('gulp-flatten');
var less = require('gulp-less');
var sequence = require('gulp-sequence').use(gulp);
var sourcemaps = require('gulp-sourcemaps');
var webserver = require('gulp-webserver');
var imageop = require('gulp-image-optimization');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var LessPluginAutoPrefix = require('less-plugin-autoprefix');


var cleancss = new LessPluginCleanCSS({ advanced: true });
var autoprefix= new LessPluginAutoPrefix({ browsers: ["last 2 versions"] });


var SRC_DIR = path.join(__dirname, 'src');
var DIST_DIR = path.join(__dirname, 'dist');

gulp.task('default', ['d']);

gulp.task('d', ['clean'], sequence('build','webserver','watch'));

gulp.task('build', function (callback) {
    sequence('less', 'script', 'images', ['copy_html', 'copy_fonts','copy_other'])(callback)
});

gulp.task('clean', function () {
    return del(DIST_DIR);
});

gulp.task('script', function () {
   return gulp.src(path.join(SRC_DIR, '**', '*.js'))
       .pipe(uglify())
       .pipe(flatten())
       .pipe(gulp.dest(DIST_DIR + '/js'));
});

gulp.task('less', function () {
    return gulp.src(path.join(SRC_DIR, '**', '*.less'))
        .pipe(sourcemaps.init())
        .pipe(less({
            plugins: [autoprefix, cleancss]
        }))
        .pipe(sourcemaps.write())
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR + '/css'));
});

gulp.task('images', function(cb) {
    return gulp.src([SRC_DIR + '/**/*.png',SRC_DIR  + '/**/*.jpg',SRC_DIR  + 'src/**/*.gif',SRC_DIR  + '/**/*.jpeg'])
        .pipe(imageop({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        }))
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR + '/imgs'));
});

gulp.task('copy_html', function () {
    return gulp.src(path.join(SRC_DIR, '**', '*.html'))
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR))
});

gulp.task('copy_fonts', function () {
    return gulp.src(path.join(SRC_DIR,'fonts/**'))
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR + '/fonts'));
});

gulp.task('copy_other', function () {
    return gulp.src([path.join(__dirname, 'manifest.json'), path.join(__dirname, 'icon.png')])
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR));
});

gulp.task('webserver', function () {
   return gulp.src('./dist')
           .pipe(webserver({
                livereload: true,
                directoryListing: {
                    enable: true,
                    path: './dist'
                },
                open: true
           }));
});

gulp.task('reload', sequence('script', 'less', 'images', ['copy_html', 'copy_other']));

gulp.task('watch', function () {
    gulp.watch(path.join(SRC_DIR, '**', '*.less'), ['less']);
    gulp.watch(path.join(SRC_DIR, '**', '*.js'), ['script']);
    gulp.watch(path.join(SRC_DIR, '**', '*.html'), ['copy_html']);
});