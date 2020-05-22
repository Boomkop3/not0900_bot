const Discord = require('discord.io');
const https = require('https');
const auth = require('./auth.json');
const startCommand = '!date ';

// Initialize Discord Bot
const bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

function main(){
	console.log('bot running, waiting for start signal');
}

function start(message, channelID){
	var message = message.substr(startCommand.length);
	
	const options = {
		hostname: auth.hostname,
		port: auth.port,
		path: '/?id=' + auth.id + '&action=start&file=' + message + '&channel=' + channelID,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': 0
		}
	}
	
	let response = [];
		
	// Request received
	const request = https.request(options, res => {
		res.on('data', chunk => {
			response += chunk;
		});
		res.on('end', result => {
			let apiResponse = JSON.parse(response);
			if (apiResponse.shift()){
				bot.sendMessage({
					to: channelID,
					message: "Sure, let's go..."
				});
				let id = setInterval(()=>{
					// shifts array by one
					handleConversation(apiResponse, channelID);
					if (apiResponse.length == 0){
						clearInterval(id);
					}
				}, 1150);
			} else {
				bot.sendMessage({
					to: channelID,
					message: "If only I had a clone with worse taste than me"
				});
			}
		});
	});
	
	// Error
	request.on('error', error => {
		console.log(error);
	});

	// request.write(payload);
	request.end();
}

function handleConversation(response, channelID){
	// console.log(response);
	if (response.shift() == 'text'){
		let lines = response.shift();
		let id = setInterval(()=>{
			bot.sendMessage({
				to: channelID,
				message: lines.shift()
			});
			if (lines.length == 0){
				clearInterval(id);
			}
		}, 1150);
	} else { // It's a menu
		
	}
}

bot.on('message', function (user, userID, channelID, message, evt) {
	// console.log(auth.id + ": input from: " + user);
    try {
        const data = JSON.stringify({
            user: user,
            userID: userID,
            channelID: channelID,
            message: message,
            evt: evt
        });
		
		if (message.startsWith(startCommand)){
			console.log('recieved start signal');
			start(message, channelID);
		}
		
    } catch (e) {
        console.log(e);
        bot.sendMessage({
            to: channelID,
            message: 'Something went wrong...'
        });
    }
});

bot.on('disconnect', (error, code)=>{
	bot.connect();
});

main();
