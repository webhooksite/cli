import fetch, {FormData} from "node-fetch";
import listen from "./lib/listen.js";
import replaceVariables from "./lib/replace-variables.js";
import log from "./lib/log.js";
import {scanRequests, setApiKey, setResponse, updateTokenListen} from "./lib/api.js";

const getTargetPath = function (url) {
    // We only want the `/a/b/c` part:
    // https://my-url.webhook.site/a/b/c
    const pathMatchDomain = url.match(/https?:\/\/[a-zA-Z0-9-]{3,36}\.webhook\.site(\/[^?#]+)/)
    if (pathMatchDomain) {
        return pathMatchDomain[1];
    }

    // We only want the `/a/b/c` part:
    // https://webhook.site/00000000-0000-0000-00000-000000000000/a/b/c
    const pathMatch = url.match(/https?:\/\/[^\/]*\/[a-z0-9-]+(\/[^?#]+)/)
    return pathMatch ? pathMatch[1] : '';
}

const forward = (tokenId, request, variables, target, keepUrl, listenSeconds) => {
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
                msg: 'Forwarded request',
                url: res.url,
                status: res.status,
            });
            if (listenSeconds > 0) {
                await setResponse(
                    tokenId,
                    request.uuid,
                    res.status,
                    res.arrayBuffer(),
                    res.headers.raw(),
                    listenSeconds * 1000
                )
            }
        })
        .catch((err) => {
            log.error({
                msg: 'Error forwarding request',
                err,
            })
        })
}

export default async (argv) => {
    if (!argv.token && !process.env.WH_TOKEN) {
        throw new Error('Please specify a token (--token)')
    }
    const tokenId = argv.token ?? process.env.WH_TOKEN;
    const apiKey = argv['api-key'] ?? process.env.WH_API_KEY;
    const searchQuery = argv['query'] ?? process.env.WH_QUERY;
    const listenSeconds = argv['listen-timeout'] ?? process.env.WH_LISTEN_TIMEOUT ?? 5;
    const keepUrl = argv['keep-url'] ?? false;
    const target = argv.target ?? process.env.WH_TARGET ?? 'https://localhost';

    setApiKey(apiKey);

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
        // Loop through existing requests if search query specified
        await scanRequests(tokenId, searchQuery, (request) => {
            forward(tokenId, request, {}, target, keepUrl, 0)
        })
    } else {
        // Listen for new requests via WebSocket
        listen(
            tokenId,
            apiKey,
            (data) => {
                forward(tokenId, data.request, data.variables, target, keepUrl, listenSeconds)
            }
        )
    }
}
