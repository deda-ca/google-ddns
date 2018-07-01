#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Service = require('./lib/Service');
const DynamicDNS = require('./lib/DynamicDNS');

// Get the parameter path of the options. If not specified then use the default path.
let optionsPath = (process.argv.length > 2 ? path.resolve(process.argv[2]) : path.resolve('./options.json'));

// Check if the given path actually exists.
if (!fs.existsSync(optionsPath))
{
    console.error(`ERROR: Unable to find options file at: ${optionsPath}.`);
    console.error(`Expecting only a single parameter that points to the options.js path.`);
    process.exit();
}

// Get the Options JSON content.
let options = null;
try {
    options = require(optionsPath);
} catch (error) {
    console.error(`ERROR: there was a JSON parser error. Please check the options JSON file syntax.`);
    console.error(error.message);
    process.exit();
}

// If the options specify to run as a service then create the service and start it.
if (options.runService)
{
    const service = new Service(options);
    service.start();
}
// Otherwise if we are to run it once then run the process once.
else 
{
    const dynamicDNS = new DynamicDNS(options);
    dynamicDNS.sync(true).then( result=>console.log(result.message) );
}