import listen from "./lib/listen.js";
import replaceVariables from "./lib/replace-variables.js";
import log from "./lib/log.js";
import child_process from "child_process";
import {scanRequests, setApiKey} from "./lib/api.js";

const exec = (tokenId, request, variables, command) => {
    replaceVariables(command, variables)

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


export default async (argv) => {
    if (!argv.token && !process.env.WH_TOKEN) {
        throw new Error('Please specify a token (--token)')
    }
    if (!argv.command && !process.env.WH_COMMAND) {
        throw new Error('Please specify a command (--command)')
    }
    const searchQuery = argv['query'] ?? process.env.WH_QUERY;
    const tokenId = argv.token ?? process.env.WH_TOKEN;
    const command = argv.command ?? process.env.WH_COMMAND;
    const apiKey = argv['api-key'] ?? process.env.WH_API_KEY;

    setApiKey(apiKey);

    if (searchQuery) {
        await scanRequests(tokenId, searchQuery, (request) => {
            exec(tokenId, request, {}, command)
        })
    } else {
        listen(
            tokenId,
            argv['api-key'] ?? process.env.WH_API_KEY,
            (data) => {
                exec(tokenId, data.request, data.runtime_variables, command);
            }
        )
    }

}