/**
 * kmagine.js
 *
 * JavaScript
 *
 * This code is published under the MIT License (MIT).
 * http://www.opensource.org/licenses/mit-license.php
 *
 * For examples, reference, and other information see
 * http://
 *
 * @author mofukuma
 * @copyright (c) 2013 by Daisuke Sugiyama
 * @see http://
 */


//メインループ requestAnimationFrame API
window.requestAnimFrame = window.requestAnimFrame || (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
    };
})();

/**
* くまじん
* @static
* @class km
**/
var km = km || {};
var _km = _km || {}; //くまじん内部用 高速化のためグローバル定義

(function(jQuery) {
    var undefined; //undefined判定用

    //初期設定-------------------
    //
    //各JSON読出用
    km.resource_json = km.resource_json || {};
    km.scene_json = km.scene_json || {};

    //リソース置き場
    km.imgs = km.imgs || {};
    km.sounds = km.sounds || {};
    km.htmls = km.htmls || {};
    km.scenes = km.scenes || {};

    km.udid = "";
    km.locale = "";
    km.easing = {
        'swing': 'cubic-bezier(.02,.01,.47,1)'
    };


    /**
     * 初期化用jsonの読出。通常は呼び出す必要なし
     * @method init
     * @param [callback] ロード完了後のコールバック
     */
    km.init = function(callback) {
        var a = [];
        var k;

        for(k in _km.resource_json){
            //TODO あとでサーバ側を直さねば
            _km.resource_json[k].src = km.config.imgpath+_km.resource_json[k].src;
            a.push( _km.resource_json[k] );
        }
        km.load(a, callback);

        if(_km.preloads){
            //TODO こっちに統一
            var loading = _km.preloads;
            _km.preloads = [];
            km.load(loading);
            loading = null;

        }

        /*
        //シーンのdomを設定
        for (k in _km.scene_json) {
            km.scenes[k] = km.scenes[k] || new kScene();
            if (_km.scene_json.hasOwnProperty(k)) {
                var sc = _km.loadScene($("<div/>"), _km.scene_json[k]);
                km.scenes[k].dom = sc;
            }
        }
        */

        _km.init_f = true;
    };

    km.getDeviceInfo = function(){
        if(_km.isUIWebView) _km.hostExec("getdeviceinfo");
    };

    /**
     * 限りなくユルく使える素材ロード
     * @method load
     * @param  {string/object/array} url  読み込むデータのURLまたは設定オブジェクト、またはそれらの配列
     * @example km.load("images/foo.png");
     * @example km.load("images/foo.png", "images/bar.jpg");
     * @example km.load(["images/foo.png", "images/bar.jpg"]);
     * @example km.load(["images/foo.png", "images/bar.jpg"], function(){...onload callback...} );
     * @example km.load("images/foo.png", "sounds/se.mp3", "sounds/bgm_130.mp3");
     *  // filename_XXX.mp3など、末尾に数字を追加することで、自動ループとbpmが指定できる
     * @example km.load({src:"images/foo.png"}, {src:"sounds/se.mp3"}, {src:"sounds/bgm_130.mp3", bpm:130});
     *  // 連想配列で詳細指定することも可能。これは１つ上と同じ処理をおこなう
     */
    km.load = function(url) {
        var a;
        var callback;
        if( arguments.length > 1 ){
            //複数引数パターン
            if($.isArray(arguments[0]) ){
                //1つ目が配列の場合 ([], fn)の想定
                a = arguments[0];
                callback = arguments[1];
            }else{
                a = arguments;
            }

        }else if ($.isArray(url)) {
            //すべて配列パターン
            a = url;
        }else{
            a = [url];
        }

        var i;

        var donesrc = {};//重複ファイルチェック用
        for(i=0; i<a.length; i++ ){
            var it = {};
            var k, j, filename, obj_f;

            obj_f = false;

            if( typeof a[i] === "function" ){
                //コールバック
                callback = a[i];
                break;

            }else if( typeof a[i] === "string" ){
                if(a[i] in donesrc){
                    continue; //重複ファイルのロードはしない
                }
                donesrc[a[i]] = true;

                it.src = a[i];

            }else if( typeof a[i] === "object" ){
                it = a[i];
                obj_f = true;

            }else{
                break;
            }

            if( /\.(gif|jpe?g|png)$/.test(it.src) ){
                //画像   
                new km.Image(it.src);

            }else if( /\.(ogg|mp3|wav)$/.test(it.src) ){
                //サウンド
                k = it.src.replace(/^(.*\/|)([^\/]+?)\.(ogg|mp3|wav)$/, "$2");

                new km.Sound(it.src, it.bpm);
            }else if( /\.kscene$/.test(it.src) ){
                //シーンデータのURL

                $.get(it.src, function(data){
                    eval(data);

                    km.load(_km.preloads);
                    _km.preloads = null;
                    _km.preloads = [];
                });

            }else if(obj_f){ 
                //シーンデータobj。シーンの読み込み
                for(k in it){
                    if (it.hasOwnProperty(k)) {
                        km.scenes[k] = new kScene(k, it[k]);
                    }
                }
            }
        }

        var fn = callback;

        //ロード完了まち
        setTimeout(function() {
            var j;
            for(j in km.imgs){
                if(!km.imgs[j].loadok){
                    setTimeout(arguments.callee, 200);
                    return;
                }
            }

            for(j in km.sounds){
                if(!km.sounds[j].loadok){
                    setTimeout(arguments.callee, 200);
                    return;
                }
            }

            //スプライト用classの生成
            var json = {};
            for(j in km.imgs){
                json[j] = km.imgs[j];
            }
            var css = _km.loadResourceCSS(json, "");
            
            $('<style type="text/css">' + css + '</style>').appendTo("head");
            json = null;

            if(fn) fn();
        }, 200);
    };

    /**
     * サウンドを再生する。
     * 事前にロードしていない場合、自動でロードしてから再生する
     * @method playSound
     * @param {string} k サウンドファイルのURL、またはロードしたサウンドのキー
     * @example km.playSound("sound/bgm.mp3");
     * @example km.playSound("bgm");
     */
    km.playSound = function(k) {
        if(k in km.sounds){
            km.sounds[k].play();
        }else{
            var url = k;

            //urlか？
            k = url.replace(/^(.*\/|)([^\/]+?)\.(mp3|ogg|wav)$/, "$2");

            if(k in km.sounds){
                km.sounds[k].play();
            }else if(!k){
                //urlじゃないうえ、ロードもしてない場合エラー
                console.log(url +" doesn't found");
            }else{
                //urlなら、ロード後に再生だ
                new km.Sound(url, function(){
                    this.play();
                });
            }
        }
    };

    /**
     * サウンドを停止する。
     * 引数なしの場合、全サウンドストップ
     * @method stopSound
     * @param {string} [k] 止めるサウンドキー
     */
    km.stopSound = function(k) {
        if (k in km.sounds) {
            km.sounds[k].stop();
        } else if(k === undefined){
            //kに何も指定していない場合、全ストップ
            $.each(km.sounds, function(k) {
                km.sounds[k].stop();
            });
        }else{//urlの指定だった
            k = k.replace(/^(.*\/|)([^\/]+?)\.(mp3|ogg|wav)$/, "$2");

            if(k in km.sounds){
                km.sounds[k].stop();
            }
        }
    };

    //TODO
    km.bgm = function(k){

    };

    km.config = {
        /**
        * transition3dを使うか？
        * @property config.mode3d
        * @default true
        **/
        mode3d : true,
        /**
        * sound用swfの場所
        * @property config.swfpath
        * @default ksound.swf
        **/
        swfpath : 'ksound.swf',
        /**
        * $.fn.toでCSS3 transirionに指定するeasingのプリセット
        * @property config.easingPresets
        **/
        easingPresets : {
            'swing': 'cubic-bezier(.02,.01,.47,1)'
        },
        /**
        * $.fn.toでのCSS3 transitionのデフォルト
        * @property config.defaultEasing
        * @default swing
        **/
        defaultEasing : "swing",
        /**
        * $.fn.sceneの切り替えエフェクトのデフォルト
        * @property config.defaultSceneTransition
        * @default fade
        **/
        defaultSceneTransition : "fade",
        /**
        * $.fn.sceneの切り替えエフェクトの時間(ms)デフォルト
        * @property config.defaultSceneTransitionTime
        * @default 300
        **/
        defaultSceneTransitionTime : 300,
    };


    /**
    * １ビートの間隔（ミリ秒）
    * @property beat
    * @default 400
    **/
    km.beat = 400;

    /**
    * 現在の経過ビート
    * @property beatCount
    **/
    km.beatCount = 0;

    _km.cssConvTransitionProp = {};

    //ブラウザ/機能判定------------
    var ua = navigator.userAgent.toLowerCase();
    _km.vendor = (navigator.vendor || "").toLowerCase();
    _km.isiPhone = /iphone/.test(ua);
    _km.isiPad = /ipad/.test(ua);
    _km.isUIWebView = /kmagine/.test(ua);
    _km.isLocal = !(/http/.test(location.href)); //HTMLファイルを直接見た時
    _km.isAndroid = /android/.test(ua);
    _km.isTouch = ('ontouchstart' in window);
    _km.isIE = ua.match(/msie/i);


    //ベンダー毎のプロパティチェック
    // see: http://api.jquery.com/jQuery.cssHooks/
    function styleSupport(prop) {
        var vendorProp, supportedProp,
            capProp = prop.charAt(0).toUpperCase() + prop.slice(1),
            prefixes = ["Moz", "Webkit", "O", "ms"],
            div = document.createElement("div");

        if (prop in div.style) {
            supportedProp = prop;
        } else {
            for (var i = 0; i < prefixes.length; i++) {
                vendorProp = prefixes[i] + capProp;
                if (vendorProp in div.style) {
                    supportedProp = vendorProp;
                    break;
                }
            }
            div = null; // avoid memory leak in IE
        }
        // add property to $.support so it can be accessed elsewhere
        $.support[prop] = supportedProp;

        return supportedProp;
    }

    //ベンダー毎のstyleプロパティ
    _km.transition = styleSupport('transition');
    _km.transform = styleSupport('transform');
    _km.transitionDelay = styleSupport('transitionDelay');
    _km.transformOrigin = styleSupport('transformOrigin');

    //ブラウザがtransform3dに対応しているか? Modernizrより
    var div = document.createElement('div');
    div.style[_km.transform] = '';
    div.style[_km.transform] = 'rotateY(90deg)';
    _km.isSupport3d = div.style[_km.transform] !== '';
    div = null;

    //初期処理END---------------------



    //プリセット------------------
    /**
    * $.fn.toのプリセット集
    * よく使うアニメはここに登録すると便利。
    * $("#target").to("poyo", 100, "swing"); ←このように使う。
    * @property toPreset
    **/
    km.toPreset = {
        scaleIn: function(t, ineasing, fn) {
            return $(this)
                .to(function() {
                    $(this).show();
                })
                .to({
                    opacity: 0,
                    scaleX: "+=0.5",
                    scaleY: "+=0.5"
                })
                .to({
                    opacity: 1,
                    scaleX: "-=0.5",
                    scaleY: "-=0.5"
                }, t || 450, ineasing, fn);
        },
        scaleOut: function(t, ineasing, fn) {
            return $(this)
                .to({
                    opacity: 1
                })
                .to({
                    opacity: 0,
                    scaleX: "+=0.5",
                    scaleY: "+=0.5"
                }, t || 450, ineasing, fn)
                .to(function() {
                    $(this).hide().css({
                        "scaleX": "-=0.5",
                        "scaleY": "-=0.5"
                    });
                });
        },
        poyo: function(t, ineasing, fn) {
            return $(this)
                .to({
                    y: "+=10",
                    scaleY: "-=0.03",
                    scaleX: "+=0.08"
                })
                .to({
                    y: "-=10",
                    scaleY: "+=0.03",
                    scaleX: "-=0.08"
                }, t || 85, ineasing || "swing", fn);
        },
        //要素を揺らす。
        shake: function(_t, ineasing, _fn) {
            var shake_px = 5,
                fn = _fn,
                self = this,
                t = _t;
            var shakeRun = function() {
                var moved_x = 0,
                    moved_y = 0;

                var shakefn = function() {
                    var dx = randint(0, shake_px) - shake_px / 2 - moved_x,
                        dy = randint(0, shake_px) - shake_px / 2 - moved_y;

                    moved_x += dx;
                    moved_y += dy;
                    dx = (dx > -1) ? "+=" + dx : "-=" + (dx * -1);
                    dy = (dy > -1) ? "+=" + dy : "-=" + (dy * -1);

                    $(self).css({
                        "x": dx,
                        "y": dy
                    });
                };
                var clearshakefn = function() {
                    var x = parseInt($(self).css("x"), 10),
                        y = parseInt($(self).css("y"), 10);
                    $(self).clearInterval("shake");
                    $(self).css({
                        "x": x - moved_x,
                        "y": y - moved_y
                    });

                    if (fn)
                        fn.apply(self);

                    self = shake_px = fn = t = moved_x = moved_y = null;
                };
                $(self).setInterval("shake", shakefn, 26);
                setTimeout(clearshakefn, t);
            };

            $(this).to({
                delay: 1
            }, 1, shakeRun);

            return this;
        }


        //TODO 要素をd間隔でtミリ秒点滅させる。
    };


    /**
    * $.fn.sceneでのシーン切り替わり方のプリセット集
    * $("#target").scene("first", "fade", 500); ←このように使う。
    * @property sceneTransitionPresets
    **/
    km.sceneTransitionPresets = {
        none: function(olddom, newdom, t) {
            $(olddom).destroy();
            $(newdom).css({
                opacity: 1
            });
        },
        fade: function(olddom, newdom, t) {
            t = t / 2;
            var d = (!olddom) ? 0 : t;
            $(olddom).to({
                opacity: 0
            }, t, "swing", function() {
                $(this).destroy();
            });
            $(newdom).to({
                opacity: 1,
                delay: d
            }, t, "swing");
        },
        crossFade: function(olddom, newdom, t) {
            $(olddom).to({
                opacity: 0
            }, t, "swing", function() {
                $(this).destroy();
            });
            $(newdom).to({
                opacity: 1
            }, t, "swing");
        },
        rotate: function(olddom, newdom, t) {
            t = t / 2;
            var d = (!olddom) ? 0 : t;
            $(olddom).to({
                rotateY: 90
            }, t, function() {
                $(this).destory();
            });
            $(newdom).to({
                rotateY: -90,
                opacity: 1,
                delay: d
            }).to({
                rotateY: 0
            }, t);
        }
    };

    //--------------------------




    /**
     * JSONシーンデータをロード(内部関数)
     * method loadScene
     * param  {string} key  シーンデータのキー
     * param  {string} json 読み込むJSONシーンデータ
     * return {jqueryobj}      生成したDOMのjQueryオブジェクト
     */
    _km.loadScene = function(target_dom, json) {
        function read_stage_json(s, it) {
            for (var k in it) {
                var d = $("<div/>")
                    .css({
                        position: 'absolute'
                    })
                    .attr('id', '' + k);
                for (var k2 in it[k]) {
                    _km.setValtoObj(d, k2, it[k][k2]);
                }

                s.append(d);

                if (it[k].children) {
                    read_stage_json(d, it[k].children);
                }
            }
        }

        var dom = target_dom;

        read_stage_json(dom, json.children);
        return dom;
    };

    /**
     * JSONシーンデータをロード
     * method loadResourceCSS
     * param  {string} json 読み込むJSONリソースデータ
     * param  {string} imgpath パス、なければkm.config.imgpath使用
     * return {string}      生成したスタイルシート
     */
    _km.loadResourceCSS = function(json, imgpath) {
        var css = [];

        if(imgpath === undefined) imgpath = km.config.imgpath;

        for (var k in json) {
            var x = ("x" in json[k]) ? unit(-1 * json[k].x, "px") : 0;
            var y = ("y" in json[k]) ? unit(-1 * json[k].y, "px") : 0;
            var w = ("w" in json[k]) ? unit(json[k].w, "px") : 0;
            var h = ("h" in json[k]) ? unit(json[k].h, "px") : 0;
            var src = ("src" in json[k]) ? 'background: transparent url(' + imgpath + json[k].src + ') ' + x + ' ' + y + ' no-repeat;' : '';

            css.push(['.sp-', k, ' {', src, ' width:', w, '; height:', h, ';-webkit-transform-style:preserve-3d;transform-style:preserve-3d; }\n'].join(''));
        }
        return css.join('');
    };

    _km.setValtoObj = function(dom, k, val) {
        var target = dom;

        switch (k) {
            case "id":
                target.attr("id", val);
                break;
            case "sprite":
                target.addClass("sp-" + val);
                break;
            case "display":
                if (val == "none") {
                    target.hide();
                }
                break;
            case "x":
                target.css("left", val);
                break;
            case "y":
                target.css("top", val);
                break;
            case "z":
            case "scaleX":
            case "scaleY":
            case "opacity":
            case "overflow":
            case "rotate":
            case "rotateX":
            case "rotateY":
            case "z-index":
                target.css(k, val);
                break;
            default:
                return;
        }
        var d = {};
        d[k] = val;
        target.data(d);
    };



    _km.onbeats = [];

    /**
     * 音楽にあわせて1ビート毎に実行される関数の登録
     * @method onBeat
     * @param {function} fn 1ビート毎に実行される関数
     */
    km.onBeat = function(fn){
        _km.onBeatFn = fn;
    };

    _km.onBeatFn = function(beat) {};
    _km.onBeat = function() {
        var now = Date.now() - km.startTime;

        console.log(km.beatCount + " time:" + now + " :" + (now - km.beatCount * km.beat));
        var imax = _km.onbeats.length;

        for (var i = 0; i < imax; i++) {
            var dom = _km.onbeats[i];
            var fn = $(dom).data("kBeat");

            if (fn) {
                fn.call(dom, km.beatCount);
            } else {
                _km.onbeats.splice(i, 1);
                i--;
                imax--;
            }
        }

        _km.onBeatFn(km.beatCount);
    };
    _km.stopBeat = function() {
        window.clearTimeout(_km.schedulerTimer);

    };

    _km.defaultBeat = 400;

    //ビートコールバックはスケジューリング＋requestAnimFrameで管理
    // see: http://www.html5rocks.com/ja/tutorials/audio/scheduling/
    km.nextBeatTime = 0;
    _km.beatQueue = [];
    _km.scheduler = function() {
        var now = Date.now();
        while (km.nextBeatTime < now + 200) {
            _km.beatQueue.push({
                beat: _km.scheduledBeat,
                time: km.nextBeatTime
            });

            km.nextBeatTime += km.beat;
            _km.scheduledBeat++;
        }
        _km.schedulerTimer = window.setTimeout(_km.scheduler, 50);
    };


    /**
     * メインループを実行開始後からの総フレーム数
     * property frame
     * type {int}
     */
    km.frame = 0;
    _km.onupdates = [];
    _km.loopinit = false;


    /**
     * 1フレームごとに呼び出される関数を登録（非推奨
     * @method onUpdate
     * @param {function} fn 1フレームごとに呼び出される関数
     */
    km.onUpdate = function(fn){
        if (_km.loopinit === false) {
            requestAnimFrame(_km.onUpdate);
            _km.loopinit = true;
        }
        _km.onUpdateFn = fn;
    };

    _km.onUpdateFn = function() {};

    //メインループ。
    _km.onUpdate = function() {

        while (_km.beatQueue.length && _km.beatQueue[0].time < Date.now()) {
            //km.beatCount = _km.beatQueue[0].beat;
            km.beatCount++;
            _km.beatQueue.splice(0, 1);
            _km.onBeat();
        }

        var imax = _km.onupdates.length;
        for (var i = 0; i < imax; i++) {
            var dom = _km.onupdates[i];
            var fn = $(dom).data("kUpdate");
            if (fn) {
                fn.apply(dom);
            } else {
                _km.onupdates.splice(i, 1);
                i--;
                imax--;
            }
        }
        km.onUpdate();
        km.frame++;

        requestAnimFrame(_km.onUpdate);
    };



    //----------------------------------
    //便利関数
    /*
    //ｎをmin～maxに収める
    _km.fixnum = function(n, min, max) {
        if (n < min) return min;
        if (n > max) return max;
        return n;
    };

    //ｎをmin～maxに収める （値ループ
    _km.loopnum = function(n, min, max) {
        return (n - min) % (max - min);
    };
    _km.chuusen = function(percent) {
        var power = randint(0, 100);
        return percent > power;
    };

    //unixtime(sec)を00:00:00の文字列で出力
    _km.utime2str = function(utime) {
        return ('0' + Math.floor((utime % 216000) / 3600)).slice(-2) + ':' + ('0' + Math.floor((utime % 3600) / 60)).slice(-2) + ':' + ('0' + (utime % 60)).slice(-2);
    };

    //YY/MM/DDの取得
    _km.utime2datestr = function(utime) {
        dd = new Date();
        dd.setTime(utime * 1000);
        yy = dd.getYear();
        mm = dd.getMonth() + 1;
        dd = dd.getDate();
        if (yy < 2000) {
            yy += 1900;
        }
        if (mm < 10) {
            mm = "0" + mm;
        }
        if (dd < 10) {
            dd = "0" + dd;
        }
        return yy + "/" + mm + "/" + dd;
    };

    //配列シャッフル
    _km.shuffle = function(arr) {
        var i = arr.length;
        while (i) {
            var j = Math.floor(Math.random() * i);
            var t = arr[--i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        return arr;
    };

    //連想配列を指定キーでソート
    _km.asort = function(arr, key) {
        arr.sort(function(b1, b2) {
            return b1[key] > b2[key] ? 1 : -1;
        });
    };

    //連想配列も含めて配列サイズをカウント
    _km.asizeof = function(arr) {
        var len = 0;
        if (arr.length)
            return arr.length;
        for (var k in arr) {
            len++;
        }
        return len;
    };

    //配列要素をランダムで返す
    _km.randget = function(it) {
        var k = randgetkey(it);
        return it[k];
    };

    //連想配列のキーをランダムで返す
    _km.randgetkey = function(it) {
        var i = 0;
        var count = 0;
        var k;
        for (k in it) {
            count++;
        }
        var at = Math.floor(Math.random() * count);
        for (k in it) {
            if (at == i)
                return k;
            i++;
        }
        return false;
    };


    */
    function randint(fr, to) {
        return Math.floor(Math.random() * (to + 1 - fr)) + fr;
    }

    _km.CSSMatrix = window.WebKitCSSMatrix || window.MSCSSMatrix || window.CSSMatrix;
    if (!_km.CSSMatrix) {
        var RE_CSSMATRIX = /^.*\((.*)\)$/g;
        var RE_CSSMATRIX_SPLIT = /\s*,\s*/;
        _km.CSSMatrix = function(arg) {
            var a = arg.replace(RE_CSSMATRIX, "$1").split(RE_CSSMATRIX_SPLIT);
            for (var i = 0; i < a.length; i++) {
                a[i] = parseFloat(a[i]);
            }
            var m = this;
            if (a.length == 16) {
                m.m11 = m.a = a[0];
                m.m12 = m.b = a[1];
                m.m13 = a[2];
                m.m14 = a[3];
                m.m21 = m.c = a[4];
                m.m22 = m.d = a[5];
                m.m23 = a[6];
                m.m24 = a[7];
                m.m31 = a[8];
                m.m32 = a[9];
                m.m33 = a[10];
                m.m34 = a[11];
                m.m41 = m.e = a[12];
                m.m42 = m.f = a[13];
                m.m43 = a[14];
                m.m44 = a[15];
            } else if (a.length == 6) {
                m.m11 = m.a = a[0];
                m.m12 = m.b = a[1];
                m.m13 = 0;
                m.m14 = 0;
                m.m21 = m.c = a[2];
                m.m22 = m.d = a[3];
                m.m23 = 0;
                m.m24 = 0;
                m.m41 = m.e = a[4];
                m.m42 = m.f = a[5];
                m.m43 = 0;
                m.m44 = 1;
            } else {
                m.m11 = m.a = 1;
                m.m12 = m.b = 0;
                m.m13 = 0;
                m.m14 = 0;
                m.m21 = m.c = 0;
                m.m22 = m.d = 1;
                m.m23 = 0;
                m.m24 = 0;
                m.m31 = 0;
                m.m32 = 0;
                m.m33 = 1;
                m.m34 = 0;
                m.m41 = m.e = 0;
                m.m42 = m.f = 0;
                m.m43 = 0;
                m.m44 = 1;
            }
        };
    }

    // Audio ----------------------------------------

    /**
     * サウンドクラス
     * コンストラクタでサウンドをロード。
     * km.loadでロードしたときにkm.Soundインスタンスが生成され
     * km.sounds以下に格納される。
     * @class km.Sound
     * @constructor
     * @param {string} url ロードするサウンドのURL
     * @param {number} [bpm] 曲の場合、BPMを指定
     * @param {function} [fn] ロード完了後のコールバック
     * @return {km.Sound}
     **/
    km.Sound = function(url, bpm, fn) {
        var k = url.replace(/^(.*\/|)([^\/]+?)\.(mp3|ogg|wav)$/, "$2");

        this.pause_f = false;
        this.volume = 1.0;

        if (_km.loopinit === false) {
            requestAnimFrame(_km.onUpdate);
            _km.loopinit = true;
        }

        if (typeof bpm === "function") {
            fn = bpm;
            bpm = 0;
        }
        var filebpm = k.replace(/[^_]+?_([0-9]+?)$/, "$1");
        filebpm = parseInt(filebpm, 10);
        if(filebpm){
            bpm = filebpm;
        }
        this.bpm = bpm || 0;
        this.mspb = (this.bpm !== 0) ? 60000.0 / bpm : 0;
        this.loop_f = (this.bpm !== 0);
        this.id = k;
        this.loadok = false;
        this.load(k, url, bpm, fn);

        km.sounds[k] = this; //くまじんリソースへ登録
    };


    if (_km.isUIWebView) {
        //iOS UIWebview
        km.Sound.prototype = {
            _play: function() {
                _km.hostExec("soundplay", this.id);
            },
            _stop: function() {
                _km.hostExec("soundstop", this.id);
            },
            _pause: function() {
                _km.hostExec("soundpause", this.id);
            },
            load: function(k, url, bpm, fn) {
                var src, type;

                url.replace(/^(.*\/|)([^\/]+?)\.(mp3|ogg|wav)$/,
                    function(ma, m1, m2, m3){
                        src = m1+m2;
                        type = m3;
                });
                this.loadComplete = fn;

                _km.hostExec("soundload", [k, "@@", src, "@@", type ,"@@", bpm ].join(""));
            },
            setLoop: function(f) {
                if(f === false){
                    _km.hostExec("setloopfalse", this.id);
                }else{
                    _km.hostExec("setlooptrue", this.id);
                }
            },

            setVolume: function(v) {
                _km.hostExec("setvolume", this.id + "@@" + v);
            },

            destroy: function() {
                this.stop();
                _km.hostExec("sounddestroy", this.id);
                delete km.sounds[this.id];
            }
        };

        //ホスト実行キューiOS用
        _km.kQueue = [];
        _km.kQueueWait = false;
        _km.nextExec = function() {
            _km.kQueueWait = false;
            if (_km.kQueue.length > 0) {
                window.location.href = _km.kQueue.shift();
                _km.kQueueWait = true;
            }
        };

        //ホスト実行キュー格納
        _km.hostExec = function(url, k) {
            if (_km.isUIWebView) {
                var ios_url = 'action://' + url + '/' + k + '';
                if (_km.kQueueWait === true) {
                    _km.kQueue.push(ios_url);
                } else {
                    window.location.href = ios_url;
                    _km.kQueueWait = true;
                }
            } else if (_km.isAndroid) {

            }
        };

    } else if (typeof webkitAudioContext != "undefined" && _km.isLocal === false) {
        //WebkitAudio使用
        _km.audio = new webkitAudioContext();
        _km.audioout = _km.audio.createGain();
        _km.audioout.gain.setValueAtTime(1.0, 0);
        _km.audioout.connect(_km.audio.destination);
        //_km.audiofilter = _km.audio.createBiquadFilter();
        //_km.audiofilter.connect(_km.audio.destination);

        km.Sound.prototype = {
            _play: function() {
                

                if(this.pause_f === true){
                    //ポーズからの復帰 
                    this.source.loop = this.loop_f;
                    this.gain.connect(_km.audioout);
                    //this.source.start(0);
                }else{
                    //再生
                    this.source.stop(0);
                    this.source = null;
                    this.source = _km.audio.createBufferSource();
                    this.source.connect(this.gain);
                    this.source.loop = this.loop_f;
                    this.source.buffer = this.buffer;
                    this.gain.connect(_km.audioout);
                    this.source.start(0);
                }

            },

            _pause: function() {
                this.gain.disconnect(_km.audioout);
            },

            _stop: function() {
                this.source.stop(0);
            },

            /**
             * サウンドのロード(コンストラクタにて使用
             * @method load
             * @param {string} k ロードするサウンドのキー
             * @param {string} url ロードするサウンドのURL
             * @param {number} [bpm] 曲の場合、BPMを指定
             * @param {function} [fn] ロード完了後のコールバック
             */
            load: function(k, url, bpm, fn) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';

                this.loadComplete = fn;

                var self = this;
                request.onload = function() {
                    var self2 = self;
                    _km.audio.decodeAudioData(request.response, function(buffer) {
                        self2.buffer = buffer;
                        self2.source = _km.audio.createBufferSource();
                        self2.gain = _km.audio.createGain();
                        self2.source.connect(self2.gain);
                        self2.gain.gain.setValueAtTime(1.0, 0);
                        self2._loadComplete();
                    }, function() { //error
                        console.log("sound load error");
                    });
                };
                request.send();

            },
            /**
             * サウンドのループ指定
             * @method setLoop
             * @param {boolean} [f] ループする場合True
             */
            setLoop: function(f) {
                this.loop_f = f;
                this.source.loop = f;
            },
            /**
             * サウンドのボリューム設定
             * @method setVolume
             * @param {number} v ボリューム値(0.0-1.0
             */
            setVolume: function(v) {
                this.volume = v;
                this.gain.gain.setValueAtTime(v, 0);
            },
            /**
             * サウンドのメモリ解放
             * @method destroy
             */
            destroy: function() {
                this.stop();
                this.source.disconnect(this.gain);
                this.gain.disconnect(_km.audioout);
                this.buffer = null;
                this.source = null;
                this.gain = null;

                delete km.sounds[this.id];
            }
        };

    } else {
        //Flash使用

        km.Sound.prototype = {
            _play: function() {
                _km.audiodom.play(this.id);
            },
            _pause: function() {
                _km.audiodom.pause(this.id);
            },
            _stop: function() {
                _km.audiodom.stop(this.id);
            },
            setLoop: function(f) {
                this.loop_f = f;
                _km.audiodom.setLoop(this.id, f);
            },
            setVolume: function(vol) {
                this.volume = vol;
                _km.audiodom.setVolume(this.id, vol);
            },
            destroy: function() {
                this.stop();
                _km.audiodom.destroy(this.id);
                delete km.sounds[this.id];
            },
            load: function(k, url, bpm, fn) {
                if(! _km.audiodom ){
                    (function(){
                        if(!_km.audiodom || !_km.audiodom.load){
                            $("#ksound-dom").remove();
                            var dom = $("<embed/>")
                                .attr({
                                    src: km.config.swfpath,
                                    name: "ksound-dom",
                                    id: "ksound-dom",
                                    allowscriptaccess: "always"
                                }).css({
                                    position: "absolute",
                                    left: -1,
                                    top: 0,
                                    height: 1,
                                    width: 1
                                }).appendTo("body");
                            _km.audiodom = dom[0];
                            setTimeout(arguments.callee, 2000); //リトライ
                        }
                    })();
                    _km.audiodominit = true;
                }

                var k2 = k, url2 = url, bpm2 = bpm;
                setTimeout(function(){
                    if(!_km.audiodom.load === false){
                        //console.log("load:"+url2);
                        _km.audiodom.load(k2, url2, bpm2);
                    }else{
                        setTimeout(arguments.callee, 100);
                    }
                },10);
                
                this.loadComplete = fn;

            }
        };
    }


    //サウンドの共通処理ここから

    /**
    * サウンドを再生する。
    * @method play
    */
    km.Sound.prototype.play = function() {

        if (this.bpm !== 0) {
            //BGMの場合
            if(this.pause_f === false){
                km.beatCount = 0;
            }
            _km.stopBeat();
            km.beat = this.mspb;
            if (_km.nowbgm) {
                km.sounds[_km.nowbgm].stop();
            }
            _km.nowbgm = this.id;
        }

        this._play();

        if (this.bpm !== 0) {
            //BGMの場合のbeatコールバック開始
            this._startBeat();
        }

        this.pause_f = false;
    };

    /**
    * サウンドを一時停止する。
    * @method pause
    */
    km.Sound.prototype.pause = function() {
        if (this.bpm !== 0) {
            _km.stopBeat();
            _km.nowbgm = null;
        }
        this.pause_f = true;
        this._pause();
    };

    /**
     * サウンドを停止する。
     * @method stop
     */
    km.Sound.prototype.stop = function() {
        if (this.bpm !== 0) {
            _km.stopBeat();
            _km.nowbgm = null;
        }
        this._stop();
        this.pause_f = false;
    };

    km.Sound.prototype._complete= function() {
        if (this.bpm !== 0) {
            _km.stopBeat();
        }
        if (this.complete) this.complete();
    };

    km.Sound.prototype._loadComplete= function() {
        this.loadok = true;
        _km.audiodomloadok = true;
        if (this.loadComplete) this.loadComplete();
    };

    km.Sound.prototype._startBeat= function() {
        if (_km.loopinit === false) {
            requestAnimFrame(_km.onUpdate);
            _km.loopinit = true;
        }
        km.startTime = Date.now();
        _km.scheduledBeat = 0;
        km.nextBeatTime = km.startTime;
        _km.scheduler();
    };

    //---------------------------------------







    //ここから jQuery Plugin-----------------
    /**
     * jQueryプラグイン
     * @class jQuery.fn
     * 
     **/
    //カスタムcssの登録処理
    var customCssProps = [
        'x',
        'y',
        'z',
        'scale',
        'scaleX',
        'scaleY',
        'rotate',
        'rotateX',
        'rotateY',
        'rotate3d',
        'perspective'
    ],
    prop3d = { //うち、3D命令
        "z": true,
        "rotateX": true,
        "rotateY": true,
        "rotate3d": true,
        "perspective": true,
        "transformOrigin": true
    };


    $.each(customCssProps, function(i, prop) {
        $.cssHooks[prop] = {
            get: function(e) {
                var t = $(e).data('kTransform') || new kTransform();
                var op = "get_" + prop;
                if (t[op]) {
                    return t[op]();
                } else {
                    return t.props[prop] || 0;
                }
            },

            set: function(e, value) {
                var t = $(e).data('kTransform') || new kTransform();
                var op;

                if (value === "") { //空の指定はプロパティの削除
                    op = "del_" + prop;
                    if (t[op]) {
                        t[op]();
                    } else {
                        delete t.props[prop];
                    }
                } else {
                    op = "set_" + prop;
                    if (t[op]) {
                        t[op](value);
                    } else {
                        t.props[prop] = value.join(',');
                    }
                }

                e.style[_km.transform] = t.toString();
                $(e).data('kTransform', t);
            }
        };

        //transform配下のプロパティ関数なので、transitionのプロパティはtransformを指定。CSSの変な仕様
        _km.cssConvTransitionProp[prop] = _km.transform;
        //pxをつける項目じゃなければtrueを入れるらしい。
        $.cssNumber[prop] = true;
    });


    //
    // kTransform
    //
    //CSS transform-propertyを保持しておくための内部用クラス。

    function kTransform() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.props = {};
        this.props.translate = "0,0";
        return this;
    }

    kTransform.prototype = {
        //set
        set_rotate: function(theta) {
            this.props.rotate = unit(theta, 'deg');
        },

        set_rotateX: function(theta) {
            this.props.rotateX = unit(theta, 'deg');
        },

        set_rotateY: function(theta) {
            this.props.rotateY = unit(theta, 'deg');
        },

        set_scale: function(xy) {
            var x, y;

            if ($.isArray(xy)) {
                x = xy[0];
                y = xy[1];
            } else {
                x = y = xy;
            }

            this.scaleX = x;
            this.scaleY = y;
            this.props.scale = this.scaleX + "," + this.scaleY;
        },
        set_scaleX: function(x) {
            this.scaleX = x;
            if (this.scaleY === undefined) {
                this.scaleY = 1;
            }
            this.props.scale = this.scaleX + "," + this.scaleY;
        },

        set_scaleY: function(y) {
            this.scaleY = y;
            if (this.scaleX === undefined) {
                this.scaleX = 1;
            }
            this.props.scale = this.scaleX + "," + this.scaleY;
        },
        set_perspective: function(dist) {
            this.props.perspective = unit(dist, 'px');
        },

        set_x: function(x) {
            if (x !== null && x !== undefined) {
                this.x = x;
            }
            this.props.translate = unit(this.x, 'px') + "," + unit(this.y, 'px');
        },

        set_y: function(y) {
            if (y !== null && y !== undefined) {
                this.y = y;
            }
            this.props.translate = unit(this.x, 'px') + "," + unit(this.y, 'px');
        },

        set_z: function(z) {
            if (z !== null && z !== undefined) {
                this.z = z;
            }
        },

        //get
        get_x: function() {
            return this.x || 0;
        },

        get_y: function() {
            return this.y || 0;
        },

        get_z: function() {
            return this.z || 0;
        },

        get_scale: function() {
            if (this.props.scale) {
                if (this.scaleX == this.scaleY) {
                    return this.scaleX;
                } else {
                    return [this.scaleX, this.scaleY];
                }
            }
            return 1;
        },
        get_scaleX: function() {
            return this.scaleX || 1;
        },
        get_scaleY: function() {
            return this.scaleY || 1;
        },

        get_rotate3d: function() {
            var s = (this.props.rotate3d || "0,0,0,0deg").split(',');
            for (var i = s.length; i--;) {
                if (s[i]) {
                    s[i] = parseFloat(s[i]);
                }
            }
            if (s[3]) {
                s[3] = unit(s[3], 'deg');
            }

            return s;
        },

        //del
        del_x: function() {
            this.x = 0;
            this.props.translate = unit(this.x, 'px') + "," + unit(this.y, 'px');
        },

        del_y: function() {
            this.y = 0;
            this.props.translate = unit(this.x, 'px') + "," + unit(this.y, 'px');
        },

        del_z: function() {
            this.z = 0;
        },

        del_scale: function() {
            delete this["scaleX"];
            delete this["scaleY"];
            delete this.props["scale"];
        },

        //transformプロパティ関数のCSS指定文を返す
        toString: function() {
            var r = [];

            for (var i in this.props) {
                if (this.props.hasOwnProperty(i)) {
                    if (_km.isSupport3d) {
                        //3Dモード
                        if (i === 'scale') {
                            r.push(i + "3d(" + this.props[i] + ",1)");
                        } else if (i === 'translate') {
                            r.push(i + "3d(" + this.props[i] + "," + unit(this.z, 'px') + ")");
                        } else if (i === 'perspective') {
                            r.unshift(i + "(" + unit(this.props[i], 'px') + ")");
                        } else {
                            r.push(i + "(" + this.props[i] + ")");
                        }
                    } else {
                        //2Dモード
                        if (i in prop3d) continue; //3D命令は無視

                        r.push(i + "(" + this.props[i] + ")");
                    }
                }
            }

            return r.join(" ");
        }

    };


    //cssに指定したプロパティをtransition-propertyに変換

    function getTransition(properties, duration, easing, delay) {
        var props = [];

        $.each(properties, function(key) {
            key = $.camelCase(key);
            key = _km.cssConvTransitionProp[key] || $.cssProps[key] || key;
            key = unCamelCase(key);

            if ($.inArray(key, props) === -1) {
                props.push(key);
            }
        });

        if (km.easing[easing]) {
            easing = km.easing[easing];
        }

        var attribs = '' + toMS(duration) + ' ' + easing;
        if (parseInt(delay, 10) > 0) {
            attribs += ' ' + toMS(delay);
        }

        var transitions = [];
        $.each(props, function(i, name) {
            transitions.push(name + ' ' + attribs);
        });

        return transitions.join(', ');
    }



    /**
     * くまじんのメインとなるトゥーインアニメ関数。
     * jQueryプラグインとして動作する。使い勝手はjQuery animateと同じ。
     * 内部でCSS3 transition-propertyを使用しているためGPUに乗り高FPSでヌルヌル動く。
     * 他、loop～endloopによる繰り返しアニメや、
     * よくあるアニメを呼び出せるプリセット機能を搭載。
     * @method to
     * @param {object} params CSSに設定する
     * @param {int} [duration] アニメの長さ（ms）
     * @param {string} [easing] アニメ補完の種類
     * @param {function} [callback] アニメ終了後に実行されるコールバック関数を指定
     * @chainable
     * @example $("#foo").to({x: 0, y: 10}, 1000);
     * @example $("#foo").to({x: 0, y: 10}, 1000, "swing", callback_fn );
     * @example $("#foo").to( "shake", 400 ); //プリセット。400msの間、揺らす
     * @example $("#foo").to( "poyo" ); //ぽよんとする。生物感を出すためのアニメ
     * @example $("#foo").to( "scaleOut" ); //だんだん透明になりつつ大きくなっていく
     * @example $("#foo").to( "scaleIn", 450 ); //上記の逆を450msで
     */
    $.fn.to = function(params, duration, easing, callback) {
        var self = this,
            delay = 0,
            queue = true;

        //セレクタで配列指定した場合、個別に呼びなおす
        if (this.length > 1) {
            $.each(this, function() {
                $(this).to(params, duration, easing, callback);
            });
            return this;
        }

        if (typeof params === 'string') {
            //第一引数が文字列、プリセット使用  .to("scaleIn");
            if (km.toPreset[params]) {
                return km.toPreset[params].apply(this, [duration, easing, callback]);
            } else {
                return this;
            }
        }

        if (typeof params === 'function') {
            //第一引数が関数  .to(function(){ ...deffered run... })
            callback = params;
            params = {};
        }

        if ($.isArray(params)) {
            //第一引数が配列 チェーンメソッドで連続呼び出し
            // .to([ {x:10}, {x:30, duration:100, easing:"swing"} ])
            var chain = this;

            for (var i = 0; i < params.length; i++) {
                chain = $(chain).to(params[i]);
            }

            return chain;
        }

        if (typeof duration === 'function') {
            // .to({x:10}, function(){ ... } )
            callback = duration;
            duration = undefined;
        }

        if (typeof easing === 'function') {
            // .to({x:10}, 1000, function(){ ... } )
            callback = easing;
            easing = undefined;
        }

        var loop = $(this).data("kLoop");
        if (loop && loop.rec) {
            var obj = {};
            if (duration !== undefined) obj.duration = duration;
            if (callback !== undefined) obj.complete = callback;
            if (easing !== undefined) obj.easing = easing;
            loop.log.push($.extend(true, obj, params));
        }

        if (params.complete !== undefined) {
            callback = params.complete;
            delete params.complete;
        }

        if (params.queue !== undefined) {
            queue = params.queue;
            delete params.queue;
        }

        if (params.easing !== undefined) {
            easing = params.easing;
            delete params.easing;
        }

        if (params.delay !== undefined) {
            delay = params.delay;
            delete params.delay;
        }

        if (params.duration !== undefined) {
            duration = params.duration;
            delete params.duration;
        }


        if (duration === undefined) {
            duration = 0;
        }

        if (easing === undefined) {
            easing = km.config.defaultEasing;
        }

        duration = toMS(duration);

        //transition 3000msと 1500msを混合するCSSが実現できてないが、CSS3の仕様上無理
        var transitionValue = getTransition(params, duration, easing, delay);

        var sum_t = parseInt(duration, 10) + parseInt(delay, 10);

        // 0時間の場合,CSSをセットするだけの関数fnをキューに入れる
        if (sum_t < 1) {
            var noDurationfn = function(next) {
                self.css(params);

                if (typeof callback === 'function') {
                    callback.apply(self);
                }
                if (typeof next === 'function') {
                    next();
                }
            };

            if (queue === true) {
                self.queue(noDurationfn); //jQueryのアニメキューへ
            } else {
                noDurationfn();
            }
            return self;
        }

        //durationおよびdelayあり
        var durationfn = function(next) {
            this.offsetWidth; //再描画する効果があるらしい

            var cb = function() {
                self.css({
                    "transition": ""
                });
                //self[0].style[_km.transition] = null;

                if (typeof callback === 'function') {
                    callback.apply(self);
                }
                if (typeof next === 'function') {
                    next();
                }
            };

            params.transition = transitionValue;
            self.css(params)
                .setTimeout(cb, sum_t);
            //self[0].style[_km.transition] = transitionValue;
        };

        if (queue === true) {
            self.queue(durationfn); //jQueryのアニメキューへ
        } else {
            durationfn();
        }

        return self;
    };

    /**
     * チェインメソッドアニメループ開始
     * @method loop
     * @chainable
     */
    $.fn.loop = function() {
        //セレクタで配列指定した場合、個別に呼びなおす
        $.each(this, function() {
            $(this).data("kLoop", {
                log: [],
                rec: true
            });
        });
        return this;
    };

    //
    /**
     * チェインメソッドアニメループ終端
     * @method endloop
     * @chainable
     */
    $.fn.endloop = function() {
        var self = $(this).to(function() {
            var l = $(this).data("kLoop");
            if (l && l.log) {
                var a = [];
                for (var i = 0; i < l.log.length; i++) {
                    a.push($.extend(true, {}, l.log[i]));
                }
                $(this).to(a);
            }
        }, 1);

        $.each(this, function() {
            var l = $(this).data("kLoop");
            l.rec = false;
            $(this).data("kLoop", l);
        });

        return self;
    };

    /**
     * アニメループ実行を停止
     * @method stoploop
     * @chainable
     */
    $.fn.stoploop = function() {
        $(this).removeData("kLoop");
        return this;
    };


    //cssプロパティは z-index ->  zIndexのように変換しないと
    //elem.styleはzIndexなのだ
    var RE_UPPER = /([A-Z])/g;

    function unCamelCase(str) {
        return str.replace(RE_UPPER, function(letter) {
            return '-' + letter.toLowerCase();
        });
    }

    //デフォルトの単位をくっつける
    var RE_NUMBER = /^[\-0-9\.]+$/;

    function unit(i, units) {
        if ((typeof i === "string") && (!i.match(RE_NUMBER))) {
            return i;
        } else {
            return "" + i + units;
        }
    }

    //jQueryのfast等の指定をmsに変換する

    function toMS(t) {
        if ($.fx.speeds[t]) {
            t = $.fx.speeds[t];
        }

        return unit(t, 'ms');
    }



    //--------------------
    //その他jQueryプラグイン

    /**
     * 移動。to関数　to({x:XXX ,y: XXX}, ...)　と同じ。
     * 引数なしの場合、リアルタイムの座標を返す
     * @method pos
     * @param x 要素が本来表示される場所からのX位置を指定
     * @param y 要素が本来表示される場所からのY位置を指定
     * @param {int} duration アニメの長さ（ms）
     * @param {string} easing アニメ補完の種類
     * @param {function} callback アニメ完了後の処理
     * @example $("#foo").pos(10, 8); //x:10 y:8に移動
     * @example $("#foo").pos(); //  リアルタイムローカル座標を返す。
     * @chainable
     */
    $.fn.pos = function(x, y, duration, easing, callback) {
        if (arguments.length === 0) {
            var m = window.getComputedStyle(this[0])[_km.transform];
            m = new _km.CSSMatrix(m);
            return [m.m41, m.m42, m.m43];
        }
        $(this).to({
            x: x,
            y: y
        }, duration, easing, callback);
        return this;
    };

    //
    /**
     * 強制停止。transition中でもその場で停止する。
     * @method stopTo
     * @chainable
     */
    $.fn.stopTo = function() {
        var m = window.getComputedStyle(this[0])[_km.transform];

        this[0].style[_km.transform] = m;
        this[0].style[_km.transition] = null;

        m = new _km.CSSMatrix(m);
        var k = this.data("kTransform");
        k.x = m.m41;
        k.y = m.m42;
        k.z = m.m43; //pos以外の保持はできない

        $(this).queue([]).stop();

        return this;
    };

    /**
     * 拡大縮小。to関数　to({scaleX:XXX,scaleY:XXX }, ...)と同じ。
     * @method scale
     * @param {number} x X方向のスケール
     * @param {number} y Y方向のスケール
     * @param {ms} [t] アニメの長さ(ms)
     * @param {string} [easing] アニメ補完の種類
     * @param {function} [fn] アニメ完了後の処理
     * @chainable
     */
    $.fn.scale = function(x, y, t, easing, fn) {
        $(this).to({
            scaleX: x ,
            scaleY: y
        }, t, easing, fn);
        return this;
    };

    /**
     * 高速で非表示にする。画面外に移動している。点滅などに
     * @method fhide
     * @chainable
     */
    $.fn.fhide = function() {
        $(this).css("x", "+=999");
        return this;
    };

    /**
     * 高速で表示する。画面内に戻す。点滅などに
     * @method fshow
     * @chainable
     */    
     $.fn.fshow = function() {
        $(this).css("x", "-=999");
        return this;
    };

    /**
     * 回転。to関数　to({rotate:XXX }, ...)と同じ。
     * @method rotate
     * @param {number} r 回転度数を指定(deg)
     * @param {ms} [t] アニメの長さ(ms)
     * @param {string} [easing] アニメ補完の種類
     * @param {function} [fn] アニメ完了後の処理
     * @chainable
     */
    $.fn.rotate = function(r, t, easing, fn) {
        $(this).to({
            rotate: r
        }, t, easing, fn);
        return this;
    };

    /**
     * 透明度のフェード。to関数　to({opacity:XXX }, ...)と同じ。
     * @method fade
     * @param {number} a 透明度を指定
     * @param {ms} [t] アニメの長さ(ms)
     * @param {string} [easing] アニメ補完の種類
     * @param {function} [fn] アニメ完了後の処理
     * @chainable
     */
    $.fn.fade = function(a, t, easing, fn) {
        $(this).to({
            opacity: a
        }, t, easing, fn);
        return this;
    };

    /**
     * ウエイトをいれる。to関数　to({delay:XXX }, ...)と同じ。
     * @method wait
     * @param {ms} [t] ウエイトの長さ(ms)
     * @param {function} [fn] ウエイト完了後の処理
     * @chainable
     */
    $.fn.wait = function(t, fn) {
        $(this).to({
            delay: t
        }, 1, fn);
        return this;
    };

    /**
     * 表示画像の変更
     * @method sprite
     * @param  {string|array} spriteid  スプライトIDを指定,アニメの場合配列で指定
     * @param {int} t
     * @param {function} fn
     * @chainable
     */
    $.fn.sprite = function(spriteid, t, fn) {
        //TODO
        var oldsp = this.data("sprite");

        if (typeof spriteid === "string") {
            this.removeClass("sp-" + oldsp);
            this.addClass("sp-" + spriteid);

        } else if ($.isArray(spriteid)) {
            var i;
            for (i = 0; i < spriteid.length; i += 2) {
                this.sprite(spriteid[i], spriteid[i + 1]);
            }

            this.to(fn);
        }

        return this;
    };

    /**
     * ルーズなクリック。
     * マウスとタッチに対応。
     * タッチした後ちょっとぐらいはみ出ても実行される。(40px)
     * @method touchClick
     * @param  {function} fn クリック時の実行関数
     * @chainable
     */
    $.fn.touchClick = function(fn) {
        var fn2 = fn;
        var pushobj = {
            id: '',
            x: 0,
            y: 0
        };
        if (_km.isTouch) {
            $(this).on('touchstart', __getidt);
            $(this).on('touchend', __getidt2);
        } else {
            $(this).on('mousedown', __getid);
            $(this).on('mouseup', __getid2);
        }

        function __getidt() {
            if (event.touches[0]) {
                var e = event.touches[0];
                pushobj.id = $(this).get(0);
                pushobj.x = e.pageX;
                pushobj.y = e.pageY;
                
            }
            event.preventDefault();
        }

        function __getid(e) {
            pushobj.id = $(this).get(0);
            pushobj.x = e.pageX;
            pushobj.y = e.pageY;
        }

        function __getidt2() {
            var e = event.changedTouches[0];
            var dx = Math.abs(e.pageX - pushobj.x);
            var dy = Math.abs(e.pageY - pushobj.y);
            if (pushobj.id == $(this).get(0) && dx < 40 && dy < 40) { //タッチを離すときは若干の誤差を許す
                fn2.call(this, e);
            }
            pushobj.id = null;
        }

        function __getid2(e) {
            var dx = Math.abs(e.pageX - pushobj.x);
            var dy = Math.abs(e.pageY - pushobj.y);
            if (pushobj.id == $(this).get(0) && dx < 40 && dy < 40) {
                fn2.call(this, e);
            }
            pushobj.id = null;
        }

        return this;
    };

    /**
     * DOMに紐づく遅延実行。
     * 使い方はsetTimeoutとほぼ同じだがキーの指定で削除したり、
     * destroy関数時に後始末してくれるなど便利
     * @method setTimeout
     * @param {string} [id] 管理するID。指定なしの場合、IDで管理しない
     * @param {function} fn 遅延実行コールバック関数
     * @param {int} t 遅延実行の時間
     * @chainable
     *
     */
    $.fn.setTimeout = function(id, fn, t) {
        if (arguments.length === 2) {
            t = fn;
            fn = id;
            id = "";
        }
        var timeid = window.setTimeout($.proxy(fn, this), t);
        if (id === "") {
            id = timeid;
        }
        var timedata = $(this).data("kTime") || {};
        timedata[id] = timeid;
        //console.log("tid:"+timeid);
        $(this).data({
            "kTime": timedata
        });

        //dataが増えないように、実行時に消す
        var self = this,
            id2 = id;
        var clearcb = function() {
            var kt = self.data("kTime");
            if (kt && kt[id2]) {
                //console.log("delid:"+kt[id2])
                delete kt[id2];
            }
            self.data({
                "kTime": kt
            });
        };
        window.setTimeout(clearcb, t);

        return this;
    };

    /**
     * DOMに紐づく遅延実行を停止
     * 登録時のキーを指定すると停止してくれる
     * @method clearTimeout
     * @param {string} [id] 停止するID。指定なしの場合、DOMに紐づく遅延実行をすべて停止
     * @chainable
     */
    $.fn.clearTimeout = function(id) {
        var timedata = $(this).data("kTime");
        if (id === undefined) {
            //console.log(timedata);
            for (var k in timedata) {
                window.clearTimeout(timedata[k]);
                //console.log("delid"+timedata[k]);
            }
            $(this).data({
                "kTime": {}
            });
        } else {
            if (timedata && id in timedata) {
                window.clearTimeout(timedata[id]);
                delete timedata[id];
                $(this).data({
                    "kTime": timedata
                });
                //console.log("delid"+timedata[id]);
            }
        }
        return this;
    };

    /**
     * DOMに紐づく定期実行。
     * 使い方はsetIntervalとほぼ同じだがキーの指定で削除したり、
     * destroy関数時に後始末してくれるなど便利
     * @method setInterval
     * @param {string} [id] 管理するID。指定なしの場合、IDで管理しない
     * @param {function} fn 定期実行コールバック関数
     * @param {int} t 定期実行の時間
     * @chainable
     *
     */
    $.fn.setInterval = function(id, fn, t) {
        if (arguments.length === 2) {
            t = fn;
            fn = id;
            id = "";
        }
        var timedata = $(this).data("kInterval") || {};
        if (timedata[id])
            $(this).clearInterval(id);

        var timeid = window.setInterval($.proxy(fn, this), t);
        if (id === "") {
            id = timeid;
        }
        timedata[id] = timeid;
        $(this).data({
            "kInterval": timedata
        });
        return this;
    };

    /**
     * DOMに紐づく定期実行を停止
     * 登録時のキーを指定すると停止してくれる
     * @method clearInterval
     * @param {string} [id] 停止するID。指定なしの場合、DOMに紐づく定期実行をすべて停止
     * @chainable
     */
    $.fn.clearInterval = function(id) {
        var timedata = $(this).data("kInterval");
        if (arguments.length === 0) {
            var k;
            for (k in timedata) {
                clearInterval(timedata[k]);
            }
            $(this).data({
                "kInterval": {}
            });
        } else {
            if (timedata && id in timedata) {
                clearInterval(timedata[id]);
                delete timedata[id];
                $(this).data({
                    "kInterval": timedata
                });
            }
        }
        return this;
    };

    /**
     * 音楽にあわせて1ビートごとに呼び出される関数をDOMに登録
     * 引数が空の場合、登録したビート関数を解除
     * @method onBeat
     * @param {function} [fn] 1ビートごとに呼び出される関数
     * @chainable
     */
    $.fn.onBeat = function(fn) {
        if(typeof fn === "function"){
            this.data("kBeat", fn);
            _km.onbeats.push(this);
        }else{
            this.removeData("kBeat");

        }
        return this;
    };

    /**
     * 要素を削除する。
     * removeと同じだが、定期実行や遅延実行、ループ停止などの後片付けを行う。
     * @method destroy
     * @chainable
     */
    $.fn.destroy = function() {
        $(this).contents().andSelf()
            .clearTimeout().clearInterval().stop().attr("id", "").stoploop().remove();
        return this;
    };

    /**
     * シーンを切換する
     * sceneidに空を指定するとシーン削除
     * @method scene
     * @param {string} sceneid 切り替えシーンのIDを指定。空文字列の場合、削除
     * @param {int} t シーンの切り替わりアニメの時間(ms)
     * @param {string} transition シーンの切り替わりアニメの種類を指定
     * @chainable
     */
    $.fn.scene = function(sceneid, t, transition) {
        var s = $(this).data("kSceneState") || new kSceneState();

        if (!_km.init_f) {
            km.init();
        }

        if ( !(sceneid in km.scenes) && sceneid !== "") {
            //存在しないシーン
            console.log("not found sceneid:"+ sceneid);
        }

        var obj_index = s.set(this, sceneid, transition, t);

        $(this).data("kSceneState", s);

        //新しいシーンのオブジェクトキャッシュを返す
        //メソッドチェインできないがよいとする。
        return obj_index;
    };

    /*
     //シーンを追加する。
     //別DIVに追加すればよい話であるので廃止
     appendScene:function(sceneid, transition, t){
     return s.set(this, sceneid, transition, t, true);
     },*/
    
    var kSceneCount = 0;
    // ステート管理
    function kSceneState() {
        this.id = '';
        this.uid = kSceneCount++;
        this.old_id = '';
        return this;
    }

    kSceneState.prototype = {
        set: function(target, nid, transition, t, addmode) {
            var oid = this.id;
            t = t || km.config.defaultSceneTransitionTime;
            transition = transition || km.config.defaultSceneTransition;

            //console.log(oid);
            //console.log(nid);

            if (oid !== '') {
                var oldstate = km.scenes[oid];
                if (oldstate && oldstate.onDestroy) oldstate.onDestroy();
            }
            var olddom = $(".js-scene-" + this.uid);
            $(olddom).contents().andSelf().attr("id", "");

            this.id = nid;
            this.old_id = oid;
            var newdom = null;
            var obj = {};

            if (nid !== '') {
                //新しいdom追加
                var base = $("<div/>").addClass("js-scene-" + this.uid)
                    .css({
                        "display": "inline",
                        "position": "relative",
                        "left": 0,
                        "top": 0,
                        "width": 0,
                        "height": 0,
                        "overflow": "visible"
                    })
                    .prependTo(target);

                var p = $(target).offset();
                newdom = km.scenes[nid].dom.clone(true);

                $(newdom)
                    .css({
                        position: "absolute",
                        overflow: "visible",
                        //top:p.top,left:p.left,
                        top: 0,
                        left: 0,
                        "z-index": 100000,
                        opacity: 0
                    })
                    .prependTo(base);

                //$(newdom).offsetWidth;

                $(newdom).find("*").each(function() {
                    var id = $(this).attr("id");
                    obj[id] = $(this);
                });

                var newstate = km.scenes[nid];
                if (newstate && newstate.onStart) newstate.onStart();

            }

            //トランジション
            var tran = (km.sceneTransitionPresets[transition]) ? km.sceneTransitionPresets[transition] : tran;
            if (addmode || oid === "") {
                tran.apply(this, [null, newdom, t]);
            } else {
                tran.apply(this, [olddom, newdom, t]);
            }

            return obj;
        },
        get: function() {
            return this.id;
        },
        back: function(target, transition, t, addmode) {
            return this.set(target, this.old_id, transition, t, addmode);
        }

    };

    // シーン定義---------------
    function kScene(k, sceneobj) {
        this.onStart = function(){};
        this.onEnd = function(){};
        this.dom = _km.loadScene($("<div/>"), sceneobj);
    }

    kScene.prototype = {};

    //-------------------------------------


    /**
     * 画像クラス
     * ロードした画像を管理するクラス。km.loadで使われる。
     * @class km.Image
     * @constructor
     * @param {string} url ロードする画像のURL（png, jpeg, gif）
     * @return {km.Image}
     **/
    km.Image = function(url) {
        var k;

        url.replace(/^(.*\/|)([^\/]+?)\.(gif|jpe?g|png)$/, function(ma, m1, m2, m3){
            k = m2;
            //filename = m2+"."+m3;
        });

        km.imgs[k] = null;
        this.e = new Image();
        this.e.id = k;
        this.e.src = url;
        this.src = url;
        this.e.onload = function(){
            var kk = this.id;
            km.imgs[kk].w = this.width;
            km.imgs[kk].h = this.height;
            km.imgs[kk].loadok = true;
        };

        km.imgs[k] = this;
    };

    km.Image.prototype = {
        createDOM : function(){
            //新しいDOMを作って返す。
            var d = document.createElement('div');
            d.className = this.className;
            return d;
        }
        /*
        createSprite : function(){

        }
        */
    };

    //スプライト。パーティクルや放物線移動など
    //メインループ（onUpdate）での使用を想定。
    //TODO: くまじんのコンセプトから外れるので後で実装
    /*
    km.Sprite = function(url) {
    };
    km.Sprite.prototype = {
        x : 0,
        y : 0,
        z : 0,
        w : 0,
        h : 0,
        scaleX : 1.0,
        scaleY : 1.0,
        rotateX : 0,
        rotateY : 0,
        rotateZ : 0,
        'z-index' : 0
    };
    */

})(jQuery);
