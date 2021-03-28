# Webhook.site CLI

This repository contains the official command-line interface for Webhook.site. 
The CLI is still being built, and currently it supports forwarding traffic from
your Webhook.site URL through the machine running Webhook.site CLI.

## How to use

### Docker

The easiest way to run Webhook.site CLI is through Docker, which will 
automatically download the latest version for you.

The following should show the help message:

```shell
docker run webhooksite/cli
```

Then, to forward requests with the `forward` command:

```shell
docker run webhooksite/cli -- index.js forward \
  --token=1e25c1cb-e4d4-4399-a267-cd2cf1a6c864 \
  --api-key=ef6ef2f8-3e48-4f77-a54c-3891dc11c05c \ 
  --target=https://example.com
```

### Node.js

If you don't want to use Docker, simply:

1. Install dependencies using `npm install`
2. Run `node index.js`