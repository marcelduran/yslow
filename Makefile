# Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.

# source directories
SRC := src
SRC_COMMON := $(SRC)/common
SRC_YUI := $(SRC)/yui/3.3.0
SRC_FIREFOX := $(SRC)/firefox
SRC_CHROME := $(SRC)/chrome
SRC_BOOKMARKLET := $(SRC)/bookmarklet
SRC_HAR := $(SRC)/har
SRC_NODEJS := $(SRC)/nodejs
SRC_OPERA := $(SRC)/opera
SRC_SAFARI := $(SRC)/safari
SRC_WSH := $(SRC)/wsh
SRC_RHINO := $(SRC)/rhino
SRC_PHANTOMJS := $(SRC)/phantomjs
SRC_NODESERVER := $(SRC)/nodeserver

# build directories
BUILD := build
BUILD_FIREFOX := $(BUILD)/firefox
BUILD_CHROME := $(BUILD)/chrome
BUILD_YUI := $(BUILD)/yui
BUILD_BOOKMARKLET := $(BUILD)/bookmarklet
BUILD_HAR := $(BUILD)/har
BUILD_NODEJS := $(BUILD)/nodejs
BUILD_OPERA := $(BUILD)/opera
BUILD_SAFARI_ROOT := $(BUILD)/safari
BUILD_SAFARI := $(BUILD_SAFARI_ROOT)/yslow.safariextension
BUILD_WSH := $(BUILD)/wsh
BUILD_RHINO := $(BUILD)/rhino
BUILD_PHANTOMJS := $(BUILD)/phantomjs
BUILD_NODESERVER := $(BUILD)/nodeserver

# package directories
PKG := pkg
PKG_FIREFOX := $(PKG)/firefox
PKG_CHROME := $(PKG)/chrome
PKG_BOOKMARKLET := $(PKG)/bookmarklet
PKG_NODEJS := $(PKG)/nodejs
PKG_OPERA := $(PKG)/opera
PKG_SAFARI := $(PKG)/safari
PKG_WSH := $(PKG)/wsh
PKG_RHINO := $(PKG)/rhino
PKG_PHANTOMJS := $(PKG)/phantomjs
PKG_NODESERVER := $(PKG)/nodeserver

# file names / versions / licenses
BOOKMARKLET_YSLOW_JS := yslow-files-bookmarklet.js
BOOKMARKLET_YSLOW_CSS := yslow-files-style.css
BOOKMARKLET_JS := yslow-bookmarklet.js
BOOKMARKLET_CSS := yslow-style.css
YSLOW_VERSION := $(shell egrep '^Version' CHANGELOG | head -1 | awk '{print $$2;}')
ifdef config
    BM_CONFIG = $(config)
else
    BM_CONFIG = config-local.js
endif
YUI_LICENSE := $(SRC_YUI)/license
YSLOW_LICENSE := $(SRC_COMMON)/license

# lib/tools directories/files
YUI_LIB := $(SRC_YUI)/build
IMG := img
YUICOMPRESSOR := `which yuicompressor`
TAC = $(shell which tac || echo 'tail -r')

.PHONY: bookmarklet chrome firefox har nodejs opera safari wsh rhino phantomjs nodeserver

all: show-version bookmarklet chrome firefox har nodejs opera safari wsh rhino phantomjs nodeserver

clean: clean-bookmarklet clean-chrome clean-firefox clean-har clean-nodejs clean-opera clean-safari clean-wsh clean-rhino clean-phantomjs clean-nodeserver
	@if [ -d $(BUILD) ]; then rmdir $(BUILD); fi

pkg: pkg-bookmarklet pkg-chrome pkg-firefox pkg-nodejs pkg-opera pkg-safari pkg-wsh pkg-rhino pkg-phantomjs pkg-nodeserver

show-version:
	@echo "YSLOW version: $(YSLOW_VERSION)"

yui:
	@echo "building YUI..."
	@if [ ! -d $(BUILD_YUI) ]; then mkdir -p $(BUILD_YUI); fi
	@cat $(YUI_LIB)/yui/yui-base$(YUI_MODE).js \
            $(YUI_LIB)/yui/features$(YUI_MODE).js \
            $(YUI_LIB)/yui/get$(YUI_MODE).js \
            $(YUI_LIB)/oop/oop$(YUI_MODE).js \
            $(YUI_LIB)/jsonp/jsonp$(YUI_MODE).js \
            $(YUI_LIB)/jsonp/jsonp-url$(YUI_MODE).js \
            $(YUI_LIB)/yql/yql$(YUI_MODE).js \
            $(YUI_LIB)/event-custom/event-custom-base$(YUI_MODE).js \
            $(YUI_LIB)/event/event-base$(YUI_MODE).js \
            $(YUI_LIB)/dom/dom-base$(YUI_MODE).js \
            $(YUI_LIB)/dom/dom-style$(YUI_MODE).js \
            $(YUI_LIB)/dom/selector-native$(YUI_MODE).js \
            $(YUI_LIB)/dom/selector-css2$(YUI_MODE).js \
            $(YUI_LIB)/node/node-base$(YUI_MODE).js \
            $(YUI_LIB)/node/node-style$(YUI_MODE).js \
            > $(BUILD_YUI)/yui$(YUI_MODE).js
	@echo "done"

bookmarklet-files:
	@echo "building BOOKMARKLET files..."
	@if [ ! -d $(BUILD_BOOKMARKLET) ]; then mkdir -p $(BUILD_BOOKMARKLET); fi
	@cat $(SRC_COMMON)/yslow.js \
            $(SRC_COMMON)/version.js \
            $(SRC_COMMON)/componentSet.js \
            $(SRC_COMMON)/component.js \
            $(SRC_COMMON)/component-bm-ch.js \
            $(SRC_COMMON)/controller.js \
            $(SRC_COMMON)/util.js \
            $(SRC_COMMON)/doc.js \
            $(SRC_COMMON)/rules.js \
            $(SRC_COMMON)/rulesets/*.js \
            $(SRC_COMMON)/resultset.js \
            $(SRC_COMMON)/view.js \
            $(SRC_COMMON)/context.js \
            $(SRC_COMMON)/renderers.js \
            $(SRC_COMMON)/peeler.js \
            $(SRC_COMMON)/peeler-bm-ch-ph.js \
            $(SRC_BOOKMARKLET)/$(BM_CONFIG) \
            $(SRC_BOOKMARKLET)/controller.js | \
            sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ | \
            sed s/{{BOOKMARKLET_JS}}/$(BOOKMARKLET_JS)/ | \
            sed s/{{BOOKMARKLET_CSS}}/$(BOOKMARKLET_CSS)/ \
            > $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_JS)
	@cat $(SRC_COMMON)/yslow.css \
            $(SRC_BOOKMARKLET)/yslow.css \
            $(SRC_COMMON)/tabview.css \
            > $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_CSS)
	@echo "done"

bookmarklet: yui bookmarklet-files
	@echo "merging YUI and BOOKMARKLET..."
	@cat $(BUILD_YUI)/yui$(YUI_MODE).js \
            $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_JS) \
            > $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_JS)
	@cp $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_CSS) \
            $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_CSS)
	@rm $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_JS) \
            $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_CSS)
	@echo "done"

chrome:
	@echo "building CHROME EXTENSION..."
	@if [ ! -d $(BUILD_CHROME) ]; then mkdir -p $(BUILD_CHROME); fi
	@cp $(SRC_CHROME)/128.png \
            $(SRC_CHROME)/16.png \
            $(SRC_CHROME)/32.png \
            $(SRC_CHROME)/48.png \
            $(SRC_CHROME)/background.html \
            $(SRC_CHROME)/options.html \
            $(SRC_CHROME)/content.js \
            $(SRC_CHROME)/pref-init.js \
            $(SRC_CHROME)/controller.js \
            $(SRC_CHROME)/icon.png \
            $(SRC_CHROME)/yslow.html \
            $(BUILD_CHROME)/
	@cat $(SRC_COMMON)/yslow.js \
            $(SRC_COMMON)/version.js \
            $(SRC_COMMON)/componentSet.js \
            $(SRC_COMMON)/component.js \
            $(SRC_COMMON)/component-bm-ch.js \
            $(SRC_COMMON)/controller.js \
            $(SRC_COMMON)/util.js \
            $(SRC_COMMON)/doc.js \
            $(SRC_COMMON)/rules.js \
            $(SRC_COMMON)/rulesets/*.js \
            $(SRC_COMMON)/resultset.js \
            $(SRC_COMMON)/view.js \
            $(SRC_COMMON)/context.js \
            $(SRC_COMMON)/renderers.js \
            $(SRC_COMMON)/peeler.js \
            $(SRC_COMMON)/peeler-bm-ch-ph.js \
            $(SRC_CHROME)/yslow-chrome-pref.js | \
            sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            > $(BUILD_CHROME)/yslow-chrome.js
	@cat $(SRC_CHROME)/manifest.json | \
            sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            > $(BUILD_CHROME)/manifest.json
	@cat $(SRC_COMMON)/yslow.css \
            $(SRC_COMMON)/tabview.css \
            > $(BUILD_CHROME)/style.css
	@echo "done"

firefox:
	@echo "building FIREFOX ADD-ON..."
	@if [ ! -d $(BUILD_FIREFOX)/chrome/content/yslow/lib ]; then mkdir -p $(BUILD_FIREFOX)/chrome/content/yslow/lib; fi
	@if [ ! -d $(BUILD_FIREFOX)/chrome/content/yslow/img ]; then mkdir -p $(BUILD_FIREFOX)/chrome/content/yslow/img; fi
	@if [ ! -d $(BUILD_FIREFOX)/chrome/skin ]; then mkdir -p $(BUILD_FIREFOX)/chrome/skin; fi
	@if [ ! -d $(BUILD_FIREFOX)/defaults/preferences ]; then mkdir -p $(BUILD_FIREFOX)/defaults/preferences; fi
	@cp $(SRC_FIREFOX)/chrome.manifest \
            $(SRC_FIREFOX)/license.txt \
            $(BUILD_FIREFOX)/
	@cp $(SRC_FIREFOX)/defaults/preferences/yslow.js \
            $(BUILD_FIREFOX)/defaults/preferences/
	@cp $(SRC_FIREFOX)/chrome/skin/yslow.css \
            $(BUILD_FIREFOX)/chrome/skin/
	@cp $(SRC_FIREFOX)/chrome/content/bindings.xml \
            $(SRC_FIREFOX)/chrome/content/browser.xul \
            $(SRC_FIREFOX)/chrome/content/exporter.js \
            $(SRC_FIREFOX)/chrome/content/platform-ff.js \
            $(SRC_FIREFOX)/chrome/content/yslow-ff-pref.js \
            $(SRC_FIREFOX)/chrome/content/yslow-firebug-net.js \
            $(SRC_FIREFOX)/chrome/content/yslow-firebug.js \
            $(SRC_FIREFOX)/chrome/content/yslow-firefox-net.js \
            $(SRC_FIREFOX)/chrome/content/yslow-firefox.js \
            $(SRC_FIREFOX)/chrome/content/yslowOptions.xul \
            $(SRC_FIREFOX)/chrome/content/yslowOverlay.xul \
            $(BUILD_FIREFOX)/chrome/content/
	@cp $(SRC_FIREFOX)/chrome/content/yslow/ad_rules.js \
            $(SRC_FIREFOX)/chrome/content/yslow/jslintwrapper.js \
            $(SRC_FIREFOX)/chrome/content/yslow/net.js \
            $(SRC_FIREFOX)/chrome/content/yslow/printable.css \
            $(SRC_FIREFOX)/chrome/content/yslow/tool.css \
            $(SRC_FIREFOX)/chrome/content/yslow/tools.js \
            $(BUILD_FIREFOX)/chrome/content/yslow/
	@cp $(SRC_FIREFOX)/chrome/content/yslow/lib/beautify.js \
            $(SRC_FIREFOX)/chrome/content/yslow/lib/cssmin.js \
            $(SRC_FIREFOX)/chrome/content/yslow/lib/fulljslint.js \
            $(SRC_FIREFOX)/chrome/content/yslow/lib/fulljsmin.js \
            $(SRC_FIREFOX)/chrome/content/yslow/lib/json2.js \
            $(BUILD_FIREFOX)/chrome/content/yslow/lib/
	@cp $(IMG)/logo_32x32.png \
            $(BUILD_FIREFOX)/chrome/content/yslow/img/
	@cp $(SRC_COMMON)/yslow.js \
            $(SRC_COMMON)/componentSet.js \
            $(SRC_COMMON)/controller.js \
            $(SRC_COMMON)/util.js \
            $(SRC_COMMON)/doc.js \
            $(SRC_COMMON)/resultset.js \
            $(SRC_COMMON)/context.js \
            $(SRC_COMMON)/renderers.js \
            $(SRC_COMMON)/yslow.css \
            $(BUILD_FIREFOX)/chrome/content/yslow/
	@cat $(SRC_COMMON)/rules.js \
            $(SRC_COMMON)/rulesets/*.js \
            > $(BUILD_FIREFOX)/chrome/content/yslow/rules.js
	@cat $(SRC_COMMON)/component.js \
            $(SRC_FIREFOX)/chrome/content/yslow/component.js \
            > $(BUILD_FIREFOX)/chrome/content/yslow/component.js
	@cat $(SRC_COMMON)/version.js | \
            sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            > $(BUILD_FIREFOX)/chrome/content/yslow/version.js
	@cat $(SRC_COMMON)/peeler.js \
            $(SRC_FIREFOX)/chrome/content/yslow/peeler.js \
            > $(BUILD_FIREFOX)/chrome/content/yslow/peeler.js
	@cat $(SRC_COMMON)/view.js \
            $(SRC_FIREFOX)//chrome/content/view.js \
            > $(BUILD_FIREFOX)/chrome/content/view.js
	@cat $(SRC_FIREFOX)/install.rdf | \
            sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            > $(BUILD_FIREFOX)/install.rdf
	@cp $(SRC_COMMON)/yslow.css \
            $(SRC_COMMON)/tabview.css \
            $(BUILD_FIREFOX)/chrome/content/yslow/
	@echo "done"

har:
	@echo "building HAR IMPORTER..."
	@if [ ! -d $(BUILD_HAR) ]; then mkdir -p $(BUILD_HAR); fi
	@cat $(SRC_COMMON)/yslow.js \
            $(SRC_COMMON)/version.js \
            $(SRC_COMMON)/componentSet.js \
            $(SRC_COMMON)/component.js \
            $(SRC_HAR)/component.js \
            $(SRC_COMMON)/context.js \
            $(SRC_COMMON)/controller.js \
            $(SRC_COMMON)/util.js \
            $(SRC_COMMON)/doc.js \
            $(SRC_COMMON)/rules.js \
            $(SRC_COMMON)/rulesets/*.js \
            $(SRC_COMMON)/resultset.js \
            $(SRC_COMMON)/peeler.js \
            $(SRC_HAR)/har-importer.js \
            $(SRC_HAR)/export.js | \
            sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            > $(BUILD_HAR)/yslow-har.js
	@echo "done"

nodejs: har
	@echo "building NODE.JS HAR IMPORTER..."
	@if [ ! -d $(BUILD_NODEJS)/node_modules ]; then mkdir -p $(BUILD_NODEJS)/node_modules; fi
	@cp $(BUILD_HAR)/yslow-har.js \
            $(BUILD_NODEJS)/node_modules/yslow.js
	@cat $(SRC_NODEJS)/executable \
            $(SRC_NODEJS)/controller.js \
            > $(BUILD_NODEJS)/yslow
	@chmod +x $(BUILD_NODEJS)/yslow
	@echo "done"

opera:
	@echo "building OPERA EXTENSION..."
	@if [ ! -d $(BUILD_OPERA) ]; then mkdir -p $(BUILD_OPERA); fi
	@if [ ! -d $(BUILD_OPERA)/images ]; then mkdir -p $(BUILD_OPERA)/images; fi
	@if [ ! -d $(BUILD_OPERA)/includes ]; then mkdir -p $(BUILD_OPERA)/includes; fi
	@cp $(SRC_OPERA)/background.js \
            $(SRC_OPERA)/index.html \
            $(BUILD_OPERA)/
	@cp $(SRC_OPERA)/images/icon_18.png \
            $(SRC_OPERA)/images/icon_64.png \
            $(BUILD_OPERA)/images/
	@cp $(SRC_OPERA)/includes/injected.js \
            $(BUILD_OPERA)/includes/
	@sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            $(SRC_OPERA)/config.xml \
            > $(BUILD_OPERA)/config.xml
	@echo "done"

safari:
	@echo "building SAFARI EXTENSION..."
	@if [ ! -d $(BUILD_SAFARI) ]; then mkdir -p $(BUILD_SAFARI); fi
	@cp $(SRC_SAFARI)/16.png \
            $(SRC_SAFARI)/Icon-32.png \
            $(SRC_SAFARI)/Icon-48.png \
            $(SRC_SAFARI)/Settings.plist \
            $(SRC_SAFARI)/global.html \
            $(SRC_SAFARI)/injected.js \
            $(BUILD_SAFARI)/
	@sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            $(SRC_SAFARI)/Info.plist \
            > $(BUILD_SAFARI)/Info.plist
	@echo "done"

wsh: har
	@echo "building WSH HAR IMPORTER..."
	@if [ ! -d $(BUILD_WSH) ]; then mkdir -p $(BUILD_WSH); fi
	@cat $(SRC_WSH)/json2.js \
            $(BUILD_HAR)/yslow-har.js \
            $(SRC_WSH)/controller.js \
            > $(BUILD_WSH)/yslow.js
	@echo "done"

rhino: har
	@echo "building RHINO HAR IMPORTER..."
	@if [ ! -d $(BUILD_RHINO)/lib ]; then mkdir -p $(BUILD_RHINO)/lib; fi
	@cp $(BUILD_HAR)/yslow-har.js \
            $(BUILD_RHINO)/lib/yslow.js
	@cp $(SRC_RHINO)/env.rhino.1.2.js \
            $(SRC_RHINO)/blank.html \
            $(BUILD_RHINO)/lib/
	@cp $(SRC_RHINO)/controller.js \
            $(BUILD_RHINO)/yslow.js
	@echo "done"

phantomjs:
	@echo "building PHANTOMJS..."
	@if [ ! -d $(BUILD_PHANTOMJS) ]; then mkdir -p $(BUILD_PHANTOMJS); fi
	@(sed '/YSLOW HERE/q;' $(SRC_PHANTOMJS)/controller.js; \
        cat $(SRC_COMMON)/yslow.js \
            $(SRC_COMMON)/version.js \
            $(SRC_COMMON)/componentSet.js \
            $(SRC_COMMON)/component.js \
            $(SRC_PHANTOMJS)/component.js \
            $(SRC_COMMON)/controller.js \
            $(SRC_COMMON)/util.js \
            $(SRC_COMMON)/doc.js \
            $(SRC_COMMON)/rules.js \
            $(SRC_COMMON)/rulesets/*.js \
            $(SRC_COMMON)/resultset.js \
            $(SRC_COMMON)/view.js \
            $(SRC_COMMON)/context.js \
            $(SRC_COMMON)/renderers.js \
            $(SRC_COMMON)/peeler.js \
            $(SRC_COMMON)/peeler-bm-ch-ph.js; \
        $(TAC) $(SRC_PHANTOMJS)/controller.js | sed '/YSLOW HERE/q' | $(TAC) ) | sed '/YSLOW HERE/d' \
        > $(BUILD_PHANTOMJS)/yslow.js
	@sed -i -e "s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/" $(BUILD_PHANTOMJS)/yslow.js
	@echo "done"

nodeserver:
	@echo "building NODEJS SERVER..."
	@if [ ! -d $(BUILD_NODESERVER) ]; then mkdir -p $(BUILD_NODESERVER); fi
	@cp $(SRC_NODESERVER)/server.js \
		$(BUILD_NODESERVER)/yslow-server.js
	@if [ -n "$(shell which npm)" ]; then \
		if [ -z "$(shell npm list | egrep ' yslow@')" ]; then \
			echo "YSlow NodeJS Sserver requires 'yslow'"; \
			npm install yslow; \
		fi; \
		if [ -z "$(shell npm list | egrep ' express@')" ]; then \
			echo "YSlow NodeJS Sserver requires 'express'"; \
			npm install express; \
		fi \
	else \
		echo "WARNING: YSlow NodeJS Server requires NPM for 'yslow' and 'express' packages"; \
	fi
	@echo "done"

clean-yui:
	@echo "cleaning YUI..."
	@if [ -f $(BUILD_YUI)/yui.js ]; then rm $(BUILD_YUI)/yui.js; fi
	@if [ -f $(BUILD_YUI)/yui-min.js ]; then rm $(BUILD_YUI)/yui-min.js; fi
	@if [ -d $(BUILD_YUI) ]; then rmdir $(BUILD_YUI); fi
	@echo "done"

clean-bookmarklet: clean-yui
	@echo "cleaning BOOKMARKLET..."
	@if [ -f $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_JS) ]; then rm $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_JS); fi
	@if [ -f $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_JS) ]; then rm $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_JS); fi
	@if [ -f $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_CSS) ]; then rm $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_CSS); fi
	@if [ -d $(BUILD_BOOKMARKLET) ]; then rmdir $(BUILD_BOOKMARKLET); fi
	@echo "done"

clean-chrome:
	@echo "cleaning CHROME EXTENSION..."
	@if [ -f $(BUILD_CHROME)/128.png ]; then rm $(BUILD_CHROME)/128.png; fi
	@if [ -f $(BUILD_CHROME)/16.png ]; then rm $(BUILD_CHROME)/16.png; fi
	@if [ -f $(BUILD_CHROME)/32.png ]; then rm $(BUILD_CHROME)/32.png; fi
	@if [ -f $(BUILD_CHROME)/48.png ]; then rm $(BUILD_CHROME)/48.png; fi
	@if [ -f $(BUILD_CHROME)/background.html ]; then rm $(BUILD_CHROME)/background.html; fi
	@if [ -f $(BUILD_CHROME)/options.html ]; then rm $(BUILD_CHROME)/options.html; fi
	@if [ -f $(BUILD_CHROME)/content.js ]; then rm $(BUILD_CHROME)/content.js; fi
	@if [ -f $(BUILD_CHROME)/pref-init.js ]; then rm $(BUILD_CHROME)/pref-init.js; fi
	@if [ -f $(BUILD_CHROME)/controller.js ]; then rm $(BUILD_CHROME)/controller.js; fi
	@if [ -f $(BUILD_CHROME)/icon.png ]; then rm $(BUILD_CHROME)/icon.png; fi
	@if [ -f $(BUILD_CHROME)/yslow.html ]; then rm $(BUILD_CHROME)/yslow.html; fi
	@if [ -f $(BUILD_CHROME)/yslow-chrome.js ]; then rm $(BUILD_CHROME)/yslow-chrome.js; fi
	@if [ -f $(BUILD_CHROME)/manifest.json ]; then rm $(BUILD_CHROME)/manifest.json; fi
	@if [ -f $(BUILD_CHROME)/style.css ]; then rm $(BUILD_CHROME)/style.css; fi
	@if [ -d $(BUILD_CHROME) ]; then rmdir $(BUILD_CHROME); fi
	@echo "done"

clean-firefox:
	@echo "cleaning FIREFOX ADD-ON..."
	@if [ -f $(BUILD_FIREFOX)/chrome.manifest ]; then rm $(BUILD_FIREFOX)/chrome.manifest; fi
	@if [ -f $(BUILD_FIREFOX)/license.txt ]; then rm $(BUILD_FIREFOX)/license.txt; fi
	@if [ -f $(BUILD_FIREFOX)/defaults/preferences/yslow.js ]; then rm $(BUILD_FIREFOX)/defaults/preferences/yslow.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/skin/yslow.css ]; then rm $(BUILD_FIREFOX)/chrome/skin/yslow.css; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/bindings.xml ]; then rm $(BUILD_FIREFOX)/chrome/content/bindings.xml; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/browser.xul ]; then rm $(BUILD_FIREFOX)/chrome/content/browser.xul; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/exporter.js ]; then rm $(BUILD_FIREFOX)/chrome/content/exporter.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/platform-ff.js ]; then rm $(BUILD_FIREFOX)/chrome/content/platform-ff.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow-ff-pref.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow-ff-pref.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow-firebug-net.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow-firebug-net.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow-firebug.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow-firebug.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow-firefox-net.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow-firefox-net.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow-firefox.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow-firefox.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslowOptions.xul ]; then rm $(BUILD_FIREFOX)/chrome/content/yslowOptions.xul; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslowOverlay.xul ]; then rm $(BUILD_FIREFOX)/chrome/content/yslowOverlay.xul; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/ad_rules.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/ad_rules.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/jslintwrapper.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/jslintwrapper.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/net.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/net.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/printable.css ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/printable.css; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/tool.css ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/tool.css; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/tools.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/tools.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/lib/beautify.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/lib/beautify.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/lib/cssmin.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/lib/cssmin.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/lib/fulljslint.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/lib/fulljslint.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/lib/fulljsmin.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/lib/fulljsmin.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/lib/json2.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/lib/json2.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/img/logo_32x32.png ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/img/logo_32x32.png; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/yslow.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/yslow.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/componentSet.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/componentSet.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/component.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/component.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/controller.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/controller.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/util.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/util.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/doc.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/doc.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/rules.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/rules.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/resultset.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/resultset.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/context.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/context.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/renderers.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/renderers.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/yslow.css ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/yslow.css; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/version.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/version.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/peeler.js ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/peeler.js; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/view.js ]; then rm $(BUILD_FIREFOX)/chrome/content/view.js; fi
	@if [ -f $(BUILD_FIREFOX)/install.rdf ]; then rm $(BUILD_FIREFOX)/install.rdf; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/yslow.css ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/yslow.css; fi
	@if [ -f $(BUILD_FIREFOX)/chrome/content/yslow/tabview.css ]; then rm $(BUILD_FIREFOX)/chrome/content/yslow/tabview.css; fi
	@if [ -d $(BUILD_FIREFOX)/chrome/content/yslow/img ]; then rmdir $(BUILD_FIREFOX)/chrome/content/yslow/img; fi
	@if [ -d $(BUILD_FIREFOX)/chrome/content/yslow/lib ]; then rmdir $(BUILD_FIREFOX)/chrome/content/yslow/lib; fi
	@if [ -d $(BUILD_FIREFOX)/chrome/content/yslow ]; then rmdir $(BUILD_FIREFOX)/chrome/content/yslow; fi
	@if [ -d $(BUILD_FIREFOX)/chrome/content ]; then rmdir $(BUILD_FIREFOX)/chrome/content; fi
	@if [ -d $(BUILD_FIREFOX)/chrome/skin ]; then rmdir $(BUILD_FIREFOX)/chrome/skin; fi
	@if [ -d $(BUILD_FIREFOX)/chrome ]; then rmdir $(BUILD_FIREFOX)/chrome; fi
	@if [ -d $(BUILD_FIREFOX)/defaults/preferences ]; then rmdir $(BUILD_FIREFOX)/defaults/preferences; fi
	@if [ -d $(BUILD_FIREFOX)/defaults ]; then rmdir $(BUILD_FIREFOX)/defaults; fi
	@if [ -d $(BUILD_FIREFOX) ]; then rmdir $(BUILD_FIREFOX); fi
	@echo "done"

clean-har:
	@echo "cleaning HAR IMPORTER..."
	@if [ -f $(BUILD_HAR)/yslow-har.js ]; then rm $(BUILD_HAR)/yslow-har.js; fi
	@if [ -d $(BUILD_HAR) ]; then rmdir $(BUILD_HAR); fi
	@echo "done"

clean-nodejs:
	@echo "cleaning NODE.JS HAR IMPORTER..."
	@if [ -f $(BUILD_NODEJS)/node_modules/yslow.js ]; then rm $(BUILD_NODEJS)/node_modules/yslow.js; fi
	@if [ -f $(BUILD_NODEJS)/yslow ]; then rm $(BUILD_NODEJS)/yslow; fi
	@if [ -d $(BUILD_NODEJS)/node_modules ]; then rmdir $(BUILD_NODEJS)/node_modules; fi
	@if [ -d $(BUILD_NODEJS) ]; then rmdir $(BUILD_NODEJS); fi
	@echo "done"

clean-opera:
	@echo "cleaning OPERA EXTENSION..."
	@if [ -f $(BUILD_OPERA)/background.js ]; then rm $(BUILD_OPERA)/background.js; fi
	@if [ -f $(BUILD_OPERA)/config.xml ]; then rm $(BUILD_OPERA)/config.xml; fi
	@if [ -f $(BUILD_OPERA)/index.html ]; then rm $(BUILD_OPERA)/index.html; fi
	@if [ -f $(BUILD_OPERA)/images/icon_18.png ]; then rm $(BUILD_OPERA)/images/icon_18.png; fi
	@if [ -f $(BUILD_OPERA)/images/icon_64.png ]; then rm $(BUILD_OPERA)/images/icon_64.png; fi
	@if [ -f $(BUILD_OPERA)/includes/injected.js ]; then rm $(BUILD_OPERA)/includes/injected.js; fi
	@if [ -d $(BUILD_OPERA)/images/ ]; then rmdir $(BUILD_OPERA)/images/; fi
	@if [ -d $(BUILD_OPERA)/includes/ ]; then rmdir $(BUILD_OPERA)/includes/; fi
	@if [ -d $(BUILD_OPERA) ]; then rmdir $(BUILD_OPERA); fi
	@echo "done"

clean-safari:
	@echo "cleaning SAFARI EXTENSION..."
	@if [ -f $(BUILD_SAFARI)/16.png ]; then rm $(BUILD_SAFARI)/16.png; fi
	@if [ -f $(BUILD_SAFARI)/Icon-32.png ]; then rm $(BUILD_SAFARI)/Icon-32.png; fi
	@if [ -f $(BUILD_SAFARI)/Icon-48.png ]; then rm $(BUILD_SAFARI)/Icon-48.png; fi
	@if [ -f $(BUILD_SAFARI)/Info.plist ]; then rm $(BUILD_SAFARI)/Info.plist; fi
	@if [ -f $(BUILD_SAFARI)/Settings.plist ]; then rm $(BUILD_SAFARI)/Settings.plist; fi
	@if [ -f $(BUILD_SAFARI)/global.html ]; then rm $(BUILD_SAFARI)/global.html; fi
	@if [ -f $(BUILD_SAFARI)/injected.js ]; then rm $(BUILD_SAFARI)/injected.js; fi
	@if [ -d $(BUILD_SAFARI) ]; then rmdir $(BUILD_SAFARI); fi
	@if [ -d $(BUILD_SAFARI_ROOT) ]; then rmdir $(BUILD_SAFARI_ROOT); fi
	@echo "done"

clean-wsh:
	@echo "cleaning WSH HAR IMPORTER..."
	@if [ -f $(BUILD_WSH)/yslow.js ]; then rm $(BUILD_WSH)/yslow.js; fi
	@if [ -d $(BUILD_WSH) ]; then rmdir $(BUILD_WSH); fi
	@echo "done"

clean-rhino:
	@echo "cleaning RHINO HAR IMPORTER..."
	@if [ -f $(BUILD_RHINO)/lib/yslow.js ]; then rm $(BUILD_RHINO)/lib/yslow.js; fi
	@if [ -f $(BUILD_RHINO)/lib/env.rhino.1.2.js ]; then rm $(BUILD_RHINO)/lib/env.rhino.1.2.js; fi
	@if [ -f $(BUILD_RHINO)/lib/blank.html ]; then rm $(BUILD_RHINO)/lib/blank.html; fi
	@if [ -f $(BUILD_RHINO)/yslow.js ]; then rm $(BUILD_RHINO)/yslow.js; fi
	@if [ -d $(BUILD_RHINO)/lib ]; then rmdir $(BUILD_RHINO)/lib; fi
	@if [ -d $(BUILD_RHINO) ]; then rmdir $(BUILD_RHINO); fi
	@echo "done"

clean-phantomjs:
	@echo "cleaning PHANTOMJS..."
	@if [ -f $(BUILD_PHANTOMJS)/yslow.js ]; then rm $(BUILD_PHANTOMJS)/yslow.js; fi
	@if [ -d $(BUILD_PHANTOMJS) ]; then rmdir $(BUILD_PHANTOMJS); fi
	@echo "done"

clean-nodeserver:
	@echo "cleaning NODEJS SERVER..."
	@if [ -f $(BUILD_NODESERVER)/yslow-server.js ]; then rm $(BUILD_NODESERVER)/yslow-server.js; fi
	@if [ -d $(BUILD_NODESERVER) ]; then rmdir $(BUILD_NODESERVER); fi
	@echo "done"

pkg-bookmarklet: BM_CONFIG := config-production.js
pkg-bookmarklet: yui bookmarklet-files
	@echo "packaging BOOKMARKLET..."
	@if [ ! -d $(PKG_BOOKMARKLET)/$(YSLOW_VERSION) ]; then mkdir -p $(PKG_BOOKMARKLET)/$(YSLOW_VERSION); fi
	@if [ -f $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_JS) ]; then \
            echo "$(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_JS) already exists"; \
            exit 1; \
        fi
	@if [ -f $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_CSS) ]; then \
            echo "$(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_CSS) already exists"; \
            exit 1; \
        fi
	@echo "    minifying YUI..."
	@$(YUICOMPRESSOR) $(BUILD_YUI)/yui$(YUI_MODE).js -o $(BUILD_YUI)/yui$(YUI_MODE)-min.js
	@rm $(BUILD_YUI)/yui$(YUI_MODE).js
	@echo "    done"
	@echo "    minifying BOOKMARKLET files..."
	@$(YUICOMPRESSOR) $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_JS) -o $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_YSLOW_JS)
	@rm $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_JS)
	@$(YUICOMPRESSOR) $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_CSS) -o $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_YSLOW_CSS)
	@rm $(BUILD_BOOKMARKLET)/$(BOOKMARKLET_YSLOW_CSS)
	@echo "    done"
	@echo "    merging minified YUI and BOOKMARKLET..."
	@cat $(YUI_LICENSE) \
            > $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_JS)
	@cat $(BUILD_YUI)/yui$(YUI_MODE)-min.js \
            >> $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_JS)
	@echo "" >> $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_JS)
	@cat $(YSLOW_LICENSE) \
            >> $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_JS)
	@cat $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_YSLOW_JS) \
            >> $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_JS)
	@rm $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_YSLOW_JS) \
            $(BUILD_YUI)/yui$(YUI_MODE)-min.js
	@cat $(YSLOW_LICENSE) \
            $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_YSLOW_CSS) \
            > $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_CSS)
	@rm $(PKG_BOOKMARKLET)/$(YSLOW_VERSION)/$(BOOKMARKLET_YSLOW_CSS)
	@echo "    done"
	@echo "done"

pkg-chrome: chrome
	@echo "packaging CHROME EXTENSION..."
	@if [ ! -d $(PKG_CHROME) ]; then mkdir -p $(PKG_CHROME); fi
	@if [ -f $(PKG_CHROME)/yslow-chrome-$(YSLOW_VERSION).zip ]; then \
            echo "$(PKG_CHROME)/yslow-chrome-$(YSLOW_VERSION).zip already exists"; \
            exit 1; \
        fi
	@cd $(BUILD_CHROME); \
        zip ../../$(PKG_CHROME)/yslow-chrome-$(YSLOW_VERSION).zip \
            128.png \
            16.png \
            32.png \
            48.png \
            background.html \
            options.html \
            content.js \
            pref-init.js \
            controller.js \
            icon.png \
            manifest.json \
            style.css \
            yslow-chrome.js \
            yslow.html
	@echo "done"

pkg-firefox: firefox
	@echo "packaging FIREFOX ADD-ON..."
	@if [ ! -d $(PKG_FIREFOX) ]; then mkdir -p $(PKG_FIREFOX); fi
	@if [ -f $(PKG_FIREFOX)/yslow-firefox-$(YSLOW_VERSION).xpi ]; then \
            echo "$(PKG_FIREFOX)/yslow-firefox-$(YSLOW_VERSION).xpi already exists"; \
            exit 1; \
        fi
	@cd $(BUILD_FIREFOX); \
	zip -r ../../$(PKG_FIREFOX)/yslow-firefox-$(YSLOW_VERSION).xpi *
	@echo "done"

pkg-nodejs: nodejs
	@echo "packaging NODE.JS HAR IMPORTER..."
	@if [ -d $(PKG_NODEJS)/yslow-$(YSLOW_VERSION) ]; then \
            echo "$(PKG_NODEJS)/yslow-$(YSLOW_VERSION) already exists"; \
            exit 1; \
        fi
	@mkdir -p $(PKG_NODEJS)/yslow-$(YSLOW_VERSION)/lib
	@mkdir -p $(PKG_NODEJS)/yslow-$(YSLOW_VERSION)/bin
	@cp $(BUILD_NODEJS)/node_modules/yslow.js \
            $(PKG_NODEJS)/yslow-$(YSLOW_VERSION)/lib/yslow.js
	@cp $(BUILD_NODEJS)/yslow \
            $(PKG_NODEJS)/yslow-$(YSLOW_VERSION)/bin/yslow
	@sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            $(SRC_NODEJS)/package.json \
            > $(PKG_NODEJS)/yslow-$(YSLOW_VERSION)/package.json
	@echo "done"

pkg-opera: opera
	@echo "packaging OPERA EXTENSION..."
	@if [ ! -d $(PKG_OPERA) ]; then mkdir -p $(PKG_OPERA); fi
	@if [ -f $(PKG_OPERA)/yslow-opera-$(YSLOW_VERSION).oex ]; then \
            echo "$(PKG_OPERA)/yslow-opera-$(YSLOW_VERSION).oex already exists"; \
            exit 1; \
        fi
	@cd $(BUILD_OPERA); \
        zip ../../$(PKG_OPERA)/yslow-opera-$(YSLOW_VERSION).oex \
            background.js \
            config.xml \
            index.html \
            images/icon_18.png \
            images/icon_64.png \
            includes/injected.js
	@echo "done"

pkg-safari: safari
	@echo "packaging SAFARI EXTENSION..."
	@if [ ! -d $(PKG_SAFARI) ]; then mkdir -p $(PKG_SAFARI); fi
	@if [ -f $(PKG_SAFARI)/yslow-$(YSLOW_VERSION).safariextz ]; then \
            echo "$(PKG_SAFARI)/yslow-$(YSLOW_VERSION).safariextz already exists"; \
            exit 1; \
        fi
	@if [ -f $(PKG_SAFARI)/update-$(YSLOW_VERSION).plist ]; then \
            echo "$(PKG_SAFARI)/update-$(YSLOW_VERSION).plist already exists"; \
            exit 1; \
        fi
#       CURRENTLY XAR DOES NOT SIGN EXTENSION, USE SAFARI INSTEAD
#	@cd $(BUILD_SAFARI); \
#        xar -cv -f ../../../$(PKG_SAFARI)/yslow-$(YSLOW_VERSION).safariextz \
#            16.png \
#            Icon-32.png \
#            Icon-48.png \
#            Info.plist \
#            Settings.plist \
#            global.html \
#            injected.js
	@sed s/{{YSLOW_VERSION}}/$(YSLOW_VERSION)/ \
            $(SRC_SAFARI)/update.plist \
            > $(PKG_SAFARI)/update-$(YSLOW_VERSION).plist
	@echo "done"
	@echo "*** NOTE ***"
	@echo "Use Safari to sign and build extension from $(BUILD_SAFARI) then save as $(PKG_SAFARI)/yslow-$(YSLOW_VERSION).safariextz"
	@echo "Push $(PKG_SAFARI)/yslow-$(YSLOW_VERSION).safariextz to http://d.yimg.com/jc/safari/yslow.safariextz"
	@echo "Push $(PKG_SAFARI)/update-$(YSLOW_VERSION).plist to http://d.yimg.com/jc/safari/update.plist"

pkg-wsh: wsh
	@echo "packaging WSH HAR IMPORTER..."
	@if [ -f $(PKG_WSH)/yslow-$(YSLOW_VERSION).js ]; then \
            echo "$(PKG_WSH)/yslow-$(YSLOW_VERSION).js already exists"; \
            exit 1; \
        fi
	@mkdir -p $(PKG_WSH)
	@cp $(BUILD_WSH)/yslow.js \
            $(PKG_WSH)/yslow-$(YSLOW_VERSION).js
	@echo "done"

pkg-rhino: rhino
	@echo "packaging RHINO HAR IMPORTER..."
	@if [ -d $(PKG_RHINO)/yslow-$(YSLOW_VERSION) ]; then \
            echo "$(PKG_RHINO)/yslow-$(YSLOW_VERSION) already exists"; \
            exit 1; \
        fi
	@mkdir -p $(PKG_RHINO)/yslow-$(YSLOW_VERSION)/lib
	@cp $(BUILD_RHINO)/yslow.js \
            $(PKG_RHINO)/yslow-$(YSLOW_VERSION)/
	@cp $(BUILD_RHINO)/lib/yslow.js \
            $(BUILD_RHINO)/lib/env.rhino.1.2.js \
            $(BUILD_RHINO)/lib/blank.html \
            $(PKG_RHINO)/yslow-$(YSLOW_VERSION)lib/
	@echo "done"

pkg-phantomjs: phantomjs
	@echo "packaging PHANTOMJS..."
	@if [ -d $(PKG_PHANTOMJS)/$(YSLOW_VERSION) ]; then \
            echo "$(PKG_PHANTOMJS)/$(YSLOW_VERSION) already exists"; \
            exit 1; \
        fi
	@mkdir -p $(PKG_PHANTOMJS)/$(YSLOW_VERSION)
	@cat $(YSLOW_LICENSE) > $(PKG_PHANTOMJS)/$(YSLOW_VERSION)/yslow.js
	@$(YUICOMPRESSOR) $(BUILD_PHANTOMJS)/yslow.js >> $(PKG_PHANTOMJS)/$(YSLOW_VERSION)/yslow.js
	@echo "done"

pkg-nodeserver: nodeserver
	@echo "packaging NODEJS SERVER..."
	@if [ -f $(PKG_NODESERVER)/yslow-server-$(YSLOW_VERSION).js ]; then \
            echo "$(PKG_NODESERVER)/yslow-server-$(YSLOW_VERSION).js already exists"; \
            exit 1; \
        fi
	@mkdir -p $(PKG_NODESERVER)
	@cp $(BUILD_NODESERVER)/yslow-server.js \
            $(PKG_NODESERVER)/yslow-server-$(YSLOW_VERSION).js
	@echo "done"
