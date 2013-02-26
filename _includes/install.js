(function (doc) {
    var link,
        install = doc.getElementById('install'),
        ua = navigator.userAgent,
        test = function (str) {
            return ua.indexOf(str) > -1;
        },
        set = function (title, href, same) {
            doc.getElementById('browser').innerHTML = 'for ' + title;
            install.href = href;
            install.target = same ? '_self' : '_blank';
        };

    function inlineInstall(e) {
      e.preventDefault();
      chrome.webstore.install();
    }

    if (test(' Firefox/') && !(' Fennec/')) {
        set('Firefox', 'https://addons.mozilla.org/en-US/firefox/addon/5369');
    } else if (test(' Chrome/')) {
        set('Chrome', 'https://chrome.google.com/webstore/detail/ninejjcohidippngpapiilnmkgllmakh');
        if (typeof chrome !== 'undefined' && chrome.webstore &&
            chrome.webstore.install && chrome.app && !chrome.app.isInstalled) {
          install.addEventListener('click', inlineInstall, false);
          link = doc.querySelector('.avail .chrome');
          if (link) {
            link.addEventListener('click', inlineInstall, false);
          }
        }
    } else if (test('Opera/') && !test(' Mini/')) {
        set('Opera', 'https://addons.opera.com/addons/extensions/details/yslow/');
    } else if (test(' Safari/') && !test(' Mobile') && !test(' CrMo/') && !test(' Silk/') && !test(' Kindle')) {
        set('Safari', '/safari/', 1);
    } else {
        set('Mobile/Bookmarklet', '/mobile/', 1);
    }
}(document));
