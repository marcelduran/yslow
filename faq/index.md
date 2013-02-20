---
layout: default
title: YSlow - Official Open Source Project Website
heading: YSlow FAQ
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: Official YSlow Open Source Project Website. YSlow analyzes web pages and suggests ways to improve their performance based on a set of rules for high performance web pages.}
- {name: author, content: Marcel Duran}
---
## Questions

* [What platforms does YSlow run on?](#faq_platforms)
* [How does YSlow work?](#faq_work)
* [How are the grades computed?](#faq_grading)
* [Does YSlow handle DHTML? Ajax? Web 2.0?](#faq_ajax)
* [How does YSlow integrate with Firebug's Net Panel?](#faq_netpanel)
* [How accurate is YSlow at finding the components in the page? Why do YSlow and Firebug's Net Panel lists differ?](#faq_accuracy)
* [How is the response time calculated? Why is it sometimes missing?](#faq_resptime)
* [How do I add my CDN hostname to YSlow for Rule 2?](#faq_cdn)
* [Does YSlow work with frames?](#faq_frames)
* [My component has an `Expires` or a `Cache-Control` header - why does YSlow say it doesn't?](#faq_expires)
* [What YSlow results are included in the YSlow beacon?](#faq_beaconformat)
* [What are the license terms that apply to YSlow?](#faq_license)

<a name="faq_platforms">
### What platforms does YSlow run on?
</a>

<ul class="avail">
  <li><a class="firefox" href="https://addons.mozilla.org/en-US/firefox/addon/5369">Firefox</a>
  <li><a class="chrome" href="https://chrome.google.com/webstore/detail/ninejjcohidippngpapiilnmkgllmakh">Chrome</a>
  <li><a class="mobile" href="../mobile/">Mobile/Bookmarklet</a>
  <li><a class="opera" href="https://addons.opera.com/addons/extensions/details/yslow/">Opera</a>
  <li><a class="safari" href="../safari/">Safari</a>
  <li><a class="command" href="../command-line-har/">Command Line (HAR)</a>
  <li><a class="phantomjs" href="../phantomjs/">PhantomJS</a>
  <li><a class="nodejs" href="../node-server/">Node.js Server</a>
  <li><a class="source" href="https://github.com/marcelduran/yslow">Source Code</a>
</ul>

[» View YSlow Ruleset Limitations](../ruleset-limitations/) across several browsers/platforms.

<a name="faq_work">
### How does YSlow work?
</a>
YSlow works in three phases to generate its results.

1. YSlow crawls the DOM to find all the components (images, scripts, stylesheets, etc.) in the page. After crawling the DOM, YSlow loops through Firebug's Net Panel components and adds those to the list of components already found in the DOM
1. YSlow gets information about each component: size, whether it was gzipped, Expires header, etc. YSlow gets this information from Firebug's Net Panel if it's available. If the component's information is not available from Net Panel (for example, the component was read from cache or it had a 304 response) YSlow makes an XMLHttpRequest to fetch the component and track its headers and other necessary information.
1. YSlow takes all this data about the page and generates a grade for each rule, which produces the overall grade.

<a name="faq_grading">
### How are the grades computed?
</a>
The grades for individual rules are computed differently depending on the rule. For example, for Rule 1, three external scripts are allowed. For each script above that, four points are deducted from the grade. The code for grading each rule is found in rules.js. The overall grade is a weighted average of the individual grades for each rule, calculated in controller.js The rules are approximately in order of importance, most important first. The specific weights are in the ruleset objects in rules.js.

Rule weights of YSlow V2 Ruleset.

<table>
<tr><th>Rule Name</th><th>Rule Id</th><th>Default weight</th></tr>
<tr><td>Make fewer HTTP requests</td><td>ynumreq</td><td>8</td></tr>
<tr><td>Use a CDN</td><td>ycdn</td><td>6</td></tr>
<tr><td>Avoid empty src or href</td><td>yemptysrc</td><td>30</td></tr>
<tr><td>Add an Expires header</td><td>yexpires</td><td>10</td></tr>
<tr><td>Compress components</td><td>ycompress</td><td>8</td></tr>
<tr><td>Put CSS at top</td><td>ycsstop</td><td>4</td></tr>
<tr><td>Put Javascript at the bottom</td><td>yjsbottom</td><td>4</td></tr>
<tr><td>Avoid CSS expression</td><td>yexpressions</td><td>3</td></tr>
<tr><td>Make JS and CSS external</td><td>yexternal</td><td>4</td></tr>
<tr><td>Reduce DNS lookups</td><td>ydns</td><td>3</td></tr>
<tr><td>Minify JS and CSS</td><td>yminify</td><td>4</td></tr>
<tr><td>Avoid redirects</td><td>yredirects</td><td>4</td></tr>
<tr><td>Remove duplicate JS and CSS</td><td>ydupes</td><td>4</td></tr>
<tr><td>Configure ETags</td><td>yetags</td><td>2</td></tr>
<tr><td>Make Ajax cacheable</td><td>yxhr</td><td>4</td></tr>
<tr><td>Use GET for AJAX requests</td><td>yxhrmethod</td><td>3</td></tr>
<tr><td>Reduce the Number of DOM elements</td><td>ymindom</td><td>3</td></tr>
<tr><td>No 404s</td><td>yno404</td><td>4</td></tr>
<tr><td>Reduce Cookie Size</td><td>ymincookie</td><td>3</td></tr>
<tr><td>Use Cookie-free Domains</td><td>ycookiefree</td><td>3</td></tr>
<tr><td>Avoid filters</td><td>ynofilter</td><td>4</td></tr>
<tr><td>Don't Scale Images in HTML</td><td>yimgnoscale</td><td>3</td></tr>
<tr><td>Make favicon Small and Cacheable</td><td>yfavicon</td><td>2</td></tr>
</table>

[» View YSlow Ruleset Matrix](../ruleset-matrix/) for more detailed information.

<a name="faq_ajax">
### Does YSlow handle DHTML? Ajax? Web 2.0?
</a>
Many web pages are moving to a Web 2.0 style where the components in the page and the page itself are built dynamically in the browser using JavaScript. The main function behind Ajax is `XMLHttpRequest`. Similar functionality can be achieved using [JSON](http://www.json.org/) and hidden iframes. YSlow analyzes all the components in the page, including components downloaded using these Web 2.0 techniques. If these dynamically loaded components are missing an `Expires` header or aren't gzipped they will be reported by YSlow, as expected.

If your Web 2.0 page dynamically downloads components after the onload handler or uses Ajax, these components will be excluded from YSlow grading. To run YSlow on these components, you will need to set `extensions.yslow.excludeAfterOnload`, _disable_ the YSlow Autorun option, and launch YSlow manually after all these requests are done.

1. Go to `about:config` in Firefox. You'll see the current list of preferences.
1. Enter `extensions.yslow.excludeAfterOnload` in Filter:.
1. If it does not exist, right-click in the window and choose New and Boolean to create a new Boolean preference. Enter `extensions.yslow.excludeAfterOnload` for the preference name.
1. Choose `false` and click OK. 

<a name="faq_netpanel">
### How does YSlow integrate with Firebug's Net Panel?
</a>
YSlow uses the components' HTTP response headers to compute a score for each of the [performance rules](http://developer.yahoo.com/performance/rules.html). For example, YSlow uses the `Expires` header to evaluate **Rule 4**, and the `ETag` header for **Rule 14**. If necessary, YSlow gets this header information by re-requesting the components using `XMLHttpRequest`, but this takes time and CPU.

The alternative that YSlow tries first is to get this header information from Firebug's Net Panel. Since YSlow is part of Firebug, it has access to Net Panel's data. Net Panel collects the HTTP header information from the original request for the component, so an additional `XMLHttpRequest` is not required. YSlow still has to do the `XMLHttpRequest` if Net Panel doesn't have a component (it was cached) or there was a `304 Not Modified` response status code.

YSlow also uses Net Panel to "discover" components that are not part of the DOM (such as `XMLHttpRequests`) and examines those as well.

<a name="faq_accuracy">
### How accurate is YSlow at finding the components in the page? Why do YSlow and some packet sniffers differ?
</a>
There are two main approaches for finding components in a web page: sniffing packets and crawling the DOM. Firebug's Net Panel, [ethereal](http://www.ethereal.net/), and [IBM Page Detailer](http://alphaworks.ibm.com/tech/pagedetailer) are packet sniffers. YSlow, [Instant Source](http://www.blazingtools.com/is.html), and the [AIS Accessibility Toolbar](http://www.webaim.org/resources/ais/) crawl the DOM.

The problem with sniffing packets is sometimes components are read from the browser's disk cache. If the user forgets to clear their cache, the components shown by the packet sniffer don't reflect all the components in the page. Packet sniffers tell the user only about the components that generated network traffic for the current web page request.

DOM crawlers, on the other hand, report all the components found in the DOM of the current page, whether they were read from disk or downloaded over the Internet. The problem with DOM crawlers is not all HTTP requests show up in the DOM. Specifically, beacons, XHR, and JSON requests aren't found in the DOM.

YSlow is a combination of a DOM crawler and a packet sniffer. YSlow has a built-in DOM crawler that discovers components, but in addition YSlow also integrates with Net Panel to find additional components that are not part of the DOM, such as XMLHttpRequests and image beacons. The Stats view in YSlow gives a breakdown of empty cache versus primed cache component counts, so you can get an idea of the amount of network traffic that would occur under each scenario.

Firebug's Net Panel generally lists only the components that generated network traffic, as expected of a packet sniffer.

<a name="faq_resptime">
### How is the response time calculated? Why is it sometimes missing?
</a>
The response time shown by YSlow in the status bar is the number of milliseconds between the `onbeforeunload` and `onload` events, in other words, the time between when the previous page unloaded and the requested page was done loading. If you download components after the onload event, those aren't included. Sometimes the response time isn't shown. This typically happens if there was no previous page, such as the first page viewed after the browser starts or after a browser tab was just opened. This also happens if the page being viewed is not an HTML document, such as `about:blank`. 

<a name="faq_cdn">
### How do I add my CDN hostname to YSlow for Rule 2?
</a>
Rule 2 says to use a content delivery network (CDN). The score for this rule is computed by checking the hostname of each component against the list of known CDNs. Unfortunately, the list of "known CDNs" are the ones used by Yahoo!. Most likely these are not relevant to your web site, except for potentially `yui.yahooapis.com`. If you want an accurate score for your web site, you can add your CDN hostnames to YSlow for Firefox and Chrome only, using the <button>Add as CDN</button> button right next to each offender hostname under details. YSlow recalculates scores and grade automatically.

The list of custom CDN hostnames can also be set on Firefox's preferences or Chrome's options. Here are the steps to follow:

#### Firefox
1. Go to `about:config` on location bar. You'll see the current list of preferences.
1. Right-click in the window and choose New and String to create a new string preference.
1. Enter `extensions.yslow.cdnHostnames` for the preference name.
1. For the string value, enter the hostname of your CDN, for example, `mycdn.com`. Do not use quotes. If you have multiple CDN hostnames, separate them with commas.

#### Chrome
1. Right-click YSlow button on extension bar and choose **Options**. You'll see the current list of preferences.
1. Look for `extensions.yslow.cdnHostnames` preference item.
1. Enter/edit the hostname of your CDN, for example, `mycdn.com`. Do not use quotes. If you have multiple CDN hostnames, separate them with commas.

Firefox and Chrome no longer need to be restarted in order to the list of custom CDNs to become effective. Just hit Run button to recalculate YSlow scores and grade.

If you specify CDN hostnames in your preferences, they'll be shown under the details for Rule 2 in the Performance view.

<a name="faq_frames">
### Does YSlow work with frames?
</a>
YSlow loops through all frames (recursively) searching for components. Frames are listed as `doc` components, while iframes show up as `iframe`. 

<a name="faq_expires">
### My component has an `Expires` or a `Cache-Control` header - why does YSlow say it doesn't?
</a>
The expiration time must be at least 48 hours in the future for components to avoid being flagged by [Rule 4](http://developer.yahoo.com/performance/rules.html#expires).

<a name="faq_beaconformat">
### What YSlow results are included in the YSlow beacon
</a>
Please see the [YSlow Beacon section in YSlow documentation](../user-guide#yslow_beacon).

<a name="faq_license">
### What are the license terms that apply to YSlow?
</a>
Most files comprising YSlow are licensed under the [New BSD License](https://raw.github.com/marcelduran/yslow/master/LICENSE.txt), with a couple of exceptions. YSlow includes [JSLint](http://www.jslint.com/) by Douglas Crockford, which is licensed under a derivative of [MIT License](http://en.wikipedia.org/wiki/MIT_License). YSlow also includes files from the [Yahoo! User Interface library](http://yuilibrary.com/), which are licensed under the [BSD license](http://yuilibrary.com/license/). 
