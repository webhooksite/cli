import pino from "pino";

const logger = pino({
    level: process.env.WH_LOG_LEVEL ?? 'info',
})

export default logger