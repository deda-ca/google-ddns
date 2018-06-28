
const options = require('./options.json');
const GoogleDynamicDNS = require('./lib/GoogleDynamicDNS');

let googleDynamicDNS = new GoogleDynamicDNS(options);
googleDynamicDNS.sync(true).then( result=>console.log(result) ).catch( error=>console.error(error) );