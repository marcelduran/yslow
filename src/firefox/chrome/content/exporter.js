/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Components*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, regexp: true, newcap: true, immed: true */

/**
 * The Exporter class provides API to export a Ruleset object to Firefox Extension (.XPI) file.
 * It only works on Firefox 3.0 and up.
 * @class
 * @static
 */

YSLOW.Exporter = {

    /**
     * Export the passed ruleset to Firefox Extension in the format of a .XPI file.
     * The .XPI file is a zip file containing install.rdf, chrome.manifest, javascript and images files that
     * can be installed in Firefox and extend YSlow functionality.
     *
     * @param {Ruleset} ruleset The ruleset to be exported.
     * @return an object with 'success' and 'messagse' fields.
     * <ul>
     * <li><code>success</code> - true if export was successful, false otherwise</li>
     * <li><code>message</code> - sucesss or error message to be displayed</li>
     * </ul>
     * @type Object
     */
    exportRuleset: function (ruleset) {
        var ext, message;

        try {
            if (typeof ruleset === "object" && typeof ruleset.id === "string" && typeof ruleset.name === "string") {
                // lowercase ruleset.id, mozilla does not support mixed case in chrome.manifest.
                ruleset.id = ruleset.id.toLowerCase();

                // Check if browser supports zipwriter
                if (!("@mozilla.org/zipwriter;1" in Components.classes)) {
                    return {
                        'success': false,
                        'message': 'Firefox 3 is required for this feature.'
                    };
                }

                ext = new YSLOW.Extension(ruleset);

                // create chrome.manifest
                ext.createChromeManifest();

                // create install.rdf
                ext.createInstallRDF();

                // create chrome/content/browser.xul
                ext.createBrowserXUL();

                // create chrome/content/yslow_blog_rules.js
                ext.createMainFile();

                // include defaults/preferences/yslow_blog_rules.js
                ext.createPreferenceFile();

                // include chrome/content/icon.png
                ext.createIconFile();

                // zip it up into .xpi file, put in Desktop directory
                ext.createXPIFile();

                message = 'A YSLOW ruleset extension file (' + ruleset.id + '.xpi) has been created on your desktop.';
                return {
                    'success': true,
                    'message': message
                };
            }
        } catch (err) {
            // do nothing.
        }

        return {
            'success': false,
            'message': 'The operation failed.'
        };
    },

    /**
     * @final
     */
    CHROME_MANIFEST_TEMPLATE: "content \t %ruleset_id% \t chrome/content/ \n" + "overlay \t chrome://yslow/content/browser.xul \t chrome://%ruleset_id%/content/browser.xul \n",

    /**
     * @final
     */
    INSTALL_RDF_TEMPLATE: '<?xml version="1.0"?>\n' + '<RDF:RDF xmlns:em="http://www.mozilla.org/2004/em-rdf#"\n' + '    xmlns:NC="http://home.netscape.com/NC-rdf#"\n' + '    xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' + '<RDF:Description RDF:about="rdf:#$41y0G2"\n' + '           em:id="{ec8030f7-c20a-464f-9b0e-13a3a9e97384}"\n' + '           em:minVersion="2.0"\n' + '           em:maxVersion="3.1.*" />\n' + '<RDF:Description RDF:about="urn:mozilla:install-manifest"\n' + '           em:id="%ruleset_id%@yahoo-inc.com"\n' + '           em:name="YSlow 2 Custom Rules (%ruleset_name%)"\n' + '           em:version="1.0"\n' + '           em:creator="YSlow 2.0"\n' + '           em:description="A YSlow Extension for %ruleset_name% Rules"\n' + '           em:homepageURL="http://performance.corp.yahoo.com"\n' + '           em:iconURL="chrome://%ruleset_id%/content/icon.png">\n' + '<em:targetApplication RDF:resource="rdf:#$41y0G2"/>\n' + '</RDF:Description>\n' + '</RDF:RDF>\n',

    /**
     * @final
     */
    BROWSER_XUL_TEMPLATE: '<?xml version="1.0" encoding="utf-8"?>\n' + '<overlay xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" xmlns:html="http://www.w3.org/1999/xhtml" id="%ruleset_id%-overlay">\n' + '<script type="application/x-javascript" src="chrome://%ruleset_id%/content/%ruleset_id%.js"></script>\n' + '</overlay>',

    /**
     * @final
     */
    PREF_FILE_TEMPLATE: 'pref("extensions.%ruleset_id%.foo", "bar");',

    /**
     * @final
     */
    MAIN_FILE_TEMPLATE: 'var %ruleset_id% = { \n\n' + '    registerRules: function() { \n' + '        if (typeof YSLOW !== "undefined") { \n' + '            %rule_definition% \n\n' + '            YSLOW.registerRuleset(%ruleset_obj_string%); \n' + '        } else { \n' + '            alert("YSlow is not loaded yet!"); \n' + '        } \n' + '    } \n' + '}; \n' + '%ruleset_id%.registerRules();'

};

/**
 * @private
 * A helper class to create a firefox extension.
 * @constructor
 * @param {Ruleset} ruleset The ruleset to be exported.
 */
YSLOW.Extension = function (ruleset) {
    var file, zfile, zipW;

    this.ruleset = ruleset;

    file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);

    file.append(ruleset.id + "@yahoo-inc.com");
    if (file.exists()) {
        file.remove(true);
    }
    file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, this.DIR_PERMISSION);
    this.file = file;

    // create chrome/content and defaults/preferences folder
    this.content_dir = this.createFolders("chrome", "content");
    this.pref_dir = this.createFolders("defaults", "preferences");

    zfile = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("Desk", Components.interfaces.nsIFile);

    zfile.append(this.ruleset.id + ".xpi");

    /*
    const PR_RDONLY      = 0x01;
    const PR_WRONLY      = 0x02;
    const PR_RDWR        = 0x04;
    const PR_CREATE_FILE = 0x08;
    const PR_APPEND      = 0x10;
    const PR_TRUNCATE    = 0x20;
    const PR_SYNC        = 0x40;
    const PR_EXCL        = 0x80;
     */

    zipW = Components.classes["@mozilla.org/zipwriter;1"].createInstance(Components.interfaces.nsIZipWriter);
    zipW.open(zfile, 0x04 /*PR_RDWR*/ | 0x08 /*PR_CREATE_FILE*/ | 0x20 /*PR_TRUNCATE*/ );
    zipW.comment = "This is a YSlow Ruleset Extension";
    this.zipW = zipW;
};

/**
 * @ignore
 */
YSLOW.Extension.DIR_PERMISSION = 511; // 0777  rwxrwxrwx
/**
 * @ignore
 */
YSLOW.Extension.FILE_PERMISSION = 384; // 0600  rw-------

YSLOW.Extension.prototype = {

    /**
     * @private
     * Create folder and subfolder in temp diretory
     * @param {String} folder_name name of folder to be created
     * @param {String} subfolder_name name of sub folder to be created
     * @return file handle of the created folder.
     * @type Components.interfaces.nsILocalFile
     */
    createFolders: function (folder_name, subfolder_name) {
        var path,
            aFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

        path = ((this.file.path.search(/\\/) !== -1) ? this.file.path + "\\" : this.file.path + "/") + folder_name;
        aFile.initWithPath(path);
        aFile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, this.DIR_PERMISSION);

        if (typeof subfolder_name === "string" && subfolder_name.length > 0) {
            aFile.append(subfolder_name);
            aFile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, this.DIR_PERMISSION);
        }

        return aFile;
    },

    /**
     * @private
     * Add entry to zip file.
     * @param {String} dir - the path that the file should be added under in the zip file.
     * @param {String} filename - file name to be added to zip file.
     * @param {nsILocalFile} aFile - file handle
     */
    writeToArchive: function (dir, filename, aFile) {
        var prefix = '';

        if (this.file.path.length <= dir.path.length) {
            prefix = dir.path.substr(this.file.path.length);
            prefix += prefix.substr(0, 1);
            prefix = prefix.substr(1);
            prefix = prefix.replace(/\\/g, '/');
        }
        this.zipW.addEntryFile(prefix + filename, Components.interfaces.nsIZipWriter.COMPRESSION_DEFAULT, aFile, false);
    },

    /**
     * @private
     * Write data to text file, at the end, write the file to the zip file.
     * @param {String} dir Directory of the file to be written.
     * @param {String} filename Name of file to be written.
     * @param {String} data Data to be written.
     */
    writeTextFile: function (dir, filename, data) {
        var path, stream,
            aFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

        path = ((dir.path.search(/\\/) !== -1) ? dir.path + "\\" : dir.path + "/") + filename;
        aFile.initWithPath(path);
        aFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, this.FILE_PERMISSION);

        stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        stream.init(aFile, 0x04 | 0x08 | 0x20, this.FILE_PERMISSION, 0); // write, create, truncate
        stream.write(data, data.length);
        stream.close();

        // add to zip file.
        this.writeToArchive(dir, filename, aFile);
    },

    /**
     * @private
     * Write binary data to file, at the end, write the file to the zip file.
     * @param {String} dir Directory of the file to be written.
     * @param {String} filename Name of file to be written.
     * @param {bytes} data Binary data to be written.
     */
    writeBinaryFile: function (dir, filename, data) {
        var path, stream,
            aFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

        path = ((dir.path.search(/\\/) !== -1) ? dir.path + "\\" : dir.path + "/") + filename;
        aFile.initWithPath(path);
        aFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, this.FILE_PERMISSION);

        stream = Components.classes["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        stream.init(aFile, 0x04 | 0x08 | 0x20, this.FILE_PERMISSION, 0); // write, create, truncate
        stream.write(data, data.length);
        if (stream instanceof Components.interfaces.nsISafeOutputStream) {
            stream.finish();
        } else {
            stream.close();
        }

        // add to zip file.
        this.writeToArchive(dir, filename, aFile);
    },

    /**
     * @private
     * Create chrome.manifest.
     */
    createChromeManifest: function () {
        var data = YSLOW.Exporter.CHROME_MANIFEST_TEMPLATE.replace(/%ruleset_id%/g, this.ruleset.id);

        this.writeTextFile(this.file, "chrome.manifest", data);
    },

    /**
     * @private
     * Create install.rdf
     */
    createInstallRDF: function () {
        var data = YSLOW.Exporter.INSTALL_RDF_TEMPLATE.replace(/%ruleset_id%/g, this.ruleset.id).replace(/%ruleset_name%/g, this.ruleset.name);

        this.writeTextFile(this.file, "install.rdf", data);
    },

    /**
     * @private
     * Create browser.xul
     */
    createBrowserXUL: function () {
        var data = YSLOW.Exporter.BROWSER_XUL_TEMPLATE.replace(/%ruleset_id%/g, this.ruleset.id);

        this.writeTextFile(this.content_dir, "browser.xul", data);
    },

    /**
     * @private
     * Create the main javascript file.
     */
    createMainFile: function () {
        var string, builtin_rules, replace_func, rule_id, rule, rule_string, data,
            rule_def = '';

        // temporary remove custom flag so that it won't be written to the xpi.
        delete this.ruleset.custom;
        string = JSON.stringify(this.ruleset, null, 2);
        this.ruleset.custom = true;

        builtin_rules = YSLOW.controller.getRuleset('ydefault').rules;
        replace_func = function (key, value) {
            return (key === "lint") ? "%lint%" : value;
        };

        for (rule_id in this.ruleset.rules) {
            if (!(rule_id in builtin_rules)) {
                rule = YSLOW.controller.getRule(rule_id);
                rule_string = JSON.stringify(rule, replace_func, 2);
                rule_string = rule_string.replace(/"%lint%"/, rule.lint.toString());
                rule_def += 'YSLOW.registerRule(\n' + rule_string + '\n);\n';
            }
        }

        data = YSLOW.Exporter.MAIN_FILE_TEMPLATE.replace(/%ruleset_id%/g, this.ruleset.id).replace(/%ruleset_obj_string%/g, string).replace(/%rule_definition%/g, rule_def);

        this.writeTextFile(this.content_dir, this.ruleset.id + ".js", data);
    },

    /**
     * @private
     * Create javascript file under default/preferences for preferences.
     */
    createPreferenceFile: function () {
        var data = YSLOW.Exporter.PREF_FILE_TEMPLATE.replace(/%ruleset_id%/g, this.ruleset.id);

        this.writeTextFile(this.pref_dir, this.ruleset.id + ".js", data);
    },

    /**
     * @private
     * Create icon image file.
     */
    createIconFile: function () {
        var istream, bstream, bytes,
            MY_ID = "yslow@yahoo-inc.com",
            em = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager),
            file = em.getInstallLocation(MY_ID).getItemFile(MY_ID, "chrome");

        file.append("content");
        file.append("yslow");
        file.append("img");

        if (file.exists()) {
            file.append("logo_32x32.png");

            istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            istream.init(file, -1, -1, false);

            bstream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
            bstream.setInputStream(istream);
            bytes = bstream.readBytes(bstream.available());

            this.writeBinaryFile(this.content_dir, "icon.png", bytes);
        }
    },

    /**
     * @private
     * Create .XPI file and clean up the temporary files.
     */
    createXPIFile: function () {

        this.zipW.close();

        // don't forget to clean up temp files.
        this.file.remove(true);
    }

};
