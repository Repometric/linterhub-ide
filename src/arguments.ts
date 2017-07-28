/**
 * Describes command line argument (simple key-value pair)
 */
export class Argument {
    /**
     * Name of property
     */
    public key: string;
    /**
     * Value of property
     */
    public value: string;
}

/**
 * Provides methods for generation of execution request
 */
export class ArgBuilder {

    private args: string[] = [];
    
    /**
     * Adds argument
     * @param {Argument} arg Argument to add 
     */
    public add(arg: Argument): void
    {
        if (arg.value !== null)
        {
            this.args[arg.key] = arg.value;
        }
    }

    /**
     * Adds range of arguments
     * @param {Argument[]} range Range of arguments to add 
     */
    public addRange(range: Argument[]): void
    {
        for(let obj in range) {
            this.add(range[obj]);
        }
    }

    /**
     * Get property value by name
     * @param {string} key Propery name
     * @returns {string} Property value
     */
    public get(key: string): string
    {
        return this.args[key];
    }

    /**
     * Generate request
     * @returns {string}
     */
    public generate(): string
    {
        let result: string[] = [];
        Object.keys(this.args).forEach(function(key){
            result.push(`--${key}=${this.args[key]}`);
        }, this);
        return result.join(' ');
    }
}
