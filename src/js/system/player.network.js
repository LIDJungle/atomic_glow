player.network = (function(p) {
    var my = {};
    my.timeouts;
    my.online;

    my.check = function(url) {
        return $.get(url, function(){
            p.logger.debug("Network.Check: We are online.");
            console.log("Network.Check: We are online.");
            p.startup.updateNetStatus("Network check: We are online.");
            p.online = true;
        }).fail(function(jqXHR, exception) {
            p.logger.debug("Network.Check: We are offline.", jqXHR);
            console.log("Network.Check: We are offline.");
            p.startup.updateNetStatus("Network ERROR: We are offline.");
            p.online = false;
        });
    };

    return my;
}(player));