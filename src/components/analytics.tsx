import Script from "next/script";
import { getEffectiveConfig } from "@/lib/site-config";

export async function AnalyticsScripts() {
  const cfg = await getEffectiveConfig();

  return (
    <>
      {cfg.gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${cfg.gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());
            gtag('config','${cfg.gaId}',{page_path:window.location.pathname});
          `}</Script>
        </>
      )}
      {cfg.clarityId && (
        <Script id="ms-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${cfg.clarityId}");
        `}</Script>
      )}
    </>
  );
}
