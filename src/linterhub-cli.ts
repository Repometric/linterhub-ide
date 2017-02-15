import { Cacheable, executeChildProcess } from './util'
import { LoggerInterface } from './integration'
import * as path from 'path';

/**
  * List of mode how to execute Linterhub Cli
  * @enum LinterhubMode
  */
export enum LinterhubMode {
    /**
     * Using 'dotnet' command
     */
    dotnet,
    /**
     * Just run dll
     */
    native,
    /**
     * Run linterhub in docker
     */
    docker
}

/**
  * This class generates commands to Linterhub
  * @class LinterhubArgs
  */
export class LinterhubArgs {
    private cliRoot: string;
    private cliPath: string;
    private project: string;
    private mode: LinterhubMode;

    /**
      * @constructor
      * @param {string} cliRoot Directory where extension can find Linterhub Cli
      * @param {string} project Root of current project
      * @param {LinterhubMode} mode Describes how to run Cli
      */
    constructor(cliRoot: string, project: string, mode: LinterhubMode = LinterhubMode.dotnet) {
        this.project = project;
        this.cliRoot = cliRoot;
        this.mode = mode;
        this.cliPath = this.prefix() + ' ';
    }
    public prefix(): string {
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

    /**
      * Analyze whole project
      * @method analyze
      * @returns {string} Command to CLI
      */
    analyze(): string {
        return this.cliPath + `--mode=analyze --project=${this.project}`;
    }

    /**
      * Analyze single file
      * @method analyzeFile
      * @param {string} file Path to this file
      * @returns {string} Command to CLI
      */
    analyzeFile(file: string): string {
        // TODO: Improve this code.
        //let path = Uri.parse(file).fsPath;
        let path = file;
        let normalizedPath = path.replace('file://', '')
            .replace(this.project + '/', '')
            .replace(this.project + '\\', '');
        return this.cliPath + `--mode=analyze --project=${this.project} --file=${normalizedPath}`;
    }

    /**
      * Activate linter
      * @method activate
      * @param {string} linter Name of linter
      * @returns {string} Command to CLI
      */
    activate(linter: string): string {
        return this.cliPath + `--mode=activate --project=${this.project} --active=true --linter=${linter}`;
    }

    /**
      * Install or/and get linter version
      * @method linterVersion
      * @param {string} linter Name of linter
      * @param {boolean} install Try to install linter or not (need su)
      * @returns {string} Command to CLI
      */
    linterVersion(linter: string, install: boolean): string {
        return this.cliPath + (install ? `--mode=LinterInstall --linter=${linter}` : `--mode=LinterVersion --linter=${linter}`);
    }

    /**
      * Deactivate linter
      * @method deactivate
      * @param {string} linter Name of linter
      * @returns {string} Command to CLI
      */
    deactivate(linter: string): string {
        return this.cliPath + `--mode=activate --project=${this.project} --active=false --linter=${linter}`;
    }

    /**
      * Get list of available linters
      * @method catalog
      * @returns {string} Command to CLI
      */
    catalog(): string {
        return this.cliPath + `--mode=catalog`;
    }

    /**
      * Receive version of CLI, Linterhub etc
      * @method analyze
      * @returns {string} Command to CLI
      */
    version(): string {
        return this.cliPath + `--mode=version`;
    }
}

/**
  * This class executes commands to Linterhub Cli
  * @class LinterhubCli
  */
export class LinterhubCli {
    private args: LinterhubArgs;
    private cliRoot: string;
    private log: any;

    /**
      * @constructor
      * @param {LoggerInterface} log Object that will be used for logging
      * @param {string} cliRoot Directory where extension can find Linterhub Cli
      * @param {string} project Root of current project
      * @param {LinterhubMode} mode Describes how to run Cli
      */
    constructor(log: LoggerInterface, cliRoot: string, project: string, mode: LinterhubMode = LinterhubMode.dotnet) {
        this.args = new LinterhubArgs(cliRoot, project, mode);
        this.cliRoot = cliRoot;
        this.log = log;
    }
    public execute(command: string): Promise<{}> {
        // TODO: Return ChildProcess in order to stop analysis when document is closed
        this.log.info('Execute command: ' + command);
        return executeChildProcess(command, this.cliRoot);
    }
    analyze(): Promise<{}> {
        return this.execute(this.args.analyze());
    }
    analyzeFile(file: string): Promise<{}> {
        return this.execute(this.args.analyzeFile(file));
    }
    catalog(): Promise<{}> {
        return this.execute(this.args.catalog());
    }
    activate(linter: string): Promise<{}> {
        return this.execute(this.args.activate(linter));
    }
    linterVersion(linter: string, install: boolean): Promise<{}> {
        return this.execute(this.args.linterVersion(linter, install));
    }
    deactivate(linter: string): Promise<{}> {
        return this.execute(this.args.deactivate(linter));;
    }
    version() {
        return this.execute(this.args.version());
    }
}

/**
  * Extends LinterhubCli, use caching for Catalog and Version api functions
  * @class LinterhubCliLazy
  */
export class LinterhubCliLazy extends LinterhubCli {
    private catalogValue: Cacheable;
    private versionValue: Cacheable;
    constructor(log: any, cliRoot: string, project: string, mode: LinterhubMode = LinterhubMode.dotnet) {
        super(log, cliRoot, project, mode);
        this.catalogValue = new Cacheable(() => super.catalog());
        this.versionValue = new Cacheable(() => super.version());
    }
    catalog() {
        return this.catalogValue.getValue();
    }
    version() {
        return this.versionValue.getValue();
    }
}
