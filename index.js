const Discord = require('discord.io');
const https = require('https');
const auth = require('./auth.json');
const startCommand = '!date ';
var spam = [];
var emotes = ['❤', '💛', '💙', '💯', '💢', '💥', '💫', '💦'];

// Initialize Discord Bot
const bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', () => {
	let speed = 100;
	let counter = 0;
	let max = 5000;
	setInterval(()=>{
		if (counter > 2000){
			if (spam.length > 0){
				let message = spam.shift();
				if (typeof message === 'function'){
					message.call();
				}
				counter -= 2000;
			}
		}
		counter += speed;
		if (counter > max) counter = max;
	}, speed)
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
	console.log(options.path);
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
		// console.log(apiResponse);
		if (apiResponse.shift()){
			spam.push([
				channelID, 
				"Sure, let's go..."
			]);
			let id = setInterval(()=>{
				// shifts array by one
				handleConversation(apiResponse, channelID, (apiResponse, channelID)=>{
					if (apiResponse.length == 0){
						clearInterval(id);
						requestNextStep(channelID);
					}
				});
			}, 50);
		} else {
			spam.push(function(){
				bot.sendMessage({
					to: channelID,
					message: "If only I had a clone with worse taste than me"
				})
			});
		}
	});
}

function requestNextStep(channelID){
	var url = '/?id=' + auth.id + '&action=next' + '&channel=' + channelID;
	var options = getNetworkOptions(url);
	getNetworkRequest(options, (response) => {
		apiResponse = JSON.parse(response);
		// console.log(apiResponse);
		if (apiResponse.shift()){
			handleConversation(apiResponse, channelID, () => {
				console.log('conversation handled');
			});
		}
	});
}

function handleConversation(response, channelID, callback){
	// console.log(response);
	let type = response.shift();
	if (type == 'text'){
		let lines = response.shift();
		let outText = '';
		while (lines.length > 0){
			outText += lines.shift();
			outText += '\r\n';
		}
		bot.sendMessage({
			to: channelID,
			message: outText
		});
		callback(response, channelID);
	} else if (type == 'menu') { // It's a menu
		console.log('got me a menu');
		let options = response.shift();
		let size = options.length;
		let message = '';
		for (let i = 0; i < size; i++){
			message += '<' + i + '] ' + options[i];
			message += '\r\n';
		}
		spam.push(function(){
			bot.sendMessage({
				to: channelID,
				message: message
			}, (err, res)=>{
				console.log(err);
				for (let i = 0; i < size; i++){
					spam.push(function(){
						bot.addReaction({
							channelID: channelID, 
							messageID: res.id, 
							reaction: emotes[i]
						}, (err, res)=>{
							// console.log(err);
							// console.log(res);
						});
					});
				}
				let waiter = setInterval(() => {
					if (spam.length == 0){
						clearInterval(waiter);
					}
				}, 50);
				setTimeout(function() {
					bot.getMessage({
						channelID: channelID, 
						messageID: res.id
					}, (err, res)=>{
						let reactions = res.reactions;
						// console.log(reactions);
						let length = reactions.length;
						// console.log(length);
						let biggest = reactions[0];
						let biggestindex = 0;
						for (let i = 0; i < length; i++){
							if (biggest.count < reactions[i].count){
								biggest = reactions[i];
								biggestindex = i;
							}
						}
						var url = '/?id=' + auth.id + '&action=menu&menu=' + biggestindex + '&channel=' + channelID;
						let options = getNetworkOptions(url);
						getNetworkRequest(options, (response)=>{
							let menuResponse = JSON.parse(response);
							if (menuResponse.shift()){
								handleConversation(menuResponse, channelID, () => {
									requestNextStep(channelID);
								});
							}
						});
					});
				}, 20000);
			})
		});
		callback([], channelID);
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
		spam.push(function(){
			bot.sendMessage({
				to: channelID,
				message: 'Something went wrong...'
			})
		});
    }
});

bot.on('disconnect', (error, code)=>{
	bot.connect();
});

main();
