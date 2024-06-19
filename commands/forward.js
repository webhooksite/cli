import fetch from "node-fetch";
import listen from "./lib/listen.js";
import replaceVariables from "./lib/replace-variables.js";
import log from "./lib/log.js";

export default async (argv) => {
    if (!argv.token && !process.env.WH_TOKEN) {
        throw new Error('Please specify a token (--token)')
    }

    listen(
        argv.token ?? process.env.WH_TOKEN,
        argv['api-key'] ?? process.env.WH_API_KEY,
        (data) => {
            let target = replaceVariables(argv.target ?? process.env.WH_TARGET ?? 'https://localhost', data.variables)

            if (!argv['keep-url']) {
                const query = data.request.query !== null
                    ? '?' + new URLSearchParams(data.request.query).toString()
                    : '';

                // We only want the `/a/b/c` part:
                // https://webhook.site/00000000-0000-0000-00000-000000000000/a/b/c
                const pathMatch = data.request.url.match(/https?:\/\/[^\/]*\/[a-z0-9-]+(\/[^?#]+)/)
                const path = pathMatch ? pathMatch[1] : '';
                target = target + path + query;
            }

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

            fetch(target, options)
                .then((res) => {
                    log.info({
                        msg: 'Forwarded incoming request',
                        url: res.url,
                        status: res.status
                    });
                })
        }
    )
}
