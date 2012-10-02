Node.js Correios library
========================

Dependencies
------------

### Runtime
* Node 0.4.X+
* Request 2.11.1+
* Cheerio 0.10.0+

Installation
------------
> npm install correios

Usage
-----
    var correios = require('correios');
    correios.track('TRACKING_CODE', callback(err, result));

### Examples
    // sorry, I can't put real tracking codes because they only last 3 months

    var correios = require('correios');
    // valid tracking code
    correios.track('TRACKING_CODE', function(err, result) {
        console.log(result);
    });
    // returns an array with objects inside from lastest to oldest data

    // valid but doesnt have data yet
    correios.track('TRACKING_CODE', function(err, result) {
        console.log(result);
    });
    // returns the correios message for the object

    // invalid tracking code
    correios.track('TRACKING_CODE', function(err, result) {
        console.log(err);
    });
    // returns the correios message saying to type a tracking code

New Features Coming
-------------------
* Unity tests
* Post service price calculation


Author
------
* Felipe K. De Boni

License:
--------

(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.