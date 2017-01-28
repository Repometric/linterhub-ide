export interface LoggerInterface {
    info(log: string): any;
    error(log: string): any;
}
export interface StatusInterface {
    update(status: string): any;
}
export declare enum LinterhubMode {
    dotnet = 0,
    native = 1,
    docker = 2,
}
export declare class LinterhubArgs {
    private cliRoot;
    private cliPath;
    private project;
    private mode;
    constructor(cliRoot: string, project: string, mode?: LinterhubMode);
    private prefix();
    analyze(): string;
    analyzeFile(file: string): string;
    activate(linter: string): string;
    linterVersion(linter: string, install: boolean): string;
    deactivate(linter: string): string;
    catalog(): string;
    version(): string;
}
export declare class LinterhubCli {
    private args;
    private cliRoot;
    private log;
    constructor(log: LoggerInterface, cliRoot: string, project: string, mode?: LinterhubMode);
    private execute(command);
    analyze(): Promise<{}>;
    analyzeFile(file: string): Promise<{}>;
    catalog(): Promise<{}>;
    activate(linter: string): Promise<{}>;
    linterVersion(linter: string, install: boolean): Promise<{}>;
    deactivate(linter: string): Promise<{}>;
    version(): Promise<{}>;
}
export declare class LinterhubCliLazy extends LinterhubCli {
    private catalogValue;
    private versionValue;
    constructor(log: any, cliRoot: string, project: string, mode?: LinterhubMode);
    catalog(): Promise<{}>;
    version(): Promise<{}>;
}
