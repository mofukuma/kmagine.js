kmagine.js
===================

Animation and sound library for iOS Hybrid Apps, mobile first teaser sites, ads, or cross platform games.


Available to run iOS, Chrome, IE9, Firefox with one source of JavaScript/HTML.

Cross platform low latency and sync-beat sound engine.
( Chrome->Webkit Audio API / iOS->Native AVAudioPlayer / IE, Firefox-> Flash )

Useful tween animation function with CSS3 transition, like jQuery.animate.
Because CSS3 transition provides *native quality* GPU animation, than running matrix calculations with JavaScript at every frame. So, kmagine don't use canvas.

(This way is similar to Google Web Designer, jQuery.transit.js)

An useful script that convert .psd file to a kmagine scene data and pngs per photoshop layer. - psd2kmagine.jsx





Usage
-----

Requires jQuery 1.8+.

``` html
<script src='jquery-1.8.1.js'></script>
<script src='kmagine.js'></script>
```


Smooth tween animation with CSS transform, transiton, usages like jQuery.animate.

``` javascript
$("#it").to({x:120, y:100}, 1000, "swing");
```

Deffered animation.
``` javascript
$("#it")
	.to({x:0 , y:0 })
    .to({x:50, y:0 }, 1000)
    .to({x:0 , y:50}, 1000)
	.to({scale:2, rotate:180}, 800)
	.to({scaleX:0, scaleY:4, opacity:0}, 500)
	;
```

Loop animation.
``` javascript
$("#it")
	.loop()
		.to({rotate:"+=180"}, 1000, "linear")
	.endloop()
	;
```

Animation by presets.
``` javascript
$("#it").to("poyo");
```

Playing sound. (full-auto init, load, play)
``` javascript
km.playSound("media/test.mp3");
```

Playing looped bgm.
``` javascript
km.playSound("media/test_160.mp3");
//or km.playSound({src:"media/test.mp3", bpm:160});
```

Setting beat-callback in bpm sync.
``` javascript
km.onBeat(function(beat){
	console.log("beat count:"+beat);
	$("#it").to("poyo");
});
```

Loading sounds, images.
``` javascript
km.load("img/top.png");
```
``` javascript
// Available to load by array mixed sounds and images.
km.load(["media/test.mp3", {src:"media/bgm.mp3", bpm:130}, "img/my1.png"], function(){
	//on loading finished

	km.sounds.test.play();
	// or km.playSound("test");

	//...
});

```

Appending sprites from scene data.
``` javascript
var o = $("#root").scene("first");

o.it.to({x:"+=100"});
```

Scene transition.
``` javascript
$("#root").scene("first", 1000, "fade");
//... later ...
$("#root").scene("secound", 1000, "fade");
```

License
----------------

© 2013, mofukuma. Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).

 * Website http://mofukuma.com/
 * Twitter [@mofukuma](http://twitter.com/mofukuma)
