import fs from 'fs';
import https from 'https';

https.get('https://usesocio.netlify.app/assets/index-ZFdieBg5.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const extract = (key) => {
      const regex = new RegExp(key + '\\\\s*:\\\\s*[\\'\\"]([^\\'\\"]+)[\\'\\"]', 'i');
      const match = data.match(regex);
      return match ? match[1] : '';
    };

    const apiKey = extract('apiKey');
    const authDomain = extract('authDomain');
    const projectId = extract('projectId');
    const storageBucket = extract('storageBucket');
    const messagingSenderId = extract('messagingSenderId');
    const appId = extract('appId');

    if (apiKey) {
      const envContent = `VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}
`;
      fs.writeFileSync('.env', envContent);
      console.log('Successfully restored .env!');
      console.log('API Key starts with:', apiKey.substring(0, 5) + '...');
    } else {
      console.log('Could not find Firebase config.');
    }
  });
}).on('error', (err) => {
  console.error(err);
});
