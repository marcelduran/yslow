---
layout: default
title: YSlow - Official Open Source Project Website
heading: YSlow Ruleset Limitations
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: Official YSlow Open Source Project Website. YSlow analyzes web pages and suggests ways to improve their performance based on a set of rules for high performance web pages.}
- {name: author, content: Marcel Duran}
---
YSlow generates the page performance summaries by accessing the page components. As of today, browsers allow different levels of access to page components, which limits YSlow’s supported ruleset in each implementation.

The table below lists the supported rules by browser/platform.

<table>
<tr><th>YSlow Rule</th><th>Firefox</th><th>Chrome</th><th>Mobile/Bookmarklet, Opera and Safari</th><th>Command Line (HAR)</th></tr>
<tr><td>Make fewer HTTP requests</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Use a CDN</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Avoid empty src or href</td><td></td><td></td><td></td><td>[4]</td></tr>
<tr><td>Add Expires headers</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Compress components with GZip</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Put CSS at top</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Put JavaScript at bottom</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Avoid CSS expressions</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Make JavaScript and CSS external</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Reduce DNS lookups</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Minify JavaScript and CSS</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Avoid URL redirects</td><td></td><td>[1]</td><td></td><td></td></tr>
<tr><td>Remove duplicate JavaScript and CSS</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Configure ETags</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Make AJAX cacheable</td><td></td><td>[2]</td><td>[2]</td><td></td></tr>
<tr><td>Use GET for AJAX requests</td><td></td><td>[2]</td><td>[2]</td><td></td></tr>
<tr><td>Reduce the number of DOM elements</td><td></td><td></td><td></td><td>[5]</td></tr>
<tr><td>Avoid HTTP 404 (Not Found) error</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Reduce cookie size</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Use cookie-free domains</td><td></td><td></td><td>[3]</td><td></td></tr>
<tr><td>Avoid AlphaImageLoader filter</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Do not scale images in HTML</td><td></td><td></td><td></td><td>[6]</td></tr>
<tr><td>Make favicon small and cacheable</td><td></td><td></td><td></td><td>[7]</td></tr>
</table>

## Limitations Explained

1. XHRs resolve any redirects on requests, it means when a request is made for url A that gets redirected to B that redirects to C, there's no trace of all redirects involved, thus this rule is never triggered.
1. When scaning the page searching for components, XHRs can't be detected, hence these rules are not triggered.
1. Only cookies sent over HTTP headers are considered and those components hosted in the same domain as the main page.
1. Empty resources are not listed in HAR files.
1. Since there's no real browser involved, a pseudo browser (JSDOM) is used to render the page which does not provide accurate results.
1. No rendered image dimension information is available in HAR files. Inline and style background images can't be distinguished from regular images.
1. Rule is only triggered when favicon is listed in exported HAR files.

## Techniques Used to Access Page Components

### Firefox
It was the original implementation of YSlow and provides full access to page components information throught Firebug Net Panel. Since it's a add-on, Firefox allows cross domain access to iframes and CSS files hosted in different domains than the page domain.

### Chrome
Chrome extension API currently does not provide access to the netwok panel data, hence XHR requests are made for each component (script, css, images, etc) found on the page being analyzed. Cross domain XHRs are possible within Chrome extension sandbox environment.

### Mobile/Bookmarklet, Opera and Safari
It relies on YQL as a proxy in order to get HTTP headers of page components, for all requests the user-agent string is passed to impersonate the browser making the request.

### Command Line (HAR)
HAR files contain all HTTP headers information needed to YSlow analyze page performance, however since there's no real browser involved, some rules are not applicable.
