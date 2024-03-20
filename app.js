const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const mysql = require('mysql');
const dbConfig = {
    host: '10.175.1.3',
    port: 3306,
    user: 'sbox-keygen',
    password: '',
    database: 'sbox-keygen',
    multipleStatements: true
};
const serverConfig = {
    ip: '',
    port: 8002
}
const db = mysql.createConnection(dbConfig);
const IPToken = '';
const checkPassAPI = '';
const postPassAPI = '';

function query(SQLquery, data){
    return new Promise((resolve, reject) => {
        db.query(SQLquery, data, (err, response) => {
            if (err) reject(err);
            resolve(response);
        })
    });
}

async function getIPInfo(ip, token){
    let response = await fetch(`https://api.ip2location.io/?key=${token}&ip=${ip}`)
   return await response.json();
}

app.listen(serverConfig.port, serverConfig.ip, () => {
    console.log(`Listening on ${serverConfig.ip}:${serverConfig.port}`)
});

app.get('/', async (req, res) => {
    console.log(req.method, req.url);
    res.send('racismAPI')
})

app.post('/check', jsonParser, async (req, res) => {
    const ip = req.headers['x-forwarded-for'].slice(req.headers['x-forwarded-for'].length/2+1);
    // const ip = req.socket.remoteAddress;
    console.log(ip, req.method,req.url, req.body);
    let response = {};
    let ipInfo;
    if (req.body.password !== checkPassAPI) {
        res.status(401);
        response = { message: 'Password incorrect!' };
        console.log('Responded with: ', response);
        return res.send(response);
    };
    if (!Boolean(req.body.ip)) {
        res.status(400);
        response.message = 'IP is NULL you dummy';
        console.log('Responded with: ', response);
        return res.send(response);
    };
    ipsData = await query('SELECT * FROM `sbox-keygen`.ips WHERE ip = ?;', [req.body.ip]);
    if (!ipsData[0]) {
        ipInfo = await getIPInfo(req.body.ip, IPToken);
        await query('INSERT INTO ips (ip, is_proxy, country_code, country_name, region_name, city_name) VALUES (?, ?, ?, ?, ?, ?);',[req.body.ip, ipInfo.is_proxy, ipInfo.country_code, ipInfo.country_name, ipInfo.region_name, ipInfo.city_name]);
        console.log(`Record created for ${req.body.ip}`);
        ipsData = await query('SELECT * FROM `sbox-keygen`.ips WHERE ip = ?;', [req.body.ip]);
    };
    if (ipsData[0].is_proxy == null) {
        console.log(`Found ip with NULL is_proxy! ${ip}(${ipsData[0].name})`);
        ipInfo = await getIPInfo(req.body.ip, IPToken);
        await query('UPDATE `sbox-keygen`.ips SET is_proxy = ?, country_code = ?, country_name = ?, region_name = ?, city_name = ? WHERE ip = ?;', [ipInfo.is_proxy, ipInfo.country_code, ipInfo.country_name, ipInfo.region_name, ipInfo.city_name, req.body.ip]);
        ipsData = await query('SELECT * FROM `sbox-keygen`.ips WHERE ip = ?;', [req.body.ip]);
        console.log(`Record updated for ${req.body.ip}(${ipsData[0].name})`);
    };
    res.status(200);
    response = {
        message: 'Record found!',
        ip: ipsData[0].ip,
        bigoted: ipsData[0].bigoted,
        banned: ipsData[0].banned,
        ban_reason: ipsData[0].ban_reason,
        is_proxy: ipsData[0].is_proxy
    };
    console.log('Responded with: ', response);
    res.send(response)
})

app.post('/post', jsonParser, async (req, res) => {
    const ip = req.headers['x-forwarded-for'].slice(req.headers['x-forwarded-for'].length/2+1);
    // const ip = req.socket.remoteAddress;
    console.log(ip, req.method,req.url, req.body);
    let response = { message: ''};
    if (req.body.password !== postPassAPI ) {
        res.status(401);
        response.message = 'Password incorrect!';
        console.log('Responded with: ', response);
        return res.send(response);
    };
    if (!Boolean(req.body.ip)) {
        res.status(400);
        response.message = 'IP is NULL you dummy';
        console.log('Responded with: ', response);
        return res.send(response);
    };
    ipsData = await query('SELECT * FROM `sbox-keygen`.ips WHERE ip = ?;', [req.body.ip]);
    if(!ipsData[0]) {
        console.log(`No records found for ${req.body.ip}.`);
        await query('INSERT INTO ips (ip) VALUES (?);',[req.body.ip]);
        console.log(`New record created for ${req.body.ip}`);
    };
    res.status(200);
    let SQLquery = '';
    let SQLqueryData= [];
    response = { ip: req.body.ip, message: "", bigoted_updated: false, banned_updated: false, ban_reason_updated: false};
    if (req.body.bigoted != null) {
        SQLquery = SQLquery.concat('UPDATE `sbox-keygen`.ips SET bigoted = ? WHERE ip = ?;');
        SQLqueryData.push(req.body.bigoted, req.body.ip);
        response.bigoted_updated = true;
    };
    if (req.body.banned != null) {
        SQLquery = SQLquery.concat('UPDATE `sbox-keygen`.ips SET banned = ? WHERE ip = ?;');
        SQLqueryData.push(req.body.banned, req.body.ip);
        response.banned_updated = true;
    };
    if (req.body.ban_reason != null) {
        SQLquery = SQLquery.concat('UPDATE `sbox-keygen`.ips SET ban_reason = ? WHERE ip = ?;');
        SQLqueryData.push(req.body.ban_reason, req.body.ip);
        response.ban_reason_updated = true;
    };
    if (!Boolean(SQLquery)) {
        response.message = "No field specified to update!";
        console.log('Responded with: ', response)
        return res.send(response);
    };
    await query(SQLquery, SQLqueryData);
    response.message = "Update successful!";
    console.log(`Updated record for ${req.body.ip}`);
    console.log('Responded with: ', response);
    return res.send(response);
    
})

