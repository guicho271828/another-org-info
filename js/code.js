////////////////////////////////////////////////////////////////
////
//// code.js -- a replacement for org-info.js
////
//// Written by Masataro Asai (guicho2.71828@gmail.com)
//// Licenced under GPLv3.
////
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// helper functions ////////////////////////////////////////////
////////////////////////////////////////////////////////////////

var identity=function(){};

jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
};

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
};


jQuery.fn.emerge = function() {
    return this.addClass("emerge");
};

function text(){
    return $(".outline-text-1,"+
             ".outline-text-2,"+
             ".outline-text-3,"+
             ".outline-text-4",slide.current).first();
}

function resume(all){
    return all ?
        $(".resume")
        : $(".outline-text-1 > .resume,"+
           ".outline-text-2 > .resume,"+
           ".outline-text-3 > .resume,"+
           ".outline-text-4 > .resume",slide.current).first();
}

function notResume(all){
    return all ?
        $(".outline-text-1 > :not(.resume),"+
          ".outline-text-2 > :not(.resume),"+
          ".outline-text-3 > :not(.resume),"+
          ".outline-text-4 > :not(.resume)")
        : $(".outline-text-1 > :not(.resume),"+
            ".outline-text-2 > :not(.resume),"+
            ".outline-text-3 > :not(.resume),"+
            ".outline-text-4 > :not(.resume)",slide.current);
}

var previousResumeExpansion;
function expand(tx){
    console.log("clicked!");
    if (tx) {
        var result =
            $(".expanded + li:not(.expanded):not(.hideAgain),"+
              ".expanded + dt + dd:not(.expanded):not(.hideAgain),"+
              ".hideAgain + li:not(.expanded):not(.hideAgain),"+
              ".hideAgain + dt + dd:not(.expanded):not(.hideAgain),"+
              "li:first-child:not(.expanded):not(.hideAgain),"+
              "dd:first-of-type:not(.expanded):not(.hideAgain)",tx)
            .first().addClass("expanded emerging-list");
        $(".expanded > ul:not(.expanded):not(.hideAgain),"+
          ".expanded > dl:not(.expanded):not(.hideAgain),"+
          ".hideAgain > ul:not(.expanded):not(.hideAgain),"+
          ".hideAgain > dl:not(.expanded):not(.hideAgain)",tx)
            .first().addClass("expanded emerging");
        return result;
    }else{
        var newResumeExpansion = expand(resume());
        console.log(previousResumeExpansion);
        console.log(newResumeExpansion);
        try{
            previousResumeExpansion
                .removeClass("expanded")
                .addClass("hideAgain");
        }catch (x){
        }
        previousResumeExpansion = newResumeExpansion;
        return expand(text());
    }
}

function setupResume(){
    $(".resume > ul, .resume > ol").addClass("expanded");
}

function setExpanders(){
    $("outline-1,outline-2,outline-3,outline-4").click(expand);
}

function outline(n){
    return ".outline-"+n;
}
function outlineContents(n){
    return ".outline-text-"+n+", h"+n;
}

function buildSectionHash(secnums){
    // get an array of numbers and return outline-container-orgheadline-*-*-*
    return Array.prototype.reduce.call(
        secnums,
        function(prev,arg){
            return prev+arg;
        },
        "#outline-container-orgheadline"
    );
}

function parseSectionHash(id){
    var re = /#?(?:outline-container-orgheadline)?(.*)/;
    return (id.match(re)||[null,"1"])[1].split("-");
}

function currentHash(){
    return slide.current.get(0).id;
}

function clip(low,x,high,when_low,when_high){
    if (x < low){
        return when_low || low;
    }else if (high || x > high){
        return when_high || high;
    }else {
        return x;
    }
}

function adjustVerticalCenter(){
    var top = 0.4 * ($(window).height() - $(document.body).height());
    var high = 0.2 * $(window).height();
    var duration = 270 ;        // default: 400
    var delay_ratio = 0.4 ;
    if (top > high){
        $(document.body)
            .finish() 
            .animate({"margin-top": high},duration);
        slide.headline()
            .finish()
            .delay( duration * delay_ratio )
            .animate({"margin-bottom": top - high},duration);
    }else{
        $(document.body)
            .finish() 
            .animate({"margin-top": clip(20,top)},duration);
    }
}

////////////////////////////////////////////////////////////////
//// Slide objects /////////////////////////////////////////////
////////////////////////////////////////////////////////////////

var nullp = $.isEmptyObject;

function Slide(arg,prev){
    this.previous = prev;
    if (!nullp(arg) && arg.length!=0){
        this.current = arg;
        var matched = arg.get(0).className.match(/outline-([0-9]*)/);
        if(matched){
            this.level=(+matched[1]);
        }else{
            throw new Error("arg is not of class outline-x.");
        }
        return this;
    }else{
        throw new Error("arg is null / jquery object with no match");
    }
}

Slide.prototype = {
    current : undefined, // jquery object
    previous : undefined, // Slide object
    level : 1,
    // hide: function(){
    //   this.current.hide();  
    // },
    headline: function(){
        return $("h1,h2,h3,h4",slide.current).first();
    },
    hideParents: function(){
        for(var i = 1;i<this.level;i++){
            $(outlineContents(i)).hide();
        }
    },
    hideSiblings: function(){
        $(outlineContents(this.level)).hide();
    },
    hideChildren: function(){
        for(var i=this.level+1;0<($(outline(i)).length);i++){
            $(outlineContents(i)).hide();
        }
    },
    showSelf: function(){
        this.current.children(outlineContents(this.level)).show().emerge();
    },
    show: function(){
        this.hideParents();
        this.hideSiblings();
        this.hideChildren();
        this.showSelf();
        adjustVerticalCenter();
        return this;
    },
    nochild : function(){
        return nullp(this.current.children(outline(1+this.level)));
    },
    // if sustain is true, it doesn't add the current slide to the slide history
    new : function(next,sustain){
        return new Slide(next,(sustain?this.previous:this));
    },
    up : function(sustain){return this.new(this.current.parent(),sustain);},
    down : function(sustain){
        return this.new(this.current.children(outline(1+this.level)).first(),sustain);},
    left : function(sustain){return this.new(this.current.prev(),sustain)},
    right : function(sustain){return this.new(this.current.next(),sustain)},
    next : function(){
        try{return this.down();} catch (x) {}
        try{return this.right();} catch (x) {}
        
        var slide = this;
        while(true){
            try{
                slide = slide.up();
            } catch (x) {
                throw new Error("no next slide");
                // tells that there is no next slide
            }
            try{
                // if the upper slide has the following slide,
                // then it is the next slide
                return slide.right(true);
            } catch (x) {
            }
        }
    },
    prev : function(){
        if (this.previous){
            return this.previous;
        }else{
            throw new Error("no previous slide");
        }
    },
};

var slide;


////////////////////////////////////////////////////////////////
//// Keyboard event handlers ///////////////////////////////////
////////////////////////////////////////////////////////////////

// a hash table with {"key strokes":function}.
// functions should take zero argument and
// should return true on success, false otherwise.
var keyManager = {};

var keystrokeManager = {
    _stroke: "",
    _minibuffer: $("<div id='minibuffer'></div>"),
    _prompt: $("<span id='prompt'></span>"),
    _input: $("<span id='input'></span>"),
    init: function(def_stroke,def_prompt){
        this.stroke=(def_stroke||"");
        this._prompt.text(def_prompt||"");
        return this;
    },
    push: function(c){
        this.stroke=this.stroke.concat(c);
        return this;
    },
    backspace: function(){
        this.stroke=this.stroke.slice(0,-1);
        return this;
    },
    setup: function(){
        this._minibuffer
            .append(this._prompt)
            .append(this._input)
            .append("<span id='fullscreen'>■</span>");
        $("body").prepend(this._minibuffer);
    },
    query: function(message,fn,def,enteredByDefault){
        // message : string
        // fn : callback
        // def : string -- default value
        // enteredByDefault : boolean
        var old = this._prompt.text();
        $(window).off("keypress",keyboardHandler);
        this.init(((def && enteredByDefault) ?
                   def : ""),
                  (enteredByDefault ?
                   message : (message+" (Default:"+def+") ")));
        var handler=(function(e){
            try{
                enterHandler(
                    backspaceHandler(
                        cancelHandler(
                            printHandler())))(e);
            } catch (x) {
                if (x=="enter") {
                    var result = this._input.text();
                    keystrokeManager.init("",old);
                    $(window).off("keypress",handler);
                    $(window).on("keypress",keyboardHandler);
                    fn((result=="")?def:result);
                }
                else throw x;
            }
        }).bind(this);
        $(window).on("keypress", handler);
        return true;
    }
};

keystrokeManager.__defineSetter__(
    "stroke",function(str){
        this._stroke = str;
        this._input.text(str);
        return this;
    });
keystrokeManager.__defineGetter__(
    "stroke",function(){
        return this._stroke;
    });


function available_p(e){
    return (32 <= e.charCode && e.charCode <= 126)}
function backspace_p(e){ return (e.keyCode == 8)}
function enter_p(e){ return (e.keyCode == 13)}
function cancel_p(e){
    return (e.charCode == 103 && e.ctrlKey) // Ctrl-g
        || (e.keyCode == 27);  // Esc
}


function enterHandler(next){
    return function(e){
        if (enter_p(e)){
            e.stopPropagation();
            e.preventDefault();
            throw "enter";
        } else return (next||identity)(e);        
    };
}

function backspaceHandler(next){
    return function(e){
        if (backspace_p(e)){
            e.stopPropagation();
            e.preventDefault();
            keystrokeManager.backspace();
        } else return (next||identity)(e); 
    };
}

function cancelHandler(next){
    return function(e){
        if (cancel_p(e)){
            e.stopPropagation();
            e.preventDefault();
            console.log("cancelled");
            keystrokeManager.init();
        } else return (next||identity)(e); 
    };
}

function printHandler(next){
    return function(e){
        if (available_p(e)){
            keystrokeManager.push(String.fromCharCode(e.charCode));
        } else return (next||identity)(e);
    };
}

function dispatchHandler(next){
    return function(e){
        var handler;
        if (available_p(e)){
            keystrokeManager.push(String.fromCharCode(e.charCode));
            handler = keyManager[keystrokeManager.stroke];
        }else{
            if (keystrokeManager.stroke == ""){
                handler = keyManager[e.keyCode];
            }
        }
        if (typeof handler == "function"){
            e.preventDefault();
            console.log("Handler function "
                        + keystrokeManager.stroke +" found");
            try{
                if (!handler(e)){
                    console.log(
                        "Handler function returned a false value.  Resetting the strokemanager state.");
                    keystrokeManager.init();
                }else {
                    console.log("Handler function returned!");
                }
            } catch (x) {
                console.error(x);
                keystrokeManager.init();
            }
        } else return (next||identity)(e);
    };
}

function rejectHandler(next){
    return function(e){
        s = keystrokeManager.stroke;
        candidates = [];
        for (let key in keyManager) {
            // console.log(key+" "+s+" "+key.substring(0, s.length));
            if (key.substring(0, s.length) == s){
                candidates.push(key);
            }
        }
        console.log("candidates: "+candidates);
        if (candidates.length > 0){
            return (next||identity)(e);
        } else {
            // no matching command exists
            console.log("no command starts with prefix "+s);
            keystrokeManager.backspace();
        }
    };
}


function keyboardHandler(e){
    console.log("charCode:"+e.charCode
                +" keyCode:"+e.keyCode
                +" which:"+e.which
                +" Modifier:"
                +(e.ctrlKey?"Ctrl":"")
                +(e.shiftKey?"Shift":"")
                +(e.metaKey?"Meta":"")
                +(e.altKey?"Alt":""));
    backspaceHandler(
        cancelHandler(
            dispatchHandler(
                rejectHandler())))(e);
    console.log(keystrokeManager.stroke);
}

////////////////////////////////////////////////////////////////
//// Touch event handlers //////////////////////////////////////
////////////////////////////////////////////////////////////////

// from https://qiita.com/Wataru/items/a9548015e00683e142e4
var position, direction;

function getPosition(event) {
    return event.originalEvent.touches[0].pageX;
}

function onTouchStart(event) {
    position = getPosition(event);
    direction = '';
}

function onTouchMove(event) {
    if (position - getPosition(event) > 70) {
        direction = 'right';
    } else if (position - getPosition(event) < -70){
        direction = 'left';
    }
}

function onTouchEnd(event) {
    if (direction == 'right'){
        keyManager.n();
    } else if (direction == 'left'){
        keyManager.p();
    }
}

////////////////////////////////////////////////////////////////
//// Fullscreen ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// from https://developers.google.com/web/fundamentals/native-hardware/fullscreen/
function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
  else {
    cancelFullScreen.call(doc);
  }
}

////////////////////////////////////////////////////////////////
//// Initialization
////

window.onload = function(){
    $("img").hover(
        function (){
            $(keystrokeManager._minibuffer).append("<span class='imgsrc'>" + $(this).attr("src")+ "</span>");
        }, function(){
            $(".imgsrc",keystrokeManager._minibuffer).remove();
        })
    $(".magnifier img").loupe({width:600,height:450,loupe:'loupe'});
    $("#content").addClass("outline-1");
    slide = new Slide($("#content"));
    slide.show();
    // setExpanders();
    setupResume();
    keystrokeManager.setup();

    $('#fullscreen').on("click",toggleFullScreen);
    $(window).on('keydown',keyboardHandler);
    $(window).on('keypress',keyboardHandler);
    $(window).on("click",keyManager.n);
    $(window).on('touchstart', onTouchStart);
    $(window).on('touchmove', onTouchMove);
    $(window).on('touchend', onTouchEnd);
    
    if(location.hash!=""){
        goToSection(
            parseSectionHash(location.hash),
            function(){});
    }
};

////////////////////////////////////////////////////////////////
//// keymanager functions

// expand one element in the list in the current slide, or go to the next slide
keyManager.n
    = keyManager[" "]
    = keyManager[40]
    = function(){
    $(".title").hide();
    console.log(slide.level);
    try{
        if(expand().length==0){
            slide = slide.next();
            slide.show();
        }
    } catch (x) {
        console.warn("This is the last slide!");
    }
};

// expand all elements in the current slide
keyManager.N
    = keyManager[39]
    = function(){
    $(".title").hide();
    console.log(slide.level);
    if(expand().length==0){keyManager.n();}
    while (expand().length>0){}
};

keyManager.p
    = keyManager[37]
    = function(){
    console.log(slide.level);
    try{
        slide = slide.prev();
        slide.show();
    } catch (x) {
        console.warn("This is the first slide!");
    }
};

keyManager.u
    = keyManager["^"]
    = keyManager[38]
    = function(){
    console.log(slide.level);
    try{
        slide = slide.up();
        slide.show();
    } catch (x) {
        console.warn("There is no parent section!");
    }
};

keyManager.s = keyManager.go = function(){
    return sectionPrompt2("Enter a section number (e.g. 1-2 )");
};

function sectionPrompt2(message){
    return keystrokeManager.query(
        message,function(result){
            goToSection(
                parseSectionHash(
                    buildSectionHash(result.split("-"))),
                function(){
                    sectionPrompt2(
                        buildSectionHash(result.split("-"))
                            + " does not exists.");})},
        parseSectionHash(currentHash()).join("-"));
}

function goToSection(secnums,onFailure){
    try{
        console.log("go to section:" + secnums);
        slide = slide.new($(buildSectionHash(secnums)));
        slide.show();
    } catch (x) {
        onFailure();
    }
}

function currentHashSimple(){
    return parseSectionHash(currentHash()).join("-");
}

keyManager.f = function(){
    console.log("fix to section:" + currentHashSimple());
    location.hash = "#"+ currentHashSimple();
}

// debug

var debug = false;

function toggleDebug(){
    if (!debug){
        debug = true;
        return (function(){
                    $(this).addClass("debug-border");
                });
    }else{
        debug = false;
        return (function(){
                    $(this).removeClass("debug-border");
                });
    }
}

keyManager.d = function(){
    $(".outline-1,.outline-2,.outline-3,.outline-4"+
      ",li,ul,ol,h1,h2,h3,h4,.outline-text-2, .outline-text-3, .outline-text-4")
        .map(toggleDebug());
    console.log("debug : "+debug);
};

// unfolding the presentation and shows all slides at once
keyManager.unfold = function(){
    $("*").visible().show();
    $(".note").css({position:"static",top:"1em"});
    $("body").css({overflow:"auto"});
};

keyManager["-"] = function(){
    var maxwidth = parseFloat($("#content").css("max-width"))*0.91;
    var size = parseFloat($("body").css("font-size"))*0.91;
    $("#content").css("max-width",maxwidth);
    $("body").css("font-size",size);
};


keyManager["+"] = function(){
    var maxwidth = parseFloat($("#content").css("max-width"))*1.1;
    var size = parseFloat($("body").css("font-size"))*1.1;
    $("#content").css("max-width",maxwidth);
    $("body").css("font-size",size);
};


var keynoteState = 0;
var keynoteStates = ["both","no-keynote","keynote-only"];
function circularIncrease(){
    ++keynoteState;
    if(keynoteState>=keynoteStates.length){keynoteState = 0;}}

keyManager.k = keyManager.keynotes = function(){
    circularIncrease();
    console.log(keynoteStates[keynoteState]);
    switch (keynoteState) {
    case 0:
        notResume(true).show();
        resume(true).show();
        break;
    case 1: // no keynote
        notResume(true).show();
        resume(true).hide();
        break;
    case 2:
        notResume(true).hide();
        resume(true).show();
        break;
    }
};

keyManager.K = function(){
    // toggle the hideAgain visibility
    $(".hideAgain").toggleClass("expanded");
}

keyManager.mini = function(){
    $("#minibuffer").toggle();
};

keyManager.banner = function(){
    $("#banner").toggle();
};

keyManager.help = keyManager.h = keyManager["?"] = function(){
    keystrokeManager.query(
        "Supported commands: \""+
            Object.keys(keyManager).join("\", \"") +
            "\". Hit Enter to escape.",
        function(result){
            if (result==""){
                console.log("empty help message");
            }else{
                console.log("help message:" + result);
            }},
        "",
        true);
    return true;
};

keyManager.R = keyManager.reload = function(){
    location.href = location.href
    return true;
};

// a simple countdown timer

var timers = [];

function Timer(){
    this._timer = $("<span class='timer'></span>");
    keystrokeManager._minibuffer.append(this._timer);
}

Timer.prototype.destroy = function(){
    this._timer.remove();
    this.stop();
}

Timer.prototype.start = function(seconds,callback){
    var self = this;
    var limit = seconds;
    var update = function(){
        var displayed_time = limit - seconds; 
        // var displayed_time = seconds;
        var rem = (displayed_time%60);
        var quo = (displayed_time-rem)/60;
        console.log("timer updated: "+quo+":"+rem);
        self._timer.text(quo+":"+rem);
    }
    var decrease = function(){
        --seconds;
        update();
        if(seconds<=0){
            stop();
        }
    }
    var stop = function(){
        (callback||identity)(id);
    }
    this.stop = stop;
    var id = setInterval(decrease,1000);
}

keyManager.timer = function(){
    var t = new Timer();
    keystrokeManager.query(
        "Enter the limit by sec",
        function(result){
            t.start(parseInt(result,10),
                    function(id){
                        // clearInterval(id);
                        t._timer
                            .addClass("highlighted")
                            .css({"font-weight":"bold"});
                    });
        }, 300, false);
    return true;
};

keyManager["remove-timer"] = function(){
    timers.map(function(t){
        t.destroy();
    });
}

keyManager.color = function(){
    keystrokeManager.query(
        "Enter the style file name",
        function(result){
            $(document.head).append("<link rel='stylesheet' href='css/" + result + ".css' />");
        }, "", false);
    return true;
}
