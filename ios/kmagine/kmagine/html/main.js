$(function() {
    //シーンのロード
    var o = $(".kmagine").scene("sample1");

    //test
    km.getDeviceInfo();

    //サウンド再生（自動ロード
    km.playSound("ranking_140.mp3");

    //domにビートコールバックを登録
    $("#k_kiso").onBeat(function(beat) {
        //2ビートに一回、ぽよ
        if (beat % 2 === 0) {
            $(this).to("poyo");
            $("[id^=mob]").to("poyo");
        }

        switch (beat) {
            case 16:
            	//・・・
            break;
        }
    });
    
    
  
  //for tests
  $("body").touchClick(function(){
        km.sounds.ranking_140.stop();
        setTimeout(function() {
            km.sounds.ranking_140.play();
        }, km.beat * 2);
  		//グローバルにビートコールバック登録
  		km.onBeat(function(beat) {
        switch (beat) {
            case 4:
                km.sounds.ranking_140.pause();
                setTimeout(function() {
                    km.sounds.ranking_140.play();
                }, km.beat * 1);
                break;
              case 5:
              km.sounds.ranking_140.setVolume(0.2);
              break;
              case 7:
              km.sounds.ranking_140.setVolume(0.7);
              break;
              case 8:
              km.sounds.ranking_140.setLoop(true);
              break;
              case 9:
              km.sounds.ranking_140.setLoop(false);
              break;
            case 10:
		  		km.sounds.ranking_140.destroy();
                break;
        }
    });
  });

});