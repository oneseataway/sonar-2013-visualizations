var querystring = require('querystring');

var options = {
    host: 'http://thethings.io/store-city/BUS/',
    port: 80,
    path: '/' + parseInt( Math.random()*180 ),
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
};

var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log("body: " + chunk);
    });
});

req.write(data);
req.end();