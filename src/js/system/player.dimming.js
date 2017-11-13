player.dimming = (function(p){
    var my = {};
    my.timeouts = [];

    my.adjust = function(){
        if (p.preview) {return;}
        p.localforage.getItem('weather').then(function(v) {
            var sunrise = new Date();
            sunrise.setHours(v.sun_phase.sunrise.hour);
            sunrise.setMinutes(v.sun_phase.sunrise.minute);
            var sunset = new Date();
            sunset.setHours(v.sun_phase.sunset.hour);
            sunset.setMinutes(v.sun_phase.sunset.minute);

            if (v === 'null') {
                p.logger.debug("Could not get dimming data. Will retry.");
                console.log("Could not get dimming data. Will retry.");
                clearTimeout(my.timeouts['dimming']);
                my.timeouts['dimming'] = setTimeout(function(){my.adjust();}, 1000);
            } else {
                var clouds = '70';
                console.log("Sunrise: "+sunrise+" Sunset: "+sunset+" Cloud cover: "+clouds);
                var now = new Date();
                if (now > sunrise && now < sunset) {
                    console.log("It's daytime. "+p.param[0].dimming.day);
                    $('.dimmer').css('opacity', "." + (100 - p.param[0].dimming.day));
                    if (clouds >= 75) {
                        //console.log("And overcast");
                        $('.dimmer').css('opacity', "." + (100 - p.param[0].dimming.overcast));
                    }
                } else {
                    console.log("It's night.", now);
                    $('.dimmer').css('opacity', "." + (100 - p.param[0].dimming.night));
                }
            }
        });
    };

    return my;
}(player));