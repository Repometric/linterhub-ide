import { LinterhubTypes } from './linterhub-types';
import { LinterhubInstaller } from './linterhub-installer';
import { LinterhubArgs } from './linterhub-args';
import * as fs from 'fs';
import * as cp from 'child_process';

/**
  * Represets wrapper for Linterhub cli
  * @class Linterhub
  */
export class Linterhub {
    private static systemId: string = "_system";
    private static linterhub_version: string = "0.3.4";
    private static project: string;
    private static logger: LinterhubTypes.LoggerInterface;
    private static status: LinterhubTypes.StatusInterface;
    private static args: LinterhubArgs;
    private static proxy: string;

    private static onReady: Promise<any>;

    private static settings: LinterhubTypes.Settings;
    private static integration: LinterhubTypes.Integration;

    /**
     * Function that execute command (used to communicate with cli)
     * @method executeChildProcess
     * @param {string} command Command to execute
     * @param {string} workingDirectory Working directory of process
     * @returns {Promise<string>} Returns stdout
     */
    public static executeChildProcess(command: string, workingDirectory: string = this.settings.linterhub.cliPath, scope: string = this.systemId): Promise<string> {
        if(workingDirectory === "")
        {
            workingDirectory = this.settings.linterhub.cliPath;
        }
        // TODO: Return ChildProcess in order to stop it when needed
        let promise = new Promise((resolve, reject) => {
            // TODO: Use spawn and buffers.
            Linterhub.status.update(scope, true);
            cp.exec(command, { cwd: workingDirectory, maxBuffer: 1024 * 1024 * 500 }, function (error, stdout, stderr) {
                let execError = stderr.toString();
                if (error) {
                    reject(new Error(error.message));
                } else if (execError !== '') {
                    reject(new Error(execError));
                } else {
                    resolve(stdout);
                }
                Linterhub.status.update(scope, false);
            });
        });

        return promise;
    }

    /**
     * Returns current settings
     * @returns {LinterhubTypes.Settings} Settings of Linterhub class
     */
    public static getSettings(): LinterhubTypes.Settings {
        return this.settings;
    }

    /**
     * Set proxy for installing Linterhub
     * @param {string} proxy String like [protocol]://[username]:[pass]@[address]:[port]
     */
    public static setProxy(proxy: string): void {
        this.proxy = proxy;
    }

    /**
     * Initialize Linterhub for current project
     * @param {LinterhubTypes.Integration} integration - Object of class that implements specific methods like convertation of errors etc.
     * @param {LinterhubTypes.Settings} settings Instance of Linterhub Settings
     */
    public static initializeLinterhub(integration: LinterhubTypes.Integration, settings: LinterhubTypes.Settings): void {
        this.onReady = new Promise((resolve, reject) => {
            this.logger = integration.logger;
            this.status = integration.status;
            this.project = integration.project;
            this.integration = integration;
            this.settings = settings;
            if (this.settings.linterhub.cliPath === undefined || this.settings.linterhub.mode === undefined || !fs.existsSync(this.settings.linterhub.cliPath)) {
                this.install()
                    .catch((error) => {
                        this.settings.linterhub.enable = false;
                        reject();
                    })
                    .then((data) => {
                        this.logger.info(JSON.stringify(this.settings));
                        this.integration.saveConfig(this.settings);
                        this.settings.linterhub.enable = true;
                        this.args = new LinterhubArgs(this.settings.linterhub.cliPath, this.project, this.settings.linterhub.mode);
                        resolve();
                    });
            }
            else {
                this.logger.info(JSON.stringify(this.settings));
                this.args = new LinterhubArgs(this.settings.linterhub.cliPath, this.project, this.settings.linterhub.mode);
                resolve();
            }
        });
    }

    /**
     * Install Linterhub Cli (REMEMBER: This method is public only for testing, it should be called only in Linterhub Class)
     */
    public static install(): Promise<String> {
        return LinterhubInstaller.getDotnetVersion()
            .then(() => { this.settings.linterhub.mode = LinterhubTypes.Mode.dotnet; })
            .catch(() => { this.settings.linterhub.mode = LinterhubTypes.Mode.native; })
            .then(() => { this.logger.info(`Start download.`); })
            .then(() => {
                return LinterhubInstaller.run(this.settings.linterhub.mode, this.settings.linterhub.cliRoot, this.logger, this.linterhub_version, this.proxy)
                    .then((data) => {
                        this.logger.info(`Finish download.`);
                        this.settings.linterhub.cliPath = data;
                        return data;
                    })
                    .catch((reason) => {
                        this.logger.error('Error while installing ' + reason + '.');
                        return "";
                    });
            });

    }

    /**
     * Analyze project.
     * @returns {any} Data with problems, converted to specific for ide format
     */
    public static analyze(): Promise<string> {
        this.onReady = this.onReady
            .then(() => { this.logger.info(`Analyze project.`); })
            .then(() => this.executeChildProcess(this.args.analyze(), "", this.project))
            .then((data: string) => { return this.integration.sendDiagnostics(data); })
            .catch((reason) => { this.logger.error(`Error analyze project '${reason}'.`); })
            .then((data) => {
                this.logger.info(`Finish analyze project.`);
                return data;
            });
        return this.onReady;
    }

    /**
     * Analyze single file.
     *
     * @param {string} path The relative path to file.
     * @param {LinterhubTypes.Run} run Run mode.
     * @param {any} document The active document.
     * @returns {any} Data with problems, converted to specific for ide format
     */
    public static analyzeFile(path: string, run: LinterhubTypes.Run = LinterhubTypes.Run.none, document: any = null): Promise<any> {
        if (this.settings.linterhub.run.indexOf(run) < 0 && run !== LinterhubTypes.Run.force) {
            return null;
        }

        if (document !== null) {
            // TODO
        }

        let relative_path = path.replace('file://', '')
            .replace(this.project + '/', '')
            .replace(this.project + '\\', '');

        this.onReady = this.onReady
            .then(() => this.logger.info(`Analyze file '${path}'.`))
            .then(() => this.executeChildProcess(this.args.analyzeFile(this.integration.normalizePath(relative_path)), "", path))
            .then((data: string) => {
                return this.integration.sendDiagnostics(data, document);
            })
            .catch((reason) => { this.logger.error(`Error analyze file ` + reason); })
            .then((data) => {
                this.logger.info(`Finish analyze file '${path}'.`);
                return data;
            });
        return this.onReady;
    }

    /**
     * Get linters catalog.
     * @returns {LinterhubTypes.LinterResult[]} Array of linters, available in Linterhub Cli
     */
    public static catalog(): Promise<LinterhubTypes.LinterResult[]> {
        this.onReady = this.onReady
            .then(() => this.executeChildProcess(this.args.catalog()))
            .then((data: string) => {
                let json: any = JSON.parse(data);
                this.logger.info(data);
                return json;
            })
            .catch((reason) => {
                this.logger.error(`Error catalog '${reason}'.`);
                return [];
            })
            .then((result) => {
                return result;
            });
        return this.onReady;
    }
    /**
     * Activate linter.
     *
     * @param name The linter name.
     * @returns {string} Must return linter name (for validation)
     */
    public static activate(name: string): Promise<string> {
        this.onReady = this.onReady
            .then(() => this.executeChildProcess(this.args.activate(name)))
            .then(() => name);
        return this.onReady;
    }

    /**
     * Ignore warning.
     *
     * @param {IgnoreWarningParams} params Describes warning.
     */
    public static ignoreWarning(params: LinterhubTypes.IgnoreWarningParams): Promise<string> {
        this.onReady = this.onReady
            .then(() => this.executeChildProcess(this.args.ignoreWarning(params)))
            .catch((reason) => this.logger.error(`Catch error while sending ignore request: '${reason}'.`))
            .then((result) => {
                this.logger.info(`Rule added!`);
                return result;
            });
        return this.onReady;
    }

    /**
     * Get the linter version.
     *
     * @param name The linter name.
     * @param install Install linter or not
     */
    public static linterVersion(name: string, install: boolean): Promise<LinterhubTypes.LinterVersionResult> {
        this.onReady = this.onReady
            .then(() => this.executeChildProcess(this.args.linterVersion(name, install)))
            .then((data: string) => {
                let json: LinterhubTypes.LinterVersionResult = JSON.parse(data);
                this.logger.info(data);
                return json;
            })
            .catch((reason) => {
                this.logger.error(`Error while requesting linter version '${reason}'.`);
                return null;
            });
        return this.onReady;
    }

    /**
     * Deactivate linter.
     *
     * @param name The linter name.
     */
    public static deactivate(name: string): Promise<string> {
        this.onReady = this.onReady
            .then(() => this.executeChildProcess(this.args.deactivate(name)))
            .then(() => name);
        return this.onReady;
    }

    /**
     * Get linterhub and other versions.
     *
     */
    public static version(): Promise<string> {
        this.onReady = this.onReady
            .then(() => {
                return this.executeChildProcess(this.args.version());
            })
            .catch((reason) => this.logger.error(reason.toString()));
        return this.onReady;
    }
}
