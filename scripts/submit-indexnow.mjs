import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');

const urlMatches = sitemapContent.match(/<loc>(https:\/\/[^<]+)<\/loc>/g) || [];
const urlList = urlMatches.map(m => m.replace(/<\/?loc>/g, ''));

const key = '8e46bcbd23d3d7494dba3c7306b3803f';
const host = 'www.imageprostudio.in';
const keyLocation = `https://${host}/${key}.txt`;

const payload = JSON.stringify({
  host,
  key,
  keyLocation,
  urlList
});

console.log(`Submitting ${urlList.length} URLs to Bing & IndexNow API...`);

async function postIndexNow(endpointHost, endpointPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: endpointHost,
      path: endpointPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${endpointHost}${endpointPath}] Response Status: ${res.statusCode} ${res.statusMessage}`);
        if (data) console.log(`Response: ${data}`);
        resolve(res.statusCode);
      });
    });

    req.on('error', (err) => {
      console.error(`[${endpointHost}] Request Error:`, err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  try {
    await postIndexNow('api.indexnow.org', '/indexnow');
    await postIndexNow('www.bing.com', '/indexnow');
    console.log('IndexNow submission completed successfully!');
  } catch (err) {
    console.error('Failed submitting to IndexNow:', err);
  }
}

main();
