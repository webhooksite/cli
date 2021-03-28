export default () => {
    console.log(`whcli 0.1
Commands:
    help            Outputs this list of commands.
    forward         Forward traffic from a Webhook.site endpoint.
        --token=                        Specifies the Webhook.site token ID where
                                        traffic should be redirected from. (required)
        --api-key=                      A valid Webhook.site API Key (required)
        --target=https://example.com    Specifies the forwarding target (required)`)
}