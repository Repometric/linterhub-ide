"use strict";
const util_1 = require("./util");
const path = require("path");
var LinterhubMode;
(function (LinterhubMode) {
    LinterhubMode[LinterhubMode["dotnet"] = 0] = "dotnet";
    LinterhubMode[LinterhubMode["native"] = 1] = "native";
    LinterhubMode[LinterhubMode["docker"] = 2] = "docker";
})(LinterhubMode = exports.LinterhubMode || (exports.LinterhubMode = {}));
class LinterhubArgs {
    constructor(cliRoot, project, mode = LinterhubMode.dotnet) {
        this.project = project;
        this.cliRoot = cliRoot;
        this.mode = mode;
        this.cliPath = this.prefix() + ' ';
    }
    prefix() {
        switch (this.mode) {
            case LinterhubMode.dotnet:
                return 'dotnet ' + path.join(this.cliRoot, 'cli.dll');
            case LinterhubMode.native:
                return path.join(this.cliRoot, 'cli');
            case LinterhubMode.docker:
                return 'TODO';
        }
        return 'unknown';
    }
    analyze() {
        return this.cliPath + `--mode=analyze --project=${this.project} --linter=jshint`;
    }
    analyzeFile(file) {
        let path = file;
        let normalizedPath = path.replace('file://', '')
            .replace(this.project + '/', '')
            .replace(this.project + '\\', '');
        return this.cliPath + `--mode=analyze --project=${this.project} --file=${normalizedPath}`;
    }
    activate(linter) {
        return this.cliPath + `--mode=activate --project=${this.project} --active=true --linter=${linter}`;
    }
    linterVersion(linter, install) {
        return this.cliPath + (install ? `--mode=LinterInstall --linter=${linter}` : `--mode=LinterVersion --linter=${linter}`);
    }
    deactivate(linter) {
        return this.cliPath + `--mode=activate --project=${this.project} --active=false --linter=${linter}`;
    }
    catalog() {
        return this.cliPath + `--mode=catalog`;
    }
    version() {
        return this.cliPath + `--mode=version`;
    }
}
exports.LinterhubArgs = LinterhubArgs;
class LinterhubCli {
    constructor(log, cliRoot, project, mode = LinterhubMode.dotnet) {
        this.args = new LinterhubArgs(cliRoot, project, mode);
        this.cliRoot = cliRoot;
        this.log = log;
    }
    execute(command) {
        this.log.info('Execute command: ' + command);
        return util_1.executeChildProcess(command, this.cliRoot);
    }
    analyze() {
        return this.execute(this.args.analyze());
    }
    analyzeFile(file) {
        return this.execute(this.args.analyzeFile(file));
    }
    catalog() {
        return this.execute(this.args.catalog());
    }
    activate(linter) {
        return this.execute(this.args.activate(linter));
    }
    linterVersion(linter, install) {
        return this.execute(this.args.linterVersion(linter, install));
    }
    deactivate(linter) {
        return this.execute(this.args.deactivate(linter));
        ;
    }
    version() {
        return this.execute(this.args.version());
    }
}
exports.LinterhubCli = LinterhubCli;
class LinterhubCliLazy extends LinterhubCli {
    constructor(log, cliRoot, project, mode = LinterhubMode.dotnet) {
        super(log, cliRoot, project, mode);
        this.catalogValue = new util_1.Cacheable(() => super.catalog());
        this.versionValue = new util_1.Cacheable(() => super.version());
    }
    catalog() {
        return this.catalogValue.getValue();
    }
    version() {
        return this.versionValue.getValue();
    }
}
exports.LinterhubCliLazy = LinterhubCliLazy;
