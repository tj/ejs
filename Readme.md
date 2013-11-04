# EJS

Embedded JavaScript templates.

[![Build Status](https://travis-ci.org/visionmedia/ejs.png)](https://travis-ci.org/visionmedia/ejs)

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
  * Extend file with `<%+ file-to-be-extended %>`
  * Blocks `<%block blockname%>content comes here<%/block%>`, cooperate with extend
  * Includes
  * Client-side support
  * Newline slurping with `<% code -%>` or `<% -%>` or `<%= code -%>` or `<%- code -%>`

## Example

    <% if (user) { %>
	    <h2><%= user.name %></h2>
    <% } %>
    
## Try out a live example now

<a href="https://runnable.com/ejs" target="_blank"><img src="https://runnable.com/external/styles/assets/runnablebtn.png" style="width:67px;height:25px;"></a>

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
  - `compileDebug`    When `false` no debug instrumentation is compiled
  - `client`          Returns standalone compiled function
  - `open`            Open tag, defaulting to "<%"
  - `close`           Closing tag, defaulting to "%>"
  - *                 All others are template-local variables

## Includes

 Includes are relative to the template with the `include` statement,
 for example if you have "./views/users.ejs" and "./views/user/show.ejs"
 you would use `<% include user/show %>`. The included file(s) are literally
 included into the template, _no_ IO is performed after compilation, thus
 local variables are available to these included templates.

```
<ul>
  <% users.forEach(function(user){ %>
    <% include user/show %>
  <% }) %>
</ul>
```

## Custom delimiters

Custom delimiters can also be applied globally:

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

## Layouts without blocks

  You may utilize compile-time `include`s without blocks to implement "layouts" by
  simply including a header and footer like so:

```html
<% include head %>
<h1>Title</h1>
<p>My page</p>
<% include foot %>
```

## extend and blocks

  Currently EJS has come up with extend and blocks, they can support:

  - Multilayer inheritance, that is the child can extend the parent file, the father coulud still extend the grandfather
  - the blocks in the clild will replace the block with the same name in the parent file, the conent outside blocks in the clild will be ignored, and the content in the blocks that are not replaced in the parent file will run directly, as no blocks surround it
  - faster, the test in benchmark shows that the layout using extend is 33% faster than that using include
  - the include could also work in the file or blocks
  - notice: no space between the open tag and `+` or `block`

```parent.ejs
<%block head%>
    head
<%/block%>
<%block body%>
    body
<%/block%>
```

```child.ejs
<%+ parent %>
<%block head%>
    the clild's head
<%/block%>
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
