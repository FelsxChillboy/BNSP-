import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

import { parseCnnRss, fetchCnnNews } from '../src/news.js';
import { createApp } from '../src/app.js';

const rssWithTwoItems = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CNN Indonesia | Berita Terkini Nasional</title>
    <item>
      <guid>https://www.cnnindonesia.com/nasional/20261113140532-12-1/judul-satu</guid>
      <pubDate>Fri, 13 Nov 2026 14:14:26 +0700</pubDate>
      <title><![CDATA[Judul Satu]]></title>
      <description><![CDATA[ <img src="https://akcdn.detik.net.id/desc-one.jpeg?w=360&amp;q=90"/> Ringkasan berita satu.]]></description>
      <enclosure length="25000" type="image/jpeg" url="https://akcdn.detik.net.id/enclosure-one.jpeg?w=360&amp;q=90"/>
      <link>https://www.cnnindonesia.com/nasional/20261113140532-12-1/judul-satu</link>
    </item>
    <item>
      <pubDate>Fri, 13 Nov 2026 15:00:00 +0700</pubDate>
      <title><![CDATA[Judul Dua]]></title>
      <description><![CDATA[ <img src="https://akcdn.detik.net.id/desc-two.jpeg"/> Ringkasan berita dua.]]></description>
      <link>https://www.cnnindonesia.com/nasional/20261113150000-12-2/judul-dua</link>
    </item>
  </channel>
</rss>`;

test('parseCnnRss memetakan item CNN ke bentuk image{large,small} + isoDate', () => {
  const items = parseCnnRss(rssWithTwoItems);

  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    title: 'Judul Satu',
    link: 'https://www.cnnindonesia.com/nasional/20261113140532-12-1/judul-satu',
    image: {
      large: 'https://akcdn.detik.net.id/enclosure-one.jpeg?w=360&q=90',
      small: 'https://akcdn.detik.net.id/enclosure-one.jpeg?w=360&q=90',
    },
    isoDate: '2026-11-13T07:14:26.000Z',
  });
});

test('parseCnnRss memakai gambar dari description bila enclosure tidak ada', () => {
  const [, second] = parseCnnRss(rssWithTwoItems);

  assert.equal(second.image.large, 'https://akcdn.detik.net.id/desc-two.jpeg');
  assert.equal(second.image.small, 'https://akcdn.detik.net.id/desc-two.jpeg');
});

test('parseCnnRss mengembalikan array kosong untuk XML tanpa item', () => {
  assert.deepEqual(parseCnnRss('<rss><channel></channel></rss>'), []);
});

test('parseCnnRss mengembalikan array kosong untuk input kosong', () => {
  assert.deepEqual(parseCnnRss(''), []);
});

test('fetchCnnNews mengirim User-Agent agar RSS CNN tidak menolak dengan 403', async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return { ok: true, text: async () => rssWithTwoItems };
  };

  const items = await fetchCnnNews('https://example.test/rss');

  assert.equal(items.length, 2);
  assert.ok(
    captured.options?.headers?.['User-Agent'],
    'fetchCnnNews harus mengirim header User-Agent'
  );
});

// --- Endpoint GET /api/news (fetch ke CNN distub, tidak menyentuh jaringan) ---

let server;
let baseUrl;
const realFetch = globalThis.fetch;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  globalThis.fetch = realFetch;
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/news mengembalikan berita yang sudah dinormalkan', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    text: async () => rssWithTwoItems,
  });

  const res = await realFetch(`${baseUrl}/api/news`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.data.length, 2);
  assert.deepEqual(body.data[0], {
    title: 'Judul Satu',
    link: 'https://www.cnnindonesia.com/nasional/20261113140532-12-1/judul-satu',
    image: {
      large: 'https://akcdn.detik.net.id/enclosure-one.jpeg?w=360&q=90',
      small: 'https://akcdn.detik.net.id/enclosure-one.jpeg?w=360&q=90',
    },
    isoDate: '2026-11-13T07:14:26.000Z',
  });
});

test('GET /api/news membalas 502 saat RSS CNN gagal diambil', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500 });

  const res = await realFetch(`${baseUrl}/api/news`);

  assert.equal(res.status, 502);
  assert.ok((await res.json()).message.length > 0);
});
