import "colors";

export default () => {
    console.log(`${'⚓ whcli: Webhook.site CLI'.bold}
Usage: whcli [command] [--arg...]
Documentation: https://docs.webhook.site/cli.html

${'Commands and Arguments'.bold}
    ${'help'.underline}            Outputs this list of commands.

    ${'forward'.underline}         Forward traffic from a Webhook.site URL.
        --token=                        Specifies the Webhook.site token ID where
                                        traffic should be redirected from. (required)
        --api-key=                      A valid Webhook.site API Key (required)
        --target=https://example.com?action=$request.query.action$
                                        Specifies the forwarding target. Variables
                                        are replaced; see below. (required)

    ${'exec'.underline}            Execute a shell command on incoming requests to a Webhook.site URL.
        --token=                        Specifies which Webhook.site URL (token ID)
                                        to listen for requests from. (required)
        --api-key=                      A valid Webhook.site API Key (required)
        --command='ping $request.host$' Specifies the command to run. Variables
                                        are replaced; see below. (required)
        
${'Variable Replacement'.bold}
    For some commands and arguments, runtime variables can be replaced with the standard
    Webhook.site Custom Actions syntax (e.g. $variable$). Global Variables are not replaced.
    The variables that are available are the default base variables and any variables
    defined in a Custom Action that was run during the request.
    More info here:  https://docs.webhook.site/custom-actions/variables.html
    
${'Environment Variables'.bold}
    Some command arguments can be specified via environment variables:
        --token         WH_TOKEN
        --api-key       WH_API_KEY
        --target        WH_TARGET
        --command       WH_COMMAND
        
    General environment variables:
        WH_LOG_LEVEL    Sets log level (silent, trace, debug, info, warn, error, fatal)
                        Defaults to info.
`)
}