import pino from "pino";

const log = pino({
    level: process.env.WH_LOG_LEVEL ?? 'info',
})

process.on('uncaughtException',
    (err) => {
        log.fatal(err, 'Unhandled Exception');
        setTimeout(() => { process.abort() }, 1000).unref()
        process.exit(1);
    });

process.on('unhandledRejection',
    (err) => {
        log.error(err, 'Unhandled Promise Rejection');
    });

export default log