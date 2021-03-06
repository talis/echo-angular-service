'use strict';

angular.module('talis.services.echo', []).factory("echo",[
    "$rootScope",
    "$http",
    "applicationLoggingService",
    "ECHO_ENDPOINT",
    "APP_ID",
    "BROWSER_NAME",
    "BROWSER_VERSION",
    "BROWSER_COMPAT_MODE",
    "BROWSER_OS",
    "BROWSER_MOBILE",
    function($rootScope,
        $http,
        applicationLoggingService,
        ECHO_ENDPOINT,
        APP_ID,
        BROWSER_NAME,
        BROWSER_VERSION,
        BROWSER_COMPAT_MODE,
        BROWSER_OS,
        BROWSER_MOBILE) {
        var instance = function() {};
        var MAX_FLUSH_EVENTS = 10;
        var DEBOUNCE_INTERVAL = 2500;
        var MAX_INTERVAL = 5000;
        var BACK_OFF_FACTOR = 1.5;

        instance._instantFlush = function() {
            var ctx = this,
                _events = [];

            // pluck off up to MAX_FLUSH EVENTS
            if (this._events.length>MAX_FLUSH_EVENTS) {
                _events = _.first(this._events,MAX_FLUSH_EVENTS);
                this._events = _.rest(this._events,MAX_FLUSH_EVENTS);
                applicationLoggingService.debug(
                    "Only flushing "+MAX_FLUSH_EVENTS+" at a time - re-queued "+this._events.length+" events",
                    {'type' : 'echo.service.backlog'}
                );
                this._flush();
            } else {
                _events = this._events;
                this._events = [];
            }

            if (_events.length>0) {
                $http.post(ECHO_ENDPOINT+'/1/events',_events, {"headers":{"Content-Type":"application/json"}}).success(function(response) {
                    applicationLoggingService.debug(
                        "Successfully flushed "+_events.length+" events to backend",
                        {'type' : 'echo.service.upload'}
                    );
                    // ok!
                }).error(function(response) {
                    // back off debounce and interval
                    DEBOUNCE_INTERVAL = Math.floor(DEBOUNCE_INTERVAL*BACK_OFF_FACTOR);
                    MAX_INTERVAL = Math.floor(MAX_INTERVAL*BACK_OFF_FACTOR);
                    instance._flush = _.debounce(instance._instantFlush,DEBOUNCE_INTERVAL,{'maxWait':MAX_INTERVAL});

                    applicationLoggingService.warn(
                        "Error flushing "+_events.length+" events to backend, backing off to "+DEBOUNCE_INTERVAL+"/"+MAX_INTERVAL+", re-queueing...",
                        {'type' : 'echo.service.upload'}
                    );

                    // have another crack
                    _events.forEach(function(event) {
                        ctx._events.push(event);
                    });
                    ctx._flush();
                });
            } else {
                applicationLoggingService.debug(
                    "No events to flush",
                    {'type' : 'echo.service.upload'}
                );
            }
        };

        instance._events = [];
        instance._flush = _.debounce(instance._instantFlush,DEBOUNCE_INTERVAL,{'maxWait':MAX_INTERVAL}); // debounce within 5s, wait no more than 10...

        instance.add = function(className,props) {
            if (_.isEmpty(className)) {
                applicationLoggingService.error(
                    "No key supplied to events.add",
                    {'type' : 'echo.service.usage'}
                );
                return;
            } else if (!_.isString(className)) {
                applicationLoggingService.error(
                    "key supplied to events.add is not a string: " + JSON.stringify(className),
                    {'type' : 'echo.service.usage'}
                );
                return;
            } else if (props!==null && !_.isObject(props)) {
                applicationLoggingService.error(
                    "props supplied to events.add should be null or object",
                    {'type' : 'echo.service.usage'}
                );
                return;
            }

            var event = {
                "class": className,
                source: APP_ID,
                timestamp: Math.floor(new Date().getTime() / 1000) // seconds since epoch
            };
            event['props'] = props || {};
            event.props.browser_name = BROWSER_NAME;
            event.props.browser_version = BROWSER_VERSION;
            event.props.browser_compat_mode = BROWSER_COMPAT_MODE;
            event.props.browser_os = BROWSER_OS;
            event.props.browser_mobile = BROWSER_MOBILE;
            if ($rootScope.user !==null && $rootScope.user.guid !==null) {
                event['user'] = $rootScope.user.guid;
            }

            this._events.push(event);
            this._flush();
        };

        return instance;
    }]);
