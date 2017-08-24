/// <reference path="../typings/globals/mocha/index.d.ts"/>

import { Linterhub, Integration, ProgressManager, LinterhubVersion, Engine, DetectType, DetectedEngine } from './index';
import * as fs from 'fs';
import * as assert from "assert";
import * as path from "path";

class Logger {
    /**
	 * Prints ordinary information
	 * @method info
	 * @param {string} log Text to print
	 */
    public info(string: string) {
        //console.log(string);
    }

    /**
	 * Prints errors
	 * @method error
	 * @param {string} log Text to print
	 */
    public error(string: string) {
        //console.error(string);
    }

    /**
	 * Prints warnings
	 * @method warn
	 * @param {string} log Text to print
	 */
    public warn(string: string) {
        //console.warn(string);
    }
}

let integration: Integration = {
    logger: new Logger(),
    progress: new ProgressManager((visibility) => null, (text) => null)
};

before(function(done) {
    Linterhub.initialize(integration)
        .then(done)
});

describe("Testing integration logic", function(){
    let project = path.join(__dirname, "../test-project");
    let detectedEngine: string = "jsonlint";

    it("checking cli version", done => {
        Linterhub.version().then((data) => {
            assert.equal(data.version, "0.6.0");
            done();
        })
        .catch(done);
    });
    
    it("requesting catalog", done => {
        Linterhub.catalog().then((data: Engine[]) => {
            let engines: string[] = [ "coffeelint", "colorguard", "csslint", "eslint", "htmlhint", "jshint", "jslint",
                                      "jsonlint", "sass-lint", "standard", "stylelint", "tslint" ];
            engines.forEach(element => {
                if(data.find((x) => {
                    return x.name === element;
                })) {
                    assert.ok(element, `${element} supported`);
                }
                else {
                    assert.fail(`${element} not supported`)
                }
            });

            done();
        })
        .catch(done);
    });
    
    it("fetching engines", done => {
        Linterhub.fetch(project).then((data: DetectedEngine[]) => {
            assert.equal(data.length, 1);
            assert.equal(data[0].found, DetectType.sourceExtension);
            assert.equal(data[0].name, detectedEngine);
            done();
        })
        .catch(done);
    })

    it(`activating ${detectedEngine}`, done => {
        Linterhub.engineConfig(project, detectedEngine).then(() => {
            assert.equal(1, 1);
            done();
        })
        .catch(done);
    })

    // TODO test cycle
});
