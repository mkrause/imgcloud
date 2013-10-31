
# imgCloud - Front-end server

## Dependencies

* [Node.js](http://nodejs.org)
* [npm](https://npmjs.org)
* [redis](http://redis.io)

Installation on Ubuntu/Debian:

    apt-get install redis-server nodejs nodejs-legacy npm git


## Configuration

See `config.js` for configuration values. You can use the imgCloud front-end server either locally, or using a IaaS provider. Currently we only support [DigitalOcean](https://digitalocean.com).

Copy `params.js.dist` to `params.js`, and enter your DigitalOcean API key, or disable `useDigitalOcean` if you want to run locally. `params.js` is included in `.gitignore` to prevent you from accidentally committed your API key.


## Running an imgCloud server

After the downloading the source, run `npm install` in the this (`server`) directory to download all node modules.

To run the application, simply use:

    $ npm start

You can optionally specify the port to run on using the `SERVER_PORT` environment variable:

    $ SERVER_PORT=8001 npm start


## Usage

Once you've configured and run the server, it will automatically start allocating and deallocating resources as necessary. Open up the application from the browser to submit images.
