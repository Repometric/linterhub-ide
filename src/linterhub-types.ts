export namespace LinterhubTypes {

	/**
	 * List of mode how to execute Linterhub Cli
	 * @enum LinterhubMode
	 */
	export enum Mode {
		dotnet,
		native,
		docker
	}

	export enum Run {
		none,
		force,
		onStart,
		onOpen,
		onType,
		onSave
	}

	export interface AnalyzeResultInterface
	{
		Name: string;
		Model: {
			Files: AnalyzeFileInterface[];
			ParseErrors: {
				ErrorMessage: string;
				Input: any;
			};
		};
	}

	export interface Integration
	{
		project: string;
		logger: LoggerInterface;
		status: StatusInterface;
		saveConfig: Function;
		sendDiagnostics: Function;
		normalizePath: Function;
	}

	export interface AnalyzeFileInterface
	{
		Path: string;
		Errors: AnalyzeErrorInterface[];
	}

	export interface AnalyzeErrorInterface
	{
		Message: string;
		Severity: number;
		Line: number;
		Evidence: string;
		Rule: {
			Name: string;
			Id: string;
			Namespace: string;
		};
		Column: AnalyzeIntervalInterface;
		Row: AnalyzeIntervalInterface;
	}

	export interface AnalyzeIntervalInterface
	{
		Start: number;
		End: number;
	}

	/**
	 * Describes logger provider
	 * @interface LoggerInterface
	 */
	export interface LoggerInterface {
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
	 * @interface StatusInterface
	 */
	export interface StatusInterface {
		/**
		 * Updates status string
		 * @method update
		 * @param {string} text New status
		 */
		update(params: any, progress?: boolean, text?: string): void;
	}

	export interface Settings {
		linterhub: {
			enable: boolean;
			run: Run[];
			mode: Mode;
			cliPath: string;
			cliRoot: string;
		};
		[key: string]: any;
	}

	export interface StatusParams {
		id: string;
		state: any;
	}

	export interface ActivateParams {
		activate: boolean;
		linter: string;
	}

	export interface AnalyzeParams {
		full: boolean;
		path: string;
	}

	export interface IgnoreWarningParams {
		file: string;
		line: number;
		error: string;
	}

	export interface LinterVersionParams {
		linter: string;
	}

	export interface LinterResult {
		name: string;
		description: string;
		languages: string;
	}

	export interface LinterVersionResult {
		LinterName: string;
		Installed: boolean;
		Version: string;
	}

	export interface CatalogResult {
		linters: LinterResult[];
	}

	export interface InstallResult {
		path: string;
	}

	export interface ConfigResult {
		strictSSL: Boolean;
		proxy: string;
	}
}