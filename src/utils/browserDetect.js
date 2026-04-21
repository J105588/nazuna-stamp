export const isInAppBrowser = () => {
  const ua = (navigator.userAgent || navigator.vendor || window.opera).toLowerCase();
  
  // 1. 直感的なアプリ名による判定
  const inAppPatterns = [
    'line/',
    'fbav/', // Facebook App
    'fban/', // Facebook (alternative)
    'messenger',
    'instagram',
    'twitter', // Now X but UA often still identifies as twitter
    'gsa/',      // Google Search App
    'yahoojp',   // Yahoo Japan App
    'micromessenger', // WeChat
    'hatena',
    'puffin',
    'duckduckgo',
    'linkedinapp',
    'threads/'
  ];

  const isKnownInApp = inAppPatterns.some(pattern => ua.includes(pattern));
  
  if (isKnownInApp) return true;

  // 2. iOSの WebView / SFSafariViewController 判定
  // 標準のSafariは "Version/X.X" を含むが、多くのWebView（Googleアプリ等）はこれを含まない
  const isIOS = /iphone|ipad|ipod/.test(ua);
  if (isIOS) {
    const hasAppleWebKit = ua.includes('applewebkit');
    const hasSafari = ua.includes('safari');
    const hasVersion = ua.includes('version/');
    const isChromeIOS = ua.includes('crios');
    const isFirefoxIOS = ua.includes('fxios');
    const isEdgeIOS = ua.includes('edgios');
    const isBraveIOS = ua.includes('brave/');

    // 「AppleWebKitを含み、かつ Version/ が無い」ものは、
    // Chrome, Firefox, Braveなどの正規ブラウザを除き、アプリ内WebViewである可能性が非常に高い
    if (hasAppleWebKit && !hasVersion && !isChromeIOS && !isFirefoxIOS && !isEdgeIOS && !isBraveIOS) {
      return true;
    }
  }

  return false;
};
