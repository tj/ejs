
# EJS

Embedded JavaScript templates.

## Installation

    $ npm install ejs

## Features

  * Complies with the [Express](http://expressjs.com) view system
  * Static caching of intermediate JavaScript
  * Unbuffered code for conditionals etc `<% code %>`
  * Escapes html by default with `<%= code %>`
  * Unescaped buffering with `<%- code %>`
  * Supports tag customization
  * Filter support for designer-friendly templates

## Example

    <% if (user) { %>
	    <h2><%= user.name %></h2>
    <% } %>
    
    // High speed mode: options.it = true;
    
    <% if (it.user) { %>
        <h2><%= it.user.name %></h2>
    <% } %>

## Usage

    ejs.compile(str, options);
    // => Function

    ejs.render(str, options);
    // => str

## Options

  - `locals`          Local variables object
  - `cache`           Compiled functions are cached, requires `filename`
  - `filename`        Used by `cache` to key caches
  - `scope`           Function execution context
  - `debug`           Output generated function body
  - `open`            Open tag, defaulting to "<%"
  - `close`           Closing tag, defaulting to "%>"
  - `it`              High performance render option, if it is true, will be _100%_ speed up; false by default

## Custom Tags

Custom tags can also be applied globally:

    var ejs = require('ejs');
    ejs.open = '{{';
    ejs.close = '}}';

Which would make the following a valid template:

    <h1>{{= title }}</h1>

## Filters

EJS conditionally supports the concept of "filters". A "filter chain"
is a designer friendly api for manipulating data, without writing JavaScript.

Filters can be applied by supplying the _:_ modifier, so for example if we wish to take the array `[{ name: 'tj' }, { name: 'mape' },  { name: 'guillermo' }]` and output a list of names we can do this simply with filters:

Template:

    <p><%=: users | map:'name' | join %></p>

Output:

    <p>Tj, Mape, Guillermo</p>

Render call:

    ejs.render(str, {
        locals: {
            users: [
                { name: 'tj' },
                { name: 'mape' },
                { name: 'guillermo' }
            ]
        }
    });

Or perhaps capitalize the first user's name for display:

    <p><%=: users | first | capitalize %></p>

## Filter List

Currently these filters are available:

  - first
  - last
  - capitalize
  - downcase
  - upcase
  - sort
  - sort_by:'prop'
  - size
  - length
  - plus:n
  - minus:n
  - times:n
  - divided_by:n
  - join:'val'
  - truncate:n
  - truncate_words:n
  - replace:pattern,substitution
  - prepend:val
  - append:val
  - map:'prop'
  - reverse
  - get:'prop'

## High Speed mode: ejs.it = true;

If you set option `it` to true, there will be 100% render speed up:

    var ejs = require('ejs');
    // global settings
    ejs.it = true;

You must use `it.var_name` to access your template locals variables:

    <h1><%= it.title %></h1>

## License 

(The MIT License)

Copyright (c) 2009-2010 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

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
