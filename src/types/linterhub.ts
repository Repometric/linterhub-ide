export interface Component
{
    installed: boolean;
    message: string;
    name: string;
    version: string;
    packages: Component[];
}

export interface LinterhubVersion
{
    version: string;
}

export interface Error
{
    id: ErrorId;
    message: string;
}

export enum ErrorId
{
    wrongLinter
}

export interface Engine
{
    name: string;
    description: string;
    url: string;
    version: {
        package: string;
        local: string;
    }
    languages: string[];
    extensions: string[];
    license: string;
    areas: string[];
    active: boolean;
}

export interface EngineResult
{
    engine: string;
    result: AnalyzeResult[];
}

export interface AnalyzeResult
{
    messages: AnalyzeMessage[];
    path: string;
}

export interface AnalyzeMessage
{
    message: string;
    description: string;
    severity: string;
    line: number;
    lineEnd: number;
    column: number;
    columnEnd: number;
    ruleId: string;
    ruleNs: string;
    ruleName: string;
}
