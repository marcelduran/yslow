---
layout: default
title: YSlow - Official Open Source Project Website
heading: YSlow Node Server
tagline: YSlow analyzes web pages and why they're slow based on Yahoo!'s rules for high performance web sites
install: true
syntaxhighlight: true
metadata:
- {name: keywords, content: performance,analysis,tool,wpo,optimization,speed,fast}
- {name: description, content: Official YSlow Open Source Project Website. YSlow analyzes web pages and suggests ways to improve their performance based on a set of rules for high performance web pages.}
- {name: author, content: Marcel Duran}
---
[Node.js](http://nodejs.org/) Server is a YSlow [Command Line (HAR)](../command-line-har/) variation powered by [Express](http://expressjs.com) that provides RESTful API. It also uses [HAR](http://www.softwareishard.com/blog/har-12-spec/) files as input source in order to analyze page performance, however unlike Command Line version, HAR can be:

* a JSON string
* a local file to be uploaded
* a file in a remote URL

<a name="installation">
## Installation
</a>

YSlow Node.js Server requires:

1. [Node.js](http://nodejs.org/) obviously
1. [Express](http://expressjs.com), e.g: `$ npm install express`
1. YSlow [Command Line (HAR)](../command-line-har/), e.g: `$ npm install yslow`

Once all requirements are installed, you can either:

* [build from source](https://github.com/marcelduran/yslow): `make nodeserver`, or
* [download built server script](../yslow-server-3.1.2.js)

To run Node.js Server:

```bash
$ node yslow-server.js <port>
```

<a name="help">
## Help
</a>

```bash
$ node yslow-server.js 8080
$ curl localhost:8080
```

```
{
  help: {
    usage: "http://localhost:8080/?[options][&har=(<HAR as JSON string> | <URL to fetch HAR from> | <HAR file to upload>)]",
    options: [
      "h | help:                 output usage information",
      "V | version:              output the version number",
      "i | info <info>:          specify the information to display/log (basic|grade|stats|comps|all) [basic]",
      "f | format <format>:      specify the output results format (json|xml|plain) [json]",
      "r | ruleset <ruleset>:    specify the YSlow performance ruleset to be used (ydefault|yslow1|yblog) [ydefault]",
      "b | beacon <url>:         specify an URL to log the results",
      "d | dict <true|false>:    include dictionary of results fields [false]",
      "v | verbose <true|false>: output beacon response information [false]"
    ],
    examples: [
      "http://localhost:8080/?har=www.example.com/foo.har",
      "curl 'http://localhost:8080/?info=grade&format=plain' -F 'har=@localfile.har'",
      "curl 'http://localhost:8080/?ruleset=yblog' -d 'har={"log":{"version":"1.1", ... }}'",
      "http://localhost:8080/?info=all&dict=true&beacon=www.beaconserver.com&verbose=true",
      "http://localhost:8080/?har=www.webpagetest.org%2Fexport.php%3Ftest%3DTEST_ID&i=grade&b=www.showslow.com%2Fbeacon%2Fyslow%2F"
    ]
  },
  error: { }
}
```

<a name="examples">
## Examples
</a>
Play with [live demo](http://yslow.aws.af.cm/) hosted at [AppFog](http://appfog.com/)
