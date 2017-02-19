/// <reference path="../typings/globals/mocha/index.d.ts"/>

import assert = require("assert");
var sinon = require('sinon')
import { LinterhubArgs, LinterhubMode, LinterhubCli, LinterhubCliLazy } from '../src/linterhub-cli';

describe('LinterhubArgs class', function () {
    let obj = new LinterhubArgs("cli-path", "project-path", LinterhubMode.dotnet);
    it('prefix method check', function () {
        assert.equal(obj.prefix(), "dotnet cli-path/cli.dll");
    });
    it('analyze request generation', function () {
        assert.equal(obj.analyze(), "dotnet cli-path/cli.dll --mode=analyze --project=project-path");
    });
    it('activate request generation', function () {
        assert.equal(obj.activate("linter"), "dotnet cli-path/cli.dll --mode=activate --project=project-path --active=true --linter=linter");
    });
    it('linterVersion request generation', function () {
        assert.equal(obj.linterVersion("linter", true), "dotnet cli-path/cli.dll --mode=LinterInstall --linter=linter");
        assert.equal(obj.linterVersion("linter", false), "dotnet cli-path/cli.dll --mode=LinterVersion --linter=linter");
    });
    it('deactivate request generation', function () {
        assert.equal(obj.deactivate("linter"), "dotnet cli-path/cli.dll --mode=activate --project=project-path --active=false --linter=linter");
    });
    it('catalog request generation', function () {
        assert.equal(obj.catalog(), "dotnet cli-path/cli.dll --mode=catalog --project=project-path");
    });
    it('version request generation', function () {
        assert.equal(obj.version(), "dotnet cli-path/cli.dll --mode=version");
    });

});

class LoggerMock {
    info(string: string) { }
    error(string: string) { }
    warn(string: string) { }
}


describe('LinterhubCli class', function () {
    let cli_path: string = "cli-path";
    let project_path: string = "project-path";
    let cli = new LinterhubCli(new LoggerMock(), cli_path, project_path);
    var execute = sinon.stub(cli, 'execute', function (command: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            resolve(command);
        });
    });
    let args = new LinterhubArgs(cli_path, project_path);
    it('analyze request execution', function () {
        return cli.analyze().then(function (x) {
            assert.equal(x, args.analyze());
        })
    });
    it('analyze file request execution', function () {
        let file: string = "file";
        return cli.analyzeFile(file).then(function (x) {
            assert.equal(x, args.analyzeFile(file));
        })
    });
    it('catalog request execution', function () {
        return cli.catalog().then(function (x) {
            assert.equal(x, args.catalog());
        })
    });
    it('activate request execution', function () {
        let linter: string = "linter";
        return cli.activate(linter).then(function (x) {
            assert.equal(x, args.activate(linter));
        })
    });
    it('deactivate request execution', function () {
        let linter: string = "linter";
        return cli.deactivate(linter).then(function (x) {
            assert.equal(x, args.deactivate(linter));
        })
    });
    it('version request execution', function () {
        return cli.version().then(function (x) {
            assert.equal(x, args.version());
        })
    });
    it('linter version request execution', function () {
        let linter: string = "linter";
        return cli.linterVersion(linter, true).then(function (x) {
            assert.equal(x, args.linterVersion(linter, true));
        })
    });
    after(function(done){
        execute.restore();
        done()
    });
});
