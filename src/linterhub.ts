import { LinterhubTypes } from './linterhub-types';
import { LinterhubInstaller } from './linterhub-installer';
import { LinterhubArgs } from './linterhub-args';
import * as fs from 'fs';
import * as cp from 'child_process';

export class Linterhub {
    private static systemId: string = "_system";
    private static linterhub_version: string = "0.3.4";
    private static project: string;
    private static logger: LinterhubTypes.LoggerInterface;
    private static status: LinterhubTypes.StatusInterface;
    private static args: LinterhubArgs;
    private static proxy: string;

    private static onReady: Promise<{}>;

    private static settings: LinterhubTypes.Settings;
    private static integration: any;

    /**
     * Function that execute command (used to communicate with cli)
     * @method executeChildProcess
     * @param {string} command Command to execute
     * @param {string} workingDirectory Working directory of process
     * @returns {Promise<string>} Returns stdout
     */
    public static executeChildProcess(command: string, workingDirectory: string = this.settings.linterhub.cliPath): Promise<string> {
        // TODO: Return ChildProcess in order to stop it when needed
        let promise = new Promise((resolve, reject) => {
            // TODO: Use spawn and buffers.
            cp.exec(command, { cwd: workingDirectory, maxBuffer: 1024 * 1024 * 500 }, function (error, stdout, stderr) {
                console.log("Execute: " + command);
                console.log(stdout);
                let execError = stderr.toString();
                if (error) {
                    reject(new Error(error.message));
                } else if (execError !== '') {
                    reject(new Error(execError));
                } else {
                    resolve(stdout);
                }
            });
        });

        return promise;
    }

    /**
     * Returns current settings
     */
    public static getSettings(): LinterhubTypes.Settings {
        return this.settings;
    }

    /**
     * Set proxy for installing Linterhub
     * @param proxy String like [protocol]://[username]:[pass]@[address]:[port]
     */
    public static setProxy(proxy: string): void {
        this.proxy = proxy;
    }

    public static initializeLinterhub(integration: any, settings: LinterhubTypes.Settings): void {
        this.onReady = new Promise((resolve, reject) => { });
        this.logger = integration.logger;
        this.status = integration.status;
        this.project = integration.project;
        this.integration = integration;
        this.settings = settings;
        if (this.settings.linterhub.cliPath === undefined || this.settings.linterhub.mode === undefined || !fs.existsSync(this.settings.linterhub.cliPath)) {
            this.install()
                .catch((error) => this.settings.linterhub.enable = false)
                .then(() => {
                    this.integration.saveConfig(this.settings)
                    this.settings.linterhub.enable = true;
                    this.args = new LinterhubArgs(this.settings.linterhub.cliPath, this.project, this.settings.linterhub.mode);
                    this.onReady = this.executeChildProcess(this.args.version());
                });
        }
        else {
            this.args = new LinterhubArgs(this.settings.linterhub.cliPath, this.project, this.settings.linterhub.mode);
            this.onReady = this.executeChildProcess(this.args.version());
        }
    }

    private static install(): Promise<String> {
        this.status.update({ id: this.systemId }, true, "Start install process..");

        return LinterhubInstaller.getDotnetVersion()
            .then(() => { this.settings.linterhub.mode = LinterhubTypes.Mode.dotnet; })
            .catch(() => { this.settings.linterhub.mode = LinterhubTypes.Mode.native; })
            .then(() => { this.logger.info(`Start download.`); })
            .then(() => {

                return LinterhubInstaller.run(this.settings.linterhub.mode, this.settings.linterhub.cliRoot, this.logger, this.status, this.linterhub_version, this.proxy)
                    .then((data) => {
                        this.logger.info(`Finish download.`);
                        this.status.update({ id: this.systemId }, false, "Active");
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
     *
     */
    public static analyze(): Promise<any> {
        this.onReady = this.onReady
            .then(() => { this.logger.info(`Analyze project.`); })
            .then(() => { this.status.update({ id: this.project }, true, "Analyzing project..."); })
            .then(() => this.executeChildProcess(this.args.analyze()))
            .then((data: string) => { return this.integration.sendDiagnostics(data); })
            .catch((reason) => { this.logger.error(`Error analyze project '${reason}'.`); })
            .then((data) => {
                this.status.update({ id: this.project }, false, "Active");
                this.logger.info(`Finish analyze project.`);
                return data;
            });
        return this.onReady;
    }

    /**
     * Analyze single file.
     *
     * @param path The relative path to file.
     * @param run The run mode (when).
     * @param document The active document.
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
            .then(() => this.status.update({ id: path }, true, "Analyzing file " + relative_path ))
            .then(() => this.executeChildProcess(this.args.analyzeFile(this.integration.normalizePath(relative_path))))
            .then((data: string) => {
                return this.integration.sendDiagnostics(data, document);
            })
            .catch((reason) => { this.logger.error(`Error analyze file ` + reason); })
            .then((data) => {
                this.status.update({ id: path }, false, "Active");
                this.logger.info(`Finish analyze file '${path}'.`);
                return data;
            });
        return this.onReady;
    }

    /**
     * Get linters catalog.
     *
     */
    public static catalog(): Promise<LinterhubTypes.LinterResult[]> {
        this.onReady = this.onReady
            .then(() => this.status.update({ id: this.systemId }, true, "Getting linters catalog.."))
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
                this.status.update({ id: this.systemId }, false, "Active");
                return result;
            });
        return this.onReady;
    }
    /**
     * Activate linter.
     *
     * @param name The linter name.
     */
    public static activate(name: string): Promise<string> {
        this.onReady = this.onReady
            .then(() => this.status.update({ id: this.systemId }, true, "Activating " + name + "..."))
            .then(() => this.executeChildProcess(this.args.activate(name)))
            .then(() => this.status.update({ id: this.systemId }, false, "Active"))
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
            .then(() => this.status.update({ id: this.systemId }, true))
            .then(() => this.executeChildProcess(this.args.linterVersion(name, install)))
            .then((data: string) => {
                let json: LinterhubTypes.LinterVersionResult = JSON.parse(data);
                this.logger.info(data);
                return json;
            })
            .catch((reason) => {
                this.logger.error(`Error while requesting linter version '${reason}'.`);
                return null;
            })
            .then((result) => {
                this.status.update({ id: this.systemId }, false);
                return result;
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
            .then(() => this.status.update({ id: this.systemId }, true, "Deactivating " + name + "..."))
            .then(() => this.executeChildProcess(this.args.deactivate(name)))
            .then(() => this.status.update({ id: this.systemId }, false, "Active"))
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
