/// <reference path="../typings/globals/mocha/index.d.ts"/>
/// <reference path="../typings/globals/assert/index.d.ts"/>

import assert = require("assert");
var sinon = require('sinon')
import { LinterhubArgs, LinterhubMode, LinterhubCli, LinterhubCliLazy } from '../src/linterhub-cli';

describe('LinterhubArgs', function () {
    let obj = new LinterhubArgs("cli-path", "project-path", LinterhubMode.dotnet);
    it('generates wrong prefix', function () {
        assert.equal(obj.prefix(), "dotnet cli-path/cli.dll");
    });
    it('generates wrong analyze request', function () {
        assert.equal(obj.analyze(), "dotnet cli-path/cli.dll --mode=analyze --project=project-path");
    });
    it('generates wrong activate request', function () {
        assert.equal(obj.activate("linter"), "dotnet cli-path/cli.dll --mode=activate --project=project-path --active=true --linter=linter");
    });
    it('generates wrong linterVersion request', function () {
        assert.equal(obj.linterVersion("linter", true), "dotnet cli-path/cli.dll --mode=LinterInstall --linter=linter");
        assert.equal(obj.linterVersion("linter", false), "dotnet cli-path/cli.dll --mode=LinterVersion --linter=linter");
    });
    it('generates wrong deactivate request', function () {
        assert.equal(obj.deactivate("linter"), "dotnet cli-path/cli.dll --mode=activate --project=project-path --active=false --linter=linter");
    });
    it('generates wrong catalog request', function () {
        assert.equal(obj.catalog(), "dotnet cli-path/cli.dll --mode=catalog");
    });
    it('generates wrong version request', function () {
        assert.equal(obj.version(), "dotnet cli-path/cli.dll --mode=version");
    });

});

class LoggerMock {
    info(string: string) { }
    error(string: string) { }
    warn(string: string) { }
}


describe('LinterhubCli', function () {
    let cli_path: string = "cli-path";
    let project_path: string = "project-path";
    let cli = new LinterhubCli(new LoggerMock(), cli_path, project_path);
    var execute = sinon.stub(cli, 'execute', function (command: string): Promise<{}> {
        return new Promise((resolve, reject) => {
            resolve(command);
        });
    });
    let args = new LinterhubArgs(cli_path, project_path);
    it('executes wrong analyze request', function () {
        return cli.analyze().then(function (x) {
            assert.equal(x, args.analyze());
        })
    });
    it('executes wrong analyze file request', function () {
        let file: string = "file";
        return cli.analyzeFile(file).then(function (x) {
            assert.equal(x, args.analyzeFile(file));
        })
    });
    it('executes wrong catalog request', function () {
        return cli.catalog().then(function (x) {
            assert.equal(x, args.catalog());
        })
    });
    it('executes wrong activate request', function () {
        let linter: string = "linter";
        return cli.activate(linter).then(function (x) {
            assert.equal(x, args.activate(linter));
        })
    });
    it('executes wrong deactivate request', function () {
        let linter: string = "linter";
        return cli.deactivate(linter).then(function (x) {
            assert.equal(x, args.deactivate(linter));
        })
    });
    it('executes wrong version request', function () {
        return cli.version().then(function (x) {
            assert.equal(x, args.version());
        })
    });
    it('executes wrong linter version request', function () {
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
