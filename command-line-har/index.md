---
layout: default
title: YSlow - Official Open Source Project Website
heading: YSlow Command Line
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
syntaxhighlight: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: Official YSlow Open Source Project Website. YSlow analyzes web pages and suggests ways to improve their performance based on a set of rules for high performance web pages.}
- {name: author, content: Marcel Duran}
---
YSlow for Command Line runs on [Node.JS](http://nodejs.org/) and requires a [HAR](http://www.softwareishard.com/blog/har-12-spec/) file as input source in order to analyze page performance. It is currently available as a [NPM](http://npmjs.org/) package for installation.

## Installation
```bash
$ npm install yslow -g
```

## Help
```bash
$ yslow --help
```
```
  Usage: yslow [options] [file ...]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -i, --info <info>        specify the information to display/log (basic|grade|stats|comps|all) [basic]
    -f, --format <format>    specify the output results format (json|xml|plain) [json]
    -r, --ruleset <ruleset>  specify the YSlow performance ruleset to be used (ydefault|yslow1|yblog) [ydefault]
    -b, --beacon <url>       specify an URL to log the results
    -d, --dict               include dictionary of results fields
    -v, --verbose            output beacon response information

  Examples:

    yslow file.har
    yslow -i grade -f xml -b http://server.com/beacon file1.har file2.har
    yslow --info all --format plain /tmp/*.har
    yslow -i basic --rulseset yslow1 -d < file.har
    curl example.com/file.har | yslow -i grade -b http://server.com/beacon -v

  More Info:

     https://yslow.org/user-guide/#version2
```

## As a module
```bash
$ node
```
```javascript
> require('fs').readFile('example.com.har', function (err, data) {
    var har = JSON.parse(data),
        YSLOW = require('yslow').YSLOW,
        doc = require('jsdom').jsdom(),
        res = YSLOW.harImporter.run(doc, har, 'ydefault'),
        content = YSLOW.util.getResults(res.context, 'basic');

    console.log(content);
});
{ w: 98725, o: 89, u: 'http%3A%2F%2Fexample.com%2F', r: 9, i: 'ydefault', lt: 981 } 
```
