player.pop = (function(p) {
    var my = {};
    my.time = Date.now();


    my.add = function (popentries) {
        var pop = [];
        var now = new Date();
        var diff = now - my.time;
        console.log("POP Diff is "+diff / 1000+". Change rate is "+p.param[0].cr+".");
        my.time = Date.now();
        p.localforage.getItem('pop').then(function(v){
            if (v === null) {pop = [];} else {pop = v;}
            $.each(popentries, function (idx, entry){
                console.log("Proof of play. Presid: "+entry['presId']+" v: "+entry['version']+" CompanyId: "+entry['coid']+" Count: "+entry['count']+" Time: "+(now.getTime() / 1000));
                pop.push({
                    'displayId': p.config.displayId,
                    'coid': entry['coid'],
                    'time': (now.getTime() / 1000),
                    'duration': p.param[0].cr,
                    'presId': entry['presId'],
                    'version': entry['version'],
                    'count': entry['count']
                });
            });
            p.localforage.setItem('pop', pop);
        });
    };

    my.send = function() {
        p.logger.debug("Sending POP.");
        console.log("Sending POP.");
        my.filterPop().then(function(){
            p.localforage.getItem('pop').then(function(v) {
                if(v === null){return;}
                console.log("In send start POP entries are "+v.length);
                if (v.length > 500) {
                    var batch = v.splice(0, 500);
                } else {
                    var batch = v;
                }

                if (p.online) {
                    if (v.length === 0 || v === null) {return;}
                    p.logger.debug("POP records: "+v.length+". Sending: "+batch.length+".");
                    console.log("POP records: "+v.length+". Sending: "+batch.length+".", batch);
                    console.log("DisplayId is ", p.displayId);
                    $.ajax({
                        type: 'POST',
                        url: p.config.URLS.popUrl,
                        data: {
                            displayId: p.config.displayId,
                            pop: batch
                        }
                    }).done(
                        function (data) {
                            p.logger.debug("Done: Proof of play data successfully sent.\n\n");
                            console.log("Done: Proof of play data successfully sent.");
                            p.localforage.getItem('pop').then(function(pop) {
                                var b = pop.splice(batch.length, pop.length);
                                console.log("Removed batch setting pop entries to "+b.length);
                                p.localforage.setItem('pop', b);
                            });
                        }
                    ).fail(
                        function (jqXHR, textStatus, errorThrown) {
                            console.log("POP Error.");
                            p.logger.debug(textStatus);
                            p.logger.debug(jqXHR);
                            p.logger.debug("There was an issue sending POP data to the server.");
                        }
                    );
                } else {
                    console.log("POP not sent. We are offline.");
                }
            });
        });
    };

    my.filterPop = function () {
        return p.localforage.getItem('pop').then(function(v) {
            if (v === null) {return;}
            // Foreach POP if displayId doesn't match current, discard. Removes any left over from testing.
            for (var i in v) {
                if (v[i].displayId !== p.config.displayId) {
                    p.logger.debug("Current Display is " + p.configdisplayId + " and POP display is " + v[i].displayId + ", discarding.");
                    v.splice(i, 1);
                }
            }
            p.localforage.setItem('pop', v);
        });
    };
    return my;
}(player));