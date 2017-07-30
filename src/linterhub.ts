import { Logger, Config, Integration, Mode } from './types/integration';
import { Installer } from './installer';
import { ArgBuilder, Argument } from './arguments';
import { Runner } from './runner';
import { Component, LinterhubVersion, Engine, AnalyzeResult, EngineResult } from './types/linterhub';
import { systemProgressId } from './progress';
import * as fs from 'fs';

/**
  * Represets wrapper for Linterhub cli
  * @class Linterhub
  */
export class Linterhub {
    private static linterhub_version: string = "0.5.2";
    
    private static project: string;

    private static config: Config;
    private static integration: Integration;

    private static saveConfig()
    {
        fs.writeFileSync('./config.json', JSON.stringify(this.config, null, 2));
    }

    private static loadConfig()
    {
        this.config = require('../../config.json');
    }

    /**
     * Set proxy for installing Linterhub
     * @param {string} proxy String like [protocol]://[username]:[pass]@[address]:[port]
     */
    public static setProxy(proxy: string): void {
        this.config.proxy = proxy;
    }

    /**
     * Initialize Linterhub
     * @param {Integration} integration
     * @return {Promise<{}>}
     */
    public static initialize(integration: Integration): Promise<{}> {
        this.loadConfig();
        return new Promise((resolve, reject) => {
            this.integration = integration;
            Runner.init(this.config.cliRoot, this.config.mode, integration.progress)
                .then((cliPath: string) => {
                    resolve();
                })
                .catch(() => {
                    this.install()
                        .catch((error) => {
                            this.config.enable = false;
                            this.saveConfig();
                            reject();
                        })
                        .then((data: string) => {
                            console.log("lel");
                            this.config.enable = true;
                            this.saveConfig();
                            Runner.init(this.config.cliRoot, this.config.mode, this.integration.progress);
                            resolve();
                        });
                });
        });
    }

    /**
     * Install Linterhub Cli
     */
    private static install(): Promise<string> {
        let installer: Installer = new Installer(this.integration.logger);
        if(this.config.cliRoot === "")
        {
            this.config.cliRoot = __dirname;
            this.saveConfig();
        }
        return installer.getDotnetVersion()
            .then(() => { this.config.mode = Mode.dotnet; })
            .catch(() => { this.config.mode = Mode.native; })
            .then(() => { this.integration.logger.info(`Start download.`); })
            .then(() => {
                return installer.install(this.config.mode, this.config.cliRoot, this.linterhub_version)
                    .then((data) => {
                        this.integration.logger.info(`Finish download.`);
                        this.saveConfig();
                        return data;
                    })
                    .catch((reason) => {
                        this.integration.logger.error('Error while installing ' + reason + '.');
                        return "";
                    });
            });

    }

    /**
     * Run analyze
     * @param {string?} project Project path
     * @param {string?} folder Folder path/name
     * @param {string?} file File name
     * @param {string?} engine Engine (Can be more than one, use comma as delim)
     * @param {string?} stdin Use it to analyze buffered in memory code
     * @returns {EngineResult[]}
     */
    public static analyze(project: string = null, folder: string = null, file: string = null, engine: string = null, stdin: string = null): Promise<EngineResult[]> {
        let args: ArgBuilder = new ArgBuilder();

        args.addRange([ 
            { key: 'mode', value: stdin !== null ? 'analyzeStdin' : 'analyze' },
            { key: 'project', value: project },
            { key: 'folder', value: folder },
            { key: 'file', value: file },
            { key: 'engine', value: engine },
        ]);

        return new Promise((resolve, reject) => {
            if(this.config.enable)
            {
                this.integration.logger.info(`Start analyze.`);
                Runner.executeCommand(args, systemProgressId, stdin) // TODO
                    .then((result: string) => {
                        let json: EngineResult[] = JSON.parse(result);
                        this.integration.logger.info(`Finish analyze.`);
                        resolve(json);
                    })
                    .catch((reason) => {
                        this.integration.logger.error(`Catch error while analyze.`);
                        reject(JSON.parse(reason));
                    });
            }
            else
            {
                reject();
            }
        });
    }

    /**
     * Get engines catalog.
     * @param {string?} project Current project (to return activated linters)
     * @returns {Engine[]} Array of engines, available in Linterhub Cli
     */
    public static catalog(project: string = null): Promise<Engine[]> {
        // TODO: use Error type for reject
        let args: ArgBuilder = new ArgBuilder();

        args.addRange([
            { key: 'mode', value: `catalog` },
            { key: 'project', value: project }
        ]);

        return new Promise((resolve, reject) => {
            if(this.config.enable)
            {
                Runner.executeCommand(args, systemProgressId)
                    .then((result: string) => {
                        let json: Engine[] = JSON.parse(result);
                        this.integration.logger.info(result);
                        resolve(json);
                    })
                    .catch((reason) => {
                        this.integration.logger.error(`Catch error while getting catalog.`);
                        reject(JSON.parse(reason));
                    });
            }
            else
            {
                reject();
            }
        });
    }

    /**
     * Activate or deactivate engine.
     * @param {string} project Project path
     * @param {string} name Engine name
     * @param {boolean?} activate Activate or deactivate engine for project
     */
    public static engineConfig(project: string, name: string, activate: boolean = true): Promise<{}> {
        let args: ArgBuilder = new ArgBuilder();

        args.addRange([
            { key: 'mode', value: 'activate' },
            { key: 'project', value: project },
            { key: 'activate', value: activate ? 'true' : 'false' },
            { key: 'engine', value: name }
        ]);

        return new Promise((resolve, reject) => {
            if(this.config.enable)
            {
                Runner.executeCommand(args, systemProgressId)
                    .then((result: string) => {
                        resolve();
                    })
                    .catch((reason) => {
                        this.integration.logger.error(`Catch error while configuring engine.`);
                        reject(JSON.parse(reason));
                    });
            }
            else
            {
                reject();
            }
        });
    }

    /**
     * Add ignore rule.
     * @param {string} project Project path
     * @param {string?} folder Relative path to folder
     * @param {string?} file Relative path to file
     * @param {number?} line Line to ignore
     * @param {string?} ruleId Rule to ignore
     * @param {string?} engine Ignore only for this engine
     */
    public static addIgnoreRule(project: string, folder: string, file: string = null, line: number = null, ruleId: string = null, engine: string = null): Promise<{}> {
        let args: ArgBuilder = new ArgBuilder();

        args.addRange([
            { key: 'mode', value: 'ignore' },
            { key: 'project', value: project },
            { key: 'line', value: line === null ? null : line.toString() },
            { key: 'ruleid', value: ruleId },
            { key: 'file', value: file },
            { key: 'folder', value: folder },
            { key: 'engine', value: engine }
        ]);

        return new Promise((resolve, reject) => {
            if(this.config.enable)
            {
                Runner.executeCommand(args, systemProgressId)
                    .then((result: string) => {
                        this.integration.logger.info(`Rule added!`);
                        resolve();
                    })
                    .catch((reason) => {
                        this.integration.logger.error(`Catch error while adding ignore rule.`);
                        reject(JSON.parse(reason));
                    });
            }
            else
            {
                reject();
            }
        });
    }

    /**
     * Get the engine version.
     * @method engineVersion
     * @param {string} name The engine name.
     * @param {boolean?} install Install engine or not
     * @return {Promise<EngineVersion>}
     */
    public static engineVersion(name: string, install: boolean = false): Promise<Component> {
        let args: ArgBuilder = new ArgBuilder();

        args.addRange([
            { key: 'mode', value: install ? `engineInstall` : `engineVersion` },
            { key: 'engine', value: name }
        ]);

        return new Promise((resolve, reject) => {
            if(this.config.enable)
            {
                Runner.executeCommand(args, systemProgressId)
                    .then((result: string) => {
                        let json: Component = JSON.parse(result);
                        resolve(json);
                    })
                    .catch((reason) => {
                        this.integration.logger.error(`Catch error while requesting engine version.`);
                        reject(JSON.parse(reason));
                    });
            }
            else
            {
                reject();
            }
        });
    }

    /**
     * Get Linterhub CLI version
     * @method version
     * @return {Promise<LinterhubVersion>}
     */
    public static version(): Promise<LinterhubVersion> {
        let args: ArgBuilder = new ArgBuilder();
        args.add({ key: 'mode', value: `version` });

        return new Promise((resolve, reject) => {
            if(this.config.enable)
            {
                Runner.executeCommand(args, systemProgressId)
                    .then((result: string) => {
                        resolve({
                            version: result
                        });
                    })
                    .catch((reason) => {
                        this.integration.logger.error(`Catch error while getting linterhub version.`);
                        reject(JSON.parse(reason));
                    });
            }
            else
            {
                reject();
            }
        });
    }
}
