{

const url = require('url');
const dns = require('dns');
const http = require('http');
const https = require('https');

/**
 * 
 * Currently only IPv4 is supported but this the class is setup to be expended to support IPv6.
 * 
 * @class 
 * @memberof DEDA.Google.Domains
 * @author Charbel Choueiri <charbel.choueiri@gmail.com>
 */
class GoogleDynamicDNS
{
    /**
     * Creates a new class with the given options.
     * @param {object} options see getDefaultOptions() for more details.
     */
    constructor(options)
    {
        /**
         * Holds the current public IP address.
         * @member {string}
         */
        this.publicIP = '';

        /**
         * Holds the current set host name IP address.
         * @member {string}
         */
        this.currentIP = '';

        /**
         * The class options as defined by getDefaultOptions().
         * On initialization the constructor options parameters are merged with the default options.
         * @member {object}
         */
        this.options = Object.assign(this.constructor.getDefaultOptions(), options);
    }

    /**
     * 
     */
    static getDefaultOptions()
    {
        return {
            username: '',
            password: '',
            hostname: '',
            publicIpUrl: 'https://domains.google.com/checkip',
            updateIpUrl: 'https://%USERNAME%:%PASSWORD%@domains.google.com/nic/update?hostname=%HOSTNAME%&myip=%IPADDRESS%'
        };
    }

    async run(force)
    {
        const publicIP = await this.getPublicIP();
        const currentIP = await this.getCurrentIP();

        // If we are to force and update then do so.
        const hasChanged = (publicIP !== currentIP);

        console.log(`Public IP ${publicIP}, currentIP ${currentIP}, has change: ${hasChanged}`);

        if (hasChanged || force) this.update();

        return hasChanged;
    }

    /**
     * Returns a promise with the public IP address of the current network hosting this application.
     * This method uses the HTTP GET url `options.publicIpUrl` to fetch the external IP address. 
     * This method can be overwritten to extend or implement different methods of fetching the external/public IP.
     * 
     * @returns {Promise} Returns a promise that is resolved with the public IP if successful otherwise returns an error object {error: message}.
     */
    getPublicIP()
    {
        return new Promise( (resolve, reject)=>{

            // Check if we are to use HTTPS or HTTP to fetch the public IP.
            const protocol = (this.options.publicIpUrl.toLowerCase().startsWith('https') ? https : http);

            // Get the HTTP body for the set URL.
            protocol.get(this.options.publicIpUrl, response=>{

                // If the HTTP response was not success then report error and return.
                if (response.statusCode !== 200) return resolve({error: `Unable to get public IP. Request failed: ${response.statusCode}`});

                // Next, read the IP from the response body.
                let ip = '';
                response.on('data', chunk=>{ ip += chunk; });
                response.on('end', ()=>{

                    // Validate the fetched IP address to ensure it is correct.
                    if (this.validateIPv4(ip))
                    {
                        // Set the local variable and resolve the promise.
                        this.publicIP = ip;
                        resolve(ip);
                    }
                    // Report the error.
                    else resolve({error: `Got invalid public IP address: ${ip}`});
                });

            // If an error occurred then report it.
            }).on('error', error=>resolve({error: `Unable to get public IP. Request error: ${error.message}`}));

        });
    }

    /**
     * Uses the DNS protocol to resolve a IPv4 addresses (A records) for the hostname. 
     * NOTE: This can and may return multiple IP addresses as of this version only the first IP address is returned. This can be extended to support multiple IPs in the future.
     * 
     * @returns {promise} Returns a promise that is resolved when the host IP address is resolve. Otherwise rejected with an error message.
     */
    getCurrentIP()
    {
        return new Promise( (resolve, reject)=>{

            // Use the DNS protocol to resolve the IPv4 address for the host name.
            dns.resolve4(this.options.hostname, (error, addresses) => {

                // If an error occurred then report it.
                if (error) return resolve({error: `Unable to resolve current host name (${this.options.hostname}) IP address: ${error}`});

                // If there are no IP address then also report an error. Note sure if this will ever occur!
                if (!addresses || addresses.length === 0) return resolve({error: `Unable to resolve current host name (${this.options.hostname}) IP address: No addresses returned!`});

                // Set the local variable and resolve the promise.
                this.currentIP = addresses[0];
                resolve(addresses[0]);
            });

        });
    }

    /**
     * Sends a request using the Google Domain Dynamic DNS API to update the IP address to the current IP address.
     * @param {string} ip - The IP address to update the Google Dynamic DNS.
     */
    update(ip)
    {
        return new Promise( (resolve, reject)=>{

            // Build the GET URL using the set option url.
            const updateIpUrl = this.options.updateIpUrl.
                replace('%USERNAME%', this.options.username).
                replace('%PASSWORD%', this.options.password).
                replace('%HOSTNAME%', this.options.hostname).
                replace('%IPADDRESS%', (ip || this.publicIP));

            // Parse the URL to get it's components to be used within the request.
            const updateUrl = url.parse(updateIpUrl);

            // Build the options parameter for the HTTPS method.
            const options = {

                protocol: updateUrl.protocol,
                host: updateUrl.host,
                path: updateUrl.path,
                auth: `${this.options.username}:${this.options.password}`,
                headers: {
                    'User-Agent': 'Nodejs google-ddns' // This is required by the Google Dynamic DNS API
                }
            };

            // Get the HTTP body for the set URL.
            https.get(options, response=>{

                // If the HTTP response was not success then report error and return.
                if (response.statusCode !== 200) return resolve({error: `Unable to update IP. Request failed: ${response.statusCode}`});

                // Next, read the IP from the response body.
                let status = '';
                response.on('data', chunk=>{ status += chunk; });
                response.on('end', ()=>{
                    resolve(status);
                    console.log(status);
                    // TODO: handle results.
                    //else resolve({error: `Got invalid public IP address: ${ip}`});
                });

            // If an error occurred then report it.
            }).on('error', error=>resolve({error: `Unable to update IP. Request error: ${error.message}`}));

        });
    }

    /**
     * 
     */
    updateResult(result)
    {
        result = result.split(' ');

        const response = GoogleDynamicDNS.Response.find( response=>response.response === result[0] );
        //if (!response) response = 
    }

    /**
     * Checks if the given IP address is a valid IPv4 address.
     * @param {string} ip - And IPv4 address to validate.
     * @returns {boolean} Returns true if the given ip is valid otherwise returns false.
     */
    validateIPv4(ip)
    {
        return /(([0-9]{1,3}\.){3}[0-9]{1,3})/.test(ip);
    }
}

/**
 * A static array the contains a list of all the possible update responses.
 * @name Response
 * @member {object}
 */
GoogleDynamicDNS.Response = [
    {response: 'good', status: 'success', description: 'The update was successful. Followed by a space and the updated IP address. You should not attempt another update until your IP address changes.'},
    {response: 'nochg', status: 'success', description: 'The supplied IP address is already set for this host. You should not attempt another update until your IP address changes.'},
    {response: 'nohost', status: 'error', description: 'The hostname does not exist, or does not have Dynamic DNS enabled.'},
    {response: 'badauth', status: 'error', description: 'The username / password combination is not valid for the specified host.'},
    {response: 'notfqdn', status: 'error', description: 'The supplied hostname is not a valid fully-qualified domain name.'},
    {response: 'badagent', status: 'error', description: 'Your Dynamic DNS client is making bad requests. Ensure the user agent is set in the request, and that you’re only attempting to set an IPv4 address. IPv6 is not supported.'},
    {response: 'abuse', status: 'error', description: 'Dynamic DNS access for the hostname has been blocked due to failure to interpret previous responses correctly.'},
    {response: '911', status: 'error', description: 'An error happened on our end. Wait 5 minutes and retry.'},
    {response: '', status: 'error', description: 'Unknown or not handled response'}
];


// Export the class
GoogleDynamicDNS.namespace = 'DEDA.Google.Domains.DynamicDNS';
module.exports = GoogleDynamicDNS;
};