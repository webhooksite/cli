import listen from "./lib/listen.js";
import replaceVariables from "./lib/replace-variables.js";
import log from "./lib/log.js";
import child_process from "child_process";

export default async (argv) => {
    if (!argv.token && !process.env.WH_TOKEN) {
        throw new Error('Please specify a token (--token)')
    }
    if (!argv.command && !process.env.WH_COMMAND) {
        throw new Error('Please specify a command (--command)')
    }

    listen(
        argv.token ?? process.env.WH_TOKEN,
        argv['api-key'] ?? process.env.WH_API_KEY,
        (data) => {
            const command = replaceVariables(argv.command ?? process.env.WH_COMMAND, data.runtime_variables)

            child_process.exec(
                command,
                (error, stdout, stderr) => {
                    log.info({
                        'msg': 'Command was executed',
                        command,
                        error,
                        stderr,
                        stdout,
                    });
                }
            )
        }
    )
}