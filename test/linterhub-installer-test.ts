/// <reference path="../typings/globals/mocha/index.d.ts"/>

import assert = require("assert");
var sinon = require('sinon');
var util = require('../src/util');
var execute = sinon.stub(util, "executeChildProcess", function (command: string, workingDirectory: string = null): Promise<string> {
    return new Promise((resolve, reject) => {
        resolve(command);
    });
})
import { PlatformInformation } from '../src/platform';
import * as installer from '../src/linterhub-installer';

describe('LinterhubPackage', function () {
    let version: string = "version";
    let packageName: string = "debian.8-x64";
    let folder: string = "folder";
    let github_prefix: string = "https://github.com/Repometric/linterhub-cli/releases/download/"

    let obj = new installer.LinterhubPackage(new PlatformInformation("linux", "x64"), "folder", true, version);
    it('returns wrong version', function () {
        assert.equal(obj.getPackageVersion(), version);
    });
    it('returns wrong package name', function () {
        assert.equal(obj.getPackageName(), packageName);
    });
    it('returns wrong package full name', function () {
        assert.equal(obj.getPackageFullName(), "linterhub-cli-" + packageName + "-" + version);
    });
    it('returns wrong package file name', function () {
        assert.equal(obj.getPackageFileName(), "linterhub-cli-" + packageName + "-" + version + ".zip");
    });
    it('returns wrong package full file name', function () {
        assert.equal(obj.getPackageFullFileName(), folder + "/linterhub-cli-" + packageName + "-" + version + ".zip");
    });
    it('returns wrong package url', function () {
        assert.equal(obj.getPackageUrl(), github_prefix + version + "/linterhub-cli-" + packageName + "-" + version + ".zip");
    });
});

describe('Additional function', function () {
    describe('GetDockerVersion', function () {
        it('generates different command', function () {
            return installer.getDockerVersion().then(function (x) {
                assert.equal(x, "docker version --format \'{{.Server.Version}}\'");
            })
        });
    });

    describe('GetDotnetVersion', function () {
        it('generates different command', function () {
            return installer.getDotnetVersion().then(function (x) {
                assert.equal(x, "dotnet --version");
            })
        });
    });

    describe('DownloadDock', function () {
        it('generates different command', function () {
            return installer.downloadDock("linter").then(function (x) {
                assert.equal(x, "docker pull linter");
            })
        });
    });
})

describe('NetworkHelper', function () {
    describe('buildRequestOptions', function () {
        let bro = new installer.NetworkHelper();
        let url = "https://example.com/file.html?param=value";
        let proxy = "https://proxyurl.com";
        it('returns object with wrong host', function () {
            assert.equal(bro.buildRequestOptions(url, proxy, true).host, "example.com");
        });
        it('returns object with wrong path', function () {
            assert.equal(bro.buildRequestOptions(url, proxy, true).path, "/file.html?param=value");
        });
    });
})

after(function(done){
    execute.restore();
    done();
})