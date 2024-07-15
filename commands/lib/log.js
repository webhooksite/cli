import pino from "pino";

const log = pino({
    level: process.env.WH_LOG_LEVEL ?? 'info',
})

const whitelistedExceptions = ['write EPIPE'];
process.on('uncaughtException',
    (err) => {
        log.fatal(err, 'Unhandled Exception');

        if (whitelistedExceptions.includes(err.message)) {
            return
        }

        setTimeout(() => { process.abort() }, 1000).unref()
        process.exit(1);
    });

process.on('unhandledRejection',
    (err) => {
        log.error(err, 'Unhandled Promise Rejection');
    });

export default log