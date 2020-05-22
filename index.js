const Discord = require('discord.io');
const https = require('https');
const auth = require('./auth.json');

// Initialize Discord Bot
const bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('message', function (user, userID, channelID, message, evt) {
	console.log(auth.id + ": input from: " + user);
    try {
        const data = JSON.stringify({
            user: user,
            userID: userID,
            channelID: channelID,
            message: message,
            evt: evt
        });

        const options = {
            hostname: auth.hostname,
            port: auth.port,
            path: '/?id=' + auth.id,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }

		// Request received
        const request = https.request(options, res => {
            res.on('data', response => {
				try {
					bot.sendMessage(JSON.parse(response));
				} catch (e) {
					bot.sendMessage({
						to: channelID,
						message: 'JSON kon niet geparsed worden, onmiddelijk de PHP developer in elkaar meppen'
					});
				}
            });
        });
		// Error
        request.on('error', error => {
            bot.sendMessage({
                to: channelID,
                message: 'Bel Bin maar even!! (Request.on error fout, minder erg)'
            });
        })

        request.write(data);
        request.end();
        
    } catch (e) {
        console.log(e);
        bot.sendMessage({
            to: channelID,
            message: 'Error werd gethrowed o gossie'
        });
    }
});
