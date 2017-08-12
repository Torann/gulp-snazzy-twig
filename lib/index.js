var map         = require('map-stream'),
    extensions  = require('./extensions'),
    rext        = require('replace-ext'),
    merge       = require('merge'),
    util        = require('gulp-util');

const PLUGIN_NAME = 'gulp-snazzy-twig';
    
module.exports = function (options) {
    'use strict';

    options = merge({
        template_layouts: 'src/layouts',
        default_layout: 'base',
        assets_path: '/assets/',
        template_css: extensions.asset('css/style.css'),
        rename_callback: function(file, rext) {
            var filename = rext(file.relative, '');

            return {
                filename: filename,
                path: filename === 'index' ? rext(file.path, '.html') : rext(file.path, '/index.html'),
                relative: filename === 'index' ? rext(file.relative, '.html') : rext(file.relative, '/index.html')
            }
        }
    }, options || {});

    // Set extensions options
    extensions.setOptions(options);

    function modifyContents(file, cb) {
        if (file.isNull()) {
            return cb(null, file);
        }

        if (file.isStream()) {
            return cb(new util.PluginError(PLUGIN_NAME, 'Streaming not supported!'));
        }

        // Get file name without an extension
        var target = options.rename_callback(file, rext);

        // Merge base and user defined template data
        var data = merge({
            cdn_base_url: extensions.url('/'),
            template_css: extensions.asset('css/style.css'),
            filename: target.filename
        }, file.data || options.data || {});

        data._file = file;

        // Create target paths
        data._target = {
            path: target.path,
            relative: target.relative
        };

        var Twig = require('twig'),
            twig = Twig.twig,
            twigOpts = {
                path: file.path,
                base: options.template_layouts,
                async: false
            };

        // No caching
        Twig.cache(false);

        // Add custom functions
        extensions.functions.forEach(function (func) {
            Twig.extendFunction(func.name, func.func);
        });

        // Add custom filters
        extensions.filters.forEach(function (filter) {
            Twig.extendFilter(filter.name, filter.func);
        });

        // Extend Twig with custom components
        Twig.extend(function (Twig) {
            require('./loader.js')(Twig, options.default_layout);
            require('./token_parsers/widget.js')(Twig, options.widgets || {});
        });

        // Get template
        var template = twig(twigOpts);

        try {
            file.contents = new Buffer(template.render(data));
        }
        catch (e) {
            if (options.errorLogToConsole) {
                util.log(PLUGIN_NAME + ' ' + e);
                return cb();
            }

            if (typeof options.onError === 'function') {
                options.onError(e);
                return cb();
            }
            return cb(new util.PluginError(PLUGIN_NAME, e));
        }

        file.path = data._target.path;
        cb(null, file);
    }

    return map(modifyContents);
};
