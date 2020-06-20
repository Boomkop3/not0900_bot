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

function getNetworkOptions(url){
	return {
		hostname: auth.hostname,
		port: auth.port,
		path: url,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': 0
		}
	};
}

function getNetworkRequest(options, callback){
	let response = [];
	https.request(options, res => {
		res.on('data', chunk => {
			response += chunk;
		});
		res.on('end', result => {
			callback(response);
		});
	}).end();
}

function start(message, channelID){
	var message = message.substr(startCommand.length);
	var url = '/?id=' + auth.id + '&action=start&file=' + message + '&channel=' + channelID;
	var options = getNetworkOptions(url);
	
	getNetworkRequest(options, (response) => {
		let apiResponse = JSON.parse(response);
		if (apiResponse.shift()){
			bot.sendMessage({
				to: channelID,
				message: "Sure, let's go..."
			});
			let id = setInterval(()=>{
				// shifts array by one
				handleConversation(apiResponse, channelID, (apiResponse, channelID)=>{
					if (apiResponse.length == 0){
						clearInterval(id);
						requestNextStep(channelID);
					}
				});
			}, 1100);
		} else {
			bot.sendMessage({
				to: channelID,
				message: "If only I had a clone with worse taste than me"
			});
		}
	});
}

function requestNextStep(channelID){
	var url = '/?id=' + auth.id + '&action=next' + '&channel=' + channelID;
	var options = getNetworkOptions(url);
	getNetworkRequest(options, (response) => {
		console.log(response);
	});
}

function handleConversation(response, channelID, callback){
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
				callback(response, channelID);
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
