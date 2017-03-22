import * as path from 'path';
import { PlatformInformation } from './platform';
import { Linterhub } from './linterhub';
import request from 'request'
import progress from 'request-progress'
import* as zlib from 'zlib';
import { LinterhubTypes } from './linterhub-types';

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
      * @returns {Promise<string>} Path to Cli
      */
    export function run(mode: LinterhubTypes.Mode, folder: string, log: LinterhubTypes.LoggerInterface, status: LinterhubTypes.StatusInterface, version: string): Promise<string> {
        // TODO
        if (mode === LinterhubTypes.Mode.docker) {
            return downloadDock("repometric/linterhub-cli");
        } else {
            return PlatformInformation.GetCurrent().then(info => {
                log.info("Platform: " + info.toString());
                let helper = new LinterhubPackage(info, folder, mode === LinterhubTypes.Mode.native, version);
                let name = helper.getPackageFullName();
                log.info("Name: " + name);
                progress(request(helper.getPackageUrl()))
                    .on('progress', state => {
                        status.update(null, true, 'Downloading.. (' + state.percentage * 100 + "%)");
                    })
                    .on('error', err => log.error(err))
                    .on('end', () => {})
                    .pipe(helper.getPackageFullFileName())
                    .pipe(zlib.createGunzip())
                    .pipe(folder);
                return path.resolve(folder, 'bin', helper.getPackageName());
            });
        }
    }

    /**
      * This function returns Docker version
      * @function getDockerVersion
      * @returns {Promise<string>} Stdout of command
      */
    export function getDockerVersion() {
        return Linterhub.executeChildProcess("docker version --format '{{.Server.Version}}'").then(removeNewLine);
    }

    /**
      * This function returns Dotnet version
      * @function getDotnetVersion
      * @returns {Promise<string>} Stdout of command
      */
    export function getDotnetVersion() {
        return Linterhub.executeChildProcess('dotnet --version').then(removeNewLine);
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
        return Linterhub.executeChildProcess("docker pull " + name);
    }
}