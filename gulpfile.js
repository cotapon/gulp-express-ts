var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var changed = require('gulp-changed');
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
var runSequence = require('run-sequence');

gulp.task('browser-sync', function() {
  browserSync.init({
    files: ['app/public/**/*.*', 'app/views/**/*.*'],
    proxy: 'http://localhost:3000',
    port: 8000,
    open: true
  });
});

gulp.task('serve', ['browser-sync'], function () {
  nodemon({
    script: './dist/bin/www',
    ext: 'js css',
    ignore: [
      'gulpfile.js',
      'node_modules',
      'bin'
    ],
    env: {
      'NODE_ENV': 'development'
    },
    stdout: false
  }).on('readable', function() {
  this.stdout.on('data', function(chunk) {
  if (/^Express\ server\ listening/.test(chunk)) {
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
    .pipe(changed('./dist'))
    .pipe($.plumber())
    .pipe(gulp.dest('./dist/views/'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('stylus', function() {
  return gulp.src('./app/public/**/*.styl')
    .pipe(changed('./dist'))
    .pipe($.plumber())
    .pipe($.stylus())
    .pipe(gulp.dest('./dist/public/'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('copy', function () {
  return gulp.src('./app/bin/**')
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

gulp.task('karma', function () {
  return gulp.src([
    'app/public/javascripts/test/**/*.ts'
  ])
    .pipe($.karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});

gulp.task('express-ts', function () {
  return gulp.src([
    './app/**/*.ts',
    '!./app/public/**/*.ts'
  ])
    .pipe($.plumber())
    .pipe($.typescript(
      { target: 'ES6', module: 'commonjs' }
    ))
    .pipe(gulp.dest('./dist/'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', function () {
  gulp.watch('./app/views/**/*.jade', ['jade']);
  gulp.watch('./app/public/**/*.ts', ['ts']);
  gulp.watch('./app/public/**/*.stly', ['stylus']);
  gulp.watch(['./app/**/*.ts', '!./app/public/**/*.ts'], ['express-ts']);
});

gulp.task('default', function(cb) {
  return runSequence(['jade', 'stylus', 'ts', 'express-ts'], 'watch', 'serve', 'karma', cb);
});
