/// <reference path="../typings/globals/mocha/index.d.ts"/>

import assert = require("assert");
var sinon = require('sinon');

var fs = require("fs");
sinon.stub(fs, "existsSync", function () {
    return true;
});

import { Linterhub } from '../src/linterhub';

import { LinterhubTypes } from '../src/linterhub-types';
import { LinterhubArgs } from '../src/linterhub-args';
import { LinterhubInstaller, LinterhubPackage } from '../src/linterhub-installer';
import { PlatformInformation } from '../src/platform';

import * as path from 'path';

var executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
    return new Promise((resolve, reject) => {
        resolve(command);
    });
});

class LoggerMock {
    private last: string;
    getLast(): string {
        return this.last;
    }
    info(string: string): void {
        this.last = string;
    }
    error(string: string): void {
        this.last = string;
    }
    warn(string: string): void {
        this.last = string;
    }
}
class StatusMock {
    update(params: any, progress?: boolean, text?: string): void { }
}

describe('Linterhub class', function () {

    let api = {
        logger: new LoggerMock(),
        status: new StatusMock(),
        project: "project",
        linterhub_version: "version",
        sendDiagnostics: function () { },
        normalizePath: function () { },
        saveConfig: function () {}
    };

    let settings = {
        linterhub: {
            enable: true,
            run: [LinterhubTypes.Run.onOpen, LinterhubTypes.Run.onSave],
            mode: LinterhubTypes.Mode.dotnet,
            cliPath: "cli-path",
            cliRoot: "cli-root"
        }
    };

    let args: LinterhubArgs = new LinterhubArgs("cli-path", "project", LinterhubTypes.Mode.dotnet);

    Linterhub.initializeLinterhub(api, settings);
    
    describe('version method', function () {
        it('should call executeChildProcess with version params', function () {
            var calls_number = executeStub.callCount;
            return Linterhub.version().then(function (x) {
                assert.equal(calls_number + 1, executeStub.callCount, "calls number is not correct");
                calls_number++;
                assert.equal(x, args.version());
            });
        });

    });

    describe('deactivate method', function () {
        it('should call executeChildProcess with deactivete params', function () {
            var calls_number = executeStub.callCount;
            return Linterhub.deactivate("linter").then(function (x) {
                assert.equal(calls_number + 1, executeStub.callCount, "calls number is not correct");
                calls_number++;
                assert.equal(x, "linter");
            });
        });
        it('must return valid linter name', function () {
            return Linterhub.deactivate("linter").then(function (x) {
                assert.equal(x, "linter");
            });
        });
    });

    describe('activate method', function () {
        it('should call executeChildProcess with activete params', function () {
            var calls_number = executeStub.callCount;
            return Linterhub.deactivate("linter").then(function (x) {
                assert.equal(calls_number + 1, executeStub.callCount, "calls number is not correct");
                calls_number++;
                assert.equal(x, "linter");
            });
        });
        it('must return valid linter name', function () {
            return Linterhub.deactivate("linter").then(function (x) {
                assert.equal(x, "linter");
            });
        });
    });

    describe('linterVersion method', function () {

        it('should call executeChildProcess with linterVersion params', function () {
            var calls_number = executeStub.callCount;
            return Linterhub.linterVersion("linter", false).then(function (x) {
                assert.equal(calls_number + 1, executeStub.callCount, "calls number is not correct");
                calls_number++;
                sinon.assert.calledWith(executeStub, args.linterVersion("linter", false));
            });
        });
        it('result check', function () {
            executeStub.restore();
            executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                return new Promise((resolve, reject) => {
                    resolve("{\"LinterName\":\"" + "linter" + "\",\"Installed\":true,\"Version\":\"v1.0.4\"}");
                });
            });
            return Linterhub.linterVersion("csslint", false).then(function (x) {
                let result: LinterhubTypes.LinterVersionResult = {
                    LinterName: "linter",
                    Installed: true,
                    Version: "v1.0.4"
                };
                assert.equal(JSON.stringify(x), JSON.stringify(result));
            }).then(function(){
                executeStub.restore();
                executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                    return new Promise((resolve, reject) => {
                        resolve(command);
                    });
                });
                return null;
            });
        });
    });
    
    describe('ignoreWarning method', function () {
        it('should call executeChildProcess with ignoreWarning params', function () {
            var calls_number = executeStub.callCount;
            var params = {
                file: "file",
                line: 1,
                error: "error"
            };
            return Linterhub.ignoreWarning(params).then(function (x) {
                assert.equal(calls_number + 1, executeStub.callCount, "calls number is not correct");
                calls_number++;
                assert.equal(x, "dotnet " + path.join("cli-path", "cli.dll") + " --mode=ignore --project=project --error=error --file=file --line=1");
            });
        });
    });

    describe('catalog method', function () {
        var data: string = "[{\"name\":\"linter1\",\"description\":\"description1\",\"languages\":\"coffeescript\",\"active\":false}," +
            "{\"name\":\"linter2\",\"description\":\"description2\",\"languages\":\"css\",\"active\":true}]";
        
        it('should call executeChildProcess with catalog params', function () {
            var calls_number = executeStub.callCount;
            return Linterhub.catalog().then(function (x) {
                assert.equal(calls_number + 1, executeStub.callCount, "calls number is not correct");
                calls_number++;
            });
        });

        it('result check', function () {
            executeStub.restore();
            executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                return new Promise((resolve, reject) => {
                    resolve(data);
                });
            });
            return Linterhub.catalog().then(function (x) {
                assert.equal(JSON.stringify(x), data);
            }).then(function(){
                executeStub.restore();
                executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                    return new Promise((resolve, reject) => {
                        resolve(command);
                    });
                });
                return null;
            });
        });
    });

    var spy_diagnostics = sinon.stub(api, "sendDiagnostics", function (data: string): any {
        return JSON.parse(data);
    });

    describe('analyze method', function () {
        var data = JSON.parse("[{\"Name\":\"jshint\",\"Model\":{\"Files\":[{\"Path\":\"file\",\"Errors\":[{\"Message\":\"description\",\"Rule\":{\"Name\":\"test_name\",\"Id\":null,\"Namespace\":null},\"Severity\":1,\"Evidence\":null,\"Line\":0,\"Column\":{\"Start\":5,\"End\":5},\"Row\":{\"Start\":4,\"End\":4}}]}],\"ParseErrors\":{\"ErrorMessage\":null,\"Input\":null}}}]");
        
        it('should call api.sendDiagnostics', function () {
            return Linterhub.analyze().then(function (x) {
                assert(spy_diagnostics.called);
            });
        });

        it('result check', function () {
            executeStub.restore();
            executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                return new Promise((resolve, reject) => {
                    resolve(JSON.stringify(data));
                });
            });
            return Linterhub.analyze().then(function (x) {
                assert.equal(JSON.stringify(x), JSON.stringify(data));
            }).then(function(){
                executeStub.restore();
                executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                    return new Promise((resolve, reject) => {
                        resolve(command);
                    });
                });
                return null;
            });
        });
    });

    describe('install method', function () {
        var install_stub = sinon.stub(LinterhubInstaller, "run",
            function (mode: LinterhubTypes.Mode, folder: string, proxy: string,
                    strictSSL: boolean, log: LinterhubTypes.LoggerInterface,
                    status: LinterhubTypes.StatusInterface, version: string): Promise<string> {
                return new Promise((resolve, reject) => {
                    resolve("path_to_cli");
                });
            }
        );

        let gdv_success: boolean = true;
        var getDotnetVersion_stub = sinon.stub(LinterhubInstaller, "getDotnetVersion",
            function (): Promise<string> {
                return new Promise((resolve, reject) => {
                    if (gdv_success) {
                        resolve("string with dotnet version");
                    }
                    else {
                        reject("error string");
                    }
                });
            }
        );

        it('should call LinterhubInstaller.run', function () {
            return Linterhub.install().then(function (x) {
                assert(install_stub.called);
            });
        });

        it('should call LinterhubInstaller.getDotnetVersion', function () {
            return Linterhub.install().then(function (x) {
                assert(getDotnetVersion_stub.called);
            });
        });

        it('check case when cant find dotnet', function () {
            gdv_success = false;
            return Linterhub.install().then(function (x) {
                assert.equal(Linterhub.getSettings().linterhub.mode, LinterhubTypes.Mode.native);
            });
        });

        it('result check', function () {
            return Linterhub.install().then(function (x) {
                assert.equal(x, "path_to_cli");
            });
        });

        after(function (done) {
            install_stub.restore();
            getDotnetVersion_stub.restore();
            done();
        });
    });

    describe('analyzeFile method', function () {
        var data = JSON.parse("[{\"Name\":\"jshint\",\"Model\":{\"Files\":[{\"Path\":\"file\",\"Errors\":[{\"Message\":\"description\",\"Rule\":{\"Name\":\"test_name\",\"Id\":null,\"Namespace\":null},\"Severity\":1,\"Evidence\":null,\"Line\":0,\"Column\":{\"Start\":5,\"End\":5},\"Row\":{\"Start\":4,\"End\":4}}]}],\"ParseErrors\":{\"ErrorMessage\":null,\"Input\":null}}}]");
        var spy_normalize = sinon.stub(api, "normalizePath", function (file: string): string {
            return file;
        });
        it('return null on wrong Run mode', function () {
            assert.equal(Linterhub.analyzeFile("path", LinterhubTypes.Run.none), null);
        });
        it('should call api.normalizePath', function () {
            return Linterhub.analyzeFile("path", LinterhubTypes.Run.onOpen).then(function (x) {
                assert(spy_normalize.called);
            });
        });
        it('should call api.sendDiagnostics', function () {
            return Linterhub.analyzeFile("path", LinterhubTypes.Run.onOpen).then(function (x) {
                assert(spy_diagnostics.called);
            });
        });

        it('result check', function () {
            executeStub.restore();
            executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                return new Promise((resolve, reject) => {
                    resolve(JSON.stringify(data));
                });
            });
            return Linterhub.analyzeFile("path", LinterhubTypes.Run.onOpen).then(function (x) {
                assert.equal(JSON.stringify(x), JSON.stringify(data));
            }).then(function(){
                executeStub.restore();
                executeStub = sinon.stub(Linterhub, "executeChildProcess", function (command: string, workingDirectory: string = "default"): Promise<string> {
                    return new Promise((resolve, reject) => {
                        resolve(command);
                    });
                });
                return null;
            });
        });

        after(function (done) {
            spy_diagnostics.restore();
            spy_normalize.restore();
            done();
        });
    });
});

describe('LinterhubPackage class', function () {

    let version: string = "version";
    let packageName: string = "debian.8-x64";
    let folder: string = "folder";
    let github_prefix: string = "https://github.com/Repometric/linterhub-cli/releases/download/";

    let obj = new LinterhubPackage(new PlatformInformation("linux", "x64"), "folder", true, version);
    it('version check', function () {
        assert.equal(obj.getPackageVersion(), version);
    });
    it('package name check', function () {
        assert.equal(obj.getPackageName(), packageName);
    });
    it('package full name check', function () {
        assert.equal(obj.getPackageFullName(), "linterhub-cli-" + packageName);
    });
    it('package file name check', function () {
        assert.equal(obj.getPackageFileName(), "linterhub-cli-" + packageName + ".zip");
    });
    it('package full file name check', function () {
        assert.equal(obj.getPackageFullFileName(), path.join(folder, "linterhub-cli-" + packageName + ".zip"));
    });
    it('package url check', function () {
        assert.equal(obj.getPackageUrl(), github_prefix + version + "/linterhub-cli-" + packageName + ".zip");
    });
});

describe('LinterhubInstallation namespace', function () {
    describe('GetDockerVersion function', function () {
        it('command check', function () {
            return LinterhubInstaller.getDockerVersion().then(function (x) {
                assert.equal(x, "docker version --format \'{{.Server.Version}}\'");
            });
        });
    });

    describe('GetDotnetVersion function', function () {
        it('command check', function () {
            return LinterhubInstaller.getDotnetVersion().then(function (x) {
                assert.equal(x, "dotnet --version");
            });
        });
    });

    describe('DownloadDock function', function () {
        it('command check', function () {
            return LinterhubInstaller.downloadDock("linter").then(function (x) {
                assert.equal(x, "docker pull linter");
                executeStub.restore();
            });
        });
    });
});
