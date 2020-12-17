import fs from 'fs';

const OIS_FORMAT = "1.0.0"

export function convert(args) {
    let oapiSpecPath = getArg(args, "spec");
    let oisSpecPath = getArg(args, "output");
    let apiName = getArg(args, "api-name");
    let apiVersion = getArg(args, "api-version");

    if (!oisSpecPath) {
        return 'OAPI Specification file must be provided';
    }

    if (!oapiSpecPath) {
        return 'Target OIS Specification file path must be provided';
    }

    let oapiFile = fs.readFileSync(oapiSpecPath);
    const parsedOapiSpec = JSON.parse(oapiFile);

    const apiSpecifications = {
        servers: parsedOapiSpec.servers,
        components: parsedOapiSpec.components,
        security: parsedOapiSpec.security,
        paths: parsedOapiSpec.paths,
    }

    const endpoints = [...Object.keys(parsedOapiSpec.paths)]
        .flatMap(path => [...Object.keys(parsedOapiSpec.paths[path])].map(method => createOISEndpoint(path, method, parsedOapiSpec.paths[path][method])))

    const oisSpec = {
        oisFormat: OIS_FORMAT,
        title: apiName || (parsedOapiSpec.info || {}).title,
        version: apiVersion || (parsedOapiSpec.info || {}).version,
        apiSpecifications,
        endpoints
    }

    fs.writeFile(oisSpecPath, JSON.stringify(oisSpec), (err) => {
        if (err) throw err;
        console.log('The file has been saved to ' + oisSpecPath);
    });
}

function createOISEndpoint(path, method, oasBody) {

    const parameters = [...oasBody.parameters || []]
        .map(oasParam => createOISParameter(oasParam))

    return {
        name: oasBody.operationId,
        operation: {
            path,
            method
        },
        // fixedOperationParameters:
        // reservedParameters:
        parameters,
        summary: oasBody.summary,
        description: oasBody.description,
        externalDocs: (oasBody.externalDocs || {}).url
    }
}

function createOISParameter(oasParam) {

    return {
        operationParameter: {
            name: oasParam.name,
            in: oasParam.in
        },
        name: oasParam.name,
        default: oasParam.default,
        description: oasParam.description,
        required: oasParam.required,
        example: oasParam.example,
    }
}

function getArg(args, name) {
    let index = args.indexOf("--" + name);
    if (index === -1) {
        return null;
    }
    return args[index + 1];
}