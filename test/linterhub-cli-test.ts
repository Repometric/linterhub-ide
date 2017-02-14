/// <reference path="../typings/globals/mocha/index.d.ts"/>
/// <reference path="../typings/globals/assert/index.d.ts"/>
 
import assert = require("assert");
import { LinterhubArgs, LinterhubMode } from '../src/linterhub-cli';
 
describe('LinterhubArgs', function() {
    let obj = new LinterhubArgs("cli-path", "project-path", LinterhubMode.dotnet);
    it('generates wrong prefix', function() {        
        assert.equal(obj.prefix(), "dotnet cli-path/cli.dll");
    });
    it('generates wrong analyze path', function() {        
        assert.equal(obj.analyze(), "dotnet cli-path/cli.dll --mode=analyze --project=project-path");
    });
});