import { ProgressManager } from '../progress';

/**
 * List of mode how to execute Linterhub Cli
 * @enum LinterhubMode
 */
export enum Mode {
	dotnet,
	native,
	docker
}

/**
 * Describes logger provider
 * @interface Logger
 */
export interface Logger {
	/**
	 * Prints ordinary information
	 * @method info
	 * @param {string} log Text to print
	 */
	info(log: string): void;

	/**
	 * Prints errors
	 * @method error
	 * @param {string} log Text to print
	 */
	error(log: string): void;

	/**
	 * Prints warnings
	 * @method warn
	 * @param {string} log Text to print
	 */
	warn(log: string): void;
}

/**
 * Contains integration objects (for logging and changing of status)
 */
export interface Integration {
	logger: Logger;
	progress: ProgressManager;
}

/**
 * Configuration file model (IDE, not CLI)
 */
export interface Config {
	enable: boolean;
	mode: Mode;
	cliRoot: string;
	proxy: string;
}
