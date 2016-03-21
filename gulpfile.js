var path = require('path');

var del = require('del');

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var flatten = require('gulp-flatten');
var less = require('gulp-less');
var sequence = require('gulp-sequence').use(gulp);
var sourcemaps = require('gulp-sourcemaps');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var LessPluginAutoPrefix = require('less-plugin-autoprefix');


var cleancss = new LessPluginCleanCSS({ advanced: true });
var autoprefix= new LessPluginAutoPrefix({ browsers: ["last 2 versions"] });


var SRC_DIR = path.join(__dirname, 'src');
var DIST_DIR = path.join(__dirname, 'dist');

gulp.task('default', ['d']);

gulp.task('d', sequence('clean', 'less', 'script', ['copy_html', 'copy_other']));

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

gulp.task('copy_html', function () {
    return gulp.src(path.join(SRC_DIR, '**', '*.html'))
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR))
});

gulp.task('copy_other', function () {
    return gulp.src([path.join(__dirname, 'manifest.json'), path.join(__dirname, 'icon.png')])
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR));
});