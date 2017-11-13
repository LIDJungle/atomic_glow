var player = (function () {
    var my = {};

    my.localforage = require('localforage');
    
    var log4js = require('log4js');
    my.logger = log4js.getLogger();
    my.logger.level = 'debug';
    log4js.configure({
        appenders: {
            out: { type: 'stdout' },
            app: { type: 'file', filename: '../logs/glow.log', maxLogSize: 10485760, backups: 3, compress: true }
        },
        categories: {
            default: { appenders: [ 'out', 'app' ], level: 'debug' }
        }
    });
    window.onerror = function(message, url, lineNumber) {
        //save error and send to server for example.
        my.logger.error("Error: "+message+" In: "+url+" at line "+lineNumber);
        return true;
    };

    const {ipcRenderer} = require('electron');
    my.ipc = ipcRenderer;

    my.cp = require('child_process');

    // Setting configuration defaults
    my.config = {
        "displayId": "100002",
        "pop": false,
        "dev": true,
        "version": "1.0.0",
        "heartRate": 300,
        "weatherUpdate": 900,
        "paramUpdate": 900,
        "URLS": {
            "popUrl": "http://shineemc.com/api/public/index.php/storePop",
            "heartbeatUrl": "http://shineemc.com/api/public/index.php/getSchedule",
            "paramUrl": "http://shineemc.com/api/public/index.php/getDisplay",
            "presentationUrl": "http://shineemc.com/api/public/index.php/loadPresentation",
            "pingUrl": "http://shineemc.com/api/public/index.php/ping"
        }
    };

    my.weather = new Weather();
    my.canvases = [];
    my.schedule = {};
    my.online = '';
    my.param = [];
	my.restart = true;
    my.preview = false;

    /*
     *   init starts the player.
     *   call from doc.body.onload
     *
     *
     *  Note that from a design standpoint... We don't want the cache/player loop to require that any data connection be "good".
     *
     *  So, get startup parameters should run independently of waitForLocalCache. That's by design.
     *  If we already have parameters and a schedule cached, we should start to play.
     */

    my.init = function() {
		my.logger.debug("\n\n");
        my.logger.debug("Player started");
        my.mode = my.utility.get_var('mode');
        my.startCache();
        my.canvas.initialize();

        if(my.config.dev){my.localforage.clear();}
        // Handle playlist only mode from website
        if (my.mode === 'playlist') {
            my.website.startPlaylistMode();
        } else {
            // Show startup diagnostic presentation
            my.startup.start();
            // Start getting data
            my.data.getStartupParameters();
            // Watch cache and start player when ready
            my.data.waitForLocalCache();
        }
    };

    my.startCache = function() {
        // Use a service worker cache to cache images for one month. 
	    // This cache will survive reboot and enables offline functionality.
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('shine_cache.js').then(function(registration) {
                    // Registration was successful
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }).catch(function(err) {
                    // registration failed :(
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
    };

    return my;
}());
