#!/usr/bin/env node

// Dependencies
import minimist from 'minimist'
import { loadConfig } from './commands/lib/config.js'

// Load config file before importing commands, so env vars (incl. WH_LOG_LEVEL)
// are set before modules initialize.
loadConfig();

const argv = minimist(process.argv.slice(2));
const command = argv['_'][0];
const version = '0.3.2';

switch (command) {
    case 'forward': {
        const { default: forward } = await import('./commands/forward.js');
        forward(argv);
        break;
    }

    case 'exec': {
        const { default: exec } = await import('./commands/exec.js');
        exec(argv);
        break;
    }

    case 'version':
        console.log(version);
        break;

    default: {
        const { default: help } = await import('./commands/help.js');
        help(version);
    }
}
