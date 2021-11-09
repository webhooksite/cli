#!/usr/bin/env node

// Dependencies
import minimist from 'minimist'

// Commands
import help from './commands/help.js'
import forward from './commands/forward.js'

const argv = minimist(process.argv.slice(2));
const command = argv['_'][0]

switch (command) {
    case 'forward':
        forward(argv)
        break;

    default:
        help()
}