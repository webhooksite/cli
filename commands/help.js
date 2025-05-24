import "colors";

export default () => {
    console.log(`⚓ whcli: Webhook.site CLI
Usage: whcli [command] [--arg...]
Documentation: https://docs.webhook.site/cli.html

${'Commands and Arguments'.bold}
  ${'help'.underline}      Outputs this list of commands.

  ${'forward'.underline}   Forward traffic from a Webhook.site URL.
    --token=                        Specifies the Webhook.site token ID where
                                    traffic should be redirected from. (required)
    --api-key=                      A valid Webhook.site API Key
    --target=https://example.com?action=$request.query.action$
                                    Specifies the forwarding target URL. Variables
                                    are replaced; see below.
    --keep-url                      When used, skips merging path and query strings
                                    into the target URL.
    --listen-timeout=5              Amount of seconds to wait for a response before
                                    forwarding it back to Webhook.site.
                                    Default 5. Max 10. 
                                    Set to 0 to disable bidirectional forwarding.
    --query=                        Forwards previously sent requests, filtered by
                                    a search query. When left blank, only requests 
                                    sent after the command runs are forwarded.
                                    See below for examples.
                                    
  ${'exec'.underline}      Execute shell commands on traffic to a Webhook.site URL.
    --token=                        Specifies which Webhook.site URL (token ID)
                                    to listen for requests from. (required)
    --api-key=                      A valid Webhook.site API Key (required)
    --command='ping $request.host$' Specifies the command to run. Variables
                                    are replaced; see below. (required)
        
${'Variable Replacement'.bold}
  For some commands and arguments, runtime variables can be replaced with the 
  standard Webhook.site Custom Actions syntax (e.g. $variable$). 
  More info here: https://docs.webhook.site/custom-actions/variables.html
  
${'Search Query'.bold}
  When specified, only past requests are processed, filtered by the specified query.
  Variable Replacement is not available for past requests.
  Examples:
    * ${'content:"foobar"'.underline} - body contents containing the word foobar
    * ${'created_at:[now-14d TO *]'.underline} - date range query (in this example, all requests 
                                 14 days and newer)
  More info here: https://docs.webhook.site/api/requests.html#search-query-examples
    
${'Environment Variables'.bold}
  Some command arguments can be specified via environment variables:
    ${'WH_TOKEN'.underline}           Specifies --token         
    ${'WH_API_KEY'.underline}         Specifies --api-key       
    ${'WH_TARGET'.underline}          Specifies --target        
    ${'WH_COMMAND'.underline}         Specifies --command    
    ${'WH_LISTEN_TIMEOUT'.underline}  Specifies --listen-timeout   
    ${'WH_QUERY'.underline}           Specifies --query
    ${'WH_LOG_LEVEL'.underline}       Sets log level (silent, trace, debug, info, 
                       warn, error, fatal) Defaults to info.
    ${'NODE_TLS_REJECT_UNAUTHORIZED'.underline}    Set to "0" to disable e.g. self-signed 
                                    or expired certificate errors.
`)
}