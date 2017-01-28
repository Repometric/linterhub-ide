export declare class LinuxDistribution {
    name: string;
    version: string;
    idLike: string[];
    constructor(name: string, version: string, idLike?: string[]);
    static GetCurrent(): Promise<LinuxDistribution>;
    toString(): string;
    private static FromFilePath(filePath);
    static FromReleaseInfo(releaseInfo: string, eol?: string): LinuxDistribution;
}
export declare class PlatformInformation {
    platform: string;
    architecture: string;
    distribution: LinuxDistribution;
    runtimeId: string;
    constructor(platform: string, architecture: string, distribution?: LinuxDistribution);
    isWindows(): boolean;
    isMacOS(): boolean;
    isLinux(): boolean;
    toString(): string;
    static GetCurrent(): Promise<PlatformInformation>;
    private static GetWindowsArchitecture();
    private static GetUnixArchitecture();
    private static getRuntimeId(platform, architecture, distribution);
    private static getRuntimeIdHelper(distributionName, distributionVersion);
}
