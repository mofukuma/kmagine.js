package {
    import flash.display.Sprite;
    import flash.events.*;
    import flash.external.ExternalInterface;
	import flash.net.URLRequest;
	import flash.utils.Timer;
    import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
    import flash.system.Security;
	import flash.system.System;
	import flash.errors.IOError;


    public class SoundData{

        private var snd:Sound;
        private var pos:Number = 0;
        private var vol:Number = 1.0;
		private var bpm:Number = 0;
		private var mspb:Number = 0;
		private var loop_f:Boolean = false;
		private var loopPosition:Number = 0;
		
        private var play_f:Boolean = false;
		private var bgm_f:Boolean = false;
		private var id:String;
		
		private var channel:SoundChannel = new SoundChannel();
		private var fixtimer:Timer = null;
		
        public function SoundData(id:String, src:String, bpm:Number) {
            Security.allowDomain('*');
			
			if (bpm != 0) {
				mspb = 60000.0 / bpm;
				bgm_f = true;
				loop_f = true;
			}
			
            snd = new Sound(new URLRequest(src));
            snd.addEventListener(Event.COMPLETE, function(e:Event):void {
        
				ExternalInterface.call([
				'function() { km.sounds["', id ,'"].duration = ',snd.length*1000,';',
				'km.sounds["', id ,'"]._loadComplete(); }'].join(''));
            });
            snd.addEventListener(IOErrorEvent.IO_ERROR, function(e:Event):void {
                ExternalInterface.call('function() { console.log("not found sound:'+ src +');}');
            });
        }
		
		public function play():void {
			if (play_f) stop();
            channel = snd.play(pos);
            setVolume(vol);
            play_f = true;
			
			if(bgm_f){
				fixtimer = new Timer(1, 1); //スレッドにのせて即実行することで再生開始タイミングとあわせる
				fixtimer.addEventListener(TimerEvent.TIMER_COMPLETE, function():void {
					if(play_f) ExternalInterface.call(['function() { km.sounds["' + id + '"]._beatStart(', channel.position, '); }'].join(''));
				});
				fixtimer.start();
			}
			channel.addEventListener(Event.SOUND_COMPLETE, onPlayComplete);
        }
		
		
		private function onPlayComplete(e:Event):void {
			if (loop_f) pos = 0;
			else stop();
			ExternalInterface.call('function() { km.sounds["' + id + '"]._complete(); }');
		}

        public function pause():void {
            pos = channel.position;
            channel.stop();
            play_f = false;
        }

        public function stop():void {
            pos = 0;
            channel.stop();
            play_f = false;
        }
		
        public function setLoop(t:Boolean):void {
			loop_f = t;
        }

        public function setVolume(v:Number):void {
            vol = v;
			
			if (play_f){
				var transform:SoundTransform = channel.soundTransform;
				transform.volume = v;
				channel.soundTransform = transform;
			}
        }

        public function destroy():void {
			try {
				snd.close();
			}catch (err:IOError){
			}
			channel.stop();
			channel = null;
			snd = null;
			
        }
    }
}
