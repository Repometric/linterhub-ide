import * as cp from 'child_process';
import { ProgressManager, systemProgressId } from './progress';
import { ArgBuilder } from './arguments';
import { Mode } from './types/integration';
import * as path from 'path';
import { Package } from './installer';
import { PlatformInformation } from './platform';
import * as fs from 'fs';

/**
 * Can execute different commands (communicate with CLI for example)
 */
export class Runner {
    private static cliPath: string;
    private static mode: Mode;
    private static progress: ProgressManager;

    /**
     * Init Runner
     * @param {string} cliRoot Where to find CLI 
     * @param {Mode} mode CLI execution mode
     * @param {ProgressManager} status 
     */
    public static init(cliRoot: string, mode: Mode, progress: ProgressManager): Promise<string> {
        this.mode = mode;
        this.progress = progress;
        return new Promise((resolve, reject) => {
            PlatformInformation.GetCurrent().then(info => {
                let helper = new Package(info, cliRoot, mode, null);
                this.cliPath = path.resolve(cliRoot, 'bin', helper.getPackageName());
                if (!fs.existsSync(this.cliPath)) {
                    reject();
                }
                else {
                    resolve(this.cliPath);
                }
            });
        });
    }

    /**
     * Invoke any commands
     * @method executeChildProcess
     * @param {string} command Command to execute
     * @param {string?} workingDirectory Working directory of process
     * @param {string?} scope Scope for status events
     * @param {string?} stdin Stdin string
     * @returns {Promise<string>} Returns stdout
     */
    public static execute(command: string, workingDirectory: string = this.cliPath, scope: string = systemProgressId, stdin: string = null): Promise<string> {
        console.log(command)
        // TODO: Return ChildProcess in order to stop it when needed
        return new Promise((resolve, reject) => {
            // TODO: Use spawn and buffers.
            Runner.progress.update(scope, true);
            let process = cp.exec(command, { cwd: workingDirectory, maxBuffer: 1024 * 1024 * 500 }, function (error, stdout, stderr) {
                let execError = stderr.toString();
                if (error) {
                    reject(stdout);
                } else if (execError !== '') {
                    reject(stdout);
                } else {
                    resolve(stdout);
                }
                Runner.progress.update(scope, false);
            });
            if (stdin !== null) {
                process.stdin.write(stdin);
                process.stdin.end();
            }
        });
    }

    /**
     * Send request to CLI with arguments
     * @method executeCommand
     * @param {ArgBuilder} args List of arguments 
     * @param {string?} scope Scope for status events
     * @param {string?} stdin Stdin string
     * @returns {Promise<string>} Returns stdout
     */
    public static executeCommand(args: ArgBuilder, scope: string, stdin: string = null): Promise<string> {
        return Runner.execute(new CommandBuilder(this.cliPath, this.mode).build(args), this.cliPath, scope, stdin);
    }
}

/**
  * This class generates commands to Linterhub
  * @class CommandBuilder
  */
export class CommandBuilder {
    private cli: string;
    private mode: Mode;

    /**
      * @constructor
      * @param {string} cliPath Directory where extension can find Linterhub Cli
      * @param {Mode} mode Execution mode of CLI
      */
    constructor(cliPath: string, mode: Mode = Mode.native) {
        this.mode = mode;
        this.cli = this.prefix(cliPath) + ' ';
    }

    private prefix(cliPath: string): string {
        switch (this.mode) {
            case Mode.dotnet:
                return 'dotnet ' + path.join(cliPath, 'cli.dll');
            case Mode.native:
                return path.join(cliPath, 'cli');
            /*case LinterhubTypes.Mode.docker:
                return 'TODO';*/
        }

        return 'unknown';
    }

    /**
     * Create full command string
     * @param {ArgBuilder} args List of arguments
     * @return {string}
     */
    public build(args: ArgBuilder): string {
        return this.cli + args.generate();
    }
}
