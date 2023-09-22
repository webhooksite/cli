#!/usr/bin/env node

// Dependencies
import minimist from 'minimist'

// Commands
import help from './commands/help.js'
import forward from './commands/forward.js'
import exec from "./commands/exec.js";

const argv = minimist(process.argv.slice(2));
const command = argv['_'][0];

switch (command) {
    case 'forward':
        forward(argv)
        break;

    case 'exec':
        exec(argv)
        break;

    default:
        help()
}