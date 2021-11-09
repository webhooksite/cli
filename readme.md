# Webhook.site CLI

This repository contains the official command-line interface for Webhook.site. 
The CLI is still being built, and currently it supports forwarding traffic from
your Webhook.site URL through the machine running Webhook.site CLI.

## Installation

### node.js

node.js version 14 or greater required.

```
npm install -g @webhooksite/cli
```

Then you can run `whcli help`

### Docker

To forward requests with the `forward` command:

```
docker run webhooksite/cli -- index.js help
```

## Usage

For usage information, please see https://docs.webhook.site/cli.html