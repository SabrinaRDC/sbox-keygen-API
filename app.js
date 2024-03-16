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
    database: 'sbox-keygen'
};
const serverConfig = {
    ip: '127.0.0.1',
    port: 8002
}
const db = mysql.createConnection(dbConfig);
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

app.listen(serverConfig.port, serverConfig.ip, () => {
    console.log(`Listening on ${serverConfig.ip}:${serverConfig.port}`)
});

app.get('/', async (req, res) => {
    console.log(req.method,);
    res.send('racismAPI')
})

app.post('/check', jsonParser, async (req, res) => {
    console.log(req.method,req.url, req.body);
    let response = {};
    if (req.body.password !== checkPassAPI) {
        res.status(401);
        response = { message: 'Password incorrect!' };
        console.log('Responded with: ', response);
        return res.send(response);
    };
    ipsData = await query('SELECT * FROM `sbox-keygen`.ips WHERE ip = ?;', [req.body.ip])
    if (!ipsData[0]) {
        res.status(404);
        response = { message: `No record found for ${req.body.ip}!`};
        console.log('Responded with: ', response);
        return res.send(response);
    };
    res.status(200);
    response = {
        message: 'Record found!',
        ip: ipsData[0].ip,
        bigoted: ipsData[0].bigoted
    };
    console.log('Responded with: ', response);
    res.send(response)
})

app.post('/post', jsonParser, async (req, res) => {
    console.log(req.method,req.url, req.body);
    let response = {};
    if (req.body.password !== postPassAPI ) {
        res.status(401);
        response = { message: 'Password incorrect!' };
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
    await query('UPDATE `sbox-keygen`.ips SET bigoted = ? WHERE ip = ?', [req.body.bigoted, req.body.ip]);
    console.log(`Updated record for ${req.body.ip}`);
    response = { message: "Success!" };
    console.log('Responded with: ', response);
    res.send(response);
})

