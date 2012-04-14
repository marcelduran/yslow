(function (doc) {
    var js = 'javascript:(function(y,p,o){p=y.body.appendChild(y.createElement(\'iframe\'));p.id=\'YSLOW-bookmarklet\';p.style.cssText=\'display:none\';o=p.contentWindow.document;o.open().write(\'&lt;head&gt;&lt;body onload="YUI_config={win:window.parent,doc:window.parent.document};var d=document;d.getElementsByTagName(\\\'head\\\')[0].appendChild(d.createElement(\\\'script\\\')).src=\\\'http://d.yimg.com/jc/yslow-bookmarklet.js\\\'"&gt;\');o.close()}(document))',
        input = doc.createElement('input'),
        txt = doc.getElementById('txt'),
        bm = doc.getElementById('bookmarklet'),
        charCode = String.fromCharCode;

    input.id = 'txt';
    location.hash = input.value = bm.href = js.replace(/&lt;/g, charCode(60)).replace(/&gt;/g, charCode(62));
    txt.parentNode.insertBefore(input, txt);
    txt.parentNode.removeChild(txt);
}(document));
