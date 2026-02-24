import SwiftUI
import WebKit

/// KVideo 公网地址
let kvideoURL = "https://ikanpp.netlify.app/"

struct ContentView: View {
    var body: some View {
        KVideoWebView(url: URL(string: kvideoURL)!)
            .ignoresSafeArea()
    }
}

struct KVideoWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsPictureInPictureMediaPlayback = true

        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        config.defaultWebpagePreferences = preferences

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black

        // 允许滑动返回
        webView.allowsBackForwardNavigationGestures = true

        // 隐藏滚动指示器
        webView.scrollView.showsHorizontalScrollIndicator = false

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        // 页面加载完成
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // 注入 iOS 标识，可以用于自适应 UI
            webView.evaluateJavaScript("""
                document.body.classList.add('ios-app');
            """)
        }

        // 支持新窗口打开（target="_blank"）
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil {
                webView.load(navigationAction.request)
            }
            return nil
        }
    }
}
