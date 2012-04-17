---
layout: default
title: YSlow
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites}
- {name: author, content: Marcel Duran}
---
## Feature highlights

* Grades web page based on one of three predefined ruleset or a user-defined ruleset;
* It offers suggestions for improving the page's performance;
* Summarizes the page's components;
* Displays statistics about the page;
* Provides tools for performance analysis, including [Smush.it™](http://developer.yahoo.com/yslow/smushit/) and [JSLint](http://jslint.com/).

## Availability

* [Firefox](https://addons.mozilla.org/en-US/firefox/addon/5369){: .firefox}
* [Chrome](https://chrome.google.com/webstore/detail/ninejjcohidippngpapiilnmkgllmakh){: .chrome}
* [Mobile/Bookmarklet](mobile){: .mobile}
* [Opera](https://addons.opera.com/addons/extensions/details/yslow/){: .opera}
* [Safari](http://d.yimg.com/jc/safari/yslow.safariextz){: .safari}
* [Command Line (HAR)](https://github.com/marcelduran/yslow/wiki/Command-Line-%28HAR%29){: .command}
* [PhantomJS](https://github.com/marcelduran/yslow/wiki/PhantomJS){: .phantomjs}
* [Source Code](https://github.com/marcelduran/yslow){: .source}
{: .avail}

[» View YSlow Ruleset Limitations](https://github.com/marcelduran/yslow/wiki/Ruleset-Limitations) across several browsers/platforms.

## Web Performance Best Practices and Rules

Yahoo!'s Exceptional Performance team has identified 34 rules that affect web page performance. YSlow's web page analysis is based on the 23 of these 34 rules that are testable. Click each performance rule below to see the details.

1. [Minimize HTTP Requests](http://developer.yahoo.com/performance/rules.html#num_http)
1. [Use a Content Delivery Network](http://developer.yahoo.com/performance/rules.html#cdn)
1. [Avoid empty src or href](http://developer.yahoo.com/performance/rules.html#emptysrc)
1. [Add an Expires or a Cache-Control Header](http://developer.yahoo.com/performance/rules.html#expires)
1. [Gzip Components](http://developer.yahoo.com/performance/rules.html#gzip)
1. [Put StyleSheets at the Top](http://developer.yahoo.com/performance/rules.html#css_top)
1. [Put Scripts at the Bottom](http://developer.yahoo.com/performance/rules.html#js_bottom)
1. [Avoid CSS Expressions](http://developer.yahoo.com/performance/rules.html#css_expressions)
1. [Make JavaScript and CSS External](http://developer.yahoo.com/performance/rules.html#external)
1. [Reduce DNS Lookups](http://developer.yahoo.com/performance/rules.html#dns_lookups)
1. [Minify JavaScript and CSS](http://developer.yahoo.com/performance/rules.html#minify)
1. [Avoid Redirects](http://developer.yahoo.com/performance/rules.html#redirects)
1. [Remove Duplicate Scripts](http://developer.yahoo.com/performance/rules.html#js_dupes)
1. [Configure ETags](http://developer.yahoo.com/performance/rules.html#etags)
1. [Make AJAX Cacheable](http://developer.yahoo.com/performance/rules.html#cacheajax)
1. [Use GET for AJAX Requests](http://developer.yahoo.com/performance/rules.html#ajax_get)
1. [Reduce the Number of DOM Elements](http://developer.yahoo.com/performance/rules.html#min_dom)
1. [No 404s](http://developer.yahoo.com/performance/rules.html#no404)
1. [Reduce Cookie Size](http://developer.yahoo.com/performance/rules.html#cookie_size)
1. [Use Cookie-Free Domains for Components](http://developer.yahoo.com/performance/rules.html#cookie_free)
1. [Avoid Filters](http://developer.yahoo.com/performance/rules.html#no_filters)
1. [Do Not Scale Images in HTML](http://developer.yahoo.com/performance/rules.html#no_scale)
1. [Make favicon.ico Small and Cacheable](http://developer.yahoo.com/performance/rules.html#favicon)

[» Check out the YSlow Ruleset Matrix](https://github.com/marcelduran/yslow/wiki/Ruleset-Matrix) to see how the grade is computed.

## Sample Screenshot
![YSlow Grade details screenshot](http://d.yimg.com/jc/ydn/yslow-ss.png)

## Frequently Asked Questions
1. [What platforms does YSlow run on?](https://github.com/marcelduran/yslow/wiki/FAQ#wiki-faq_platforms)
1. [How does YSlow work?](https://github.com/marcelduran/yslow/wiki/FAQ#wiki-faq_work)
1. [How are the grades computed?](https://github.com/marcelduran/yslow/wiki/FAQ#wiki-faq_grading)
1. [How do I add my CDN hostname to YSlow for Rule 2?](https://github.com/marcelduran/yslow/wiki/FAQ#wiki-faq_cdn)
1. [What YSlow results are included in the YSlow beacon?](https://github.com/marcelduran/yslow/wiki/FAQ#wiki-faq_beaconformat)

[See more...](https://github.com/marcelduran/yslow/wiki/FAQ)

## Contact Us
YSlow development is discussed in the [GitHub Issue Tracker](../issues).  
General performance questions are discussed in the [Exceptional Performance group](http://tech.groups.yahoo.com/group/exceptional-performance/).
