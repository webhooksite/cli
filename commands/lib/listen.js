import Echo from "laravel-echo";
import client from "socket.io-client";
import logger from "./log.js";

export default (tokenId, apiKey, onRequest) => {
    const headers = apiKey ? {'Api-Key': apiKey} : {};
    const echo = new Echo.default({
        host: process.env.WH_WS_HOST ?? 'wss://ws.webhook.site',
        broadcaster: 'socket.io',
        client,
        auth: {headers}
    })

    let channel = echo.private(`token.${tokenId}`);

    channel.socket.on('connect', (error) => {
        logger.info('Connected to Websocket. Listening for requests.', { error })
        if (!apiKey) {
            logger.warn('Warning: If token is associated with a Webhook.site account, specify an API key.', { error })
        }
    })

    channel.socket.on('error', (error) => {
        logger.trace('WS: Error', { error })
    })

    channel.listen('.request.created', (data) => {
        onRequest(data)
    })
}