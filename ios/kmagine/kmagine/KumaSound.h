//
//  KumaSound.h
//

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#include <AVFoundation/AVFoundation.h>

@protocol KumaSoundDelegate
-(void) audioSequence:(double)currentTime beatcount:(int)beatcount;
-(void) audioFadein:(double)volume;
-(void) audioFadeout:(double)volume;
@optional
@end

@interface KumaSound : NSObject 
<AVAudioPlayerDelegate>
{
    NSTimer * timerFade;
    AVAudioPlayer * audio;
    float vol;
    double duration;
    BOOL pause_f, loop_f;
    id<KumaSoundDelegate> snddelegate;
}

@property (nonatomic) id<KumaSoundDelegate> snddelegate;
@property (nonatomic, retain) AVAudioPlayer * audio;
@property double duration;
@property float vol;
@property BOOL pause_f, loop_f;

//-(id) initWithPath:(NSString *)path ofType:(NSString *)ofType delegate:(id)targetDelegate;
-(id) initWithPath:(NSString *)path bgm_bpm:(int)bgm_bpm delegate:(id)targetDelegate;
-(void)start;
-(void)stop:(BOOL)fade;
-(void)pause;
-(void)playThreaded:(id)threadAudio;
-(void)setVolume:(double)volume;
-(void)setLoop:(BOOL) f;
@end


