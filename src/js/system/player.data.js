player.data = (function (p) {
    var my = {};
    my.timeouts = [];

    my.getStartupParameters = function () {
        $.when(my.getDisplayId()).then(function () {
            p.logger.debug("Gotten display ID, checking network. "+p.displayId);
            $.when(p.network.check(my.pingURL)).then(function () {
                p.logger.debug("Network is "+p.online+" and we're getting our display parameters.");
                $.when(my.updateDisplayParameters()).then(function () {
                    p.logger.debug("Finished getting display parameters. Showing startup presentation.");
                });
            });
        });
    };

    my.waitForLocalCache = function () {
        p.logger.debug("Waiting for cache");
        // wait for getStartupParameters to finish before we start getting data.
        p.localforage.getItem('param').then(function(param){
            if (param === null || param === 'null') {
                p.logger.debug("waiting for display parameters from server.");
                p.startup.updateStatus('Getting Display Parameters...');
                clearTimeout(my.timeouts['cache']);
                my.timeouts['cache'] = setTimeout(function() {my.waitForLocalCache();}, 500);
            } else {
                console.log("we have display parameters from server.", param);
                p.logger.debug("Startup parameters: ", param);
                p.param = param;

                // Set up the canvases
                p.canvas.initialize();
                // Load fonts
                p.fonts.configure();

                // Get schedule and set up external data sources.
                my.updateSchedule();
                my.updateWeather();
                my.updateTides();

                // Start cache watcher for schedule
                my.waitForScheduleCache();
            }
        });
    };

    my.waitForScheduleCache = function() {
        // Wait for schedule
        p.localforage.getItem('schedule').then(function(scheduleCache){
            if (scheduleCache === null || scheduleCache === 'null') {
                p.startup.updateStatus('Getting Schedule...');
                clearTimeout(my.timeouts['cache']);
                my.timeouts['cache'] = setTimeout(function() {my.waitForScheduleCache();}, 500);
            } else {
                // We wait 5 seconds while the blinker blinks
                console.log("We have a schedule.", scheduleCache);
                p.startup.updateStatus('Starting up...');
                clearTimeout(my.timeouts['main']);
                my.timeouts['main'] = setTimeout(function() {
                    my.startPlayerLoop(scheduleCache);
                }, 5000);
            }
        });
    };

    /**
     *  Called from my.waitForLocalCache(); when local cache is ready.
     *  Do not call directly.
     *
     */
    my.startPlayerLoop = function(schedule) {
        p.schedule = schedule;
        p.logger.debug("Schedule data", p.schedule);

        console.log("Next presentation Id", p.schedule.schedule[0].masterPlaylist[0]);
        if (p.preview) {
            console.log("We are in preview mode.", p.preview);
            p.website.goFullScreen();
        } else {
            console.log("We are not in preview mode.", p.preview);
        }
        p.canvas.loadNextPresentation();
    };

    my.updateSchedule = function() {
        if (p.online) {
            $.ajax({
                type: 'GET',
                url: p.config.URLS.heartbeatUrl,
                data: {
                    displayId: p.config.displayId,
                    previewMode: p.preview,
                    restart: p.restart,
                    version: p.config.version
                }
            }).done(
                function (data) {
                    p.restart = false;
                    p.localforage.setItem('schedule', data).then(function(v) {
                        // Do stuff here.
                        my.schedule = data;
                        p.logger.debug("Retrieved schedule data");
                    });
                    if (!(p.mode === 'playlist' || p.mode === 'master')) {
                        p.logger.debug('Sending proof of play.');
                        p.pop.send();

                        // Here's where we need to react to any update/reboot commands
                        // Reboot
                        if (data.reboot === 'true') {
                            p.logger.debug("Rebooting computer due to request from cloud. data.reboot is "+data.reboot);
                            p.cp.exec('shutdown -r -t 0');
                        }
                    }
                    clearTimeout(my.timeouts['schedule']);
                    my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, p.config.heartRate * 1000);
                }
            ).fail(
                function (jqXHR, textStatus, errorThrown) {
                    p.logger.debug(textStatus);
                    p.logger.debug(jqXHR);
                    p.logger.debug("Could not get schedule. Checking network.");
                    my.online = false;
                    clearTimeout(my.timeouts['schedule']);
                    my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
                }
            );
        } else {
            p.network.check(p.config.URLS.pingURL);
            clearTimeout(my.timeouts['schedule']);
            my.timeouts['schedule'] = setTimeout(function(){my.updateSchedule();}, 1000);
        }
    };

    my.getDisplayId = function(){
        var deferred = $.Deferred();
        var get_id = p.utility.get_var('id');
        if (get_id !== false) {
            console.log("Player started in preview mode. Display Id: "+get_id);
            p.displayId = get_id;
            p.preview = true;
            $('.dimmer').hide();
            deferred.resolve();
        } else {
            var fs = require('fs');
            fs.readFile('config/config.json', 'utf8', function (err,data) {
                p.logger.debug("File read errors: ", err);
                p.logger.debug("File Read data:", data);
                p.config = JSON.parse(data);
                deferred.resolve();
            });
        }
        return deferred;
    };

    my.updateDisplayParameters = function () {
        var deferred = $.Deferred();
        p.logger.debug("Getting display params for Id: "+p.displayId);
        if (p.online) {
            $.ajax(
                {type: 'GET', url: p.config.URLS.paramUrl, data: {id: p.config.displayId, online: p.online}}
            ).done(
                function(d) {
                    var data = [];
                    data[0] = eval(d);
                    data[0].dimming = JSON.parse(data[0].dimming);
                    p.param = data;
                    p.logger.debug('displayParam', data);
                    p.localforage.setItem('param', data).then(function(v) {
                        console.log("Stored param data");
                    });
                    p.online = true;
                    clearTimeout(my.timeouts['param']);
                    my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, p.config.paramUpdate * 1000);
                }
            ).fail(
                function() {
                    p.logger.debug("Could not get param from AJAX call.");
                    p.localforage.getItem('param').then(function(param){
                        p.param = param;
                    });
                    p.online = false;
                    clearTimeout(my.timeouts['param']);
                    my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, p.config.paramUpdate * 1000);
                }
            );
        } else {
            p.logger.debug("Could not get display parameters. Not online.");
            my.network.check(p.config.URLS.pingURL);
            clearTimeout(my.timeouts['param']);
            my.timeouts['param'] = setTimeout(function(){my.updateDisplayParameters();}, 1000);
        }
        deferred.resolve();
    };

    my.updateWeather = function () {
        if (p.param[0].zip === 'undefined' || p.param[0].zip === '') {return;}
        if (p.online) {
            p.weather.update(p.param[0].zip).then(function(){
                p.localforage.setItem('weather', p.weather.data).then(function(v) {});
            });
            clearTimeout(my.timeouts['weather']);
            my.timeouts['weather'] = setTimeout(function(){my.updateWeather();}, p.config.weatherUpdate * 1000);
        } else {
            console.log("Could not get weather. Checking network.");
            p.network.check(p.config.URLS.pingURL);
            clearTimeout(my.timeouts['weather']);
            my.timeouts['weather'] = setTimeout(function(){my.updateWeather();}, 1000);
        }
    };

    my.updateTides = function () {
        if (p.param[0].station === 'undefined' || p.param[0].station === '') {return;}
        console.log("Getting tides for station: "+p.param[0].station)
        if (p.online) {
            p.weather.tides(p.param[0].station).then(function(){
                p.localforage.setItem('tides', p.weather.tideData).then(function(v) {});
            });
            clearTimeout(my.timeouts['tides']);
            my.timeouts['tides'] = setTimeout(function(){my.updateTides();}, p.config.weatherUpdate * 1000);
        } else {
            console.log("Could not get tides. Checking network.");
            p.network.check(p.config.URLS.pingURL);
            clearTimeout(my.timeouts['tides']);
            my.timeouts['tides'] = setTimeout(function(){my.updateTides();}, 1000);
        }
    };

    return my;
}(player));