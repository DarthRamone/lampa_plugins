(function () {
    'use strict';

    if (window.plugin_tmdb_adult_parser_ready) return;
    window.plugin_tmdb_adult_parser_ready = true;

    function init() {
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
            if (!isAdultCard) return originalGet(params, oncomplite, onerror);

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

            function fallback() {
                var p = clone(params || {});
                p.from_search = true; // отключает title/year/category фильтрацию в parser.js
                p.other = true;
                if (!p.search && p.movie) p.search = p.movie.original_title || p.movie.title || '';
                originalGet(p, doneSuccess, doneError);
            }

            originalGet(params, function (data) {
                if (data && data.Results && data.Results.length) doneSuccess(data);
                else fallback();
            }, function () {
                fallback();
            });
        };

        console.log('tmdb_adult_parser: loaded');
    }

    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
