import { XMLParser } from 'fast-xml-parser';

// Sumber resmi: RSS berita nasional CNN Indonesia.
export const CNN_RSS_URL = 'https://www.cnnindonesia.com/nasional/rss';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

// Satu <item> tanpa pembungkus array dikembalikan sebagai objek oleh parser.
function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function toIsoDate(pubDate) {
  if (!pubDate) return '';
  const date = new Date(pubDate);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

// Sebagian item tidak punya <enclosure>; gambarnya ada di <img> dalam <description>.
function imageFromDescription(description) {
  if (typeof description !== 'string') return '';
  const match = description.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : '';
}

// Menormalkan RSS CNN ke bentuk yang dipakai newsMapper di frontend.
export function parseCnnRss(xml) {
  if (typeof xml !== 'string' || xml.trim() === '') return [];

  let parsed;
  try {
    parsed = parser.parse(xml);
  } catch {
    return [];
  }

  return asArray(parsed?.rss?.channel?.item).map((item) => {
    const enclosureUrl = item?.enclosure?.['@_url'];
    const image = enclosureUrl || imageFromDescription(item?.description) || '';

    return {
      title: typeof item?.title === 'string' ? item.title.trim() : '',
      link: typeof item?.link === 'string' ? item.link.trim() : '',
      image: { large: image, small: image },
      isoDate: toIsoDate(item?.pubDate),
    };
  });
}

export async function fetchCnnNews(url = CNN_RSS_URL) {
  // CNN menolak (403) permintaan tanpa User-Agent yang mirip browser.
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PortalBerita/1.0; +https://localhost)',
      Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`RSS CNN merespons HTTP ${res.status}`);
  return parseCnnRss(await res.text());
}
