player.utility = (function (p) {
    var my = {};

    my.get_var = function (var_name){
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == var_name){return pair[1];}
        }
        return(false);
    };

    my.cvtSql = function (date) {
        var t = date.split(/[- :]/);
        return new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
    };

    my.isEven = function (n){
        return my.isNumber(n) && (n % 2 == 0);
    };

    my.isNumber = function (n){
        return n === parseFloat(n);
    };

    my.parseTagString = function(str){
        var tagStr = '';
        if (str !== '') {
            var tags = JSON.parse(str);
            if (tags !== 'null') {
                for (var i = 0; i < tags.length; i++) {
                    tagStr += tags[i].name + ", ";
                }
                tagStr = tagStr.substring(0, tagStr.length - 2);
            }
        }
        return tagStr;
    };

    return my;
}(player));