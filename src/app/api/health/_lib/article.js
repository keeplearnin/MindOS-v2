// Article scraper — fetch a URL and extract readable text
// Uses Mozilla's Readability algorithm (same as Firefox Reader View)

import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export async function fetchArticle(url) {
  // Fetch the page
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch article: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error('URL does not point to an HTML page');
  }

  const html = await res.text();
  const { document } = parseHTML(html);

  // Extract metadata before Readability mutates the DOM
  const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  let faviconUrl = faviconEl?.getAttribute('href') || null;
  if (faviconUrl && !faviconUrl.startsWith('http')) {
    try {
      faviconUrl = new URL(faviconUrl, url).href;
    } catch { faviconUrl = null; }
  }

  const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')
    || new URL(url).hostname.replace('www.', '');

  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');

  // Run Readability
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article || !article.textContent?.trim()) {
    throw new Error('Could not extract readable content from this page. It may require JavaScript to render.');
  }

  // Clean up text: collapse whitespace, trim
  const content = article.textContent
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const wordCount = content.split(/\s+/).length;

  return {
    title: article.title || ogTitle || 'Untitled',
    siteName,
    author: article.byline || null,
    excerpt: article.excerpt || ogDesc || content.slice(0, 200) + '...',
    content,
    wordCount,
    faviconUrl,
  };
}
