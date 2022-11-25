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
        console.log("inserting character '"+c+"'");
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
        $(window).off("keydown",keyboardHandler);
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
                    $(window).on("keydown",keyboardHandler);
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

function backspace_p(e){ return (e.key == "Backspace")}
function enter_p(e){     return (e.key == "Enter")}
function cancel_p(e){    return (e.key == "g" && e.ctrlKey) || (e.key == "Escape")} // Ctrl-g and Esc

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
        keystrokeManager.push(e.key);
    };
}


function findCandidates(prefix){
    candidates = [];
    for (let key in keyManager) {
        // console.log(key+" "+s+" "+key.substring(0, s.length));
        if (key.substring(0, prefix.length) == prefix){
            candidates.push(key);
        }
    }
    return candidates;
}

function dispatchHandler(next){
    return function(e){
        if (e.type == "keydown" && keystrokeManager.stroke == ""){
            keystrokeManager.push(e.key);
        }
        if (e.type == "keypress"){
            keystrokeManager.push(e.key);
        }
        var candidates = findCandidates(keystrokeManager.stroke);
        if (candidates.length == 1){
            var name = candidates[0];
            var handler = keyManager[name];
            e.preventDefault();
            console.log("Handler function '" + name +"' found");
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
        } else if (candidates.length > 1) {
            console.log("multiple handler functions with a prefix string '"+keystrokeManager.stroke+"' found");
            console.log("candidates: "+candidates);
            return (next||identity)(e);
        } else {                // candiadtes.length == 0
            console.log("handler function with a prefix string '"+keystrokeManager.stroke+"' not found");
            if (e.type == "keydown"){
                keystrokeManager.stroke = "";
            }
            if (e.type == "keypress"){
            }
            return (next||identity)(e);
        }
    };
}

function rejectHandler(next){
    return function(e){
        var candidates = findCandidates(keystrokeManager.stroke);
        console.log("candidates: "+candidates);
        if (candidates.length > 0){
            return (next||identity)(e);
        } else {
            // no matching command exists
            console.log("no command starts with prefix "+keystrokeManager.stroke);
            keystrokeManager.backspace();
        }
    };
}


function keyboardHandler(e){
    console.log("code:"+e.code
                +" key:"+e.key
                +" type:"+e.type
                +" charCode (obsolete):"+e.charCode
                +" keyCode (obsolete):"+e.keyCode
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
//// font size  ////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

var fontsizeManager = {
    init: function(){
        this.maxwidth = parseFloat($("#content").css("max-width"));
        this.size = parseFloat($("body").css("font-size"));
        this.maxwidth_default = this.maxwidth;
        this.size_default = this.size;
        return this;
    },
    apply: function(){
        $("#content").css("max-width",this.maxwidth);
        $("body").css("font-size",this.size);
    },
    increase: function(){
        this.maxwidth = this.maxwidth * 1.1;
        this.size     = this.size     * 1.1;
        this.apply();
    },
    decrease: function(){
        this.maxwidth = this.maxwidth * 0.91;
        this.size     = this.size     * 0.91;
        this.apply();
    },
    reset: function(){
        this.maxwidth = this.maxwidth_default;
        this.size     = this.size_default;
        this.apply();
    }
};


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
    // $(window).on('click',keyManager.n);
    $(window).on('wheel',
                 function (e){
                     // jQuery sucks; e is not equivalent to the original event object
                     if (e.originalEvent.deltaY > 0){
                         return keyManager["-"](e);
                     } else {
                         return keyManager["+"](e);
                     }
                 });
    $(window).on('touchstart', onTouchStart);
    $(window).on('touchmove', onTouchMove);
    $(window).on('touchend', onTouchEnd);

    fontsizeManager.init();

    if(location.hash!=""){
        goToSection(
            location.hash.slice(1).split("."),
            function(){});
    }
};

////////////////////////////////////////////////////////////////
//// keymanager functions

// printable keys are accumulated into a string in keystrokeManager until matched.
// When the new key results in a string which does not match any commands, the new key is removed.
// non-printable keys are queried by the event.key string.

// expand one element in the list in the current slide, or go to the next slide
keyManager.n
    = keyManager[" "]
    = keyManager["ArrowRight"]
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
    = keyManager["ArrowDown"]
    = function(){
    $(".title").hide();
    console.log(slide.level);
    if(expand().length==0){keyManager.n();}
    while (expand().length>0){}
};

keyManager.p
    = keyManager["ArrowLeft"]
    = function(){
    console.log(slide.level);
    try{
        slide = slide.prev();
        slide.show();
    } catch (x) {
        console.warn("This is the first slide!");
    }
};

// keyManager.u
//     = keyManager["^"]
//     = keyManager["ArrowUp"]
//     = function(){
//     console.log(slide.level);
//     try{
//         slide = slide.up();
//         slide.show();
//     } catch (x) {
//         console.warn("There is no parent section!");
//     }
// };

// saving and jumping to sections

keyManager.s = keyManager.go = function(){
    return sectionPrompt("Enter a section number (e.g. 1.2 )");
};

keyManager.f = function(){
    section = currentSection().join(".")
    console.log("fix to section:" + section);
    location.hash = "#"+ section;
}

function currentHash(){
    return slide.current.get(0).id;
}

function currentSection(){
    return hashToSection(currentHash());
}

function hashToSection(hash){
    // get a hash and return an array of section numbers
    // hash = "outline-container-org7394a07"
    var elems = $("#"+hash);
    console.assert(elems.length==1,"hashToSection: duplicate elements with the same id",elems,elems.length);
    var elem = elems[0];
    var outline_class = Array.from(elem.classList).find(cls => cls.slice(0, 7)==="outline"); // "outline-2"
    console.assert(outline_class,"hashToSection: classList should include outline-*",elem.classList);
    var split = outline_class.split("-");  // ["outline","2"]
    console.assert(split.length==2 && split[0]==="outline","hashToSection: class name should be outline-X",split);
    var level = parseInt(split[1],10); // 2
    console.assert(level>=1,"hashToSection: level cannot be less than 1 ... what is happening?");
    var position = $("."+outline_class).index(elem); // 0 == first element
    console.log(level);

    if (level == 1){
        return [];
    }
    else {
        console.assert(elems.parent().length==1, "hashToSection: parent should exist", elems.parent());
        return hashToSection(elems.parent()[0].id).concat([position+1]);
    }
}

function sectionToHash(secnums){
    // get an array of section numbers and return a hash
    // secnums = [2]
    function rec(tree,level,secnums){
        // .outline-1, 2, [2]
        console.log(tree,level,secnums);
        var children = tree.children(".outline-"+level);
        var next = children[secnums[0]-1]
        if (next == undefined){
            console.warn(next,"traversal failed! stopping at level "+(level-1));
            return tree[0].id;
        }
        if (secnums.length>1){
            console.log("continue traversing.");
            return rec($(next), level+1, secnums.slice(1));
        }
        else{
            console.log("found an element at level "+level);
            return next.id;
        }
    }
    return rec($(".outline-1"), 2, secnums); // .outline-1,2,[2]
}

function sectionPrompt(message){
    return keystrokeManager.query(
        message,function(result){
            // "2.3"
            goToSection(
                result.split("."),
                function(){
                    sectionPrompt(
                        "section " + result + " does not exists.");})},
        currentSection().join("."));
}

function goToSection(secnums,onFailure){
    try{
        console.log("go to section: " + secnums.join("."));
        slide = slide.new($("#"+sectionToHash(secnums)));
        slide.show();
    } catch (x) {
        onFailure();
    }
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
    $("body *").show();
    $(".note").css({position:"static",top:"1em"});
    $("body").css({overflow:"auto"});
};

keyManager["-"] = function(){
    fontsizeManager.decrease();
};
keyManager["+"] = function(){
    fontsizeManager.increase();
};
keyManager["0"] = function(){
    fontsizeManager.reset();
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
