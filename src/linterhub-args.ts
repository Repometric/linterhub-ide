import * as path from 'path';
import { LinterhubTypes } from './linterhub-types';

/**
  * This class generates commands to Linterhub
  * @class LinterhubArgs
  */
export class LinterhubArgs {
    private cliRoot: string;
    private cliPath: string;
    private project: string;
    private mode: LinterhubTypes.Mode;

    /**
      * @constructor
      * @param {string} cliRoot Directory where extension can find Linterhub Cli
      * @param {string} project Root of current project
      * @param {LinterhubType.Mode} mode Describes how to run Cli
      */
    constructor(cliRoot: string, project: string, mode: LinterhubTypes.Mode = LinterhubTypes.Mode.dotnet) {
        this.project = project;
        this.cliRoot = cliRoot;
        this.mode = mode;
        this.cliPath = this.prefix() + ' ';
    }

    private prefix(): string {
        switch (this.mode) {
            case LinterhubTypes.Mode.dotnet:
                return 'dotnet ' + path.join(this.cliRoot, 'cli.dll');
            case LinterhubTypes.Mode.native:
                return path.join(this.cliRoot, 'cli');
            case LinterhubTypes.Mode.docker:
                return 'TODO';
        }

        return 'unknown';
    }

    /**
      * Analyze whole project
      * @method analyze
      * @returns {string} Command to CLI
      */
    public analyze(): string {
        return this.cliPath + `--mode=analyze --project=${this.project}`;
    }

    /**
      * Analyze single file
      * @method analyzeFile
      * @param {string} file Path to this file
      * @returns {string} Command to CLI
      */
    public analyzeFile(file: string): string {
        return this.cliPath + `--mode=analyze --project=${this.project} --file=${file}`;
    }

    /**
      * Activate linter
      * @method activate
      * @param {string} linter Name of linter
      * @returns {string} Command to CLI
      */
    public activate(linter: string): string {
        return this.cliPath + `--mode=activate --project=${this.project} --active=true --linter=${linter}`;
    }

    /**
      * Install or/and get linter version
      * @method linterVersion
      * @param {string} linter Name of linter
      * @param {boolean} install Try to install linter or not (need su)
      * @returns {string} Command to CLI
      */
    public linterVersion(linter: string, install: boolean): string {
        return this.cliPath + (install ? `--mode=LinterInstall --linter=${linter}` : `--mode=LinterVersion --linter=${linter}`);
    }

    /**
      * Deactivate linter
      * @method deactivate
      * @param {string} linter Name of linter
      * @returns {string} Command to CLI
      */
    public deactivate(linter: string): string {
        return this.cliPath + `--mode=activate --project=${this.project} --active=false --linter=${linter}`;
    }

    /**
      * Get list of available linters
      * @method catalog
      * @returns {string} Command to CLI
      */
    public catalog(): string {
        return this.cliPath + `--mode=catalog --project=${this.project}`;
    }

    /**
      * Add ignore rule
      * @method ignoreWarning
      * @param {LinterhubTypes.IgnoreWarningParams} params Describes warning.
      * @returns {string} Command to CLI
      */
    public ignoreWarning(params: LinterhubTypes.IgnoreWarningParams): string {
        let command: string = this.cliPath + `--mode=ignore --project=${this.project}`;
        if (params.error !== null) {
            command += " --error=" + params.error;
        }
        if (params.file !== null) {
            command += " --file=" + params.file;
        }
        if (params.line !== null) {
            command += " --line=" + params.line;
        }
        return command;
    }

    /**
      * Receive version of CLI, Linterhub etc
      * @method version
      * @returns {string} Command to CLI
      */
    public version(): string {
        return this.cliPath + `--mode=version`;
    }
}
