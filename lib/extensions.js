var S = require('string');

module.exports = function() {

    var assets_path = '/assets/',
        base_url = '';

    var getAsset = function (path) {
        if (path[0] === '/') return getUrl(path);

        return getUrl(assets_path + path.replace(/^\/|\/$/g, ''));
    },

    string_match = function(patterns, value) {
        if (patterns == value) return true;

        patterns = patterns.split('|');

        for (var i = 0; i < patterns.length; i++) {

            // Escape the pattern elements
            var pattern = patterns[i].replace(new RegExp('[.\\+*?\[\^\]$(){}=!<>|:\-]', 'g'), '\$&');

            // Asterisks are translated into zero-or-more regular expression wildcards
            // to make it convenient to check if the strings starts with the given
            // pattern such as "library/*", making any string check convenient.
            pattern = pattern.replace('\*', '.*');

            if (value.match(pattern)) {
                return true;
            }
        }

        return false;
    },

    strpos = function (haystack, needle, offset) {
        var i = (haystack + '')
            .indexOf(needle, (offset || 0));

        return i === -1 ? false : i;
    },

    getUrl = function (url) {
        var needles = ['#', '//', 'mailto:', 'tel:', 'http'];

        for (var i = 0; i < needles.length; i++) {
            if (S(url).startsWith(needles[i])) {
                return url;
            }
        }

        // Prefix URL with base URL
        return base_url.replace(/^\/|\/$/g, '') + '/' + url.replace(/^\/|\/$/g, '');
    };

    return {
        setOptions: function(options) {

            options = options || {};

            // Set base URL
            base_url = options.base_url || '';

            // Get assets paths
            assets_path = ('/' + options.assets_path + '/').replace(/\/{2,}/g, '/');
        },

        url: getUrl,

        asset: getAsset,

        functions: [
            {
                name: 'is_active',
                func: function (arg, active_class, inactive_class) {
                    return string_match(arg, '/' + this.context._target.relative.replace('index.html', ''))
                        ? (active_class === undefined ? 'active' : active_class)
                        : (inactive_class === undefined ? '' : inactive_class);
                }
            },
            {
                name: 'asset',
                func: function (arg) {
                    return getAsset(arg);
                }
            },
            {
                name: 'url',
                func: function (arg) {
                    return getUrl(arg);
                }
            },
            {
                name: 'powered_by',
                func: function () {
                    return 'Powered by magic';
                }
            },
            {
                name: 'csrf_token',
                func: function () {
                    return '<input type="hidden" name="_token" value="{{csrf_token}}">';
                }
            }
        ],

        filters: [
            {
                name: 'truncate',
                func: function (str, limit, pad) {
                    var breakpoint;

                    // Return with no change if string is shorter than $limit
                    if (str.length <= limit) return str;

                    // is break present between limit and the end of the string?
                    if (false !== (breakpoint = strpos(str, ' ', limit))) {
                        if (breakpoint < str.length - 1) {
                            str = str.substr(0, breakpoint) + (pad || '&hellip;');
                        }
                    }

                    return str;
                }
            },
            {
                name: 'paragraph',
                func: function (str) {
                    return str.replace(/(<p[^>]+?>|<p>|<\/p>)/img, '');
                }
            }
        ]
    }
}();