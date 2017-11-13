player.anim = (function(p){
    var my = {};
    my.load = function (c) {
        c.forEachObject(function(obj) {
            //console.log('Anim', obj.get('anim'));
            switch (obj.get('anim')) {
                case 'blink':
                    my.startBlink(obj, c);
                    break;
                case 'time':
                    obj.set('text', my.currentTime());
                    c.renderAll();
                    break;
                case 'tempF':
                    p.weather.getTempF(obj);
					c.renderAll();
                    break;
                case 'tempC':
                    p.weather.getTempC(obj);
					c.renderAll();
                    break;
                case 'tideH':
                    p.weather.getTidesH(obj);
                    c.renderAll();
                    break;
                case 'tideL':
                    p.weather.getTidesL(obj);
                    c.renderAll();
                    break;
            }
        });
    };

    my.currentTime = function() {
        var currentTime = new Date();
        var hours = currentTime.getHours();
        var minutes = currentTime.getMinutes();
        if (minutes < 10) {minutes = "0" + minutes;}
        var suffix = "AM";
        if (hours >= 12) {
            suffix = "PM";
            hours = hours - 12;
        }
        if (hours == 0) {hours = 12;}
        return hours+":"+minutes+" "+suffix;
    };

    my.startBlink = function(obj, c) {
        setInterval(my.blink, 1000, obj, c);
    };

    my.blink = function(obj, c) {
        if (obj.getFill() == '#000') {
            obj.set('fill', '#FFF');
        } else {
            obj.set('fill', '#000');
        }
        c.renderAll();
    };

    return my;

}(player));