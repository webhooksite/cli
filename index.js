// Dependencies
import minimist from 'minimist'

// Commands
import help from './commands/help.js'
import forward from './commands/forward.js'

const argv = minimist(process.argv.slice(2));

switch (argv['_'][0]) {
    case 'help':
        help()
        break;

    case 'forward':
        forward(argv)
        break;

    default:
        console.log(`Error: Unknown command ${argv['_'][0]}, try "help" :)`)
}