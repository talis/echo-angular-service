echo-angular-service
====================

An angular service to submit events to [Talis Echo](http://docs.talisecho.apiary.io) with a debounce.

For internal use at Talis as you'll need some way of obtaining Talis OAuth tokens to use (we inject these with [transformRequest](http://engineering.talis.com/articles/elegant-api-auth-angular-js/)) but provided for intellectual interest in case anyone else is thinking of doing something similar. MIT licenced so rip, remix and enjoy.

Usage
---

Include via bower:

```
bower install echo-angular --save-dev
```

You'll need to define a constant somewhere for the `ECHO_ENDPOINT`. We do it like this:

```javascript

    angular.module('talis.environment', [], function($provide) {}).
      constant('ECHO_ENDPOINT', 'https://analytics.talis.com');

```

We have our environment set up by a dynamic `env.js` script that is served from Express, using the [user agent middleware](https://github.com/biggora/express-useragent) to pass back sanitised information about the browser back to angular. It esablishes these futher constants that are injected into the service:

```javascript

constant('BROWSER_NAME','Chrome').
constant('BROWSER_VERSION','34.0.1847.116').
constant('BROWSER_COMPAT_MODE','false');

```

These are set in the `props` of the event sent back to echo.

You'll also need `app-logger-angular` (see repo [here](https://github.com/talis/app-logging-angular-service)) which bower will install for you, but you'll need to reference that and this module somewhere:

```javascript

angular.module('myapp', [
    'talis.services.echo',
    'talis.services.logging',
]);

````