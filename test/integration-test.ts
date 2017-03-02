/// <reference path="../typings/globals/mocha/index.d.ts"/>

import assert = require("assert");
var sinon = require('sinon');
import * as cli from '../src/linterhub-cli';
var fs = require("fs");
sinon.stub(fs, "existsSync", function () {
    return true;
});
import { Integration, LoggerInterface, StatusInterface } from '../src/integration';
import { Run } from '../src/integration';
import { LinterhubMode } from '../src/linterhub-cli';
import { Types } from '../src/types';

import { LinterhubInstallation } from '../src/linterhub-installer';

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

describe('Integration class', function () {
    let api = {
        logger: new LoggerMock(),
        status: new StatusMock(),
        project: "project",
        linterhub_version: "version",
        sendDiagnostics: function () { },
        normalizePath: function () { }
    };
    let settings = {
        linterhub: {
            enable: true,
            run: [Run.onOpen, Run.onSave],
            mode: LinterhubMode.docker,
            cliPath: "cli-path",
            cliRoot: "cli-root"
        }
    };
    describe('version method', function () {
        var spy = sinon.stub(cli.LinterhubCli.prototype, "version", function (): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve();
            });
        });
        let integration: Integration = new Integration(api, settings);
        it('should call linterhub.version', function () {
            return integration.version().then(function (x) {
                assert(spy.called);
                spy.restore();
            });
        });
    });
    var spy_diagnostics = sinon.stub(api, "sendDiagnostics", function (data: string): any {
        return JSON.parse(data);
    });
    describe('analyze method', function () {
        var data = JSON.parse("[{\"Name\":\"jshint\",\"Model\":{\"Files\":[{\"Path\":\"file\",\"Errors\":[{\"Message\":\"description\",\"Rule\":{\"Name\":\"test_name\",\"Id\":null,\"Namespace\":null},\"Severity\":1,\"Evidence\":null,\"Line\":0,\"Column\":{\"Start\":5,\"End\":5},\"Row\":{\"Start\":4,\"End\":4}}]}],\"ParseErrors\":{\"ErrorMessage\":null,\"Input\":null}}}]");
        var spy = sinon.stub(cli.LinterhubCli.prototype, "analyze", function (): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve(JSON.stringify(data));
            });
        });
        var integration = new Integration(api, settings);

        it('should call linterhub.analyze', function () {
            return integration.analyze().then(function (x) {
                assert(spy.called);
            });
        });
        it('should call api.sendDiagnostics', function () {
            return integration.analyze().then(function (x) {
                assert(spy_diagnostics.called);
            });
        });

        it('result check', function () {
            return integration.analyze().then(function (x) {
                assert.equal(JSON.stringify(x), JSON.stringify(data));
            });
        });
        after(function (done) {
            spy.restore();
            done();
        });
    });
    describe('install method', function () {
        var install_stub = sinon.stub(LinterhubInstallation, "install",
            function (mode: LinterhubMode, folder: string, proxy: string, strictSSL: boolean, log: LoggerInterface, status: StatusInterface, version: string): Promise<string> {
                return new Promise((resolve, reject) => {
                    resolve("path_to_cli");
                });
            }
        );
        let gdv_success: boolean = true;
        var getDotnetVersion_stub = sinon.stub(LinterhubInstallation, "getDotnetVersion",
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
        var integration = new Integration(api, settings);

        it('should call LinterhubInstallation.install', function () {
            return integration.install().then(function (x) {
                assert(install_stub.called);
            });
        });

        it('should call LinterhubInstallation.getDotnetVersion', function () {
            return integration.install().then(function (x) {
                assert(getDotnetVersion_stub.called);
            });
        });

        it('check case when cant find dotnet', function () {
            gdv_success = false;
            return integration.install().then(function (x) {
                assert.equal(integration.getSettings().linterhub.mode, LinterhubMode.native);
            });
        });

        it('result check', function () {
            return integration.install().then(function (x) {
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
        var spy = sinon.stub(cli.LinterhubCli.prototype, "analyzeFile", function (name: string, install: boolean): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve(JSON.stringify(data));
            });
        });
        var spy_normalize = sinon.stub(api, "normalizePath", function (file: string): string {
            return file;
        });
        var integration = new Integration(api, settings);
        it('return null on wrong Run mode', function () {
            assert.equal(integration.analyzeFile("path", Run.none), null);
        });
        it('should call linterhub.analyzeFile', function () {
            return integration.analyzeFile("path", Run.onOpen).then(function (x) {
                assert(spy.called);
            });
        });
        it('should call api.normalizePath', function () {
            return integration.analyzeFile("path", Run.onOpen).then(function (x) {
                assert(spy_normalize.called);
            });
        });
        it('should call api.sendDiagnostics', function () {
            return integration.analyzeFile("path", Run.onOpen).then(function (x) {
                assert(spy_diagnostics.called);
            });
        });

        it('result check', function () {
            return integration.analyzeFile("path", Run.onOpen).then(function (x) {
                assert.equal(JSON.stringify(x), JSON.stringify(data));
            });
        });
        after(function (done) {
            spy.restore();
            spy_normalize.restore();
            done();
        });
    });
    describe('linterVersion method', function () {
        var spy = sinon.stub(cli.LinterhubCli.prototype, "linterVersion", function (name: string, install: boolean): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve("{\"LinterName\":\"" + name + "\",\"Installed\":true,\"Version\":\"v1.0.4\"}");
            });
        });
        let integration: Integration = new Integration(api, settings);
        it('should call linterhub.linterVersion', function () {
            return integration.linterVersion("csslint", false).then(function (x) {
                assert(spy.called);
            });
        });
        it('result check', function () {
            return integration.linterVersion("csslint", false).then(function (x) {
                let result: Types.LinterVersionResult = {
                    LinterName: "csslint",
                    Installed: true,
                    Version: "v1.0.4"
                };
                assert.equal(JSON.stringify(x), JSON.stringify(result));
            });
        });
        after(function (done) {
            spy.restore();
            done();
        });
    });
    describe('ignoreWarning method', function () {
        var spy = sinon.stub(cli.LinterhubCli.prototype, "ignoreWarning", function (params: Types.IgnoreWarningParams): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve();
            });
        });
        let integration: Integration = new Integration(api, settings);
        it('should call linterhub.ignoreWarning', function () {
            return integration.ignoreWarning({ file: "filename", error: "errorid", line: 10 }).then(function (x) {
                assert(spy.called);
            });
        });
        after(function (done) {
            spy.restore();
            done();
        });
    });
    describe('catalog method', function () {
        var data: string = "[{\"name\":\"linter1\",\"description\":\"description1\",\"languages\":\"coffeescript\",\"active\":false}," +
            "{\"name\":\"linter2\",\"description\":\"description2\",\"languages\":\"css\",\"active\":true}]";
        var spy = sinon.stub(cli.LinterhubCli.prototype, "catalog", function (): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve(data);
            });
        });
        let integration: Integration = new Integration(api, settings);
        it('should call linterhub.catalog', function () {
            return integration.catalog().then(function (x) {
                assert(spy.called);
            });
        });
        it('result check', function () {
            return integration.catalog().then(function (x) {
                assert.equal(JSON.stringify(x), data);
            });
        });
        after(function (done) {
            spy.restore();
            done();
        });
    });
    describe('deactivate method', function () {
        var spy = sinon.stub(cli.LinterhubCli.prototype, "deactivate", function (): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve();
            });
        });
        let integration: Integration = new Integration(api, settings);
        it('should call linterhub.deactivate', function () {
            return integration.deactivate("linter").then(function (x) {
                assert(spy.called);
                spy.restore();
            });
        });
        it('must return valid linter name', function () {
            return integration.deactivate("linter").then(function (x) {
                assert.equal(x, "linter");
            });
        });
    });
    describe('activate method', function () {
        var spy = sinon.stub(cli.LinterhubCli.prototype, "activate", function (): Promise<string> {
            return new Promise((resolve, reject) => {
                resolve();
            });
        });
        let integration: Integration = new Integration(api, settings);
        it('should call linterhub.activate', function () {
            return integration.activate("linter").then(function (x) {
                assert(spy.called);
                spy.restore();
            });
        });
        it('must return valid linter name', function () {
            return integration.activate("linter").then(function (x) {
                assert.equal(x, "linter");
            });
        });
    });
});