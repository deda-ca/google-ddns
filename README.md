# google-ddns

This is a Google Dynamic DNS client the uses the google domain API to update and ensure the domain IP remains up to date on a none-static or dynamic IP address connection.

## Features

* Uses the full Google Dynamic DNS API found [here](https://support.google.com/domains/answer/6147083?hl=en).
* No dependencies, uses only build-in node packages.
* Runs as a stand along application, as a library or as a service.
* Highly customizable via input options JSON or JS file.
* Clean code and very well documented.

## Install

`npm -g install google-ddns`

## Usage

When the package is installed via NPM it automatically adds google-ddns to the bin folder which provides access to execute google-ddns script directly by calling it. This works on linux, windows, and MacOS as long as NPM was installed correctly.

Google-DDNS requires an options input file that contains the domain host, username, password and any other custom options listed below. Start by created options.js file and copy the content of the [example options.js](https://github.com/DEDAjs/google-ddns/blob/master/options.js) file into it and update the domain and user information as found within your google domain registry [here](https://domains.google.com/registrar).

To run the script as a CLI once change "runService" to false within options.js and execute the following command:

>  google-ddns options.js

This is provided the google-ddns was installed within the global NPM folder. This will run the script using the given options.

To run it as a service change "runService" to true within your options.js file and execute the same command:

> google-ddns options.js

This will run the google ddns script very 60 seconds (default if not changed) to ensure the domain DNS IP matches that of the public IP where this script is hosted.

You can also run the script as a service or cron job using third party tools.


## Options

 - **hostname** {string} - The dynamic DNS hostname.
 - **username** {string} - The dynamic DNS username.
 - **password** {string} - The dynamic DNS password.

The above fields are required to be within the options.js or options.json file. The following options are optional and the default values can be overwritten within the options files.

 * **publicIpUrl** [*https://domains.google.com/checkip*] - The HTTP/HTTPS URL used to check the current public IP of the device. The default value uses Google's provided URl but users can override this URL.
 * **updateIpUrl** [*https://domains.google.com/nic/update?hostname=%HOSTNAME%&myip=%IPADDRESS%*] - The HTTPS URL of the Google DNS API update. Typically this should not change unless Google decides to change the URL or format.
 * **userAgent** [*Nodejs google-ddns*] - The HTTP header User-Agent to send when updating the IP address. This is required by the Google Dynamic DNS API to identify the dynamic DNS client.
 * **failOnUnresolvedHostName** [*false*] - Indicates whether to fail or keep going during synchronizing if the current host name was not resolved. This typically happens if the domain was created and has not yet been applied or propagated. See TTL (Time-to-Live) for more information. Every though this can fail, the update can sill be successful.
 * **maxUnresolvedHostNameFail** [*3*] - This works in conjunction with failOnUnresolvedHostName to make sure we don't keep failing over and over with no error back reporting.
 * **useHostIPAddressCache** [*true*] - Indicates whether to cache and use the last resolved host IP address or resolve every-time. Generally speaking we don't need to resolve the host every-time since it will not change unless we change it. This saves having to do a DNS request every interval. Use the hostIPAddressCacheExpires to do a check every once in a while.
 * **hostIPAddressCacheExpires** [*3600*] - If useHostIPAddressCache is set to true, this timer is used to force a host IP address checked/resolution every once in a while rather than never. The time is in seconds and defaults to every hour.
 * **debug** [*false*] - Set the debug mode on or off. The debug mode will write debug and status information to the console.

The next options pertain to running the script as a service:

 * **runService** [*true*] - Defines whether to run the application as a service as a one time call to update the google domain IP address.
 * **checkInterval** [*60*] - Used by the service. The amount of time in seconds to wait before checking if the public IP has changed.
 * **maxConsecutiveErrors** [*10*] - Used by the service. The maximum number of consecutive errors before stopping the check timer loop.
 * **exitOnMaxErrors** [*true*] - Used by the service. Defines whether to exit process when the max consecutive errors has been reached.
 * **logPath** [*'./logs.log'*] - Used by the service. Defines the log output path. Set to false to disable output logs.
 * **logToConsole** [*true*] - Used by the service. Defines whether to log output to the console or not.
