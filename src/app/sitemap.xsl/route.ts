// Yoast-style XSLT stylesheet that renders the raw sitemap XML as a readable,
// branded HTML table in the browser. Search engines ignore it; humans see a
// nice index. Served with an explicit text/xsl content-type.

const XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex,follow"/>
        <title>CodeForge AI — XML Sitemap</title>
        <style>
          :root { color-scheme: light dark; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 2rem 1rem; background: #f6f8fc; color: #171717;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
          .wrap { max-width: 1000px; margin: 0 auto; }
          .head { display: flex; align-items: center; gap: .6rem; margin-bottom: .35rem; }
          .dot { width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(150deg,#006bff,#0b3ea8); }
          h1 { font-size: 1.25rem; font-weight: 800; letter-spacing: -.02em; margin: 0; }
          .muted { color: #666; font-size: .9rem; margin: 0 0 1.25rem; }
          .count { color: #171717; }
          .count b { color: #006bff; }
          table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #ebebeb;
            border-radius: 12px; overflow: hidden; font-size: .875rem; }
          th, td { text-align: left; padding: .7rem .9rem; border-bottom: 1px solid #f0f0f0; }
          th { background: #fafafa; font-weight: 600; color: #444; text-transform: uppercase; font-size: .72rem; letter-spacing: .04em; }
          tr:last-child td { border-bottom: 0; }
          tr:hover td { background: #f7faff; }
          a { color: #006bff; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          td.n { color: #666; white-space: nowrap; }
          footer { margin-top: 1.25rem; font-size: .8rem; color: #888; }
          @media (prefers-color-scheme: dark) {
            body { background: #0a0a0a; color: #ededed; }
            .muted { color: #a1a1a1; }
            table { background: #18181b; border-color: rgba(255,255,255,.12); }
            th { background: #202024; color: #cfcfcf; }
            th, td { border-color: rgba(255,255,255,.08); }
            tr:hover td { background: rgba(0,107,255,.08); }
            .count { color: #ededed; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="head"><span class="dot"></span><h1>CodeForge AI — XML Sitemap</h1></div>
          <p class="muted">Generated for search engines. This page is a human-readable view.</p>

          <xsl:if test="s:sitemapindex">
            <p class="count">This XML Sitemap Index file contains <b><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/></b> sitemaps.</p>
            <table>
              <thead><tr><th>Sitemap</th><th>Last Modified</th></tr></thead>
              <tbody>
                <xsl:for-each select="s:sitemapindex/s:sitemap">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                    <td class="n"><xsl:value-of select="s:lastmod"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:if>

          <xsl:if test="s:urlset">
            <p class="count">This XML Sitemap contains <b><xsl:value-of select="count(s:urlset/s:url)"/></b> URLs.</p>
            <table>
              <thead><tr><th>URL</th><th>Priority</th><th>Change Freq.</th><th>Last Modified</th></tr></thead>
              <tbody>
                <xsl:for-each select="s:urlset/s:url">
                  <tr>
                    <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                    <td class="n"><xsl:value-of select="s:priority"/></td>
                    <td class="n"><xsl:value-of select="s:changefreq"/></td>
                    <td class="n"><xsl:value-of select="s:lastmod"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:if>

          <footer>CodeForge AI · codeforgeai.io</footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

export function GET() {
  return new Response(XSL, {
    headers: {
      "Content-Type": "text/xsl; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
