"use strict";
const fs = require("fs");
const os = require("os");
const util = require("./util");
const unknown = 'unknown';
class LinuxDistribution {
    constructor(name, version, idLike) {
        this.name = name;
        this.version = version;
        this.idLike = idLike;
    }
    static GetCurrent() {
        return LinuxDistribution.FromFilePath('/etc/os-release')
            .catch(() => LinuxDistribution.FromFilePath('/usr/lib/os-release'))
            .catch(() => Promise.resolve(new LinuxDistribution(unknown, unknown)));
    }
    toString() {
        return `name=${this.name}, version=${this.version}`;
    }
    static FromFilePath(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(LinuxDistribution.FromReleaseInfo(data));
                }
            });
        });
    }
    static FromReleaseInfo(releaseInfo, eol = os.EOL) {
        let name = unknown;
        let version = unknown;
        let idLike = null;
        const lines = releaseInfo.split(eol);
        for (let line of lines) {
            line = line.trim();
            let equalsIndex = line.indexOf('=');
            if (equalsIndex >= 0) {
                let key = line.substring(0, equalsIndex);
                let value = line.substring(equalsIndex + 1);
                if (value.length > 1 && value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                if (key === 'ID') {
                    name = value;
                }
                else if (key === 'VERSION_ID') {
                    version = value;
                }
                else if (key === 'ID_LIKE') {
                    idLike = value.split(" ");
                }
                if (name !== unknown && version !== unknown && idLike !== null) {
                    break;
                }
            }
        }
        return new LinuxDistribution(name, version, idLike);
    }
}
exports.LinuxDistribution = LinuxDistribution;
class PlatformInformation {
    constructor(platform, architecture, distribution = null) {
        this.platform = platform;
        this.architecture = architecture;
        this.distribution = distribution;
        try {
            this.runtimeId = PlatformInformation.getRuntimeId(platform, architecture, distribution);
        }
        catch (err) {
            this.runtimeId = null;
        }
    }
    isWindows() {
        return this.platform === 'win32';
    }
    isMacOS() {
        return this.platform === 'darwin';
    }
    isLinux() {
        return this.platform === 'linux';
    }
    toString() {
        let result = this.platform;
        if (this.architecture) {
            if (result) {
                result += ', ';
            }
            result += this.architecture;
        }
        if (this.distribution) {
            if (result) {
                result += ', ';
            }
            result += this.distribution.toString();
        }
        return result;
    }
    static GetCurrent() {
        let platform = os.platform();
        let architecturePromise;
        let distributionPromise;
        switch (platform) {
            case 'win32':
                architecturePromise = PlatformInformation.GetWindowsArchitecture();
                distributionPromise = Promise.resolve(null);
                break;
            case 'darwin':
                architecturePromise = PlatformInformation.GetUnixArchitecture();
                distributionPromise = Promise.resolve(null);
                break;
            case 'linux':
                architecturePromise = PlatformInformation.GetUnixArchitecture();
                distributionPromise = LinuxDistribution.GetCurrent();
                break;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
        let promises = [architecturePromise, distributionPromise];
        return Promise.all(promises)
            .then(([arch, distro]) => {
            return new PlatformInformation(platform, arch, distro);
        });
    }
    static GetWindowsArchitecture() {
        return util.executeChildProcess('wmic os get osarchitecture')
            .then(architecture => {
            if (architecture) {
                let archArray = architecture.split(os.EOL);
                if (archArray.length >= 2) {
                    let arch = archArray[1].trim();
                    if (arch.indexOf('64') >= 0) {
                        return "x86_64";
                    }
                    else if (arch.indexOf('32') >= 0) {
                        return "x86";
                    }
                }
            }
            return unknown;
        }).catch(() => {
            return unknown;
        });
    }
    static GetUnixArchitecture() {
        return util.executeChildProcess('uname -m')
            .then(architecture => {
            if (architecture) {
                return architecture.trim();
            }
            return null;
        });
    }
    static getRuntimeId(platform, architecture, distribution) {
        switch (platform) {
            case 'win32':
                switch (architecture) {
                    case 'x86': return 'win7-x86';
                    case 'x86_64': return 'win7-x64';
                }
                throw new Error(`Unsupported Windows architecture: ${architecture}`);
            case 'darwin':
                if (architecture === 'x86_64') {
                    return 'osx.10.11-x64';
                }
                throw new Error(`Unsupported macOS architecture: ${architecture}`);
            case 'linux':
                if (architecture === 'x86_64') {
                    const unknown_distribution = 'unknown_distribution';
                    const unknown_version = 'unknown_version';
                    let runtimeId = PlatformInformation.getRuntimeIdHelper(distribution.name, distribution.version);
                    if (runtimeId === unknown_distribution && distribution.idLike && distribution.idLike.length > 0) {
                        for (let id of distribution.idLike) {
                            runtimeId = PlatformInformation.getRuntimeIdHelper(id, distribution.version);
                            if (runtimeId !== unknown_distribution) {
                                break;
                            }
                        }
                    }
                    if (runtimeId !== unknown_distribution && runtimeId !== unknown_version) {
                        return runtimeId;
                    }
                }
                throw new Error(`Unsupported Linux distro: ${distribution.name}, ${distribution.version}, ${architecture}`);
        }
        throw Error('Unsupported platform ' + platform);
    }
    static getRuntimeIdHelper(distributionName, distributionVersion) {
        const unknown_distribution = 'unknown_distribution';
        const unknown_version = 'unknown_version';
        const centos_7 = 'centos.7-x64';
        const debian_8 = 'debian.8-x64';
        const fedora_23 = 'fedora.23-x64';
        const opensuse_13_2 = 'opensuse.13.2-x64';
        const rhel_7 = 'rhel.7-x64';
        const ubuntu_14_04 = 'ubuntu.14.04-x64';
        const ubuntu_16_04 = 'ubuntu.16.04-x64';
        switch (distributionName) {
            case 'ubuntu':
                if (distributionVersion.startsWith("14")) {
                    return ubuntu_14_04;
                }
                else if (distributionVersion.startsWith("16")) {
                    return ubuntu_16_04;
                }
                break;
            case 'elementary':
            case 'elementary OS':
                if (distributionVersion.startsWith("0.3")) {
                    return ubuntu_14_04;
                }
                else if (distributionVersion.startsWith("0.4")) {
                    return ubuntu_16_04;
                }
                break;
            case 'linuxmint':
                if (distributionVersion.startsWith("18")) {
                    return ubuntu_16_04;
                }
                break;
            case 'centos':
            case 'ol':
                return centos_7;
            case 'fedora':
                return fedora_23;
            case 'opensuse':
                return opensuse_13_2;
            case 'rhel':
                return rhel_7;
            case 'debian':
                return debian_8;
            case 'galliumos':
                if (distributionVersion.startsWith("2.0")) {
                    return ubuntu_16_04;
                }
                break;
            default:
                return unknown_distribution;
        }
        return unknown_version;
    }
}
exports.PlatformInformation = PlatformInformation;
