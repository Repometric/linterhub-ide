'use strict';
const url_1 = require("url");
const HttpProxyAgent = require("http-proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
const r_process = require("process");

function getSystemProxyURL(requestURL) {
    if (requestURL.protocol === 'http:') {
        return r_process.env.HTTP_PROXY || r_process.env.http_proxy || null;
    }
    else if (requestURL.protocol === 'https:') {
        return r_process.env.HTTPS_PROXY || r_process.env.https_proxy || r_process.env.HTTP_PROXY || r_process.env.http_proxy || null;
    }
    return null;
}

function getProxyAgent(requestURL, proxy, strictSSL) {
    const proxyURL = proxy || getSystemProxyURL(requestURL);
    if (!proxyURL) {
        return null;
    }
    const proxyEndpoint = url_1.parse(proxyURL);
    if (!/^https?:$/.test(proxyEndpoint.protocol)) {
        return null;
    }
    const opts = {
        host: proxyEndpoint.hostname,
        port: Number(proxyEndpoint.port),
        auth: proxyEndpoint.auth,
        rejectUnauthorized: strictSSL
    };
    return requestURL.protocol === 'http:' ? new HttpProxyAgent(opts) : new HttpsProxyAgent(opts);
}
exports.getProxyAgent = getProxyAgent;
