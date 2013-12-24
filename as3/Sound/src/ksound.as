package {
    import flash.display.Sprite;
    import flash.external.ExternalInterface;
	import flash.utils.Dictionary;
    import flash.system.Security;
    import flash.system.System;

	import SoundData;
	
	public class ksound extends Sprite {
		private var sounds: Object = new Object();
		
		public function ksound() {
            Security.allowDomain('*');
            ExternalInterface.addCallback('load', load);
			ExternalInterface.addCallback('play', play);
            ExternalInterface.addCallback('pause', pause);
            ExternalInterface.addCallback('stop', stop);
			ExternalInterface.addCallback('setLoop', setLoop);
			ExternalInterface.addCallback('setVolume', setVolume);
            ExternalInterface.addCallback('destroy', destroy);
        }
	    public function load(id:String, src:String, bpm:Number ):void {
            sounds[id] = new SoundData(id, src, bpm);
        }

		public function play(id:String ):void {
            sounds[id].play();
        }

        public function pause(id:String):void {
			sounds[id].pause();
        }

        public function stop(id:String):void {
			sounds[id].stop();
        }

        public function setLoop(id:String, t:Boolean):void {
            sounds[id].setLoop(t);
        }

        public function setVolume(id:String, vol:Number):void {
            sounds[id].setVolume(vol);
        }

        public function destroy(id:String):void {
            sounds[id].destroy();
			delete sounds[id];
        }
	}
}
