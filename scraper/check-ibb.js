const pool = require('./src/db/connection');
pool.query("SELECT id, title, source, ibb_url FROM plays WHERE source = 'ibb' LIMIT 5")
    .then(r => {
        r.rows.forEach(p => console.log(p.id, p.title, '|', p.source, '|', p.ibb_url ? 'URL:OK' : 'URL:NULL'));
        pool.end();
    })
    .catch(e => { console.error(e.message); pool.end(); });
