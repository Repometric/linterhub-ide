/// <reference path="../typings/globals/mocha/index.d.ts"/>

import assert = require("assert");
var sinon = require('sinon');
var path = require('path');

import { LinterhubArgs } from '../src/linterhub-args';
import { LinterhubTypes } from '../src/linterhub-types';

describe('LinterhubArgs class', function () {
    let obj = new LinterhubArgs("cli-path", "project-path", LinterhubTypes.Mode.dotnet);
    let cli_path: string = "dotnet " + path.join("cli-path", "cli.dll");
    it('analyze request generation', function () {
        assert.equal(obj.analyze(), cli_path + " --mode=analyze --project=project-path");
    });
    it('activate request generation', function () {
        assert.equal(obj.activate("linter"), cli_path + " --mode=activate --project=project-path --active=true --linter=linter");
    });
    it('linterVersion request generation', function () {
        assert.equal(obj.linterVersion("linter", true), cli_path + " --mode=LinterInstall --linter=linter");
        assert.equal(obj.linterVersion("linter", false), cli_path + " --mode=LinterVersion --linter=linter");
    });
    it('deactivate request generation', function () {
        assert.equal(obj.deactivate("linter"), cli_path + " --mode=activate --project=project-path --active=false --linter=linter");
    });
    it('catalog request generation', function () {
        assert.equal(obj.catalog(), cli_path + " --mode=catalog --project=project-path");
    });
    it('version request generation', function () {
        assert.equal(obj.version(), cli_path + " --mode=version");
    });
    it('ignoreWarning request generation', function () {
        assert.equal(obj.ignoreWarning({ file: null, error: null, line: null }), cli_path + " --mode=ignore --project=project-path");
        assert.equal(obj.ignoreWarning({ file: "file", error: null, line: null }), cli_path + " --mode=ignore --project=project-path --file=file");
        assert.equal(obj.ignoreWarning({ file: "file", error: "test", line: null }), cli_path + " --mode=ignore --project=project-path --error=test --file=file");
        assert.equal(obj.ignoreWarning({ file: "file", error: null, line: 10 }), cli_path + " --mode=ignore --project=project-path --file=file --line=10");
    });

});

class LoggerMock {
    info(string: string) { }
    error(string: string) { }
    warn(string: string) { }
}
