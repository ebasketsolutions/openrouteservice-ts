"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants = {
    defaultAPIVersion: "v2",
    defaultHost: "https://api.openrouteservice.org",
    missingAPIKeyMsg: "Please add your openrouteservice api_key..",
    baseUrlConstituents: ["host", "service", "api_version", "mime_type"],
    propNames: {
        apiKey: "api_key",
        host: "host",
        service: "service",
        apiVersion: "api_version",
        mimeType: "mime_type",
        profile: "profile",
        format: "format",
        timeout: "timeout"
    }
};
class OrsUtil {
    fillArgs(defaultArgs, requestArgs) {
        requestArgs = Object.assign(Object.assign({}, defaultArgs), requestArgs);
        return requestArgs;
    }
    saveArgsToCache(args) {
        return {
            host: args[constants.propNames.host],
            api_version: args[constants.propNames.apiVersion],
            profile: args[constants.propNames.profile],
            format: args[constants.propNames.format],
            service: args[constants.propNames.service],
            api_key: args[constants.propNames.apiKey],
            mime_type: args[constants.propNames.mimeType]
        };
    }
    prepareRequest(args) {
        delete args[constants.propNames.mimeType];
        delete args[constants.propNames.host];
        delete args[constants.propNames.apiVersion];
        delete args[constants.propNames.service];
        delete args[constants.propNames.apiKey];
        delete args[constants.propNames.profile];
        delete args[constants.propNames.format];
        delete args[constants.propNames.timeout];
        return Object.assign({}, args);
    }
    prepareUrl(args) {
        let url = args[constants.propNames.host];
        let urlPathParts = [
            args[constants.propNames.apiVersion],
            args[constants.propNames.service],
            args[constants.propNames.profile],
            args[constants.propNames.format]
        ];
        let urlPathParts_str = urlPathParts.join("/");
        urlPathParts_str = urlPathParts_str.replace(/\/(\/)+/g, "/");
        if (urlPathParts_str[0] === "/") {
            urlPathParts_str = urlPathParts_str.slice(1);
        }
        let end = urlPathParts_str.slice(-1);
        if (end[0] === "/") {
            urlPathParts_str = urlPathParts_str.slice(0, -1);
        }
        url = url + "/" + urlPathParts_str;
        return url;
    }
}
const orsUtil$4 = new OrsUtil();
class OrsBase {
    constructor(args) {
        this.defaultArgs = {};
        this.requestArgs = {};
        this.argsCache = null;
        this.customHeaders = {};
        this._setRequestDefaults(args);
    }
    _setRequestDefaults(args) {
        this.defaultArgs[constants.propNames.host] = constants.defaultHost;
        if (args[constants.propNames.host]) {
            this.defaultArgs[constants.propNames.host] = args[constants.propNames.host];
        }
        if (args[constants.propNames.service]) {
            this.defaultArgs[constants.propNames.service] = args[constants.propNames.service];
        }
        if (constants.propNames.apiKey in args) {
            this.defaultArgs[constants.propNames.apiKey] = args[constants.propNames.apiKey];
        }
        else {
            console.error(constants.missingAPIKeyMsg);
            throw new Error(constants.missingAPIKeyMsg);
        }
    }
    checkHeaders() {
        if (this.requestArgs.customHeaders) {
            this.customHeaders = this.requestArgs.customHeaders;
            delete this.requestArgs.customHeaders;
        }
        if (!("Content-type" in this.customHeaders)) {
            this.customHeaders = Object.assign(Object.assign({}, this.customHeaders), { "Content-type": "application/json" });
        }
    }
    fetchRequest(body, controller) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = orsUtil$4.prepareUrl(this.argsCache);
            if (this.argsCache[constants.propNames.service] === "pois") {
                url += url.indexOf("?") > -1 ? "&" : "?";
            }
            const authorization = { "Authorization": this.argsCache[constants.propNames.apiKey] };
            return yield fetch(url, {
                method: "POST",
                body: JSON.stringify(body),
                headers: Object.assign(Object.assign({}, authorization), this.customHeaders),
                signal: controller.signal
            });
        });
    }
    createRequest(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort("timed out"), this.defaultArgs[constants.propNames.timeout] || 5e3);
            try {
                const orsResponse = yield this.fetchRequest(body, controller);
                if (!orsResponse.ok) {
                    const error = new Error(orsResponse.statusText);
                    /*         error.status = orsResponse.status;
                            error.response = orsResponse; */
                    throw error;
                }
                return this.argsCache[constants.propNames.format] === "gpx" ? yield orsResponse.text() : yield orsResponse.json();
            }
            finally {
                clearTimeout(timeout);
            }
        });
    }
    getBody(args) {
        return this.httpArgs;
    }
    calculate(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            this.requestArgs = orsUtil$4.fillArgs(this.defaultArgs, this.requestArgs);
            this.argsCache = orsUtil$4.saveArgsToCache(this.requestArgs);
            this.httpArgs = orsUtil$4.prepareRequest(this.requestArgs);
            const postBody = this.getBody(this.httpArgs);
            return yield this.createRequest(postBody);
        });
    }
}
const orsUtil$3 = new OrsUtil();
class OrsGeocode extends OrsBase {
    constructor(args) {
        super(args);
        this.lookupParameter = {
            api_key: function (key, val) {
                return key + "=" + val;
            },
            text: function (key, val) {
                return "&" + key + "=" + encodeURIComponent(val);
            },
            focus_point: function (key, val) {
                let urlParams = "";
                urlParams += "&focus.point.lon=" + val[1];
                urlParams += "&focus.point.lat=" + val[0];
                return urlParams;
            },
            boundary_bbox: function (key, val) {
                let urlParams = "";
                urlParams += "&boundary.rect.min_lon=" + val[0][1];
                urlParams += "&boundary.rect.min_lat=" + val[0][0];
                urlParams += "&boundary.rect.max_lon=" + val[1][1];
                urlParams += "&boundary.rect.max_lat=" + val[1][0];
                return urlParams;
            },
            point: function (key, val) {
                if (val && Array.isArray(val.lat_lng)) {
                    let urlParams = "";
                    urlParams += "&point.lon=" + val.lat_lng[1];
                    urlParams += "&point.lat=" + val.lat_lng[0];
                    return urlParams;
                }
            },
            boundary_circle: function (key, val) {
                let urlParams = "";
                urlParams += "&boundary.circle.lon=" + val.lat_lng[1];
                urlParams += "&boundary.circle.lat=" + val.lat_lng[0];
                urlParams += "&boundary.circle.radius=" + val.radius;
                return urlParams;
            },
            sources: function (key, val) {
                let urlParams = "&sources=";
                if (val) {
                    for (const key2 in val) {
                        if (Number(key2) > 0) {
                            urlParams += ",";
                        }
                        urlParams += val[key2];
                    }
                    return urlParams;
                }
            },
            layers: function (key, val) {
                let urlParams = "&layers=";
                let counter = 0;
                for (key in val) {
                    if (counter > 0) {
                        urlParams += ",";
                    }
                    urlParams += val[key];
                    counter++;
                }
                return urlParams;
            },
            boundary_country: function (key, val) {
                return "&boundary.country=" + val;
            },
            size: function (key, val) {
                return "&" + key + "=" + val;
            },
            address: function (key, val) {
                return "&" + key + "=" + val;
            },
            neighbourhood: function (key, val) {
                return "&" + key + "=" + val;
            },
            borough: function (key, val) {
                return "&" + key + "=" + val;
            },
            locality: function (key, val) {
                return "&" + key + "=" + val;
            },
            county: function (key, val) {
                return "&" + key + "=" + val;
            },
            region: function (key, val) {
                return "&" + key + "=" + val;
            },
            postalcode: function (key, val) {
                return "&" + key + "=" + val;
            },
            country: function (key, val) {
                return "&" + key + "=" + val;
            }
        };
    }
    getParametersAsQueryString(args) {
        let queryString = "";
        for (const key in args) {
            const val = args[key];
            if (constants.baseUrlConstituents.indexOf(key) <= -1) {
                queryString += this.lookupParameter[key](key, val);
            }
        }
        return queryString;
    }
    fetchGetRequest(controller) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = orsUtil$3.prepareUrl(this.requestArgs);
            url += "?" + this.getParametersAsQueryString(this.requestArgs);
            return yield fetch(url, {
                method: "GET",
                headers: this.customHeaders,
                signal: controller.signal
            });
        });
    }
    geocodePromise() {
        return __awaiter(this, void 0, void 0, function* () {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort("timed out"), this.defaultArgs[constants.propNames.timeout] || 5e3);
            try {
                const orsResponse = yield this.fetchGetRequest(controller);
                if (!orsResponse.ok) {
                    const error = new Error(orsResponse.statusText);
                    /*         error.status = orsResponse.status;
                            error.response = orsResponse; */
                    throw error;
                }
                return (yield orsResponse.json()) || orsResponse.text();
            }
            finally {
                clearTimeout(timeout);
            }
        });
    }
    geocode(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            if (!this.defaultArgs[constants.propNames.service] && !this.requestArgs[constants.propNames.service]) {
                this.requestArgs.service = "geocode/search";
            }
            this.requestArgs = orsUtil$3.fillArgs(this.defaultArgs, this.requestArgs);
            return yield this.geocodePromise();
        });
    }
    reverseGeocode(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            if (!this.defaultArgs[constants.propNames.service] && !this.requestArgs[constants.propNames.service]) {
                this.requestArgs.service = "geocode/reverse";
            }
            this.requestArgs = orsUtil$3.fillArgs(this.defaultArgs, this.requestArgs);
            return yield this.geocodePromise();
        });
    }
    structuredGeocode(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            if (!this.defaultArgs[constants.propNames.service] && !this.requestArgs[constants.propNames.service]) {
                this.requestArgs.service = "geocode/search/structured";
            }
            this.requestArgs = orsUtil$3.fillArgs(this.defaultArgs, this.requestArgs);
            return yield this.geocodePromise();
        });
    }
}
class OrsIsochrones extends OrsBase {
    constructor(args) {
        super(args);
        if (!this.defaultArgs[constants.propNames.service] && !this.requestArgs[constants.propNames.service]) {
            this.defaultArgs.service = "isochrones";
        }
        if (!args[constants.propNames.apiVersion]) {
            this.defaultArgs.api_version = constants.defaultAPIVersion;
        }
    }
    getBody(args) {
        const options = {};
        if (args.restrictions) {
            options.profile_params = {
                restrictions: Object.assign({}, args.restrictions)
            };
            delete args.restrictions;
        }
        if (args.avoidables) {
            options.avoid_features = [...args.avoidables];
            delete args.avoidables;
        }
        if (args.avoid_polygons) {
            options.avoid_polygons = Object.assign({}, args.avoid_polygons);
            delete args.avoid_polygons;
        }
        if (Object.keys(options).length > 0) {
            return Object.assign(Object.assign({}, args), { options });
        }
        else {
            return Object.assign({}, args);
        }
    }
}
class OrsMatrix extends OrsBase {
    constructor(args) {
        super(args);
        if (!this.defaultArgs[constants.propNames.service] && !this.requestArgs[constants.propNames.service]) {
            this.defaultArgs[constants.propNames.service] = "matrix";
        }
        if (!args[constants.propNames.apiVersion]) {
            this.defaultArgs.api_version = constants.defaultAPIVersion;
        }
    }
}
class OrsDirections extends OrsBase {
    constructor(args) {
        super(args);
        if (!this.defaultArgs[constants.propNames.service]) {
            this.defaultArgs[constants.propNames.service] = "directions";
        }
        if (!args[constants.propNames.apiVersion]) {
            this.defaultArgs.api_version = constants.defaultAPIVersion;
        }
    }
    getBody(args) {
        if (args.options && typeof args.options !== "object") {
            args.options = JSON.parse(args.options);
        }
        if (args.restrictions) {
            args.options = args.options || {};
            args.options.profile_params = {
                restrictions: Object.assign({}, args.restrictions)
            };
            delete args.restrictions;
        }
        if (args.avoidables) {
            args.options = args.options || {};
            args.options.avoid_features = [...args.avoidables];
            delete args.avoidables;
        }
        return args;
    }
}
const orsUtil$2 = new OrsUtil();
class OrsPois extends OrsBase {
    constructor(args) {
        super(args);
        if (!this.defaultArgs[constants.propNames.service]) {
            this.defaultArgs[constants.propNames.service] = "pois";
        }
    }
    generatePayload(args) {
        const payload = {};
        for (const key in args) {
            if (!(constants.baseUrlConstituents.indexOf(key) > -1 || key === constants.propNames.apiKey || key === constants.propNames.timeout)) {
                payload[key] = args[key];
            }
        }
        return payload;
    }
    poisPromise() {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs.request = this.requestArgs.request || "pois";
            this.argsCache = orsUtil$2.saveArgsToCache(this.requestArgs);
            if (this.requestArgs[constants.propNames.service]) {
                delete this.requestArgs[constants.propNames.service];
            }
            const payload = this.generatePayload(this.requestArgs);
            return yield this.createRequest(payload);
        });
    }
    pois(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            this.requestArgs = orsUtil$2.fillArgs(this.defaultArgs, this.requestArgs);
            return yield this.poisPromise();
        });
    }
}
const orsUtil$1 = new OrsUtil();
class OrsElevation extends OrsBase {
    generatePayload(args) {
        const payload = {};
        for (const key in args) {
            if (constants.baseUrlConstituents.indexOf(key) <= -1) {
                payload[key] = args[key];
            }
        }
        return payload;
    }
    elevationPromise() {
        return __awaiter(this, void 0, void 0, function* () {
            this.argsCache = orsUtil$1.saveArgsToCache(this.requestArgs);
            const payload = this.generatePayload(this.requestArgs);
            return yield this.createRequest(payload);
        });
    }
    lineElevation(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            if (!this.defaultArgs[constants.propNames.service] && !this.requestArgs[constants.propNames.service]) {
                this.requestArgs[constants.propNames.service] = "elevation/line";
            }
            this.requestArgs = orsUtil$1.fillArgs(this.defaultArgs, this.requestArgs);
            return yield this.elevationPromise();
        });
    }
    pointElevation(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            if (!this.defaultArgs[constants.propNames.service] && !this.requestArgs[constants.propNames.service]) {
                this.requestArgs[constants.propNames.service] = "elevation/point";
            }
            this.requestArgs = orsUtil$1.fillArgs(this.defaultArgs, this.requestArgs);
            return yield this.elevationPromise();
        });
    }
}
const orsUtil = new OrsUtil();
class OrsOptimization extends OrsBase {
    generatePayload(args) {
        let payload = {};
        for (const key in args) {
            if (constants.baseUrlConstituents.indexOf(key) <= -1) {
                payload[key] = args[key];
            }
        }
        return payload;
    }
    optimizationPromise() {
        return __awaiter(this, void 0, void 0, function* () {
            this.argsCache = orsUtil.saveArgsToCache(this.requestArgs);
            const payload = this.generatePayload(this.requestArgs);
            return yield this.createRequest(payload);
        });
    }
    optimize(reqArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestArgs = reqArgs;
            this.checkHeaders();
            if (!this.defaultArgs[constants.propNames.service] && !reqArgs[constants.propNames.service]) {
                reqArgs[constants.propNames.service] = "optimization";
            }
            this.requestArgs = orsUtil.fillArgs(this.defaultArgs, this.requestArgs);
            return yield this.optimizationPromise();
        });
    }
}
const Openrouteservice = {
    Geocode: OrsGeocode,
    Isochrones: OrsIsochrones,
    Directions: OrsDirections,
    Matrix: OrsMatrix,
    Pois: OrsPois,
    Elevation: OrsElevation,
    Optimization: OrsOptimization
};
if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = Openrouteservice;
}
exports.default = Openrouteservice;
