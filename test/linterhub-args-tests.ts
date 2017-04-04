/// <reference path="../typings/globals/mocha/index.d.ts"/>

import assert = require("assert");
var sinon = require('sinon');

import { LinterhubArgs } from '../src/linterhub-args';
import { LinterhubTypes } from '../src/linterhub-types';

describe('LinterhubArgs class', function () {
    let obj = new LinterhubArgs("cli-path", "project-path", LinterhubTypes.Mode.dotnet);
    it('analyze request generation', function () {
        assert.equal(obj.analyze(), "dotnet cli-path\\cli.dll --mode=analyze --project=project-path");
    });
    it('activate request generation', function () {
        assert.equal(obj.activate("linter"), "dotnet cli-path\\cli.dll --mode=activate --project=project-path --active=true --linter=linter");
    });
    it('linterVersion request generation', function () {
        assert.equal(obj.linterVersion("linter", true), "dotnet cli-path\\cli.dll --mode=LinterInstall --linter=linter");
        assert.equal(obj.linterVersion("linter", false), "dotnet cli-path\\cli.dll --mode=LinterVersion --linter=linter");
    });
    it('deactivate request generation', function () {
        assert.equal(obj.deactivate("linter"), "dotnet cli-path\\cli.dll --mode=activate --project=project-path --active=false --linter=linter");
    });
    it('catalog request generation', function () {
        assert.equal(obj.catalog(), "dotnet cli-path\\cli.dll --mode=catalog --project=project-path");
    });
    it('version request generation', function () {
        assert.equal(obj.version(), "dotnet cli-path\\cli.dll --mode=version");
    });
    it('ignoreWarning request generation', function () {
        assert.equal(obj.ignoreWarning({ file: null, error: null, line: null }), "dotnet cli-path\\cli.dll --mode=ignore --project=project-path");
        assert.equal(obj.ignoreWarning({ file: "file", error: null, line: null }), "dotnet cli-path\\cli.dll --mode=ignore --project=project-path --file=file");
        assert.equal(obj.ignoreWarning({ file: "file", error: "test", line: null }), "dotnet cli-path\\cli.dll --mode=ignore --project=project-path --error=test --file=file");
        assert.equal(obj.ignoreWarning({ file: "file", error: null, line: 10 }), "dotnet cli-path\\cli.dll --mode=ignore --project=project-path --file=file --line=10");
    });

});

class LoggerMock {
    info(string: string) { }
    error(string: string) { }
    warn(string: string) { }
}

