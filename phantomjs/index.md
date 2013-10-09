---
layout: default
title: YSlow - Official Open Source Project Website
heading: YSlow for PhantomJS
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
syntaxhighlight: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: Official YSlow Open Source Project Website. YSlow analyzes web pages and suggests ways to improve their performance based on a set of rules for high performance web pages.}
- {name: author, content: Marcel Duran}
---
[PhantomJS](http://www.phantomjs.org/) is a headless WebKit with JavaScript API. YSlow for PhantomJS is a command line script that allows page performance analysis from live URLs, unlike YSlow for [Command Line (HAR)](../command-line-har/) where a pre-generated [HAR](http://www.softwareishard.com/blog/har-12-spec/) file is needed in order to analyze page performance.

YSlow for PhantomJS also introduces new output formats for automated test frameworks: [TAP (Test Anything Protocol)](http://www.testanything.org/) and [JUnit](http://www.junit.org/), other formats as well as hook for custom formatters will be available soon, keep watching. With this new feature, YSlow can now be added to your [continuous integration](http://en.wikipedia.org/wiki/Continuous_integration) pipeline as a performance test suite, preventing performance regression to be pushed to production. See [examples](#wiki-examples) and [screenshots](#wiki-screenshots) below.

<a name="installation">
## Installation
</a>

1. Check [steps to install PhantomJS](http://phantomjs.org/download.html) or alternatively [build it from source](http://phantomjs.org/build.html).
1. Assuming PhantomJS is properly installed and executable from your PATH:  
[Download YSlow for PhantomJS](http://yslow.org/yslow-phantomjs-3.1.8.zip)
1. Extract the content into any directory.

<a name="help">
## Help
</a>

```bash
$ phantomjs yslow.js --help
```
```
  Usage: phantomjs [phantomjs options] yslow.js [yslow options] [url ...]

  PhantomJS Options:

    http://y.ahoo.it/phantomjs/options

  YSlow Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -i, --info <info>        specify the information to display/log (basic|grade|stats|comps|all) [all]
    -f, --format <format>    specify the output results format (json|xml|plain|tap|junit) [json]
    -r, --ruleset <ruleset>  specify the YSlow performance ruleset to be used (ydefault|yslow1|yblog) [ydefault]
    -b, --beacon <url>       specify an URL to log the results
    -d, --dict               include dictionary of results fields
    -v, --verbose            output beacon response information
    -t, --threshold <score>  for test formats, the threshold to test scores ([0-100]|[A-F]|{JSON}) [80]
                             e.g.: -t B or -t 75 or -t '{"overall": "B", "ycdn": "F", "yexpires": 85}'
    -u, --ua "<user agent>"  specify the user agent string sent to server when the page requests resources
    -vp, --viewport <WxH>    specify page viewport size WxY, where W = width and H = height [400x300]
    -ch, --headers <JSON>    specify custom request headers, e.g.: -ch '{"Cookie": "foo=bar"}'
    -c, --console <level>    output page console messages (0: none, 1: message, 2: message + line + source) [0]
    --cdns "<list>"          specify comma separated list of additional CDNs

  Examples:

    phantomjs yslow.js http://yslow.org
    phantomjs yslow.js -i grade -f xml www.yahoo.com www.cnn.com www.nytimes.com
    phantomjs yslow.js --info all --format plain --ua "MSIE 9.0" http://yslow.org
    phantomjs yslow.js -i basic --rulseset yslow1 -d http://yslow.org
    phantomjs yslow.js -i grade -b http://www.showslow.com/beacon/yslow/ -v yslow.org
    phantomjs --load-plugins=yes yslow.js -vp 800x600 http://www.yahoo.com
    phantomjs yslow.js -i grade -f tap -t 85 http://yslow.org
```

<a name="examples">
## Examples
</a>

### Basic information with JSON output
```bash
$ phantomjs yslow.js --info basic http://www.yahoo.com
```
```json
{"w":491065,"o":95,"u":"http%3A%2F%2Fwww.yahoo.com","r":60,"i":"ydefault","lt":966}
```

### Basic information with plain text (human readable) output
```bash
$ phantomjs yslow.js --info basic --format plain http://www.cnn.com
```
```html
size: 561.4K (561458 bytes)
overall score: D (64)
url: http://www.cnn.com/
# of requests: 137
ruleset: ydefault
page load time: 2576
```

### Basic test (overall score only) with TAP output
```bash
$ phantomjs yslow.js --info basic --format tap --threshold B http://yslow.org
```
```yaml
TAP version 13
1..1
ok 1 B (86) overall score
```

### Full test with TAP output
```bash
$ phantomjs yslow.js --info grade --format tap --threshold '{"overall": "B", "ycdn": 65}' http://yslow.org
```
```yaml
TAP version 13
1..24
ok 1 B (88) overall score
not ok 2 C (72) ynumreq: Make fewer HTTP requests
  ---
  message: This page has 7 external Javascript scripts.  Try combining them into one.
This page has 5 external stylesheets.  Try combining them into one.
  ...
ok 3 C (70) ycdn: Use a Content Delivery Network (CDN)
  ---
  message: There are 3 static components that are not on CDN. <p>You can specify CDN hostnames in your preferences. See <a href="https://yslow.org/faq#faq_cdn">YSlow FAQ</a> for details.</p>
  offenders:
    - "yslow.org: 1 component, 8.0K (8.0K GZip)"
    - "fonts.googleapis.com: 1 component, 1.0K (1.0K GZip)"
    - "widgets.twimg.com: 1 component, 0.8K"
  ...
ok 4 A (100) yemptysrc: Avoid empty src or href
not ok 5 F (12) yexpires: Add Expires headers
  ---
  message: There are 8 static components without a far-future expiration date.
  offenders:
    - "http://yslow.org/stylesheets/styles-min.css"
    - "https://fonts.googleapis.com/css?family=Lato:300italic,700italic,300,700"
    - "http://widgets.twimg.com/j/2/widget.css"
    - "http://www.google-analytics.com/ga.js"
    - "http://widgets.twimg.com/j/2/widget.js"
    - "http://d.yimg.com/jc/ydn/yslow-ss.png"
    - "http://widgets.twimg.com/i/widget-logo.png"
    - "http://yslow.org/favicon.ico"
  ...
ok 6 A (100) ycompress: Compress components with gzip
ok 7 A (100) ycsstop: Put CSS at top
ok 8 A (100) yjsbottom: Put JavaScript at bottom
ok 9 A (100) yexpressions: Avoid CSS expressions
ok 10 N/A (-1) yexternal: Make JavaScript and CSS external # SKIP score N/A
  ---
  message: Only consider this if your property is a common user home page.
  offenders:
    - "There is a total of 2 inline css"
    - "There is a total of 2 inline scripts"
  ...
not ok 11 C (70) ydns: Reduce DNS lookups
  ---
  message: The components are split over more than 4 domains
  offenders:
    - "yslow.org: 3 components, 17.6K (17.6K GZip)"
    - "fonts.googleapis.com: 1 component, 1.0K (1.0K GZip)"
    - "themes.googleusercontent.com: 4 components, 0.0K"
    - "widgets.twimg.com: 3 components, 49.2K (48.4K GZip)"
    - "www.google-analytics.com: 1 component, 36.5K (36.5K GZip)"
    - "d.yimg.com: 2 components, 49.5K"
    - "a0.twimg.com: 1 component, 3.6K"
    - "www.facebook.com: 1 component, 10.8K (10.8K GZip)"
    - "static.ak.fbcdn.net: 10 components, 948.5K (354.1K GZip)"
    - "profile.ak.fbcdn.net: 1 component, 2.4K"
  ...
ok 12 A (90) yminify: Minify JavaScript and CSS
  ---
  message: There is 1 component that can be minified
  offenders:
    - "inline &lt;style&gt; tag #2"
  ...
ok 13 A (100) yredirects: Avoid URL redirects
ok 14 A (100) ydupes: Remove duplicate JavaScript and CSS
ok 15 A (100) yetags: Configure entity tags (ETags)
ok 16 A (100) yxhr: Make AJAX cacheable
ok 17 A (100) yxhrmethod: Use GET for AJAX requests
ok 18 A (100) ymindom: Reduce the number of DOM elements
ok 19 A (100) yno404: Avoid HTTP 404 (Not Found) error
ok 20 A (100) ymincookie: Reduce cookie size
ok 21 A (100) ycookiefree: Use cookie-free domains
ok 22 A (100) ynofilter: Avoid AlphaImageLoader filter
ok 23 A (100) yimgnoscale: Do not scale images in HTML
ok 24 A (95) yfavicon: Make favicon small and cacheable
  ---
  message: Favicon is not cacheable
  ...
```

<a name="screenshots">
## Screenshots
</a>

### [Jenkins](http://jenkins-ci.org/) with TAP test results
![Jenkins with TAP test results screenshot](http://i.imgur.com/K2WK3.png)

### [Jenkins](http://jenkins-ci.org/) with JUnit test results
![Jenkins with JUnit test results screenshot](http://i.imgur.com/PTD6j.png)

### [Jenkins](http://jenkins-ci.org/) with JUnit test result details
![Jenkins with JUnit test result details screenshot](http://i.imgur.com/0vjzQ.png)

<a name="jenkins-integration">
## Jenkins integration
</a>

Once you have Jenkins, PhantomJS and YSlow for PhantomJS installed and working properly, just add the following shell command into your building process:

`phantomjs /tmp/yslow.js -i grade -threshold "B" -f junit http://built-page-here > yslow.xml`

In line above:

 - YSlow for PhantomJS script is located at `/tmp/yslow.js`
 - `-i grade` specifies that all rules will be tested
 - `-threshold "B"` specifies the lowest acceptable score for all rules as well as overall score
 - `-f junit` specifies the output format for Jenkins
 - `http://built-url-here` is the reachable built page url of your project
 - `yslow.xml` is the output results in junit format

If you have TAP plugin installed (via Jenkins plugin manager), you can replace the line above or add another test as follows:

`phantomjs /tmp/yslow.js -i grade -threshold "B" -f tap http://built-page-here > yslow.tap`

In line above:

 - YSlow for PhantomJS script is located at `/tmp/yslow.js`
 - `-i grade` specifies that all rules will be tested
 - `-threshold "B"` specifies the lowest acceptable score for all rules as well as overall score
 - `-f tap` specifies the output format for TAP Jenkins plugin
 - `http://built-url-here` is the reachable built page url of your project
 - `yslow.tap` is the output results in TAP format

Make sure you publish JUnit and/or TAP results report in the post-build actions pointing to the output test results file(s), e.g: yslow.xml, yslow.tap, etc.
