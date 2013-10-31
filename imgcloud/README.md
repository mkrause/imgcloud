# imgCloud - Application

This application provides a flexible front-end for users who want to be able to manipulate their images in a user-friendly fashion.

The default parameters are tweaked for high quality results at the cost of some performance.


# Dependencies

* [Node.js](http://nodejs.org)
* [npm](https://npmjs.org)
* [redis](http://redis.io)
* `ImageMagick` or `GraphicsMagick`
* `ExpressJS` and more (see `package.json`)

Installation on Ubuntu/Debian:

    apt-get install redis-server nodejs nodejs-legacy npm git


## Running an imgCloud instance

After the downloading the source, run `npm install` in this (`imgcloud`) directory to download all node modules.

To run the application, simply use:

    $ npm start

You can optionally specify the port to run on using the `PORT` environment variable:

    $ PORT=8001 npm start


## Usage

You can use the application as is, as a stand-alone application. To use it, just load the application in a browser and upload an image. The real power comes from using imgCloud with the load balancer, resource manager, and monitor included in the [front-end server](https://github.com/mkrause/imgcloud/tree/master/server).
