var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync').create();
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var rimraf = require('rimraf');
var runSequence = require('run-sequence'); // エラーでも止めない

gulp.task('browser-sync', function() {
  browserSync.init({
    files: ['app/public/**/*.*', 'app/views/**/*.*'], // BrowserSyncにまかせるファイル群
    proxy: 'http://localhost:3000',  // express の動作するポートにプロキシ
    port: 4000,  // BrowserSync は 4000 番ポートで起動
    open: true  // ブラウザ open しない
  });
});

gulp.task('serve', ['browser-sync'], function () {
  nodemon({
    script: './dist/bin/www',
    ext: 'js html css',
    ignore: [  // nodemon で監視しないディレクトリ
      'gulpfile.js',
      'node_modules',
      'bin',
      'test'
    ],
    env: {
      'NODE_ENV': 'development'
    },
    stdout: false  // Express の再起動時のログを監視するため
  }).on('readable', function() {
  this.stdout.on('data', function(chunk) {
  if (/^Express\ server\ listening/.test(chunk)) {
        // Express の再起動が完了したら、reload() でBrowserSync に通知。
        // ※Express で出力する起動時のメッセージに合わせて比較文字列は修正
        reload();
      }
      process.stdout.write(chunk);
    });
    this.stderr.on('data', function(chunk) {
      process.stderr.write(chunk);
    });
  });
});

gulp.task('jade', function() {
  return gulp.src('./app/views/*.jade')
    .pipe($.plumber())
    .pipe(gulp.dest('./dist/views/'));
});

gulp.task('stylus', function() {
  return gulp.src('./app/public/**/*.styl')
    .pipe($.plumber())
    .pipe($.stylus())
    .pipe(gulp.dest('./dist/public/'));
});

gulp.task('copy', function () {
  gulp.src('./app/bin/**')
    .pipe($.plumber())
    .pipe(gulp.dest('./dist/bin'));
});

gulp.task('ts', function () {
    return browserify({
        entries: './app/public/javascripts/main.ts'
    }).plugin('tsify')
        .plugin('licensify')
        .bundle()
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(babel())
        .pipe(uglify({
            preserveComments: 'license'
        }))
        .pipe(gulp.dest('./dist/public/javascripts'))
        .pipe(browserSync.reload({stream: true}));
});


gulp.task('server', function () {
  return gulp.src([
    './app/**/*.ts',
    '!./app/public/**/*.ts'
  ])
    .pipe($.plumber())
    .pipe($.typescript(
      { target: 'ES6', module: 'commonjs' }
    ))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('default', function(cb) {
  return runSequence(
    ['jade', 'stylus', 'ts', 'server'], 'serve', cb
  );
});


gulp.task('watch', function () {
    gulp.watch('app/ts/**/*.ts', ['build-ts']);
});
