/**
 * Installation component model
 */
export interface Component {
    installed: boolean;
    message: string;
    name: string;
    version: string;
    packages: Component[];
}

/**
 * Result of linterhub version request
 */
export interface LinterhubVersion {
    version: string;
}

/**
 * Error model
 */
export interface Error {
    code: ErrorCode;
    title: string;
    description: string;
}

/**
 * Enum of possible error codes
 */
export enum ErrorCode {
    noError,
    linterhubConfig,
    missngParams,
    engineCrashed,
    engineMissing,
    pathMissing
}

/**
 * Engine model
 */
export interface Engine {
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

/**
 * Analyze result model (for one engine)
 */
export interface EngineResult {
    engine: string;
    result: AnalyzeResult[];
    error: Error;
}

/**
 * Analyze result model
 */
export interface AnalyzeResult {
    messages: AnalyzeMessage[];
    path: string;
}

/**
 * Analyze message model
 */
export interface AnalyzeMessage {
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
