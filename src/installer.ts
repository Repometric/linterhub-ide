import * as path from 'path';
import { Linterhub } from './linterhub';
import { Mode, Logger } from './types/integration';
import { Runner } from './runner';
import * as fs from 'fs';
import * as request from 'request';
import * as progress from 'request-progress';
import * as unzip from 'unzip';
import * as si from 'systeminformation';

export interface Platform {
    name: string;
    arch: string;
};

/**
  * Class that provide information for downloading, installing and activating of Linterhub
  * @class Package
  */
export class Package {
    /**
     * Url prefix for CLI releases on github
     */
    readonly prefix: string = "https://github.com/binore/linterhub-cli/releases/download/";
    
    private version: string;
    private mode: Mode;
    private folder: string;
    private info: Platform;

    /**
     * @constructor
     * @param {Platform} info Platform Information contains data obut OS version etc
     * @param {string} folder Folder contains package
     * @param {Mode} mode Execution mode of CLI
     * @param {version} version Linterhub CLI version 
     */
    constructor(info: Platform, folder: string, mode: Mode, version: string) {
        this.info = info;
        this.mode = mode;
        this.folder = folder;
        this.version = version;
    }

    /**
     * Returns package version
     */
    getPackageVersion(): string {
        return this.version;
    }

    /**
     * Returns package name (based on system name and availability of dotnet)
     */
    getPackageName(): string {
        if (this.mode === Mode.dotnet) {
            return "dotnet";
        }
        // TODO: Improve name conversion
        if (this.info.name === "Darwin") {
            return "osx.10.11-x64";
        }
        if (this.info.name === "Windows") {
            return "win10-x64";
        }
        if (this.info.name === "Linux") {
            return "debian.8-x64";
        }
        return "unknown";
    }

    /**
     * Full package name
     */
    getPackageFullName(): string {
        return "linterhub-cli-" + this.getPackageName();
    }

    /**
     * Package file name
     */
    getPackageFileName(): string {
        return this.getPackageFullName() + ".zip";
    }

    /**
     * Full path to package file
     */
    getPackageFullFileName(): string {
        return path.join(this.folder, this.getPackageFileName());
    }

    /**
     * Url for downloading package (on github)
     */
    getPackageUrl(): string {
        return this.prefix + this.version + "/" + this.getPackageFileName();
    }
}

/**
 * Provides methods for downloading and installing of CLI
 */
export class Installer {

    private log: Logger;
    private proxy: string;

    /**
     * Creates new instance of Linterhub Installer
     * @param {Logger} log Object that will be used for logging
     * @param {string} proxy Proxy to use. Null by default
     */
    constructor(log: Logger, proxy: string = null) {
        this.log = log;
        this.proxy = proxy;
    }

    /**
      * Method to install package
      * @method install
      * @param {Mode} mode Describes how to run Cli
      * @param {string} folder Folder to install Linterhub
      * @param {string} version What version of Linterhub Cli to install
      * @returns {Promise<string>} Path to Cli
      */
    public install(mode: Mode, folder: string, version: string): Promise<string> {
        if (mode === Mode.docker) {
            // TODO
            //return downloadDock("repometric/linterhub-cli");
            return null;
        } else {
            return new Promise((resolve, reject) => {
                si.osInfo().then(info => {
                    this.log.info("Platform: " + info.platform);
                    let platform: Platform = {
                        name: info.platform,
                        arch: info.arch
                    };
                    let helper = new Package(platform, folder, mode, version);
                    let name = helper.getPackageFullName();
                    this.log.info("Name: " + name);
                    progress(request({
                        url: helper.getPackageUrl(),
                        proxy: this.proxy
                    }), {})
                        .on('progress', state => {
                            var percent = Math.round(state.percent * 10000) / 100;
                            this.log.info('Downloading.. (' + percent + "%)");
                        })
                        .on('error', err => {
                            this.log.error(err);
                            reject(err);
                        })
                        .on('response', function (res) {
                            res.pipe(fs.createWriteStream(helper.getPackageFullFileName()));
                        })
                        .on('end', () => {
                            this.log.info("Unzipping " + folder);
                            fs.createReadStream(helper.getPackageFullFileName())
                                .pipe(unzip.Extract({ path: folder }))
                                .on('close', function () {
                                    let path_: string = path.resolve(folder, 'bin', helper.getPackageName());
                                    fs.readdir(path_, function(err, files) {
                                        if (err) return;
                                        files.forEach((file) => fs.chmodSync(path.join(path_, file), '755'));
                                    });
                                    resolve(path_);
                                });
                        });
                })
                .catch((e) => this.log.info(e));
            });
        }
    }

    /**
      * Returns Docker version
      * @method getDockerVersion
      * @returns {Promise<string>} Stdout of command
      */
    public getDockerVersion(): Promise<string> {
        return Runner.execute("docker version --format '{{.Server.Version}}'").then(this.removeNewLine);
    }

    /**
      * Returns Dotnet version
      * @method getDotnetVersion
      * @returns {Promise<string>} Stdout of command
      */
    public getDotnetVersion(): Promise<string> {
        return Runner.execute('dotnet --version', null).then(this.removeNewLine);
    }

    private removeNewLine(out: string): string {
        return out.replace('\n', '').replace('\r', '');
    }

    /**
      * Downloads Docker Image
      * @method downloadDock
      * @param {string} name Name of image to download
      * @returns {Promise<string>} Stdout of command
      */
    public downloadDock(name: string): Promise<string> {
        return Runner.execute(`docker pull ${name}`).then(this.removeNewLine);
    }
}
