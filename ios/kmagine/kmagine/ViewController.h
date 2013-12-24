//
//  ViewController.h
//  kmagine
//
//  Created by mofukuma on 2013/12/12.
//  Copyright (c) 2013年 mofukuma. All rights reserved.
//

#import <UIKit/UIKit.h>

#import "KumaSound.h"

#import "Reachability/Reachability.h"

//#import "KumaStoreKitObserver.h"

@interface ViewController : UIViewController<UIWebViewDelegate> {
    NSMutableDictionary *sounds;
}





+ (id)controllerWithResourcePath:(NSString *)path;
+ (id)controllerWithResourcePath:(NSString *)path nibNamed:(NSString *)nib bundle:(NSBundle *)bundle;

- (id)initWithResourcePath:(NSString *)path nibNamed:(NSString *)nib bundle:(NSBundle *)bundle;


@property (nonatomic, retain) IBOutlet UIWebView *webView;
@property(nonatomic, retain) NSString *path;
@property(nonatomic, retain) NSMutableDictionary *sounds;
@property(nonatomic, retain) UIImageView *imageView;

//@property (nonatomic, retain) KumaStoreKitObserver *mySKObserver;


@end