(function () {
    'use strict';

    if (window.plugin_tmdb_adult_ready) return;
    window.plugin_tmdb_adult_ready = true;

    function init() {
        if (!window.Lampa || !Lampa.TMDB || !Lampa.TMDB.api) return;

        if (Lampa.TMDB.__adult_patched) return;
        Lampa.TMDB.__adult_patched = true;

        var originalApi = Lampa.TMDB.api;

        function addAdultParam(url) {
            if (typeof url !== 'string') return url;
            if (!/^search\/|^discover\//.test(url)) return url;
            if (/[?&]include_adult=/.test(url)) return url;
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'include_adult=true';
        }

        Lampa.TMDB.api = function (url) {
            return originalApi.call(Lampa.TMDB, addAdultParam(url));
        };

        console.log('tmdb_adult: loaded');
    }

    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
