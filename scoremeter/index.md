---
layout: default
title: YSlow Scoremeter
tagline: Scoremeter shows a breakdown of YSlow grade that your site received. Adjust the sliders to estimate how each action will contribute to your web page’s performance.
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast,mobile,bookmarklet}
- {name: description, content: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites}
- {name: author, content: Marcel Duran}
- {property: og:title, content: YSlow Scoremeter}
- {property: og:type, content: website}
- {property: og:image, content: http://d.yimg.com/jc/ydn/yslow_128x77.png}
- {property: og:url, content: http://yslow.org/scoremeter/}
- {property: og:site_name, content: YSlow Scoremeter}
- {property: fb:admins, content: 100002389604296}
- {property: og:description, content: YSlow Scoremeter allows you to view and adjust all rules scores from page performance analysis}
- {name: twitter:card, content: summary}
- {name: twitter:site, content: @yslow}
- {name: twitter:creator, content: @yslow}
- {name: twitter:url, content: http://yslow.org/scoremeter/}
- {name: twitter:description, content: YSlow Scoremeter allows you to view and adjust all rules scores from page performance analysis}
- {name: twitter:title, content: YSlow Scoremeter}
- {name: twitter:image, content: http://d.yimg.com/jc/ydn/yslow_128x77.png}
install: true
scoremeter: true
---
<div id="yslow" class="yui3-skin-sam  yui-skin-sam">
    <div id="url">
    </div>
    <h2 id="overall">
        <span class="title">Overall Grade</span>
        <span class="score"></span>
        <span class="val"></span>
    </h2>
    <table id="rules">
        <tbody>
            <tr class="header">
                <th colspan="2">score</th>
                <th>rule</th>
                <th>weight</th>
                <th>slider</th>
            </tr>
        </tbody>
    </table>
</div>

[» Check out the YSlow Ruleset Matrix](https://github.com/marcelduran/yslow/wiki/Ruleset-Matrix) to see how the grade is computed.

## Contact Us
YSlow development is discussed in the [GitHub Issue Tracker](../issues).  
General performance questions are discussed in the [Exceptional Performance group](http://tech.groups.yahoo.com/group/exceptional-performance/).
