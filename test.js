(function () {
    'use strict';

    if (window.plugin_tmdb_adult_bundle_ready) return;
    window.plugin_tmdb_adult_bundle_ready = true;

    function patchTMDBAdult() {
        if (!window.Lampa || !Lampa.TMDB || !Lampa.TMDB.api) return;
        if (Lampa.TMDB.__adultPatched) return;

        Lampa.TMDB.__adultPatched = true;

        var originalApi = Lampa.TMDB.api.bind(Lampa.TMDB);

        function addAdultParam(url) {
            if (typeof url !== 'string') return url;
            if (!/^search\/|^discover\//.test(url)) return url;
            if (/[?&]include_adult=/.test(url)) return url;
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'include_adult=true';
        }

        Lampa.TMDB.api = function (url) {
            return originalApi(addAdultParam(url));
        };

        console.log('tmdb_adult_bundle: TMDB patch enabled');
    }

    function patchParserAdultFallback() {
        if (!window.Lampa || !Lampa.Parser || !Lampa.Parser.get) return;
        if (Lampa.Parser.__adultFallbackPatched) return;

        Lampa.Parser.__adultFallbackPatched = true;

        var originalGet = Lampa.Parser.get.bind(Lampa.Parser);

        function clone(obj) {
            var out = {};
            for (var k in obj) out[k] = obj[k];
            return out;
        }

        Lampa.Parser.get = function (params, oncomplite, onerror) {
            var isAdultCard = !!(params && params.movie && params.movie.adult);

            if (!isAdultCard) {
                return originalGet(params, oncomplite, onerror);
            }

            var finished = false;

            function doneSuccess(data) {
                if (finished) return;
                finished = true;
                if (oncomplite) oncomplite(data);
            }

            function doneError(err) {
                if (finished) return;
                finished = true;
                if (onerror) onerror(err);
            }

            function runFallback() {
                var p = clone(params || {});
                p.from_search = true;
                p.other = true;

                if (!p.search && p.movie) {
                    p.search = p.movie.original_title || p.movie.title || '';
                }

                originalGet(p, doneSuccess, doneError);
            }

            originalGet(params, function (data) {
                if (data && data.Results && data.Results.length) doneSuccess(data);
                else runFallback();
            }, function () {
                runFallback();
            });
        };

        console.log('tmdb_adult_bundle: Parser patch enabled');
    }

    function init() {
        patchTMDBAdult();
        patchParserAdultFallback();
    }

    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
