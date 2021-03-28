import Echo from "laravel-echo";
import client from "socket.io-client";
import fetch from "node-fetch";

export default async (argv) => {
    if (!argv.token) {
        throw new Error('Please specify a token (--token)')
    }
    if (!argv['api-key']) {
        throw new Error('Please specify an API Key (--api-key)')
    }
    if (!argv.target) {
        throw new Error('Please specify an API Key (--key)')
    }

    const tokenId = argv.token
    const apiKey = argv['api-key']
    const target = argv.target

    const echo = new Echo({
        host: argv.url ?? 'wss://webhook.site/socket.io',
        broadcaster: 'socket.io',
        client,
        auth: {headers: {'Api-Key': apiKey}}
    })

    let channel = echo.private(`token.${tokenId}`);

    channel.socket.on('reconnect', (x) => {
        console.log('Reconnected', x)
    })
    channel.socket.on('connect', () => {
        console.log('Connected')
    })
    channel.socket.on('error', (error) => {
        console.log('Error', error)
    })

    channel.listen('.request.created', (data) => {
        const query = data.request.query !== null
            ? '?' + new URLSearchParams(data.request.query).toString()
            : '';
        const pathMatch = data.request.url.match(/http(s)?:\/\/.+\/.+(\/[^?#]+)/)
        const path = pathMatch ? pathMatch[2] : '';

        let options = {
            method: data.request.method,
            body: data.request.content,
            headers: data.request.headers,
        };

        // Remove host header
        if ('host' in options.headers) {
            delete options.headers.host
        }

        fetch(target + path + query, options)
            .then((res) => {
                console.log('Forwarded incoming request', {
                    url: res.url,
                    status: res.status
                });
            })
    })
}