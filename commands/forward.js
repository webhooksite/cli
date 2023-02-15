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
        throw new Error('Please specify a target (--target)')
    }

    const tokenId = argv.token
    const apiKey = argv['api-key']
    const target = argv.target
    
    const echo = new Echo.default({
        host: argv.url ?? 'wss://ws.webhook.site',
        broadcaster: 'socket.io',
        client,
        auth: {headers: {'Api-Key': apiKey}}
    })
    
    let channel = echo.private(`token.${tokenId}`);

    channel.socket.on('error', (error) => {
        console.trace(`Error: ${error}`)
    })

    channel.listen('.request.created', (data) => {
        const query = data.request.query !== null
            ? '?' + new URLSearchParams(data.request.query).toString()
            : '';
            
        // We only want the `/a/b/c` part: 
        // https://webhook.site/00000000-0000-0000-00000-000000000000/a/b/c
        const pathMatch = data.request.url.match(/https?:\/\/[^\/]*\/[a-z0-9-]+(\/[^?#]+)/)
        const path = pathMatch ? pathMatch[1] : '';

        let options = {
            method: data.request.method,
            headers: data.request.headers,
            body: null,
        };

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
