import Echo from "laravel-echo";
import client from "socket.io-client";
import logger from "./log.js";

export default (tokenId, apiKey, onRequest) => {
    const echo = new Echo.default({
        host: process.env.WH_WS_HOST ?? 'wss://ws.webhook.site',
        broadcaster: 'socket.io',
        client,
        auth: {headers: {'Api-Key': apiKey}}
    })

    let channel = echo.private(`token.${tokenId}`);

    channel.socket.on('connect', (error) => {
        logger.trace('WS: Connected', { error })
    })

    channel.socket.on('error', (error) => {
        logger.trace('WS: Error', { error })
    })

    channel.listen('.request.created', (data) => {
        onRequest(data)
    })
}