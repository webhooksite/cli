import fetch, {FormData} from "node-fetch";
import listen from "./lib/listen.js";
import replaceVariables from "./lib/replace-variables.js";
import log from "./lib/log.js";
import {setApiKey, setResponse, updateTokenListen} from "./lib/api.js";

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

export default async (argv) => {
    if (!argv.token && !process.env.WH_TOKEN) {
        throw new Error('Please specify a token (--token)')
    }
    const tokenId = argv.token ?? process.env.WH_TOKEN;
    const apiKey = argv['api-key'] ?? process.env.WH_API_KEY;
    const listenSeconds = argv['listen-timeout'] ?? process.env.WH_LISTEN_TIMEOUT ?? 5;

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

    listen(
        tokenId,
        apiKey,
        (data) => {
            let target = replaceVariables(argv.target ?? process.env.WH_TARGET ?? 'https://localhost', data.variables)

            if (!argv['keep-url']) {
                let path = '';
                const query = data.request.query !== null
                    ? '?' + new URLSearchParams(data.request.query).toString()
                    : '';

                target = target + getTargetPath(data.request.url) + query;
            }

            let options = {
                method: data.request.method,
                headers: data.request.headers,
                body: null,
            };

            if (listenSeconds > 0) {
                // Enough time to clear token listen property when command exits.
                options['signal'] = AbortSignal.timeout(listenSeconds * 1000);
            }

            const removeHeaders = [
                'host',
                'content-length'
            ]

            for (let headerName of removeHeaders) {
                if (headerName in options.headers) {
                    delete options.headers[headerName]
                }
            }

            if (data.request.method !== 'GET' && data.request.method !== 'HEAD') {
                options['body'] = data.request.content

                // Handle serialized multipart requests
                if (options['body'] === '' && data.request.request) {
                    options['body'] = new FormData();
                    // node-fetch generates a new Content-Type header
                    delete options.headers['content-type'];

                    for (const formFieldName in data.request.request) {
                        options['body'].append(formFieldName, data.request.request[formFieldName])
                    }
                }
            }

            fetch(target, options)
                .then(async (res) => {
                    log.info({
                        msg: 'Forwarded incoming request',
                        url: res.url,
                        status: res.status,
                    });
                    if (listenSeconds > 0) {
                        await setResponse(
                            tokenId,
                            data.request.uuid,
                            res.status,
                            res.arrayBuffer(),
                            res.headers.raw(),
                            listenSeconds * 1000
                        )
                    }
                })
                .catch((err) => {
                    log.error({
                        msg: 'Error forwarding incoming request',
                        err,
                    })
                })
        }
    )
}
