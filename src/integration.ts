import { LinterhubCli, LinterhubMode } from './linterhub-cli';
import { LinterhubInstallation } from './linterhub-installer';
import { Types } from './types';
import * as fs from 'fs';

export enum Run {
    none,
    force,
    onStart,
    onOpen,
    onType,
    onSave
}

export interface AnalyzeResultInterface
{
    Name: string;
    Model: {
        Files: AnalyzeFileInterface[];
        ParseErrors: {
            ErrorMessage: string;
            Input: any;
        };
    };
}

export interface AnalyzeFileInterface
{
    Path: string;
    Errors: AnalyzeErrorInterface[];
}

export interface AnalyzeErrorInterface
{
    Message: string;
    Severity: number;
    Line: number;
    Evidence: string;
    Rule: {
        Name: string;
        Id: string;
        Namespace: string;
    };
    Column: AnalyzeIntervalInterface;
    Row: AnalyzeIntervalInterface;
}

export interface AnalyzeIntervalInterface
{
    Start: number;
    End: number;
}

/**
  * Describes logger provider
  * @interface LoggerInterface
  */
export interface LoggerInterface {
    /**
      * Prints ordinary information
      * @method info
      * @param {string} log Text to print
      */
    info(log: string): void;

    /**
      * Prints errors
      * @method error
      * @param {string} log Text to print
      */
    error(log: string): void;

    /**
      * Prints warnings
      * @method warn
      * @param {string} log Text to print
      */
    warn(log: string): void;
}

/**
  * Describes status provider
  * @interface StatusInterface
  */
export interface StatusInterface {
    /**
      * Updates status string
      * @method update
      * @param {string} text New status
      */
    update(params: any, progress?: boolean, text?: string): void;
}

export interface Settings {
    linterhub: {
        enable: boolean;
        run: Run[];
        mode: LinterhubMode;
        cliPath: string;
        cliRoot: string;
    };
    [key: string]: any;
}

export class Integration {
    protected systemId: string = "_system";
    protected linterhub_version: string;
    protected linterhub: LinterhubCli;
    protected project: string;
    protected logger: LoggerInterface;
    protected status: StatusInterface;

    protected onReady: Promise<{}>;

    protected settings: Settings;
    protected api: any;

    /**
     * Returns current settings
     */
    public getSettings(): Settings {
        return this.settings;
    }

    public initializeLinterhub() {
        this.linterhub = new LinterhubCli(this.logger, this.settings.linterhub.cliPath, this.project, this.settings.linterhub.mode);
        this.onReady = this.linterhub.version();
        return this.onReady;
    }

    constructor(api: any, settings: any) {
        this.logger = api.logger;
        this.status = api.status;
        this.project = api.project;
        this.linterhub_version = api.linterhub_version;
        this.api = api;
        this.settings = settings;
        if (this.settings.linterhub.cliPath === undefined || this.settings.linterhub.mode === undefined || !fs.existsSync(this.settings.linterhub.cliPath)) {
            this.install()
                .then(() => this.initializeLinterhub())
                .then(() => this.api.saveConfig(this.settings));
        }
        else {
            this.onReady = this.initializeLinterhub();
        }
    }

    install(): Promise<string> {
        this.status.update({ id: this.systemId }, true, "Start install process..");

        return LinterhubInstallation.getDotnetVersion()
            .then(() => { this.settings.linterhub.mode = LinterhubMode.dotnet; })
            .catch(() => { this.settings.linterhub.mode = LinterhubMode.native; })
            .then(() => { this.logger.info(`Start download.`); })
            .then(() => {

                return LinterhubInstallation.install(this.settings.linterhub.mode, this.settings.linterhub.cliRoot, null, true, this.logger, this.status, this.linterhub_version)
                    .then((data) => {
                        this.logger.info(`Finish download.`);
                        this.logger.info(data);
                        return data;
                    })
                    .catch((reason) => {
                        this.logger.error(`Error catalog '${reason}.toString()'.`);
                        return "";
                    })
                    .then((result) => {
                        this.status.update({ id: this.systemId }, false, "Active");
                        this.settings.linterhub.cliPath = result;
                        return result;
                    });
            });

    }

    initialize(settings: Settings = null) {

        this.settings = settings;
        this.settings.linterhub.run = this.settings.linterhub.run.map(value => Run[value.toString()]);
        this.settings.linterhub.mode = LinterhubMode[this.settings.linterhub.mode.toString()];
        return this.initializeLinterhub();
        //this.connection.sendRequest(ConfigRequest)
        //    .then((x: ConfigResult) => { this.connection.console.info(x.proxy); });
    }


    /**
     * Analyze project.
     *
     */
    analyze(): Promise<any> {
        return this.onReady
            .then(() => { this.logger.info(`Analyze project.`); })
            .then(() => { this.status.update({ id: this.project }, true, "Analyzing project..."); })
            .then(() => this.linterhub.analyze())
            .then((data: string) => { return this.api.sendDiagnostics(data); })
            .catch((reason) => { this.logger.error(`Error analyze project '${reason}.toString()'.`); })
            .then((data) => {
                this.status.update({ id: this.project }, false, "Active");
                this.logger.info(`Finish analyze project.`);
                return data;
            });
    }

    /**
     * Analyze single file.
     *
     * @param path The relative path to file.
     * @param run The run mode (when).
     * @param document The active document.
     */
    analyzeFile(path: string, run: Run = Run.none, document: any = null): Promise<any> {
        if (this.settings.linterhub.run.indexOf(run) < 0 && run !== Run.force) {
            return null;
        }

        if (document !== null) {
            // TODO
        }

        return this.onReady
            .then(() => this.logger.info(`Analyze file '${path}'.`))
            .then(() => this.status.update({ id: path }, true, "Analyzing file..."))
            .then(() => this.linterhub.analyzeFile(this.api.normalizePath(path)))
            .then((data: string) => {
                return this.api.sendDiagnostics(data, document);
            })
            .catch((reason) => { this.logger.error(`Error analyze file '${reason}.toString()'.`); })
            .then((data) => {
                this.status.update({ id: path }, false, "Active");
                this.logger.info(`Finish analyze file '${path}'.`);
                return data;
            });
    }
    /**
     * Get linters catalog.
     *
     */
    catalog(): Promise<Types.LinterResult[]> {
        return this.onReady
            .then(() => this.status.update({ id: this.systemId }, true, "Getting linters catalog.."))
            .then(() => this.linterhub.catalog())
            .then((data: string) => {
                let json: any = JSON.parse(data);
                this.logger.info(data);
                return json;
            })
            .catch((reason) => {
                this.logger.error(`Error catalog '${reason}.toString()'.`);
                return [];
            })
            .then((result) => {
                this.status.update({ id: this.systemId }, false, "Active");
                return result;
            });
    }
    /**
     * Activate linter.
     *
     * @param name The linter name.
     */
    activate(name: string): Promise<string> {
        return this.onReady
            .then(() => this.status.update({ id: this.systemId }, true, "Activating " + name + "..."))
            .then(() => this.linterhub.activate(name))
            .catch((reason) => this.logger.error(`Error activate '${reason}.toString()'.`))
            .then(() => this.status.update({ id: this.systemId }, false, "Active"))
            .then(() => name);
    }

    /**
     * Ignore warning.
     *
     * @param {IgnoreWarningParams} params Describes warning.
     */
    ignoreWarning(params: Types.IgnoreWarningParams): Promise<string> {
        return this.onReady
            .then(() => this.linterhub.ignoreWarning(params))
            .catch((reason) => this.logger.error(`Catch error while sending ignore request: '${reason}.toString()'.`))
            .then((result) => {
                this.logger.info(`Rule added!`);
                return result;
            });
    }

    /**
     * Get the linter version.
     *
     * @param name The linter name.
     * @param install Install linter or not
     */
    linterVersion(name: string, install: boolean): Promise<Types.LinterVersionResult> {
        return this.onReady
            .then(() => this.status.update({ id: this.systemId }, true))
            .then(() => this.linterhub.linterVersion(name, install))
            .then((data: string) => {
                let json: Types.LinterVersionResult = JSON.parse(data);
                this.logger.info(data);
                return json;
            })
            .catch((reason) => {
                this.logger.error(`Error while requesting linter version '${reason}.toString()'.`);
                return null;
            })
            .then((result) => {
                this.status.update({ id: this.systemId }, false);
                return result;
            });
    }

    /**
     * Deactivate linter.
     *
     * @param name The linter name.
     */
    deactivate(name: string): Promise<string> {
        return this.onReady
            .then(() => this.status.update({ id: this.systemId }, true, "Deactivating " + name + "..."))
            .then(() => this.linterhub.deactivate(name))
            .catch((reason) => this.logger.error(`Error deactivate '${reason}.toString()'.`))
            .then(() => this.status.update({ id: this.systemId }, false, "Active"))
            .then(() => name);
    }

    /**
     * Get linterhub and other versions.
     *
     */
    version(): Promise<string> {
        return this.onReady
            .then(() => {
                return this.linterhub.version();
            })
            .catch((reason) => this.logger.error(reason.toString()));
    }
}
