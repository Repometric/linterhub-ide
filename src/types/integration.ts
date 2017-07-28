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
 * Describes status provider
 * @class Status
 */
export abstract class Status {
	public static systemId: string = "_system";
	/**
	 * Updates status 
	 * @method update
	 * @param {string} id Id of tab (path)
	 * @param {boolean} progress Active or not
	 */
	abstract update(id: string, progress: boolean): void;
}

export interface Integration {
	logger: Logger;
	status: Status;
}

export interface Config {
	enable: boolean;
	mode: Mode;
	cliRoot: string;
	proxy: string;
}
