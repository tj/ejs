
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
  * Client-side support
  * Newline slurping with `<% code -%>` or `<% -%>` or `<%= code -%>` or `<%- code -%>`
  * Layouts with <% extends foo.html %> and <% block block_name %>
  * Mixins with <% include %>

## Example

    <% if (user) { %>
	    <h2><%= user.name %></h2>
    <% } %>

## Usage

    ejs.compile(str, options);
    // => Function

    ejs.render(str, options);
    // => str

## Options

  - `cache`           Compiled functions are cached, requires `filename`
  - `filename`        Used by `cache` to key caches
  - `scope`           Function execution context
  - `debug`           Output generated function body
  - `open`            Open tag, defaulting to "<%"
  - `close`           Closing tag, defaulting to "%>"
  - *                 All others are template-local variables

## Custom tags

Custom tags can also be applied globally:

    var ejs = require('ejs');
    ejs.open = '{{';
    ejs.close = '}}';

Which would make the following a valid template:

    <h1>{{= title }}</h1>

## Layouts and Blocks

Layout for a view can be specified by using :

    <% extends layout.html %>

This will insert the contents of layout.html at the location of the extends 
statement.  Extends are used with blocks to provide dynamic layout capabilities
with default behaviour.

For example, consider the following layout.html:

    <div id="has-default">
        <% block block1%>
           <p>This is default value</p>
        <% end %>
    </div>
    <div class="no-default">
        <% block block2%>
        <% end %>
    </div>

In your ejs file, specifying:
    
    <% extends layout.html %>
    <% block block2 %><p>Block 2 value</p><%end%>

would cause the following to be rendered.
    
    <div id="has-default">
        <p>This is default value</p>
    </div>
    <div class="no-default">
        <p>Block 2 value</p>
    </div>

In the above _block1_ has a default value defined, if _block1_ is not passed in
the default value would be used. However, if _block1_ was specified, then it 
would override the default value. 

Please note that blocks must be terminated with an _end_ statement.

## Mixins

This effectively replace partials() from Express 2.x.  You can include partiral 
ejs by specifying:

    <% include component.html %>

This would insert the contents of _component.html_ at the location of the include
statement.

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
        users: [
          { name: 'tj' },
          { name: 'mape' },
          { name: 'guillermo' }
        ]
    });

Or perhaps capitalize the first user's name for display:

    <p><%=: users | first | capitalize %></p>

## Filter list

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

## Adding filters

 To add a filter simply add a method to the `.filters` object:
 
```js
ejs.filters.last = function(obj) {
  return obj[obj.length - 1];
};
```


## client-side support

  include `./ejs.js` or `./ejs.min.js` and `require("ejs").compile(str)`.

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
