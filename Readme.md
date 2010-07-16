
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
  - `context|scope`   Function execution context
  - `debug`           Output generated function body
  