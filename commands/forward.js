import fetch, {FormData} from "node-fetch";
import listen from "./lib/listen.js";
import replaceVariables from "./lib/replace-variables.js";
import log from "./lib/log.js";
import {createToken, getTargetPath, scanRequests, setApiKey, setResponse, updateTokenListen} from "./lib/api.js";

const forward = (tokenId, request, variables, target, keepUrl, listenSeconds, rewrite) => {
    target = replaceVariables(target, variables)

    if (!keepUrl) {
        const query = request.query !== null
            ? '?' + new URLSearchParams(request.query).toString()
            : '';

        target = target + getTargetPath(request.url) + query;
    }

    let options = {
        method: request.method,
        headers: request.headers,
        body: null,
        compress: false,
    };

    if (listenSeconds > 0) {
        // Enough time to clear token listen property when command exits.
        options['signal'] = AbortSignal.timeout(listenSeconds * 1000);
    }

    const removeHeaders = [
        'host',
        'content-length',
        'transfer-encoding',
    ]

    if (rewrite) {
        // node-fetch doesn't decompress the body (compress: false), so ask the
        // target for plain text to be able to rewrite it.
        removeHeaders.push('accept-encoding')
    }

    for (let headerName of removeHeaders) {
        if (headerName in options.headers) {
            delete options.headers[headerName]
        }
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        options['body'] = request.content

        // Handle serialized multipart requests
        if (options['body'] === '' && request.request) {
            options['body'] = new FormData();
            // node-fetch generates a new Content-Type header
            delete options.headers['content-type'];

            for (const formFieldName in request.request) {
                options['body'].append(formFieldName, request.request[formFieldName])
            }
        }
    }

    fetch(target, options)
        .then(async (res) => {
            log.info({
                msg: `Forwarded request (status: ${res.status})`,
                url: res.url,
                status: res.status,
                request_id: request.uuid,
            });
            if (listenSeconds > 0) {
                await setResponse(
                    tokenId,
                    request,
                    res.status,
                    res.arrayBuffer(),
                    res.headers.raw(),
                    listenSeconds * 1000,
                    target,
                    rewrite,
                )
            }
        })
        .catch(async (err) => {
            log.error({
                msg: 'Error forwarding request',
                err,
            })
            if (listenSeconds > 0) {
                await setResponse(
                    tokenId,
                    request,
                    500,
                    'Error forwarding request: ' + err,
                    {'content-type': 'text/plain'},
                    listenSeconds * 1000,
                    target,
                    rewrite,
                )
            }
        })
}

export default async (argv) => {
    let tokenId = argv.token ?? process.env.WH_TOKEN;
    const apiKey = argv['api-key'] ?? process.env.WH_API_KEY;
    const searchQuery = argv['query'] ?? process.env.WH_QUERY;
    const listenSeconds = argv['listen-timeout'] ?? process.env.WH_LISTEN_TIMEOUT ?? 5;
    const keepUrl = argv['keep-url'] ?? false;
    const target = argv.target ?? process.env.WH_TARGET ?? 'https://localhost';
    const rewrite = argv.rewrite ?? process.env.WH_REWRITE ?? false;

    setApiKey(apiKey);

    if (!tokenId) {
        tokenId = (await createToken()).uuid;
        log.info('Auto-created URL: https://webhook.site/' + tokenId);
        log.info('View incoming requests at https://webhook.site/#!/view/' + tokenId);
    }

    // Listen for the amount of seconds
    await updateTokenListen(tokenId, listenSeconds);

    const clearTokenListen = async function () {
        await updateTokenListen(tokenId, 0);
        process.exit()
    }

    // Remove token listening on exit
    process.on('exit', clearTokenListen)
    process.on('SIGINT', clearTokenListen)

    if (searchQuery) {
        log.info('Scanning requests with query ' + searchQuery + ' and forwarding to ' + target);
        // Loop through existing requests if search query specified
        await scanRequests(tokenId, searchQuery, (request) => {
            forward(tokenId, request, {}, target, keepUrl, 0, rewrite)
        })
    } else {
        // Listen for new requests via WebSocket
        listen(
            tokenId,
            apiKey,
            (data) => {
                forward(tokenId, data.request, data.variables, target, keepUrl, listenSeconds, rewrite)
            }
        )
        log.info('Forwarding all incoming requests from https://webhook.site/' + tokenId + ' to ' + target);
    }
}
