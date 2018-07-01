{
"use strict";

// Define the required modules for this class.
const fs = require('fs');
const path = require('path');

const DynamicDNS = require('./DynamicDNS');

/**
 * This is a service class designed to run the Google DynamicDNS as a service on a time interval that checks if the public IP has
 * changed in-order to update the Google host DNS IP address. This is intended to be simple and clean, for more complex features use
 * this as a template in conjunction with DynamicDNS class. 
 * 
 * @class
 * @memberof DEDA-Google-DDNS
 * @author Charbel Choueiri <charbel.choueiri@gmail.com>
 */
class Service
{
    /**
     * Creates a new class with the given options.
     * @param {object} options See [getDefaultOptions()]{@link DEDA-Google-DDNS.Service.getDefaultOptions} for more details.
     */
    constructor(options)
    {
        /**
         * An instance of the Google DynamicDNS class used within this service.
         * @member {DEDA-Google-DDNS.DynamicDNS}
         */
        this.dynamicDNS = new DynamicDNS(options);

        /**
         * Keeps track of the number of consecutive errors in-order to determine what to do next base don the set options.
         * @member {number}
         */
        this.consecutiveErrors = 0;

        /**
         * The class options as defined by [getDefaultOptions()]{@link DEDA-Google-DDNS.Service.getDefaultOptions}
         * On initialization the constructor options parameters are merged with the default options.
         * @member {DEDA-Google-DDNS.Service.DefaultOptions}
         */
        this.options = Object.assign(this.constructor.getDefaultOptions(), options);

        // Update log file to include first entry.
        this.log('Creating new service.\n');
    }

    /**
     * @typedef {Object} DefaultOptions
     * @property {number} [checkInterval = 60] - The amount of time in seconds to wait before checking if the public IP has changed.
     * @property {number} [maxConsecutiveErrors = 10] - The maximum number of check consecutive errors before stopping the check timer loop.
     * @property {boolean} [exitOnMaxErrors = true] - Defines whether to exit process when the max consecutive errors has been reached.
     * @property {string | boolean} [logPath = './logs.log'] - Defines the log output path. Set to false to disable output logs.
     * @property {boolean} [logToConsole = true] - Defines whether to log output to the console or not.
     * @memberof DEDA-Google-DDNS.Service
     */

    /**
     * Returns a list of all possible options for this class with their default values.
     * @returns {DEDA-Google-DDNS.Service.DefaultOptions} Returns the component default options.
     */
    static getDefaultOptions()
    {
        return {
            checkInterval: 60,
            maxConsecutiveErrors: 3,
            exitOnMaxErrors: true,
            logPath: './logs.log',
            logToConsole: true
        };
    }

    /**
     * Starts the service check loop that will check for public IP changes every set time interval to ensure it remains
     * synchronized with the host name DNS IP address.
     */
    async start()
    {
        let checkInterval = this.options.checkInterval;

        // Call the sync method and get the results.
        const result = await this.dynamicDNS.sync();

        // If it was successful then set time out to the next interval.
        if (result.status !== 'error')
        {
            // Clear the current error counter.
            this.consecutiveErrors = 0; 

            // If it was actually updated then log it.
            if (result.status === 'success') this.log(result.message);
        }
        // Otherwise if an error occurred then update the counter and log the error.
        else
        {
            // Update the error counter and log the error.
            this.consecutiveErrors++;
            this.log(result.message, 'error');
            
            // If google returned '911' then wait 5 minutes before trying again. Even if if checkInterval was longer than 5 minutes, we missed this one and should try again.
            if (result.response === '911') checkInterval = 6*60;
        }

        // If we have not exceeded the consecutive errors then run the timer again.
        if (this.consecutiveErrors < this.options.maxConsecutiveErrors) setTimeout(()=>this.start(), checkInterval*1000);

        // Otherwise log the error and exit.
        else this.log('The maximum consecutive errors have occurred.', 'error');
    }

    /**
     * 
     * @param {*} message 
     * @param {*} type 
     */
    log(message, type = 'log')
    {
        // Get the current date time stamp as a string. Add the message type and time stamp.
        const date = new Date();
        message = `${type.toUpperCase()} (${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}): ${message}`;

        // Append the message to the log file if provided. Also append the message to the console if set.
        if (this.options.logPath) fs.writeFileSync( path.resolve(process.argv[1], '../', this.options.logPath), message + '\n', {flag: 'a'} );
        if (this.options.logToConsole) console[type](message);
    }
}

// Export the class
Service.namespace = 'DEDA.Google.Domains.DynamicDNS.Service';
module.exports = Service;
};