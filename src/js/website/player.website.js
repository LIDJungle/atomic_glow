player.website = (function (p) {
    var my = {};
    my.timeouts = [];
    my.pixelRatio = 1;

    my.startPlaylistMode = function () {
        console.log('We are working with a playlist.');

        p.displayId = p.utility.get_var('id');
        p.param[0] = {'h': p.utility.get_var('h'), 'w': p.utility.get_var('w'), 'cr': p.utility.get_var('crate')};
        localforage.setItem('param', p.param);
        var itemStr = p.utility.get_var('items');
        var items = itemStr.split(',');
        my.goFullScreen();

        var mp = {'masterPlaylist': items, 'presentations': []};
        p.schedule.schedule = [];
        p.schedule.schedule[0] = mp;

        console.log("Items: ", items);
        // We need to load the presentation cache.
        for (i = 0; i < items.length; i++) {
            my.loadPreview(items[i]);
        }

        // Always on for playlist mode.
        p.schedule.schedule.ani_allow = true;
        p.schedule.schedule.trans_allow = true;
        p.preview = true;
        // We need to wait for the presentations to load.
        clearTimeout(my.timeouts['load']);
        my.timeouts['load'] = setTimeout(
            function(){
                my.checkLoadStatus(items);
            }, 1000);
    };


    my.zoomFullScreenPlayer = function(canvas) {
        console.log("Zooming by "+my.pixelRatio);
        my.zoom(my.pixelRatio, canvas);
        if (my.pixelRatio > 4) {
            var pixelMask = 'img/'+my.pixelRatio+'.png';
            canvas.setOverlayImage(pixelMask, canvas.renderAll.bind(canvas));
        }

    };

    my.zoom = function (factor, canvas) {
        console.log("Factor: "+factor, canvas);

        canvas.setHeight(canvas.getHeight() * factor);
        canvas.setWidth(canvas.getWidth() * factor);
        if (canvas.backgroundImage) {
            // Need to scale background images as well
            var bi = canvas.backgroundImage;
            bi.width = bi.width * factor; bi.height = bi.height * factor;
        }
        var objects = canvas.getObjects();
        console.log("Objects", objects);
        var origObj = objects.length;
        for (i = 0; i < origObj; i++) {
            //for (var i in objects) {
            var o = objects[i];
            var scaleX = o.scaleX;
            var scaleY = o.scaleY;
            var left = o.left;
            var top = o.top;

            var tempScaleX = scaleX * factor;
            var tempScaleY = scaleY * factor;
            var tempLeft = left * factor;
            var tempTop = top * factor;

            o.scaleX = tempScaleX;
            o.scaleY = tempScaleY;
            o.left = tempLeft;
            o.top = tempTop;
            o.setCoords();
        }
        canvas.renderAll();
    };

    my.goFullScreen = function() {
        //console.log("going full screen.");
        // Get height and width of browser window.
        var browserWidth = $(window).width();
        var browserHeight = $(window).height();
        var hpr = Math.floor(browserHeight / p.param[0].h);
        my.pixelRatio = Math.floor(browserWidth / p.param[0].w);
        if (my.pixelRatio > hpr) {my.pixelRatio = hpr;}
        var previewWidth= my.pixelRatio * p.param[0].w;
        var previewHeight = my.pixelRatio * p.param[0].h;
        var leftMargin = (browserWidth - previewWidth) / 2;
        var topMargin = (browserHeight - previewHeight) / 2;

        console.log("Browser Dims: "+browserHeight+" X "+browserWidth);
        console.log("Presentation Dims: "+p.param[0].w+" X "+p.param[0].h);
        console.log("Pixel ratio is: "+my.pixelRatio);

        $('.canvas-holder').css("top", topMargin);
        $('.canvas-holder').css("left", leftMargin);

    };

    /* Playlist functions */
    my.checkLoadStatus = function(items){
        console.log("Checking load status");
        var complete = true;
        for (i = 0; i < items.length; i++) {
            if (typeof(my.schedule.schedule[0].presentations[items[i]]) === 'undefined') {
                JL().fatal("We don't have "+items[i]);
                complete = false;
            }
        }
        if (complete) {
            p.loadNextPresentation();
        } else {
            clearTimeout(my.timeouts['load']);
            my.timeouts['load'] = setTimeout(function(){my.checkLoadStatus(items);}, 1000);
        }
    };

    my.loadPreview = function(id) {
        console.log("Getting presentation id: "+id);
        $.ajax({
            type: 'GET',
            url: p.presentationUrl,
            data: {
                id: id
            },
            success: function(data) {
                data.json = JSON.parse(data.json);
                console.log("Storing Data", data);
                p.schedule.schedule[0].presentations[id] = data;
            }
        });
    };

    my.setSiteInfo = function(presId) {
        console.log("My mode is: "+p.mode);
        var version = p.schedule.schedule[0].presentations[presId].version;
        var name = p.schedule.schedule[0].presentations[presId].name;

        $('#statusLeft', parent.document).text(presId+"v"+version+": "+name);
        $('#statusRight', parent.document).text("Tags: "+p.utility.parseTagString(p.schedule.schedule[0].presentations[presId].tags));
    };
    return my;
}(player))