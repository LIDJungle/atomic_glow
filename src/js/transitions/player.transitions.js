player.transitions = (function(p){
    var my = {};
    my.load = function(c) {
        //console.log("We have to c: ", c);
        //console.log("Transition type: "+typeof(c.transition));
        switch (c.transition) {
            case 'slide-right':
                //my.slide_right($('.'+ p.canvas.containerClass), p.canvas.getWidth());
                break;
            case 'slide-left':
                //my.slide_left($('.'+ p.canvas.containerClass), p.canvas.getWidth());
                break;
            case 'wipe-right':
                //my.wipe_right($('.'+ p.canvas.containerClass), p.canvas.getWidth());
                break;
            case 'wipe-left':
                //my.wipe_left($('.'+ p.canvas.containerClass), p.canvas.getWidth());
                break;
        }
    };

    my.slide_right = function(elem, width) {
        // how do we hold this one a centered element?
        elem.css(
            "width", '0px'
        );
        elem.animate({
            width: width+"px"
        }, 500);
    };

    my.slide_left = function(elem, width) {
        elem.css('width', '0px');
        elem.css("left", function(){return width+"px";});
        elem.animate({
            width: width+'px',
            left: '0px'
        }, 5000);
    };

    my.wipe_right = function(elem, width) {
        var o = $('<div class="overlay">&nbsp;</div>').insertAfter(elem);
        var p = elem.position();
        o.css({'height': elem.css('height'), 'width': elem.css('width'), margin: elem.css('margin'), 'top': p.top, 'left': p.left});
        o.animate({
            width: '0px',
            left: width+"px"
        }, 5000, function(){o.remove();});
    }

    my.wipe_left = function(elem, width) {
        var o = $('<div class="overlay">&nbsp;</div>').insertAfter(elem);
        var p = elem.position();
        o.css({'height': elem.css('height'), 'width': elem.css('width'), margin: elem.css('margin'), 'top': p.top, 'left': p.left});
        o.animate({
            width: '0px',
            left: "0px"
        }, 5000, function(){o.remove();});
    };



    return my;
}(player));