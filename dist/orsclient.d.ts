declare class OrsBase {
    defaultArgs: any;
    requestArgs: any;
    argsCache: any;
    customHeaders: any;
    httpArgs: any;
    constructor(args: any);
    _setRequestDefaults(args: any): void;
    checkHeaders(): void;
    fetchRequest(body: any, controller: AbortController): Promise<Response>;
    createRequest(body: any): Promise<any>;
    getBody(args: any): any;
    calculate(reqArgs: any): Promise<any>;
}
declare class OrsGeocode extends OrsBase {
    lookupParameter: any;
    constructor(args: any);
    getParametersAsQueryString(args: any): string;
    fetchGetRequest(controller: AbortController): Promise<Response>;
    geocodePromise(): Promise<any>;
    geocode(reqArgs: any): Promise<any>;
    reverseGeocode(reqArgs: any): Promise<any>;
    structuredGeocode(reqArgs: any): Promise<any>;
}
declare class OrsIsochrones extends OrsBase {
    constructor(args: any);
    getBody(args: any): any;
}
declare class OrsMatrix extends OrsBase {
    constructor(args: any);
}
declare class OrsDirections extends OrsBase {
    constructor(args: any);
    getBody(args: any): any;
}
declare class OrsPois extends OrsBase {
    constructor(args: any);
    generatePayload(args: any): any;
    poisPromise(): Promise<any>;
    pois(reqArgs: any): Promise<any>;
}
declare class OrsElevation extends OrsBase {
    generatePayload(args: any): any;
    elevationPromise(): Promise<any>;
    lineElevation(reqArgs: any): Promise<any>;
    pointElevation(reqArgs: any): Promise<any>;
}
declare class OrsOptimization extends OrsBase {
    generatePayload(args: any): any;
    optimizationPromise(): Promise<any>;
    optimize(reqArgs: any): Promise<any>;
}
declare const Openrouteservice: {
    Geocode: typeof OrsGeocode;
    Isochrones: typeof OrsIsochrones;
    Directions: typeof OrsDirections;
    Matrix: typeof OrsMatrix;
    Pois: typeof OrsPois;
    Elevation: typeof OrsElevation;
    Optimization: typeof OrsOptimization;
};
export default Openrouteservice;
