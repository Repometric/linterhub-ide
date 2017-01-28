export declare function executeChildProcess(command: string, workingDirectory?: string): Promise<string>;
export declare class Cacheable {
    private value;
    private action;
    constructor(action: () => Promise<{}>);
    getValue(): Promise<{}>;
}
