YSLOW
=====

YSlow analyzes web pages and suggests ways to improve their performance based on a set of [rules for high performance web pages](http://developer.yahoo.com/performance/rules.html).

### Building

All flavors:

    make

Specific flavor:

    make <flavor>

Available flavors:

* **firefox**: Mozilla Firefox add-on
* **chrome**: Google Chrome extension
* **bookmarklet**: Mobile/Any-browser bookmarklet
* **opera**: Opera extension
* **safari**: Apple Safari extension
* **nodejs**: Command Line powered by Node.JS

e.g.:

    make chrome

### Packaging

All flavors:
    
    make pkg

Specific flavor:

    make pkg-<flavor>

e.g:

    make pkg-firefox

More Info
---------

[getyslow.com](http://getyslow.com)

Licensing
---------

Copyright (c) 2012, Yahoo! Inc.  All rights reserved.  
Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
