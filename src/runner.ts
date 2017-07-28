import * as cp from 'child_process';
import { Status } from './types/integration';
import { ArgBuilder } from './arguments';
import { Mode } from './types/integration';
import * as path from 'path';
import { Package } from './installer';
import { PlatformInformation } from './platform';
import * as fs from 'fs';

export class Runner {
    private static cliPath: string;
    private static mode: Mode;
    private static status: Status;

    public static init(cliRoot: string, mode: Mode, status: Status): Promise<string> {
        this.mode = mode;
        this.status = status;
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
     * Function that execute command (used to communicate with cli)
     * @method executeChildProcess
     * @param {string} command Command to execute
     * @param {string} workingDirectory Working directory of process
     * @returns {Promise<string>} Returns stdout
     */
    public static execute(command: string, workingDirectory: string = this.cliPath, scope: string = Status.systemId, stdin: string = null): Promise<string> {
        console.log(command)
        // TODO: Return ChildProcess in order to stop it when needed
        return new Promise((resolve, reject) => {
            // TODO: Use spawn and buffers.
            Runner.status.update(scope, true);
            let process = cp.exec(command, { cwd: workingDirectory, maxBuffer: 1024 * 1024 * 500 }, function (error, stdout, stderr) {
                let execError = stderr.toString();
                if (error) {
                    reject(new Error(error.message));
                } else if (execError !== '') {
                    reject(new Error(execError));
                } else {
                    resolve(stdout);
                }
                Runner.status.update(scope, false);
            });
            if (stdin !== null) {
                process.stdin.write(stdin);
                process.stdin.end();
            }
        });
    }

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

    public build(args: ArgBuilder): string {
        return this.cli + args.generate();
    }
}
