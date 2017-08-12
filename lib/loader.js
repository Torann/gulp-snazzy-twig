module.exports = function (Twig, default_layout) {
    'use strict';

    var fs = require('fs'),
        S = require('string'),
        yaml = require('js-yaml'),
        path = require('path');

    var getSource = function (data) {
        data = parseContent(data);

        // All pages extend the primary layout
        var source = '{% extends "' + data.options.template + '.twig" %}';

        var template = 'layout';

        // Special features for layout extending
        if (template !== 'layout') {
            source += '{% block content %}';
            source += data.body;
            source += '{% endblock %}';
        }
        else {
            source += '{% block layout %}';
            source += data.body;
            source += '{% endblock %}';
        }

        return source;
    };

    var parseContent = function (content) {
        var body = '',
            options = {
                template: default_layout,
                content: 'layout'
            };

        // Remove Byte Order Mark (BOM)
        content = S(content.replace(/\uFEFF/g, '')).trim().s;

        // Detecting metadata by separators (---)
        var results = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/.exec(content);

        // Separate the meta-data from the content
        if (typeof(results[2]) !== 'undefined') {
            options = yaml.safeLoad(results[2]);
            body = results[3];
        }
        else {
            body = content;
        }

        return {
            body: body,
            options: options
        };
    };

    Twig.Templates.registerLoader('fs', function (location, params, callback, error_callback) {
        var template,
            precompiled = params.precompiled,
            parser = this.parsers[params.parser] || this.parser.twig;

        if (!fs || !path) {
            throw new Twig.Error('Unsupported platform: Unable to load from file ' +
                'because there is no "fs" or "path" implementation');
        }

        var loadTemplateFn = function (err, data) {
            if (err) {
                if (typeof error_callback === 'function') {
                    error_callback(err);
                }
                return;
            }

            if (precompiled === true) {
                data = JSON.parse(data);
            }

            params.data = S(params['path']).startsWith(params['base']) ? data : getSource(data);
            params.path = params.path || location;

            // template is in data
            template = parser.call(this, params);

            template.context = {
                apple: 'mooooo'
            };

            if (typeof callback === 'function') {
                callback(template);
            }
        };

        params.path = params.path || location;

        try {
            if (!fs.statSync(params.path).isFile()) {
                throw new Twig.Error('Unable to find template file ' + params.path);
            }
        } catch (err) {
            throw new Twig.Error('Unable to find template file ' + params.path);
        }

        loadTemplateFn(undefined, fs.readFileSync(params.path, 'utf8'));

        return template;
    });

};