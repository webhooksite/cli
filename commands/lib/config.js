import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import yaml from 'js-yaml';

const CONFIG_PATH = process.env.WH_CONFIG ?? join(homedir(), '.config', 'whcli', 'whcli.yaml');

const ENV_MAP = {
    'token': 'WH_TOKEN',
    'api-key': 'WH_API_KEY',
    'target': 'WH_TARGET',
    'command': 'WH_COMMAND',
    'listen-timeout': 'WH_LISTEN_TIMEOUT',
    'query': 'WH_QUERY',
    'log-level': 'WH_LOG_LEVEL',
    'rewrite': 'WH_REWRITE',
};

export function loadConfig(path = CONFIG_PATH) {
    let content;
    try {
        content = readFileSync(path, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT') return;
        throw err;
    }

    const config = yaml.load(content) ?? {};

    for (const [key, envVar] of Object.entries(ENV_MAP)) {
        if (key in config && !(envVar in process.env)) {
            process.env[envVar] = String(config[key]);
        }
    }
}
