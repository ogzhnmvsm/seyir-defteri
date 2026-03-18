const fs = require('fs');

const { savePlay } = require('./src/db/save-to-db');
const playData = JSON.parse(fs.readFileSync('./data/oyun-verisi.json', 'utf-8'));

// Database'e kaydet
savePlay(playData)
    .then(() => {
        console.log('\n🎉 Kayıt işlemi tamamlandı!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Hata:', err);
        process.exit(1);
    });