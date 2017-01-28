import * as https from 'https';
import { PlatformInformation } from './platform';
import { LinterhubMode, StatusInterface, LoggerInterface } from './linterhub-cli';
export declare class LinterhubPackage {
    readonly prefix: string;
    private version;
    private info;
    private native;
    private folder;
    constructor(info: PlatformInformation, folder: string, native: boolean, version: string);
    getPackageVersion(): string;
    getPackageName(): string;
    getPackageFullName(): string;
    getPackageFileName(): string;
    getPackageFullFileName(): string;
    getPackageUrl(): string;
}
export declare class NetworkHelper {
    buildRequestOptions(urlString: any, proxy: string, strictSSL: boolean): https.RequestOptions;
    downloadContent(urlString: any, proxy: string, strictSSL: boolean): Promise<string>;
    downloadFile(urlString: string, pathx: string, proxy: string, strictSSL: boolean, status: any): Promise<string>;
}
export declare function install(mode: LinterhubMode, folder: string, proxy: string, strictSSL: boolean, log: LoggerInterface, status: StatusInterface, version: string): Promise<string>;
export declare function getDockerVersion(): Promise<string>;
export declare function getDotnetVersion(): Promise<string>;
export declare function downloadDock(name: string): Promise<string>;
