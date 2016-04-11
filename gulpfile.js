var path = require('path');

var del = require('del');

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var util = require('gulp-util');
var flatten = require('gulp-flatten');
var gulpif = require('gulp-if');
var zip = require('gulp-zip');
var less = require('gulp-less');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');
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
var TEMP_DIR = path.join(__dirname, 'temp');

gulp.task('default', ['d']);

//开发
gulp.task('d', ['cleanBuild'], function () {
    global.isPublish = false;
    runSequence('build','webserver','watch');
});

//生产
gulp.task('p',['cleanBuild'], function () {
    global.isPublish = true;
    runSequence('build');
});

//发布到chrome的包
gulp.task('c', function () {
    global.isPublish = true;
    runSequence('p','zip');
});

gulp.task('build', function (callback) {
    sequence('less', 'concat','uglify', 'images', ['copy_html', 'copy_fonts','copy_other'],'cleanTemp')(callback)
});

gulp.task('cleanBuild', function () {
    return del(DIST_DIR);
});
gulp.task('cleanTemp', function () {
    return del(TEMP_DIR);
});

gulp.task('concat', function () {
    return gulp.src([
        './src/utils/querySelect.js',
        './src/utils/events.js',
        './src/utils/util.js',
        './src/utils/config.js',
        './src/utils/base.js'
    ]).pipe(concat('util.js'))
        .pipe(flatten())
        .pipe(gulp.dest(TEMP_DIR))
});

gulp.task('uglify', function () {
   return gulp.src([path.join(SRC_DIR, '**', '*.js'),'!'+ path.join(SRC_DIR, 'utils','*.js'),path.join(TEMP_DIR, '**', '*.js')])
       .pipe(gulpif(!isPublish,sourcemaps.init({loadMaps: true})))
       .pipe(uglify({
           compress:{
               drop_debugger: isPublish
           }
       }))
       .pipe(gulpif(!isPublish,sourcemaps.write('./')))
       .pipe(flatten())
       .pipe(gulp.dest(DIST_DIR + '/js'));
});

gulp.task('less', function () {
    return gulp.src(path.join(SRC_DIR, '**', '*.less'))
        .pipe(gulpif(!isPublish,sourcemaps.init({loadMaps: true})))
        .pipe(less({
            plugins: [autoprefix, cleancss]
        }))
        .pipe(gulpif(!isPublish,sourcemaps.write('./')))
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
        .pipe(replace(/(<script.*src=").*(\/\w+\.js")/gi, function (origin,$1,$2) {
            return $1+'./js'+$2;
        }))
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR))
});

gulp.task('copy_fonts', function () {
    return gulp.src(path.join(SRC_DIR,'fonts/**'))
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR + '/fonts'));
});

gulp.task('copy_other', function () {
    return gulp.src([path.join(__dirname, 'manifest.json'), path.join(__dirname, '*.png')])
        .pipe(flatten())
        .pipe(gulp.dest(DIST_DIR));
});

gulp.task('zip', function () {
    return gulp.src(path.join(DIST_DIR,'**/**.*'))
        .pipe(zip('1Player.zip'))
        .pipe(gulp.dest(__dirname));
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

gulp.task('watch', function () {
    gulp.watch(path.join(SRC_DIR, '**', '*.less'), ['less']);
    gulp.watch(path.join(SRC_DIR, '**', '*.js'), ['concat','uglify']);
    gulp.watch(path.join(SRC_DIR, '**', '*.html'), ['copy_html']);
});