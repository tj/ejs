
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

## Partial (`%RENDER` and `%COMPILE()` usage)

Partial rendering allow reuse some part of the template. See this example:

Template:
    <%- link_to( url, %RENDER%>
        <span class="mylink"><%= linkTxt %></span>
    <%END ) %>

Result:
    <a href="domain.org/some/path">
        <span class="mylink">some link text here!</span>
    </a>

`%RENDER` must be placed at the end of the js block and it will return a string
related to the result of the template partial block ended by `END`. The `END`
must be on the start of the js block.

Compile allows great things! See this example:

Template:
    <%- saveForm( userObj, %COMPILE(usrForm)%>
        <ul>
            <li> Name:   <%- usrForm.textField("fullName") %> </li>
            <li> e-mail: <%- usrForm.textField("email")    %> </li>
            <li> Birth:  <%- usrForm.dateField("birth")    %> </li>
        </ul>
        usrForm.submit('Update');
    <%END ) %>

Result:
    <form action="/save/id:123">
        <script type="text/javascript">
            function openCal(input) { ... }
        </script>
        <ul>
            <li> Name:   <input name="fullName"
                         value="Obi-Wan Kenobi"/> </li>
            <li> e-mail: <input name="email"
                         value="kenobi@jedicouncil.wars"/> </li>
            <li> Birth:  <input name="birth"
                         value="13/09/678654" onclick="openCal(this)"/> </li>
        </ul>
        <input type="submit" value="Update"/>
    </form>

`%COMPILE(...)` works like `%RENDER`, but returns a function and accept any
parameter list to be used on the compiled partial.

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
