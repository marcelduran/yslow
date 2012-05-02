(function (doc) {
    var install = doc.getElementById('install'),
        ua = navigator.userAgent,
        test = function (str) {
            return ua.indexOf(str) > -1;
        },
        set = function (title, href, same) {
            doc.getElementById('browser').innerHTML = 'for ' + title;
            install.href = href;
            install.target = same ? '_self' : '_blank';
        };

    if (test(' Firefox/') && !(' Fennec/')) {
        set('Firefox', 'https://addons.mozilla.org/en-US/firefox/addon/5369');
    } else if (test(' Chrome/')) {
        set('Chrome', 'https://chrome.google.com/webstore/detail/ninejjcohidippngpapiilnmkgllmakh');
    } else if (test('Opera/') && !test(' Mini/')) {
        set('Opera', 'https://addons.opera.com/addons/extensions/details/yslow/');
    } else if (test(' Safari/') && !test(' Mobile') && !test(' CrMo/') && !test(' Silk/') && !test(' Kindle')) {
        set('Safari', 'http://d.yimg.com/jc/safari/yslow.safariextz', 1);
    } else {
        set('Mobile/Bookmarklet', '/mobile', 1);
    }
}(document));
