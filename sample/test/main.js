$(function() {
    //シーンのロード
    var o = $(".kmagine").scene("sample1");

    //サウンド再生（自動ロード
    km.load("ranking_140.mp3", main);
    
    //ロード完了後に実行
    function main(){
    	
    	//再生
    	km.playSound("ranking_140");
    	
	    //domにビートコールバックを登録
	    $("#k_kiso").onBeat(function(beat) {
	        //2ビートに一回、ぽよ
	        if (beat % 2 === 0) {
	            $(this).to("poyo");
	            $("[id^=mob]").to("poyo");
	        }

	        //for tests
	        switch (beat) {
	            //36ビート目に一時停止
	            case 36:
	                km.sounds.ranking_140.pause();
	                setTimeout(function() {
	                    km.sounds.ranking_140.play();
	                }, km.beat * 4);
	                break;
	        }
	    });

	    //for tests
	    //グローバルにビートコールバック登録
	    km.onBeat(function(beat) {
	        switch (beat) {
	              case 32:
	              km.sounds.ranking_140.setLoop(true);
	              break;
	              case 33:
	              km.sounds.ranking_140.setLoop(false);
	              break;
	              case 34:
	              km.sounds.ranking_140.setVolume(0.5);
	              break;
	        }
	    });
	  
	  $("body").touchClick(function(){
     km.sounds.ranking_140.destroy();
     });
    }

});