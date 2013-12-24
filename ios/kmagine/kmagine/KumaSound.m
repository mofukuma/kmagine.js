//
//  KumaSound.m
//


#import "KumaSound.h"

@interface KumaSound (InternalMethods)

@end

@implementation KumaSound
@synthesize snddelegate, duration, vol, audio, pause_f, loop_f;

#define FEDE_SEED 0.01f
#define VOLUME_SEED 0.005f
#define SEQUENCE_INTERVAL 0.5f

//-(id) initWithPath:(NSString *)filename ofType:(NSString *)ofType delegate:(id)targetDelegate{
-(id) initWithPath:(NSString *)path bgm_bpm:(int)bgm_bpm delegate:(id)targetDelegate{
    //NSString * path = [[NSBundle mainBundle] pathForResource:filename ofType:ofType];
    NSURL * url = [NSURL fileURLWithPath:path];
    NSError *error = nil;
    audio = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:&error];
    if(audio){
        NSLog(@"load: %@", [NSString stringWithFormat:@"%@" , [url path]]);
    }else{
        NSLog(@"error load: %@", [NSString stringWithFormat:@"%@" , [url path]]);
    }
    audio.delegate = targetDelegate;
    self.snddelegate = targetDelegate;
    duration = audio.duration;
    loop_f = NO;
    vol = 1.0f;
    pause_f = NO;
    
    if(bgm_bpm !=0){
        audio.numberOfLoops = -1;
    }

    return self;
}
- (void)audioSequence{
    if(audio == nil) return;
    if(audio.playing){
        if( audio.currentTime >= duration ){
            //ループした
        }
        
		//[self.delegate audioSequence:audio.currentTime beatcount:beat];
	}
}
-(void)start{
    if(pause_f == NO) audio.currentTime = 0.0f;
    [NSThread detachNewThreadSelector:@selector(playThreaded:) toTarget:self withObject:audio];

    pause_f = NO;
}

-(void)stop:(BOOL)fade{
    if(audio == nil) return;
    
    if(fade){
        timerFade = [NSTimer scheduledTimerWithTimeInterval:FEDE_SEED target:self selector:@selector(audioFadeout) userInfo:nil repeats:YES];
    } else {
        if(audio.playing){
            [audio prepareToPlay];
            [audio stop];
            [audio setCurrentTime:0.0f];

        }
    }

    pause_f = NO;
}

-(void)pause{
    if(audio == nil) return;
    if(audio.playing){
        [audio pause];
        pause_f = YES;
    }    
}

-(void)audioFadein{
    if(audio.playing){
        if((audio.volume+VOLUME_SEED) < vol){
            
            [self.snddelegate audioFadein:audio.volume];
            [audio setVolume:audio.volume+VOLUME_SEED];
        } else {
            
            if([timerFade isValid]) [timerFade invalidate];
        }
    }
    
}
-(void)audioFadeout{
    if(audio.volume <= 0.0f){
        if([timerFade isValid]) [timerFade invalidate];
        [self stop:NO];
    } else {
        [self.snddelegate audioFadeout:audio.volume];
        [audio setVolume:audio.volume-VOLUME_SEED];
    }
}
-(void)playThreaded:(id)threadAudio{
    if(threadAudio == nil) return;
    @autoreleasepool {
        [(AVAudioPlayer *)threadAudio prepareToPlay];
        [(AVAudioPlayer *)threadAudio play];
    }
}
-(void)setVolume:(double)volume{
    [audio setVolume:volume];
}

-(void)setLoop:(BOOL)f{
    if(f == YES){
        audio.numberOfLoops = -1;
    }else{
        audio.numberOfLoops = 0;
    }
}

@end

