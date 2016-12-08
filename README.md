# Gulp Snazzy Twig

JavaScript implantation of Skosh's Twig templating system for use with Gulp.

### Install

```sh
$ npm install gulp-snazzy-twig --save
```

### Example

```javascript
var gulp = require('gulp'),
    twig = require('gulp-snazzy-twig');

gulp.task('compile', function () {
    return gulp.src('src/html/**/*.twig')
        .pipe(twig({
            data: {
                title: 'Gulp and Twig',
                benefits: [
                    'Fast',
                    'Flexible',
                    'Secure'
                ]
            }
        }))
        .pipe(gulp.dest('./'));
});
```