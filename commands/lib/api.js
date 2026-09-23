import fetch from "node-fetch";
import * as self from "./api.js";
import log from "./log.js";
import rewriteHtml from "./rewrite.js";

let apiKey = process.env.WH_API_KEY ?? null;
let apiUrl = process.env.WH_API ?? 'https://webhook.site';

async function getErrorMessage(res) {
    if (res.status === 401) return 'Authentication error. (Are you using a valid API key?)';
    const body = await res.text();
    try {
        return JSON.parse(body)?.error?.message ?? body;
    } catch {
        return body;
    }
}

function getHeaders() {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }

    if (apiKey) {
        headers['Api-Key'] = apiKey;
    }

    return headers;
}

// Strips the forwarded path and query, turning e.g.
// https://webhook.site/<uuid>/a/b?c=1 into https://webhook.site/<uuid> and
// http://localhost:3000/a/b?c=1 into http://localhost:3000.
export function getBaseUrl(url, path) {
    const withoutQuery = url.split(/[?#]/)[0];
    return (path && withoutQuery.endsWith(path)
        ? withoutQuery.slice(0, -path.length)
        : withoutQuery).replace(/\/$/, '');
}

export function setApiKey(newApiKey) {
    apiKey = newApiKey;
}

export function getHeader(headers, name) {
    const value = headers?.[name];
    return Array.isArray(value) ? value[0] : value;
}

export function getTargetPath(url) {
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

export async function createToken(config) {
    return fetch(`${apiUrl}/token`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config),
    })
        .then(async res => {
            if (res.status === 201) {
                return res.json();
            }
            throw Error('Could not create token: ' + await getErrorMessage(res));
        });
}

export async function getToken(id) {
    return fetch(`${apiUrl}/token/${id}`, {
        method: 'GET',
        headers: getHeaders(),
    })
        .then(async res => {
            if (res.status === 200) {
                return res.json();
            }
            throw Error('Could not get token: ' + await getErrorMessage(res));
        });
}

export async function updateToken(id, tokenData) {
    return fetch(`${apiUrl}/token/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tokenData),
        headers: getHeaders(),
    })
        .then(async res => {
            if (res.status === 200) {
                return res.json();
            }
            throw Error('Could not update token: ' + await getErrorMessage(res));
        });
}

export async function setResponse(tokenId, request, status, content, headers, timeout, target, rewrite) {
    let body = Buffer.from(await content);

    if (rewrite && getHeader(headers, 'content-type')?.includes('html')) {
        const path = getTargetPath(request.url);

        // Try to infer character encoding via header, default to utf8
        const charset = getHeader(headers, 'content-type').match(/charset=["']?([\w-]+)/i)?.[1];
        const encoding = !charset || /^utf-?8$/i.test(charset) ? 'utf8' : 'latin1';

        body = Buffer.from(rewriteHtml(
            body.toString(encoding),
            new URL(target),
            new URL(getBaseUrl(target, path)),
            getBaseUrl(request.url, path),
        ), encoding);

        // The rewrite probably changes content length
        delete headers['content-length'];
    }

    // Webhook.site API expects a base64-encoded string
    content = body.toString('base64');

    if (content.length > 10000000) {
        log.error({
            msg: `Cannot forward response from ${target} to Webhook.site: 10 MB response size exceeded`,
        })
        await setResponseError(tokenId, request, target, 'Response size exceeded');
        return;
    }

    await fetch(
        `${apiUrl}/token/${tokenId}/request/${request.uuid}/response`,
        {
            method: 'PUT',
            body: JSON.stringify({
                status,
                content,
                headers: headers,
                url: target,
            }),
            headers: getHeaders(),
            signal: AbortSignal.timeout(timeout)
        }
    )
        .then(async (res) => {
            if (res.status === 200) {
                log.info({
                    msg: 'Forwarded response to Webhook.site',
                    status: res.status,
                    request_id: request.uuid,
                })
                return;
            }

            const error = await getErrorMessage(res);

            log.info({
                msg: 'Error forwarding response to Webhook.site',
                status: res.status,
                error,
            })

            await setResponseError(tokenId, request, target, error);
        })
        .catch((err) => {
            log.error({
                msg: 'Error forwarding response to Webhook.site',
                err,
            })
        });
}

async function setResponseError(tokenId, request, target, error) {
    await fetch(
        `${apiUrl}/token/${tokenId}/request/${request.uuid}/response`,
        {
            method: 'PUT',
            body: JSON.stringify({
                status: 500,
                content: Buffer.from(`Webhook.site CLI Error: ${error}`).toString('base64'),
                headers: {
                    'content-type': ['text/plain'],
                },
                url: target,
            }),
            headers: getHeaders(),
        }
    )
}

export async function updateTokenListen(id, listenSeconds) {
    const tokenData = await self.getToken(id)
    tokenData['listen'] = listenSeconds;
    return await self.updateToken(id, tokenData);
}

export async function scanRequests(id, query, callback) {
    let page = 1;

    const fetchPage = async () => {
        const url = `${apiUrl}/token/${id}/requests?sorting=newest&page=${page}&query=${query}`;

        await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
        }).then(async (res) => {
            const response = await res.json();

            for (const request of response.data) {
                callback(request)
            }

            if (!response.is_last_page && response.data.length > 0) {
                page++;
                setTimeout(fetchPage, 1000);
            }
        }).catch((err) => {
            log.error({
                msg: 'Error fetching requests from Webhook.site',
                err,
            })
        });
    };

    fetchPage()
}