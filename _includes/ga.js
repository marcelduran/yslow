(function (doc, tag, place, script) {
    place = doc.getElementsByTagName(tag)[0];
    script = doc.createElement(tag);
    _gaq = [['_setAccount', 'UA-30790475-1'],
        ['_trackPageview'], ['_trackPageLoadTime']];
    script.src = '//www.google-analytics.com/ga.js';
    setTimeout(function () {
        place.parentNode.insertBefore(script, place);
    }, 0);
}(document, 'script'));
