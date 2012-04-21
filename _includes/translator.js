(function (doc, tag) {
    var script = doc.createElement(tag),
        place = doc.getElementsByTagName(tag)[0];

    // callback
    window.translate = function () {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            gaTrack: true,
            gaId: 'UA-30790475-1',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'translator');
    };

    // dynamically inject js
    script.src = '//translate.google.com/translate_a/element.js?cb=translate';
    script.async = 1;
    setTimeout(function () {
        place.parentNode.insertBefore(script, place);
    }, 0);
}(document, 'script'));

