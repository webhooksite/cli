import fetch from "node-fetch";
import * as self from "./api.js";
import log from "./log.js";

let apiKey = process.env.WH_API_KEY ?? null;
let apiUrl = process.env.WH_API ?? 'https://webhook.site';

const getHeaders = function () {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }

    if (apiKey) {
        headers['Api-Key'] = apiKey;
    }

    return headers;
}

export function setApiKey(newApiKey) {
    apiKey = newApiKey;
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
            throw Error('Could not get token: ' + await res.text());
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
            throw Error('Could not update token: ' + await res.text());
        });
}

export async function setResponse(tokenId, requestId, status, content, headers, timeout) {
    await fetch(
        `${apiUrl}/token/${tokenId}/request/${requestId}/response`,
        {
            method: 'PUT',
            body: JSON.stringify({
                status,
                content: Buffer.from(await content).toString('base64'),
                headers: headers,
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
                })
                return;
            }

            if (res.status === 413) {
                log.error({
                    msg: 'Error forwarding response to Webhook.site: 10 MB response size exceeded',
                })
                return;
            }

            log.info({
                msg: 'Error forwarding response to Webhook.site',
                status: res.status,
                error: (await res.text()),
            })
        })
        .catch((err) => {
            log.error({
                msg: 'Error forwarding response to Webhook.site',
                err,
            })
        });
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