"use strict";
const fs = require("fs");
const https = require("https");
const path = require("path");
const url_1 = require("url");
const proxy_1 = require("./proxy");
const platform_1 = require("./platform");
const util_1 = require("./util");
const linterhub_cli_1 = require("./linterhub-cli");
const mkdirp_1 = require("mkdirp");
const yauzl = require("yauzl");
class LinterhubPackage {
    constructor(info, folder, native, version) {
        this.prefix = "https://github.com/Repometric/linterhub-cli/releases/download/";
        this.version = "0.3.1";
        this.info = info;
        this.native = native;
        this.folder = folder;
        this.version = version;
    }
    getPackageVersion() {
        return this.version;
    }
    getPackageName() {
        if (!this.native) {
            return "dotnet";
        }
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
    getPackageFullName() {
        return "linterhub-cli-" + this.getPackageName() + "-" + this.version;
    }
    getPackageFileName() {
        return this.getPackageFullName() + ".zip";
    }
    getPackageFullFileName() {
        return this.folder + this.getPackageFullName();
    }
    getPackageUrl() {
        return this.prefix + this.version + "/" + this.getPackageFileName();
    }
}
exports.LinterhubPackage = LinterhubPackage;
class NetworkHelper {
    buildRequestOptions(urlString, proxy, strictSSL) {
        const url = url_1.parse(urlString);
        const options = {
            host: url.host,
            path: url.path,
            agent: proxy_1.getProxyAgent(url, proxy, strictSSL),
            rejectUnauthorized: strictSSL
        };
        return options;
    }
    downloadContent(urlString, proxy, strictSSL) {
        const options = this.buildRequestOptions(urlString, proxy, strictSSL);
        return new Promise((resolve, reject) => {
            https.get(options, function (response) {
                var body = '';
                response.on('data', (chunk) => body + chunk);
                response.on('end', () => resolve(body));
                response.on('error', (err) => reject(new Error(err.message)));
            });
        });
    }
    downloadFile(urlString, pathx, proxy, strictSSL, status) {
        const options = this.buildRequestOptions(urlString, proxy, strictSSL);
        return new Promise((resolve, reject) => {
            let request = https.request(options, response => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    return resolve(this.downloadFile(response.headers.location, pathx, proxy, strictSSL, status));
                }
                if (response.statusCode != 200) {
                    return reject(new Error(response.statusCode.toString()));
                }
                let packageSize = parseInt(response.headers['content-length'], 10);
                let downloadedBytes = 0;
                let downloadPercentage = 0;
                let tmpFile = fs.createWriteStream(pathx);
                response.on('data', data => {
                    downloadedBytes += data.length;
                    let newPercentage = Math.ceil(100 * (downloadedBytes / packageSize));
                    if (newPercentage !== downloadPercentage) {
                        downloadPercentage = newPercentage;
                        status.update('Downloading.. (' + newPercentage + "%)");
                    }
                });
                response.on('end', () => resolve());
                response.on('error', err => reject(new Error(err.message)));
                response.pipe(tmpFile, { end: false });
            });
            request.on('error', error => {
                reject(new Error(error.message));
            });
            request.end();
        });
    }
}
exports.NetworkHelper = NetworkHelper;
function install(mode, folder, proxy, strictSSL, log, status, version) {
    if (mode == linterhub_cli_1.LinterhubMode.docker) {
        return downloadDock("repometric/linterhub-cli");
    }
    else {
        return platform_1.PlatformInformation.GetCurrent().then(info => {
            log.info("Platform: " + info.toString());
            let helper = new LinterhubPackage(info, folder, mode == linterhub_cli_1.LinterhubMode.native, version);
            let name = helper.getPackageFullName();
            log.info("Name: " + name);
            let networkHelper = new NetworkHelper();
            return networkHelper.downloadFile(helper.getPackageUrl(), helper.getPackageFullFileName(), proxy, strictSSL, status).then(() => {
                log.info("File downloaded");
                return installFile(helper.getPackageFullFileName(), folder, log).then((folder) => {
                    return path.resolve(folder, 'bin', helper.getPackageName());
                });
            });
        });
    }
}
exports.install = install;
function installFile(zipFile, folder, log) {
    return new Promise((resolve, reject) => {
        yauzl.open(zipFile, { autoClose: true, lazyEntries: true }, (err, zipFile) => {
            if (err) {
                return reject(new Error('Immediate zip file error'));
            }
            zipFile.readEntry();
            zipFile.on('entry', (entry) => {
                let absoluteEntryPath = path.resolve(folder, entry.fileName);
                if (entry.fileName.endsWith('/')) {
                    mkdirp_1.mkdirp(absoluteEntryPath, { mode: 0o775 }, err => {
                        if (err) {
                            return reject(new Error('Error creating directory for zip directory entry:' + err.code || ''));
                        }
                        zipFile.readEntry();
                    });
                }
                else {
                    zipFile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            return reject(new Error('Error reading zip stream'));
                        }
                        mkdirp_1.mkdirp(path.dirname(absoluteEntryPath), { mode: 0o775 }, err => {
                            if (err) {
                                return reject(new Error('Error creating directory for zip file entry'));
                            }
                            let fileMode = true
                                ? 0o755
                                : 0o664;
                            readStream.pipe(fs.createWriteStream(absoluteEntryPath, { mode: fileMode }));
                            readStream.on('end', () => zipFile.readEntry());
                        });
                    });
                }
            });
            zipFile.on('end', () => resolve(folder));
            zipFile.on('error', (err) => {
                log.error(err.toString());
                reject(new Error('Zip File Error:' + err.code || ''));
            });
        });
    });
}
function getDockerVersion() {
    return util_1.executeChildProcess("docker version --format '{{.Server.Version}}'").then(removeNewLine);
}
exports.getDockerVersion = getDockerVersion;
function getDotnetVersion() {
    return util_1.executeChildProcess('dotnet --version').then(removeNewLine);
}
exports.getDotnetVersion = getDotnetVersion;
function removeNewLine(out) {
    return out.replace('\n', '').replace('\r', '');
}
function downloadDock(name) {
    return util_1.executeChildProcess("docker pull " + name);
}
exports.downloadDock = downloadDock;
