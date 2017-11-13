function Weather() {
    var self = this;
    this.data = {};
    this.tideData = {};

    // Return current temp in F
    this.getTempF = function (obj) {
        var text = "";
        if (typeof(self.data['current_observation']['temp_f']) !== 'undefined') {
            text = Math.round(self.data['current_observation']['temp_f']);
        } else {
            console.log("Could not retrieve fahrenheit temperature. Data undefined.");
        }
        console.log("F text", text);
        obj.set('text', text+"°");
    };
    // Return current temp in C
    this.getTempC = function (obj) {
        var text = "";
        if (typeof(self.data['current_observation']['temp_c']) !== 'undefined') {
            text = Math.round(self.data['current_observation']['temp_c']);
        } else {
            console.log("Could not retrieve celsius temperature. Data undefined.");
        }
        obj.set('text', text+"°");
    };

    this.getTidesH = function (obj) {
        var T = self.tideData.high.am+" - "+self.tideData.high.pm;
        obj.set('text', T);
    };
    this.getTidesL = function (obj) {
        var T = self.tideData.low.am+" - "+self.tideData.low.pm;
        obj.set('text', T);
    };

    this.update = function (zip) {
        console.log("Updating weather for "+zip+"");
        var url="https://api.wunderground.com/api/b73e4a5d25bcfd5c/conditions/astronomy/q/"+zip+".json";
        return $.ajax({
            dataType: "jsonp",
            url: url
        }).done(function(data) {
            console.log("Retrieved weather data", data);
            self.data = data;
        });
    };

    this.tides = function (station) {
        if (station === "" || (typeof(station) === 'undefined')) {return;}
        console.log("Updating Tides for "+station);
        var url="https://tidesandcurrents.noaa.gov/api/datagetter?date=today&station="+station+"&product=predictions&datum=MLLW&units=english&time_zone=lst_ldt&application=web_services&format=json";
        return $.ajax({
            dataType: "json",
            url: url
        }).done(function(data) {
            self.processTideData(data);
        });
    };

    this.processTideData = function (data) {
        console.log("Retrieved tides data", data);

        // Process tide data
        var tides = data.predictions;
        var last = {};
        var type = 'new';
        // Set defaults.
        // There is some logic here... It's for the 24 hour cycle. If the tide is higher at 12:00 midnight than it is going to be all morning, that was high tide.
        var tidesData = {high: {am: "12:00a", pm: "12:00a"}, low: {am: "12:00a", pm: "12:00a"}};
        for (var element in tides) {
            if (tides[element].hasOwnProperty('v')) {
                //console.log("Last: "+last.v+" Current: "+tides[element].v+" Direction: "+type);
                if (Object.keys(last).length === 0 && last.constructor === Object) {
                    // Getting our very first tide. Set it as the last one we've seen and move on.
                    last = tides[element];
                } else if (last.v > tides[element].v && type === 'new') {
                    // This is the very first time we've gotten to make a comparison. What direction are we going?
                    // Numbers are going down - Look for lowest
                    last = tides[element]; type = 'low';
                } else if (last.v < tides[element].v && type === 'new') {
                    // Numbers are going up - Look for highest
                    last = tides[element]; type = 'high';
                } else if (last.v > tides[element].v && type === 'high') {
                    // Last one was highest - Log it and start looking for lows
                    tidesData.high = self.processTideDate(last.t, tidesData.high);
                    last = element; type = 'low';
                } else if (last.v < tides[element].v && type === 'low') {
                    // Last one was lowest - Log it and start looking for highs
                    tidesData.low = self.processTideDate(last.t, tidesData.low);
                    last = tides[element]; type = 'high';
                } else {
                    last = tides[element];
                }
            } else {
                console.log("No value element in tide prediction.");
            }

        }
        self.tideData = tidesData;
    };

    /*
        We look at the dates and build the ampm objects here
     */
    this.processTideDate = function(date, data) {
        var d = new Date(Date.parse(date));
        var hours = d.getHours();
        var minutes = (d.getMinutes()<10?'0':'') + d.getMinutes();
        var ampm = 'a';
        if (hours > 12) {
            hours = hours - 12; ampm = 'p';
            data.pm = hours+":"+minutes+ampm;
        } else if (hours == 12) {
            ampm = 'p';
            data.pm = hours+":"+minutes+ampm;
        } else if (hours == 0) {
            hours = 12;
            data.am = hours+":"+minutes+ampm;
        } else {
            data.am = hours+":"+minutes+ampm;
        }
        return data;
    };
}