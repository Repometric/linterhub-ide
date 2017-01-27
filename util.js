"use strict";
const cp = require("child_process");

function executeChildProcess(command, workingDirectory = null) {
    let promise = new Promise((resolve, reject) => {
        cp.exec(command, { cwd: workingDirectory, maxBuffer: 1024 * 1024 * 500 }, function (error, stdout, stderr) {
            let execError = stderr.toString();
            if (error) {
                reject(new Error(error.message));
            }
            else if (execError !== '') {
                reject(new Error(execError));
            }
            else {
                resolve(stdout);
            }
        });
    });
    return promise;
}
exports.executeChildProcess = executeChildProcess;

class Cacheable {
    constructor(action) {
        this.value = null;
        this.action = action;
    }
    getValue() {
        let that = this;
        let promise = new Promise((resolve, reject) => {
            if (that.value == null) {
                that.action().then(value => {
                    that.value = value;
                    resolve(that.value);
                }).catch(error => reject(error));
            }
            else {
                resolve(that.value);
            }
        });
        return promise;
    }
}
exports.Cacheable = Cacheable;
