export namespace Types {

	export interface NoParams {
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

	export interface NoResult {
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