import * as path from 'path';
import { PlatformInformation } from './platform';
import { Linterhub } from './linterhub';
import { LinterhubTypes } from './linterhub-types';
var fs = require('fs');
var request = require('request');
var progress = require('request-progress');
var unzip = require('unzip');

/**
  * Class that provide information for downloading, installing and activating Linterhub
  * @class LinterhubPackage
  */
class LinterhubPackage {
    readonly prefix: string = "https://github.com/Repometric/linterhub-cli/releases/download/";
    private version: string;
    private info: PlatformInformation;
    private native: boolean;
    private folder: string;
    constructor(info: PlatformInformation, folder: string, native: boolean, version: string) {
        this.info = info;
        this.native = native;
        this.folder = folder;
        this.version = version;
    }

    getPackageVersion(): string {
        return this.version;
    }

    getPackageName(): string {
        if (!this.native) {
            return "dotnet";
        }
        // TODO: Improve name conversion
        if (this.info.isMacOS()) {
            return "osx.10.11-x64";
        }
        if (this.info.isWindows()) {
            return "win10-x64";
        }
        if (this.info.isLinux()) {
            return "debian.8-x64";
        }
        return "unknown";
    }

    getPackageFullName(): string {
        return "linterhub-cli-" + this.getPackageName();
    }
    getPackageFileName(): string {
        return this.getPackageFullName() + ".zip";
    }
    getPackageFullFileName(): string {
        return path.join(this.folder, this.getPackageFileName());
    }
    getPackageUrl(): string {
        return this.prefix + this.version + "/" + this.getPackageFileName();
    }
}

export namespace LinterhubInstaller {

    /**
      * Function that installs Linterhub
      * @function install
      * @param {LinterhubMode} mode Describes how to run Cli
      * @param {string} folder Folder to install Linterhub
      * @param {LoggerInterface} log Object that will be used for logging
      * @param {StatusInterface} status Object that will be used for changing status
      * @param {string} version What version of Linterhub Cli to install
      * @param {string} proxy Proxy to use
      * @returns {Promise<string>} Path to Cli
      */
    export function run(mode: LinterhubTypes.Mode, folder: string, log: LinterhubTypes.LoggerInterface, status: LinterhubTypes.StatusInterface, version: string, proxy: string): Promise<string> {
        // TODO
        if (mode === LinterhubTypes.Mode.docker) {
            return downloadDock("repometric/linterhub-cli");
        } else {
            return new Promise((resolve, reject) => {
                PlatformInformation.GetCurrent().then(info => {
                    log.info("Platform: " + info.toString());
                    let helper = new LinterhubPackage(info, folder, mode === LinterhubTypes.Mode.native, version);
                    let name = helper.getPackageFullName();
                    log.info("Name: " + name);
                    progress(request({
                            url: helper.getPackageUrl(),
                            proxy: proxy
                        }), {})
                        .on('progress', state => {
                            var percent = Math.round(state.percent * 10000) / 100;
                            status.update(null, true, 'Downloading.. (' + percent + "%)");
                        })
                        .on('error', err => log.error(err))
                        .on('response', function(res){
                            res.pipe(fs.createWriteStream(helper.getPackageFullFileName()));
                        })
                        .on('end', () => {
                            log.info("Unzipping " + folder);
                            fs.createReadStream(helper.getPackageFullFileName()).pipe(unzip.Extract({ path: folder }));
                            resolve(path.resolve(folder, 'bin', helper.getPackageName()));
                        })
                });
            });
        }
    }

    /**
      * This function returns Docker version
      * @function getDockerVersion
      * @returns {Promise<string>} Stdout of command
      */
    export function getDockerVersion() {
        return Linterhub.executeChildProcess("docker version --format '{{.Server.Version}}'", null).then(removeNewLine);
    }

    /**
      * This function returns Dotnet version
      * @function getDotnetVersion
      * @returns {Promise<string>} Stdout of command
      */
    export function getDotnetVersion() {
        return Linterhub.executeChildProcess('dotnet --version', null).then(removeNewLine);
    }

    function removeNewLine(out: string): string {
        return out.replace('\n', '').replace('\r', '');
    }

    /**
      * Function downloads Docker Image
      * @function downloadDock
      * @param {string} name Name of image to download
      * @returns {Promise<string>} Stdout of command
      */
    function downloadDock(name: string): Promise<string> {
        return Linterhub.executeChildProcess("docker pull " + name, null);
    }
}