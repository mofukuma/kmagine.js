//
//  ViewController.m
//  kmagine
//
//  Created by mofukuma on 2013/12/12.
//  Copyright (c) 2013年 mofukuma. All rights reserved.
//

#import "ViewController.h"

#define HTML_PATH @"html/"
#define DEFAULT_HTML @"html/index.html"

@interface ViewController ()

- (void)handleActionURL:(NSURL *)url;

@end

@implementation ViewController


- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


+ (id)controllerWithResourcePath:(NSString *)path {
	return [[self class] controllerWithResourcePath:path nibNamed:nil bundle:nil];
}

+ (id)controllerWithResourcePath:(NSString *)path nibNamed:(NSString *)nib bundle:(NSBundle *)bundle {
	return [[ViewController alloc] initWithResourcePath:path nibNamed:nib bundle:bundle];
}


UIView *loadingView;
UIActivityIndicatorView *indicator;

@synthesize webView=webView_;
@synthesize path=path_;

@synthesize sounds;
@synthesize imageView;
//@synthesize mySKObserver;


- (id)initWithResourcePath:(NSString *)path nibNamed:(NSString *)nib bundle:(NSBundle *)bundle {
	self = [super initWithNibName:nib bundle:bundle];
	if (self) {
		self.path = path;
	}
	
	return self;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    
    //ロード画面
    
    //StoreKit準備：起動後、トランザクション用のオブザーバーを作る。
    //KumaStoreKitObserverはkmagine.jsから外し
	//mySKObserver = [[KumaStoreKitObserver alloc] init];
    //[mySKObserver setDelegate:self];
	//[[SKPaymentQueue defaultQueue] addTransactionObserver: mySKObserver];
    
	UIApplication *app = [UIApplication sharedApplication];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationWillTerminate:) name:UIApplicationWillTerminateNotification object:app];
    
    //ステータスバー消す
    //[[UIApplication sharedApplication] setStatusBarHidden:YES withAnimation:NO];
    //self.navigationController.navigationBarHidden = YES;
    
    
	if (self.webView == nil) {
		//self.webView = [[UIWebView alloc] initWithFrame:self.view.bounds];
		//[self.view addSubview:self.webView];
    }
    self.webView.autoresizingMask = //UIViewAutoresizingFlexibleWidth|
                                    UIViewAutoresizingFlexibleHeight|
                                    UIViewAutoresizingFlexibleLeftMargin|
    UIViewAutoresizingFlexibleRightMargin;
                                    //UIViewAutoresizingFlexibleTopMargin|
                                    //UIViewAutoresizingFlexibleBottomMargin;
    self.webView.backgroundColor = [UIColor clearColor];
    [self.webView setScalesPageToFit:YES];
    self.webView.opaque = NO;
    self.webView.delegate = self;

    

	
    NSLog(@":init");
    
    self.sounds = [NSMutableDictionary dictionary];
    
    //初期URLのロード
    NSString *path = self.path;
	if ([path length] == 0) {
		path = DEFAULT_HTML;
	}
	
	NSString *ext = [path pathExtension];
	
	NSURL *url = [[NSBundle mainBundle] URLForResource:[path stringByDeletingPathExtension] withExtension:ext];
	[self.webView loadRequest:[NSURLRequest requestWithURL:url]];

    
    
}

 /*
 //縦固定
 - (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
 return (interfaceOrientation == UIInterfaceOrientationPortrait
 || interfaceOrientation == UIDeviceOrientationPortraitUpsideDown);
 }

 //横固定
 - (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation{
 return (interfaceOrientation == UIInterfaceOrientationLandscapeRight
 || interfaceOrientation == UIInterfaceOrientationLandscapeLeft);
 }
 */

- (void)viewDidUnload {
	self.webView = nil;
	[super viewDidUnload];
}


- (void)dealloc {
    self.webView.delegate = nil;
	self.path = nil;
	self.webView = nil;
	self.sounds = nil;
}

#pragma mark HTML Integration

- (void)pageLoaded:(NSString *)url {
	NSLog(@"page loaded: %@", url);
}

- (void)handleActionURL:(NSURL *)url {
	SEL action = NSSelectorFromString([NSString stringWithFormat:@"%@Action:", [url host]]);
	if ([self respondsToSelector:action]) {
		[self performSelector:action withObject:url];
        return;
    }
	
    
	action = NSSelectorFromString([NSString stringWithFormat:@"%@Action", [url host]]);
	if ([self respondsToSelector:action]) {
		[self performSelector:action];
        return;
	}

    NSLog(@"no iOS Host Action");
}

- (void)pageLoadedAction:(NSURL *)url {
	NSString *pageUrl = [[url query] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
	
	[self pageLoaded:pageUrl];
}


- (void)logAction:(NSURL *)url {
	NSLog(@"%@ %@ %@", [url path], [url query], [url fragment]);
}
-(void)soundplayAction:(NSURL *)url {
    NSLog(@"sound play");
    
    KumaSound *song = (KumaSound *)[self.sounds objectForKey:[url path]];
    [song start];
    
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}


-(void)setlooptrueAction:(NSURL *)url {
    KumaSound *song = (KumaSound *)[self.sounds objectForKey:[url path]];
    [song setLoop:YES];
    
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}

-(void)setloopfalseAction:(NSURL *)url {
    KumaSound *song = (KumaSound *)[self.sounds objectForKey:[url path]];
    [song setLoop:NO];
    
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}

-(void)setvolumeAction:(NSURL *)url {
    NSArray* arr = [[url path] componentsSeparatedByString:@"@@"];
    NSString * key = [arr objectAtIndex:0];
    double vol = [[arr objectAtIndex:1] doubleValue];
    
    KumaSound *song = (KumaSound *)[self.sounds objectForKey:key];
    [song setVolume:vol];
    
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}

-(void)sounddestroyAction:(NSURL *)url {
    KumaSound *song = (KumaSound *)[self.sounds objectForKey:[url path]];
    [song stop:NO];
    song = nil;
    [self.sounds removeObjectForKey:[url path]];
    
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}

-(void)soundstopAction:(NSURL *)url {
    NSLog(@"sound stop");
    KumaSound *song = [self.sounds objectForKey:[url path]];
    [song stop:NO];
    
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}

-(void)soundpauseAction:(NSURL *)url {
    NSLog(@"sound pause");
    KumaSound *song = [self.sounds objectForKey:[url path]];
    [song pause];
    
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}


-(void)getdeviceinfoAction{
    UIDevice *device = [UIDevice currentDevice];
    NSUUID *udid = [device identifierForVendor];
    NSLog(@"***udid: %@", udid);

    NSArray *langs = [NSLocale preferredLanguages];
    NSString *langID = [langs objectAtIndex:0];
    NSLog(@"***locale: %@", langID);

    [self.webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"_km.udid = '%@';_km.locale = '%@'; _km.nextExec();", udid, langID]];
}

-(void)htmlAction:(NSURL *)url{
    NSLog(@"%@ %@ %@", [url path], [url query], [url fragment]);
    
    NSString *urlString = [NSString stringWithFormat:@"http:/%@/?%@",[url path], [url query] ];
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:urlString]];
    [self.webView stringByEvaluatingJavaScriptFromString:@"_km.nextExec();"];
}

-(void)soundloadAction:(NSURL *)url{
    NSLog(@"%@ %@ %@", [url path], [url query], [url fragment]);
    
    NSString * it = [[[url path] componentsSeparatedByString:@"/"] objectAtIndex:1];
    NSArray* arr = [it componentsSeparatedByString:@"@@"];
    
    //key, src, type, bpm
    NSString * key = [arr objectAtIndex:0];
    NSString * src = [arr objectAtIndex:1];
    NSString * type = [arr objectAtIndex:2];
    int bpm = [[arr objectAtIndex:3] integerValue];
    
    //Cacheをつかう場合
    //NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    //NSString *documentsDirectory = [paths objectAtIndex:0];
    //NSString* storagePath = [NSString stringWithFormat:@"%@/myCache/f/bgm/", documentsDirectory];
    //NSLog(@"sound load: %@", [NSString stringWithFormat:@"%@%@", storagePath, [url path]]);
    
    //
    //NSString * path = [[NSBundle mainBundle] pathForResource:filename ofType:ofType];
    //
    
        //KumaSound *song = [[KumaSound alloc]initWithPath:[NSString stringWithFormat:@"%@%@", storagePath, [arr objectAtIndex:i] ] ofType:@"caf" delegate:self];
        NSLog(@"src: %@", src );
        NSString * path = [[NSBundle mainBundle] pathForResource:[NSString stringWithFormat:@"%@%@",HTML_PATH, src] ofType:type ];
        NSLog(@"sound load: %@", path );
        //KumaSound *song = [[KumaSound alloc]initWithPath:path ofType:@"caf" delegate:self];
		KumaSound *song = [[KumaSound alloc]initWithPath:path bgm_bpm:bpm delegate:self];
        
        if(song != nil)
            [self.sounds setObject:song forKey: [NSString stringWithFormat:@"/%@", key]]; //urlは/がつくが、そのままキーにしちゃう
    
    [self.webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"km.sounds['%@']._loadComplete(); _km.nextExec();",key]];
    NSLog(@"sound loaded: %@", key );
    
}



-(void)audioSequence:(double)currentTime beatcount:(int)beatcount{
	
}
// フェードイン中
-(void)audioFadein:(double)volume{
}
// フェードアウト中
-(void)audioFadeout:(double)volume{
}

#pragma mark UIWebViewDelegate
- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
	NSURL *url = [request URL];
	NSLog(@"url:%@", url);
	if ([[url scheme] isEqual:@"action"]) {
		[self handleActionURL:url];
		return NO;
	}
    
	if ([[url scheme] isEqual:@"ios@@http"]) {
        //_blankの制御
        NSLog(@"href...%@", [url scheme]);
		return NO;
	}
    
    
    /* //デバッグ用
     NSString *requestString = [[[request URL] absoluteString] stringByReplacingPercentEscapesUsingEncoding: NSUTF8StringEncoding];
     if ([requestString hasPrefix:@"ios-log:"]) {
     NSString* logString = [[requestString componentsSeparatedByString:@":#iOS#"] objectAtIndex:1];
     NSLog(@"UIWebView console: %@", logString);
     return NO;
     }*/
	
	return YES;
}

- (void)webViewDidStartLoad:(UIWebView *)webView {
	
}

- (void)webViewDidFinishLoad:(UIWebView *)webView {
    //_blankの制御
    /*
     [webView stringByEvaluatingJavaScriptFromString:@"var tags = document.getElementsByTagName('a');for(var i=0; i < tags.length; i++) {var tag = tags[i];var t = tag.getAttribute('target');var h = tag.getAttribute('href');if(t == '_blank') {tag.setAttribute('target', '');tag.setAttribute('href', 'ios_'+h);}}"];*/
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error {
	
}


/**
 * タッチイベント開始
 */
- (void)webView:(UIWebView *)webView touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    NSLog(@"touchstart");
}

/**
 * タッチイベント終了
 */
- (void)webView:(UIWebView *)webView touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
    NSLog(@"touchend");
}


@end
