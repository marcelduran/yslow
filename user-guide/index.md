---
layout: default
title: YSlow - Official Open Source Project Website
heading: YSlow Help
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: Official YSlow Open Source Project Website. YSlow analyzes web pages and suggests ways to improve their performance based on a set of rules for high performance web pages.}
- {name: author, content: Marcel Duran}
---
<a name="introduction">
## Introduction
</a>
YSlow analyzes web page performance by examining all the components on the page, including components dynamically created by using JavaScript. It measures the page's performance and offers suggestions for improvement.

YSlow for Firefox is integrated into the Firebug web development tool for Firefox.

> YSlow is not integrated into [Firebug Lite](http://getfirebug.com/firebuglite).

<a name="guidelines">
### Performance Rules
</a>
Yahoo!'s Exceptional Performance team has identified 34 rules that affect web page performance. YSlow's web page analysis is based on the 23 of these 34 rules that are testable. These testable rules are listed below roughly in order of importance and effectiveness. Studies have shown that web page response time can be improved by 25% to 50% by following these rules.

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

When analyzing a web page, YSlow deducts points for each infraction of a rule and then applies a grade to each rule. An overall grade and score for the web page is computed by summing up the values of the score for each rule weighted by the rule's importance. Note that the rules are weighted for an average page. For various reasons, there may be some rules that are less important for your particular page. 

From YSlow 2.0 on, users can create their own custom rulesets in addition to the following three predefined rulesets:

1. YSlow(V2) - this ruleset contains the 23 rules listed above.
1. Classic(V1) - this ruleset contains the first 13 rules listed above.
1. Small Site or Blog - this ruleset contains 14 rules that are applicable to small web sites or blogs.

Refer to [Customizing Rulesets](#customrules) for more information.

<a name="installation">
### Installing YSlow
</a>
#### Firefox
YSlow for Firefox needs Firebug to run. Obtain the latest version of Firebug from https://addons.mozilla.org/en-US/firefox/addon/1843. Firebug documentation is available at http://www.getfirebug.com/docs.html.

Once Firebug is installed, download YSlow for Firefox from https://addons.mozilla.org/en-US/firefox/addon/5369. Follow the prompts to install the tool.

#### Chrome
#### Mobile/Bookmarklet
Refer to [Mobile/Bookmarklet](../mobile/) page for more information.
#### Opera
#### Safari
Refer to [Safari](../safari/) page for more information.
#### Command Line (HAR)
Refer to [Command Line HAR](../command-line-har/) page for more information.
#### PhantomJS
Refer to [PhantomJS](../phantomjs/) page for more information.
#### NodeJS Server
Refer to [NodeJS Server](../node-server/) page for more information.

<a name="using_yslow">
### Using YSlow
</a>
#### Firefox
YSlow for Firefox runs in the Firebug window, so in order to run the tool, Firebug must be enabled.

There are two ways to start YSlow for Firefox:

1. Open the Firebug window and click on the YSlow tab.
1. Click the YSlow button on the status bar.

The first time you bring up Firefox with YSlow, the following screen will be displayed in the Firebug portion of the browser window:

![YSlow initial page](http://l.yimg.com/a/i/ydn/yslow/help/yslowinitial.png)

Click **Run Test** to run YSlow. You may also click on the Grade, Components, or Statistics tabs to start the web page analysis.

You can click on the box next to **Autorun YSlow each time a web page is loaded** to set up YSlow to run each time the browser loads a web page. You can enable or disable the **Autorun** option by right clicking anywhere in the YSlow status bar and selecting or deselecting **Autorun**.

![Autorun context menu](http://l.yimg.com/a/i/ydn/yslow/help/yslowautorun.png)

If you left click on the YSlow icon on the left side of the status bar or the response time value on the right side, the page display will toggle between displaying the entire page and displaying the page with the Firebug window. If you left click on the grade in the status bar, the Grade View will be displayed in the Firebug window. If you left click on the page weight value in the status bar, the Statistics View will be displayed in the Firebug window.

#### Chrome
#### Mobile/Bookmarklet
Refer to [Mobile/Bookmarklet](../mobile/) page for more information.
#### Opera
#### Safari
Refer to [Safari](../safari/) page for more information.
#### Command Line (HAR)
Refer to [Command Line HAR](../command-line-har/) page for more information.
#### PhantomJS
Refer to [PhantomJS](../phantomjs/) page for more information.
#### NodeJS Server
Refer to [NodeJS Server](../node-server/) page for more information.

<a name="views">
## YSlow Views
</a>
YSlow displays the results of its analysis in separate Grade, Components, and Statistics views. You can navigate between these views by selecting the tab with the view name under the YSlow tab of the Firebug console.

Following are descriptions of the Grade, Components, and Statistics views.

<a name="performance_view">
### Grade View
</a>
To view an analysis of the page's performance, choose the Grade tab or click the page's letter grade in the status bar at the bottom of the page.

The Grade View displays a report card for the web page. The overall letter grade for the page is displayed at the top along with an overall numeric performance score. The page is graded based on 23 testable rules for high performance web pages (see Performance Rules). The rules are listed in order of importance from most important to least important. Each rule is assigned a letter grade A through F, with A being the highest grade.

Following is an example Grade View:

![Grade view](http://l.yimg.com/a/i/ydn/yslow/help/gradeview.png)

If a rule is not relevant to the web page, the grade returned is N/A, not applicable.

You can review your web page's grades for each of the 23 testable rules. For each rule, a grade is listed along with a list of components that violated the rule and suggestions for improvement. Additionally, there is a short description of the rule and a Read More link you can click on to read more about how the rule impacts web page performance.

<a name="components_view">
### Components View
</a>
To display information about the page's components, choose the Components tab. The Components View displays all the components present on the web page. You might look at this view, for example, to see which components could be gzipped to improve performance.

Following is an example Components View:

![Components view](http://l.yimg.com/a/i/ydn/yslow/help/componentsview.png)

At the top of the display for this view there is a summary of the total number of components on the page and the page weight in kilobytes. Then there is a table with the component information. Click on the **Expand All** link to expand all the rows in the table.

Following is a summary of the columns in the Components View table:

* **Type** - the component's type. The page is comprised of components of the following types: doc, js, css, flash, cssimage, image, redirect, favicon, xhr, and iframe.
* **Size** - the component's size in kilobytes.
* **Gzip** - the component's gzipped size in kilobytes.
* **Cookie Received** - the number of bytes in the HTTP Set-Cookie response header.
* **Cookie Sent** - the number of bytes in the HTTP Cookie request header.
* **Headers** - the HTTP header icon. To view the header click the ![magnifying glass](http://l.yimg.com/a/i/ydn/yslow/viewresponseheader.jpg) icon. Click the icon again to close the header.
* **URL** - the component's URL.
* **Expires** - the date in the Expires header or `max-age` in the `cache-control` header. This field is set to no expires if there is no expires information.
* **Response Time** - the time in milliseconds it takes to load the component using `XMLHttpRequest`.
* **ETag** - the ETag response header value, if applicable.
* **Action** - an action to take on the component for additional performance analysis.

<a name="stats_view">
### Statistics View
</a>
To view statistics about the web page, choose the Statistics tab. This view provides a summary of the total number of HTTP requests and the total weight of the page in kilobytes as well as page weight analysis for both Empty Cache and Primed Cache perspectives. The Empty Cache perspective indicates all the components that the browser must request to load the page when the user visits it for the first time. In the Primed Cache perspective, all or most of the components would already be in the cache, which would reduce the number of HTTP requests and the weight of the page.

The `Expires` and `Last-Modified` headers of each component affect the Empty and Primed Cache perspectives. For example, when the cache is full, a component with an `Expires` header in the far future does not require an HTTP request and adds no weight to the page size. If a component is expired, but has a fairly old `Last-Modified` date, then it generates a conditional `GET HTTP` request. However, this usually results in a `304 Not Modified` response and does not add any weight to the page.

Following is an example Statistics View:

![Statistics view](http://l.yimg.com/a/i/ydn/yslow/help/statisticsview.png)

<a name="yslowmenubar">
## YSlow Menu Bar
</a>
The YSlow menu bar contains the Grade, Components, and Statistics tabs, which are described above. It also contains the Tools tab; for information about the Tools tab, refer to YSlow Tools. In addition to these four tabs, the menu bar also contains contains options for selecting and editing rulesets, creating a printable view of the page performance analysis, and getting help. These options are described in the following sections.

<a name="customrules">
### Rulesets
</a>
Beginning with YSlow 2.0, you can select one of three predefined rulesets to use for your web page analysis or define your own custom ruleset. The three predefined rulesets are:

1. YSlow(V2) - this ruleset contains all 23 testable rules.
1. Classic(V1) - this ruleset contains the original 13 rules that were used in YSlow 1.0.
1. Small Site or Blog - this ruleset contains the 14 rules that are applicable to small web sites or blogs. Refer to the image below to see which rules are in this ruleset.

![Small site or blog](http://l.yimg.com/a/i/ydn/yslow/help/smallsite.png)

Note that the ruleset last selected becomes the default ruleset. The default ruleset can be one of three predefined ones or one you create yourself.

To create your own ruleset, click on the **Edit** button next to the Rulesets pull-down menu. The New Ruleset screen shown below will be displayed:

![Create ruleset](http://l.yimg.com/a/i/ydn/yslow/help/newruleset.png)

Initially all the rules will be unchecked. Select the rules you wish to include in your ruleset. Then click the **Save ruleset as...** button, enter a name for the ruleset, and click **Save**.

To run YSlow using your customized ruleset, select the ruleset from the Rulesets pull-down menu. YSlow will ask **Do you want to run the selected ruleset now?** Click on **Run Test** to run YSlow with your ruleset.

You can make additional edits to your ruleset by selecting your ruleset in the Rulesets pull-down-menu and clicking on **Edit**. You can remove rules previously selected and add new rules. When you complete your changes, either click **Save** to save the revised ruleset with the same name or click **Save ruleset as...** to create a new ruleset.

The following image shows the ruleset editing screen:

![Edit ruleset](http://l.yimg.com/a/i/ydn/yslow/help/editruleset.png)

If you no longer need the ruleset, you can delete it by clicking on the **Delete** button.

<a name="printable_version">
### Printable View
</a>
Click on the Printable View link on the YSlow toolbar to display the page performance analysis. YSlow asks what information you want to display. Select one or more of the available views as shown in the following image:

![Print preview](http://l.yimg.com/a/i/ydn/yslow/help/printview.png)

YSlow will open a new window, formatted for printing, containing the information from the views you selected.

<a name="getting_help">
### Help
</a>
Click on Help to bring up the following menu:

![Help menu](http://l.yimg.com/a/i/ydn/yslow/help/helpmenu.png)

Following is a description of each of the help menu options:

* [YSlow Help](.) - links to this document, the YSlow User Guide
* [YSlow FAQ](../faq/) - links to frequently asked questions about using YSlow
* [YSlow Community](http://tech.groups.yahoo.com/group/exceptional-performance/) - links to the Exceptional Performance Yahoo! group
* [Send Feedback](https://github.com/marcelduran/yslow/issues) - links to a feedback form for sending comments and suggestions
* [YSlow Home](http://yslow.org) - links to YSlow home page

<a name="toolstab">
## YSlow Tools
</a>
YSlow's Tools menu provides several reporting tools that you can use to get information to help with your web page analysis. Following is a screen shot of the Tools menu:

![Tools menu](http://l.yimg.com/a/i/ydn/yslow/help/toolsmenu.png)

Each tool is described below.

<a name="js_lint">
### JSLint
</a>
JSLint gathers all external and inline JavaScript from the current web page, submits it to JSLint, a JavaScript verifier, and opens a separate window with a report about problems with the page's JavaScript. The report includes approximate locations within the source of the problem code. Often times the problems are syntax errors, but JSLint looks for style convention problems and structural problems too.

Following is an example JSLINT report:

![JSLint report](http://l.yimg.com/a/i/ydn/yslow/help/jslint.png)

<a name="all_js">
### All JS
</a>
All JS collects all external and inline JavaScript from the page and displays the scripts in a separate window. You might want to use this tool to check which scripts the page actually uses and whether the page is pulling them in correctly.

Following is an example All JS report:

![All JS report](http://l.yimg.com/a/i/ydn/yslow/help/alljs.png)

<a name="all_js_beautified">
### All JS Beautified
</a>
All JS Beautified is similar to All JS except the JavaScript output is formatted to be more human readable.

Following is an example All JS Beautified report:

![All JS beautified](http://l.yimg.com/a/i/ydn/yslow/help/alljsbeautified.png)

<a name="all_js_minified">
### All JS Minified
</a>
All JS Minified collects all external and inline JavaScript and removes comments and white space to decrease the size of the scripts. You can replace your JavaScript with the minified version to improve performance of the web page.

Following is an example All JS Minified report:

![All JS minified report](http://l.yimg.com/a/i/ydn/yslow/help/alljsminified.png)

<a name="all_css">
### All CSS
</a>
All CSS collects all the inline and external stylesheets on the page and displays them in a separate window.

Following is an example All CSS report:

![All CSS report](http://l.yimg.com/a/i/ydn/yslow/help/allcss.png)

<a name="all_smush_it">
### All Smush.it
</a>
If you click on All Smush.it, Smush.it will be run on all the image components on the page. This tool will tell you which images can be optimized and will create a zip file with the optimized images. When you select this tool you will see output like the following:

![All Smush.it report](http://l.yimg.com/a/i/ydn/yslow/help/smushit.png)

<a name="printable_view">
### Printable View
</a>
Click on Printable View to open a new window with a printable view of grades, components, and statistics for the page.

<a name="yslow_beacon">
## YSlow Beacon
</a>
YSlow can be configured to beacon back YSlow results to a server.

Here are the preferences that control the beacon:

`extensions.yslow.optinBeacon` - turn on or off sending yslow beacon
`extensions.yslow.beaconUrl` - specify url of the beacon

<a name="version1">
### YSlow 1.x - YSlow 2.0.0b6
</a>
YSlow results are sent as cgi parameters appended to the url specified in `extensions.yslow.beaconUrl` via `HTTP GET` method.

YSlow beacon parameters

<table>
<tr><th>Name</th><th>Value</th></tr>
<tr><td>w</td><td>total page size</td></tr>
<tr><td>o</td><td>overall score</td></tr>
<tr><td>u</td><td>url</td></tr>
<tr><td>r</td><td>total number of requests</td></tr>
<tr><td>s</td><td>space id of the page</td></tr>
<tr><td>i</td><td>id of the ruleset used</td></tr>
<tr><td>ynumreq</td><td>score for Make fewer HTTP Requests</td></tr>
<tr><td>ycdn</td><td>score for Use a Content Delivery Network(CDN)</td></tr>
<tr><td>yemptysrc</td><td>score for Avoid empty src or href</td></tr>
<tr><td>yexpires</td><td>score for Add Expires headers</td></tr>
<tr><td>ycompress</td><td>score for Compress components with gzip</td></tr>
<tr><td>ycsstop</td><td>score for Put CSS at top</td></tr>
<tr><td>yjsbottom</td><td>score for Put JavaScript at bottom</td></tr>
<tr><td>yexpressions</td><td>score for Avoid CSS expressions</td></tr>							
<tr><td>yexternal</td><td>score for Make JavaScript and CSS external</td></tr>							
<tr><td>ydns</td><td>score for Reduce DNS lookups</td></tr>							
<tr><td>yminify</td><td>score for Minify JavaScript and CSS</td></tr>							
<tr><td>yredirects</td><td>score for Avoid URL redirects</td></tr>							
<tr><td>ydupes</td><td>score for Remove duplicate JavasScript and CSS</td></tr>							
<tr><td>yetags</td><td>score for Configure entity tags (ETags)</td></tr>							
<tr><td>yxhr</td><td>score for Make AJAX cacheable</td></tr>							
<tr><td>yxhrmethod</td><td>score for Use GET for AJAX requests</td></tr>							
<tr><td>ymindom</td><td>score for Reduce the number of DOM elements</td></tr>							
<tr><td>yno404</td><td>score for Avoid HTTP 404 (Not Found) error</td></tr>							
<tr><td>ymincookie</td><td>score for Reduce cookie size</td></tr>							
<tr><td>ycookiefree</td><td>score for Use cookie-free domains</td></tr>							
<tr><td>ynofilter</td><td>score for Avoid AlphaImageLoader filter</td></tr>							
<tr><td>yimgnoscale</td><td>score for Do not scale images in HTML</td></tr>							
<tr><td>yfavicon</td><td>score for Make favicon small and cacheable</td></tr>																							
</table>

<a name="version2">
### YSlow 2.0.0 GA and up
</a>
Starting YSlow 2.0.0 GA, users can customize the YSlow results being included in YSlow beacon.
A new preference is introduced `extensions.yslow.beaconInfo` to indicate what to include in YSlow beacon. The value of this preference can be `basic`, `grade`, `stats`, `comps`, `all` or a comma separated list of `grade`, `stats` and `comps`.

Default value of the preference is `basic`. YSlow beacon is sent with `HTTP GET` if beaconInfo is set to `basic`; for all other values, the beacon is sent with `HTTP POST` method and the parameters are in JSON format as body of the POST request.

<table>
<tr><th>Name</th><th>Value</th><th>Type</th></tr>
<tr><td>w</td><td>total page size</td><td>basic</td></tr>
<tr><td>o</td><td>overall score</td><td>basic</td></tr>
<tr><td>u</td><td>url</td><td>basic</td></tr>
<tr><td>r</td><td>total number of requests</td><td>basic</td></tr>
<tr><td>s</td><td>space id of the page</td><td>basic</td></tr>
<tr><td>i</td><td>id of the ruleset used</td><td>basic</td></tr>
<tr><td>lt</td><td>page load time</td><td>basic</td></tr>
<tr><td>g</td><td>scores of all rules in the ruleset. e.g.:
<pre>{
    "ynumreq": {
        "score": 85
    }
    "ydns": {
        "score": 85,
        "components": ["www.yahoo.com", 
                       "l.yimg.com", 
                       "us.i1.yimg.com", 
                       "m.doubleclick.net", 
                       "ad.doubleclick.net", 
                       "srd.yahoo.com", 
                       "us.bc.yahoo.com"]
},
...
}</pre></td><td>grade</td></tr>
<tr><td>w_c</td><td>page weight with primed cache</td><td>stats</td></tr>
<tr><td>r_c</td><td>number of requests with primed cache</td><td>stats</td></tr>
<tr><td>stats</td><td>number of requests and weight grouped by component type. e.g.:
<pre>{
    "doc": {
        "r": 1,
        "w": 36858
    },
    "js": {
        "r": 3,
        "w": 29060
    },
    ...
}</pre>
</td><td>stats</td></tr>
<tr><td>stats_c</td><td>number of request and weight of components group by component type with primed cache</td><td>stats</td></tr>
<tr><td>comps</td><td>an array of all the components found on the page. e.g.:
<pre>[{
        "type": "doc",
        "url": "http://www.yahoo.com/",
        "size": 141710,
        "resp": 254,
        "gzip": 36858,
        "cr": 488,
        "cs": 396
},
{
        "type": "js",
        "url": "http://d.yimg.com/foo.js",
        "size": 978,
        "resp": 37,
        "gzip": "553",
        "expires": "2019/7/24"
},
        ...
]</pre></td><td>comps</td></tr>
</table> 
