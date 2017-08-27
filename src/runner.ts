import * as cp from 'child_process';
import { ProgressManager, systemProgressId } from './progress';
import { ArgBuilder } from './arguments';
import { Mode } from './types/integration';
import * as path from 'path';
import { Package, Platform } from './installer';
import * as si from 'systeminformation';
import * as fs from 'fs';

export class Task {
    public command: string;
    public instance: cp.ChildProcess;
    public promise: Promise<string>;
    public finished: boolean = false;

    public constructor(promise: Promise<string>, instance: cp.ChildProcess, command: string)
    {
        this.command = command;
        this.instance = instance;
        this.promise = promise.then((result: string) => {
            this.finished = true;
            return result;
        })
        .catch((e) => {
            this.finished = true;
            return e;
        });
    }
}

/**
 * Can execute different commands (communicate with CLI for example)
 */
export class Runner {
    private static cliPath: string;
    private static mode: Mode;
    private static progress: ProgressManager;
    public static tasks: Task[] = [];

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
            si.osInfo().then(info => {
                let platform: Platform = {
                    name: info.platform,
                    arch: info.arch
                };
                let helper = new Package(platform, cliRoot, mode, null);
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
    public static execute(command: string, workingDirectory: string = this.cliPath, scope: string = systemProgressId, stdin: string = null): Task {

        this.tasks.filter(x => x.command == command).forEach(x => x.instance.kill());
        this.tasks = this.tasks.filter(x => x.finished);
        
        let instance: cp.ChildProcess;
        let promise: Promise<string> = new Promise((resolve, reject) => {
            // TODO: Use spawn and buffers.
            Runner.progress.update(scope, true);
            instance = cp.exec(command, { cwd: workingDirectory, maxBuffer: 1024 * 1024 * 500 }, function (error, stdout, stderr) {
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

        let task: Task = new Task(promise, instance, command);

        this.tasks.push(task);
        return task;
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
        return Runner.execute(new CommandBuilder(this.cliPath, this.mode).build(args), this.cliPath, scope, stdin).promise;
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
