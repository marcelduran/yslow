---
layout: default
title: YSlow - Official Open Source Project Website
heading: YSlow Ruleset Matrix
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: Official YSlow Open Source Project Website. YSlow analyzes web pages and suggests ways to improve their performance based on a set of rules for high performance web pages.}
- {name: author, content: Marcel Duran}
---
## Matrix Table Keys

1. **Rule**: The YSlow performance rule
1. **Weight**: How this performance rule is weighted in the overall page analyis grade
1. **Points**: Number of points deducted per offender (performance infraction occurance), from a total of 100 per rule
1. **Configs**: How many points/threshold per component will be used for computation
1. **Score Computation**: The formula used to compute the final score per rule
1. **Grades from A to F**: How many components/offenders is necessary to reach grades from A to F

[Download PDF version](https://spreadsheets0.google.com/spreadsheet/pub?hl=en_US&hl=en_US&key=0Amm9wgJ9NFxEdHZTTVlXdWNQNW1GVGZnSTVOM0xDcnc&single=true&gid=0&output=pdf)

<div class="wide-wrapper">

<table border="0" cellpadding="0" cellspacing="0" class="tblGenFixed">
<tbody>
<tr>
<td class="s0">Rule</td>
<td class="s1">Weight</td>
<td class="s1">Points</td>
<td class="s1">Configs</td>
<td class="s1">Score Computation</td>
<td class="s2">(A)<br>90 &lt;= S &lt;= 100</td>
<td class="s3">(B)<br>80 &lt;= S &lt; 90</td>
<td class="s4">(C)<br>70 &lt;= S &lt; 80</td>
<td class="s5">(D)<br>60 &lt;= S &lt; 70</td>
<td class="s6">(E)<br>50 &lt;= S &lt; 60</td>
<td class="s7">(F)<br>0 &lt;= S &lt; 50</td>
</tr>
<tr>
<td class="s8">Make fewer HTTP requests</td>
<td class="s9">8</td>
<td class="s10">js = 3<br>css = 4<br>css images = 3</td>
<td class="s10">max js = 3<br>max css = 2<br>max css images = 6</td>
<td class="s11">(N JS - 3) * 3<br>(N CSS - 2) * 4<br>(N CSS images - 6) * 3</td>
<td class="s11">0 to 6 JS OR<br>0 to 4 CSS OR<br>0 to 9 CSS images</td>
<td class="s11">7 to 9 JS OR<br>5 to 7 CSS OR<br>10 to 12 CSS images</td>
<td class="s11">10 to 13 JS OR<br>8 to 9 CSS OR<br>13 to 16 CSS images</td>
<td class="s11">14 to 16 JS OR<br>10 to 12 CSS OR<br>17 to 19 CSS images</td>
<td class="s11">17 to 19 JS OR<br>13 to 14 CSS OR<br>20 to 22 CSS images</td>
<td class="s11">&gt;= 20 JS OR<br>&gt;= 15 CSS OR<br>&gt;= 23 CSS images</td>
</tr>
<tr>
<td class="s12">Use a CDN</td>
<td class="s13">6</td>
<td class="s13">10</td>
<td class="s14">patterns = CDN hostname RegExp patterns<br>types = js, css, image, cssimage, flash, favicon</td>
<td class="s15">N RegExp mismatches * 10<br>(ignores /favicon.ico)</td>
<td class="s15">0 or 1 of any type</td>
<td class="s15">2 of any type</td>
<td class="s15">3 of any type</td>
<td class="s15">4 of any type</td>
<td class="s15">5 of any type</td>
<td class="s15">&gt;= 6 of any type</td>
</tr>
<tr>
<td class="s16">Avoid empty src or href</td>
<td class="s17">30</td>
<td class="s17">100</td>
<td class="s17">-</td>
<td class="s18">N empty src &lt;img&gt; * 100<br>N empty src &lt;script&gt; * 100<br>N empty href &lt;link rel="stylesheet"&gt; * 100</td>
<td class="s18">0 empty src &lt;img&gt; AND<br>0 empty src &lt;script&gt; AND<br>0 empty href &lt;link rel="stylesheet"&gt;</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s18">&gt;= 1 empty src &lt;img&gt; OR<br>&gt;= 1 empty src &lt;script&gt; OR<br>&gt;= 1 empty href &lt;link rel="stylesheet"&gt;</td>
</tr>
<tr>
<td class="s12">Add Expires headers</td>
<td class="s13">10</td>
<td class="s13">11</td>
<td class="s14">how far = 172800s (2 days)<br>types = js, css, image, cssimage, flash, favicon</td>
<td class="s15">N (unexpired or expiring in &lt; 2 days of any type) * 11</td>
<td class="s15">0 unexpired or expiring in &lt; 2 days of any type</td>
<td class="s15">1 unexpired or expiring in &lt; 2 days of any type</td>
<td class="s15">2 unexpired or expiring in &lt; 2 days of any type</td>
<td class="s15">3 unexpired or expiring in &lt; 2 days of any type</td>
<td class="s15">4 unexpired or expiring in &lt; 2 days of any type</td>
<td class="s15">&gt;= 5 unexpired or expiring in &lt; 2 days of any type</td>
</tr>
<tr>
<td class="s16">Compress components with GZip</td>
<td class="s17">8</td>
<td class="s17">11</td>
<td class="s19">min file size = 500 bytes<br>types = doc, iframe, xhr, js, css</td>
<td class="s18">N (uncompressed or file size &lt; 500b of any type) * 11</td>
<td class="s18">0 uncompressed or file size &lt; 500b of any type</td>
<td class="s18">1 uncompressed or file size &lt; 500b of any type</td>
<td class="s18">2 uncompressed or file size &lt; 500b of any type</td>
<td class="s18">3 uncompressed or file size &lt; 500b of any type</td>
<td class="s18">4 uncompressed or file size &lt; 500b of any type</td>
<td class="s18">&gt;= 5 uncompressed or file size &lt; 500b of any type</td>
</tr>
<tr>
<td class="s12">Put CSS at top</td>
<td class="s13">4</td>
<td class="s13">10</td>
<td class="s13">-</td>
<td class="s15">1 + N CSS link tag on BODY * 10</td>
<td class="s15">0 CSS link tag on BODY</td>
<td class="s15">1 CSS link tag on BODY</td>
<td class="s15">2 CSS link tag on BODY</td>
<td class="s15">3 CSS link tag on BODY</td>
<td class="s15">4 CSS link tag on BODY</td>
<td class="s15">&gt;= 5 CSS link tag on BODY</td>
</tr>
<tr>
<td class="s16">Put JavaScript at bottom</td>
<td class="s17">4</td>
<td class="s17">5</td>
<td class="s17">-</td>
<td class="s18">N JS on HEAD * 5<br>ignores injected,  defered and async JS</td>
<td class="s18">0 to 2 JS on HEAD</td>
<td class="s18">3 or 4 JS on HEAD</td>
<td class="s18">5 or 6 JS on HEAD</td>
<td class="s18">7 or 8 JS on HEAD</td>
<td class="s18">9 or 10 JS on HEAD</td>
<td class="s18">&gt;= 11 JS on HEAD</td>
</tr>
<tr>
<td class="s12">Avoid CSS expressions</td>
<td class="s13">3</td>
<td class="s13">2</td>
<td class="s13">-</td>
<td class="s15">N expressions on CSS links or inline STYLE * 2</td>
<td class="s15">0 to 5 expressions on CSS or inline STYLE</td>
<td class="s15">6 to 10 expressions on CSS or inline STYLE</td>
<td class="s15">11 to 15 expressions on CSS or inline STYLE</td>
<td class="s15">16 to 20 expressions on CSS or inline STYLE</td>
<td class="s15">21 to 25 expressions on CSS or inline STYLE</td>
<td class="s15">&gt;= 26 expressions on CSS or inline STYLE</td>
</tr>
<tr>
<td class="s16">Make JavaScript and CSS external</td>
<td class="s17">4</td>
<td class="s19">n/a</td>
<td class="s17">-</td>
<td class="s18">none</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
</tr>
<tr>
<td class="s12">Reduce DNS lookups</td>
<td class="s13">3</td>
<td class="s13">5</td>
<td class="s14">max domains = 4</td>
<td class="s15">N domains &gt; 4 AND<br>(N domains - 4) * 5</td>
<td class="s15">0 to 6 domains</td>
<td class="s15">7 or 8 domains</td>
<td class="s15">9 or 10 domains</td>
<td class="s15">11 or 12 domains</td>
<td class="s15">13 or 14 domains</td>
<td class="s15">&gt;= 15 domains</td>
</tr>
<tr>
<td class="s16">Minify JavaScript and CSS</td>
<td class="s17">4</td>
<td class="s17">10</td>
<td class="s19">types = js, css</td>
<td class="s18">N (unminified JS or CSS external or inline) * 10</td>
<td class="s18">0 or 1 unminified component</td>
<td class="s18">2 unminified components</td>
<td class="s18">3 unminified components</td>
<td class="s18">4 unminified components</td>
<td class="s18">5 unminified components</td>
<td class="s18">&gt;= 6 unminified components</td>
</tr>
<tr>
<td class="s12">Avoid URL redirects</td>
<td class="s13">4</td>
<td class="s13">10</td>
<td class="s13">-</td>
<td class="s15">N redirects * 10</td>
<td class="s15">0 or 1 redirect</td>
<td class="s15">2 redirects</td>
<td class="s15">3 redirects</td>
<td class="s15">4 redirects</td>
<td class="s15">5 redirects</td>
<td class="s15">&gt;= 6 redirects</td>
</tr>
<tr>
<td class="s16">Remove duplicate JavaScript and CSS</td>
<td class="s17">4</td>
<td class="s17">5</td>
<td class="s19">types = js, css</td>
<td class="s18">N (duplicated JS or CSS) * 5</td>
<td class="s18">0 to 2 duplicated JS or CSS </td>
<td class="s18">3 or 4 duplicated JS or CSS </td>
<td class="s18">5 or 6 duplicated JS or CSS</td>
<td class="s18">7 or 8 duplicated JS or CSS</td>
<td class="s18">9 or 10 duplicated JS or CSS</td>
<td class="s18">&gt;= 11 duplicated JS or CSS</td>
</tr>
<tr>
<td class="s12">Configure ETags</td>
<td class="s13">2</td>
<td class="s13">11</td>
<td class="s14">types = js, css, image, cssimage, flash, favicon</td>
<td class="s15">N bad etag of any type * 11</td>
<td class="s15">0 bad etag of any type</td>
<td class="s15">1 bad etag of any type</td>
<td class="s15">2 bad etags of any type</td>
<td class="s15">3 bad etags of any type</td>
<td class="s15">4 bad etags of any type</td>
<td class="s15">&gt;= 5 bad etags of any type</td>
</tr>
<tr>
<td class="s16">Make AJAX cacheable</td>
<td class="s17">4</td>
<td class="s17">5</td>
<td class="s19">min cache time = 3600s</td>
<td class="s18">N (uncached or expiring in &lt; 3600s) XHR * 5</td>
<td class="s18">0 to 2 uncacheable XHR</td>
<td class="s18">3 or 4 uncacheable XHR</td>
<td class="s18">5 or 6 uncacheable XHR</td>
<td class="s18">7 or 8 uncacheable XHR</td>
<td class="s18">9 or 10 uncacheable XHR</td>
<td class="s18">&gt;= 11 uncacheable XHR</td>
</tr>
<tr>
<td class="s12">Use GET for AJAX requests</td>
<td class="s13">3</td>
<td class="s13">5</td>
<td class="s13">-</td>
<td class="s15">N XHRs not using GET * 5</td>
<td class="s15">0 to 2 XHRs not using GET</td>
<td class="s15">3 or 4 XHRs not using GET</td>
<td class="s15">5 or 6 XHRs not using GET</td>
<td class="s15">7 or 8 XHRs not using GET</td>
<td class="s15">9 or 10 XHRs not using GET</td>
<td class="s15">&gt;= 11 XHRs not using GET</td>
</tr>
<tr>
<td class="s16">Reduce the number of DOM elements</td>
<td class="s17">3</td>
<td class="s17">10</td>
<td class="s19">range = 250<br>max dom = 900</td>
<td class="s18">N DOM elements &gt; 900 AND<br>(N DOM elements - 900) / 250 * 10</td>
<td class="s18">0 to 1150 DOM elements</td>
<td class="s18">1151 to 1400 DOM elements</td>
<td class="s18">1401 to 1650 DOM elements</td>
<td class="s18">1651 to 1900 DOM elements</td>
<td class="s18">1901 to 2150 DOM elements</td>
<td class="s18">&gt;= 2151 DOM elements</td>
</tr>
<tr>
<td class="s12">Avoid HTTP 404 (Not Found) error</td>
<td class="s13">4</td>
<td class="s13">5</td>
<td class="s14">types = js, css, image, cssimage, flash, favicon, xhr</td>
<td class="s15">N 404 * 5</td>
<td class="s15">0 to 2 404</td>
<td class="s15">3 or 4 404</td>
<td class="s15">5 or 6 404</td>
<td class="s15">7 or 8 404</td>
<td class="s15">9 or 10 404</td>
<td class="s15">&gt;= 11 404</td>
</tr>
<tr>
<td class="s16">Reduce cookie size</td>
<td class="s17">3</td>
<td class="s17">10</td>
<td class="s19">max cookie size = 1000</td>
<td class="s18">cookie size &gt; 1000 AND<br>1 + (cookie size / 1000) * 10</td>
<td class="s18">0 to 1000 bytes cookies</td>
<td class="s18">1001 to 1900 bytes cookies</td>
<td class="s18">1901 to 2900 bytes cookies</td>
<td class="s18">2901 to 3900 bytes cookies</td>
<td class="s18">3901 to 4900 bytes cookies</td>
<td class="s18">&gt;= 4901 bytes cookies</td>
</tr>
<tr>
<td class="s12">Use cookie-free domains</td>
<td class="s13">3</td>
<td class="s13">5</td>
<td class="s14">types = js, css, image, cssimage, flash, favicon</td>
<td class="s15">N (components of any type with cookies of any size) * 5<br>ignores /favicon.ico</td>
<td class="s15">0 to 2 components with cookie</td>
<td class="s15">3 or 4 components with cookie</td>
<td class="s15">5 or 6 components with cookie</td>
<td class="s15">7 or 8 components with cookie</td>
<td class="s15">9 or 10 components with cookie</td>
<td class="s15">&gt;= 11 components with cookie</td>
</tr>
<tr>
<td class="s16">Avoid AlphaImageLoader filter</td>
<td class="s17">4</td>
<td class="s17">5</td>
<td class="s19">half points = 2</td>
<td class="s18">N alpha filters * 5 + M _hack alpha filters * 2</td>
<td class="s18">0 to 2 alpha filters OR<br>0 to 5 _hack alpha filters</td>
<td class="s18">3 or 4 alpha filters OR<br>6 to 10 _hack alpha filters</td>
<td class="s18">5 or 6 alpha filters OR<br>11 to 15 _hack alpha filters</td>
<td class="s18">7 or 8 alpha filters OR<br>16 to 20 _hack alpha filters</td>
<td class="s18">9 or 10 alpha filters OR<br>21 to 25 _hack alpha filters</td>
<td class="s18">&gt;= 11 alpha filters OR<br>&gt;= 26 _hack alpha filters</td>
</tr>
<tr>
<td class="s12">Do not scale images in HTML</td>
<td class="s13">3</td>
<td class="s13">5</td>
<td class="s13">-</td>
<td class="s15">N (images scaled down width or height) * 5 </td>
<td class="s15">0 to 2 scaled down images</td>
<td class="s15">3 or 4 scaled down images</td>
<td class="s15">5 or 6 scaled down images</td>
<td class="s15">7 or 8 scaled down images</td>
<td class="s15">9 or 10 scaled down images</td>
<td class="s15">&gt;= 11 scaled down images</td>
</tr>
<tr>
<td class="s16">Make favicon small and cacheable</td>
<td class="s17">2</td>
<td class="s17">5</td>
<td class="s19">size = 2000b<br>min cache time = 3600s</td>
<td class="s18">Favicon 404 not found = 5<br>Favicon size &gt; 2000b = 5<br>No favicon expiration or expiration &lt; 3600s = 5</td>
<td class="s18">Favicon is found AND<br>Any favicon size<br>Any expiration or not<br>OR<br>Favicon is not found AND<br>Any expiration or not (usually not)</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
<td class="s17">-</td>
</tr>
</tbody></table>

</div>
