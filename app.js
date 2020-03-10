var SpotifyWebApi = require('spotify-web-api-node');
var config = require("./config.json");
var tmi = require('tmi.js');
var credentials = {
	clientId: config.client_id,
	clientSecret: config.client_secret,
	redirectUri: config.redirect_uri
};

const opts = {
	identity: {
		username: config.BOT_USERNAME,
		password: config.OAUTH_TOKEN
	},
	channels: [
		config.CHANNEL_NAME
	]
};

var spotifyApi = new SpotifyWebApi(credentials);


spotifyApi.setRefreshToken(config.refresh_token);

function refreshToken() {
	spotifyApi.refreshAccessToken().then(
		function (data) {
			console.log('The access token has been refreshed!');

			// Save the access token so that it's used in future calls
			spotifyApi.setAccessToken(data.body['access_token']);
		},
		function (err) {
			console.log('Could not refresh access token', err);
		}
	);
}
refreshToken();
// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Connected Message
function onConnectedHandler(addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}


// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
	if (self) { return; } // Ignore messages from the bot
	// Remove whitespace from chat message
	const args = msg.slice(config.prefix.length).split(' ');
	const command = args.shift().toLowerCase();
	console.log("Command: " + command) //Writes command in console
	console.log("Args: " + args) //Writes arguments in console
	// If the command is known, let's execute it
	if (command === 'sr') {
		if (args.length > 0) {
			//If there is a song name behind the command -> add to playlist
			var arguments = args.join(" ").trim();
			addToPlaylist(arguments);
		} else {
			//If there are no words after command -> Say in chat how to add songs
			client.say(config.CHANNEL_NAME, "Mit \"!sr song\" kannst du einen Song anfragen!")
				.then((data) => {
					console.log("Sent Message!");
				}).catch((err) => {
					console.error(err);
				});
		}

	}
	//!srplaylist Command
	if (command === 'srplaylist') {
		//Message the playlist url
		client.say(config.CHANNEL_NAME, "Das ist die Playlist: https://open.spotify.com/playlist/" + config.playlist_id)
			.then((data) => {
				console.log("Sent Message!", data);
			}).catch((err) => {
				console.error(err);
			});
	}
	//!song command
	if (command === "song") {
		//Check for currently  playing song
		nowPlaying();
	}
	//!skip command
	if (command === "skip") {
		//Check for mod and usernames
		if (context['mod'] || context['display-name'] === "Salkinxd" || context['display-name'] === "SpiceTV") {
			console.log("User is a mod!");
			//Skips track if user is a mod
			skipTrack();
		} else {
			//Doesn't skip track if user is not a mod
			console.log("User is not a mod!");
			//Say in chat that they are not a moderator
			client.say(config.CHANNEL_NAME, "Sorry, du bist leider kein Moderator.").then((data) => {
				console.log("Message sent!", data);
			}).catch((err) => {
				console.error(err);
			});
		}
	}
}

//Add to playlist function
function addToPlaylist(args) {
	//Search for track
	spotifyApi.searchTracks(args)
		.then(function (SearchTrackdata) {
			var trackURIshort = SearchTrackdata.body.tracks.items[0].uri.split(":")[2]
			spotifyApi.getPlaylistTracks(config.playlist_id)
				.then(
					function (GetPlaylistdata) {
						//console.log('The playlist contains these tracks', GetPlaylistdata.body.items);
						function checkIfTrackExists(age) {
							return age.track.id === trackURIshort;
						}
						//Check if track exists in result from search
						if (GetPlaylistdata.body.items.some(checkIfTrackExists)) {
							console.log("Song already exists!");
							//Say in chat that song already exists
							client.say(config.CHANNEL_NAME, "Dieser Song existiert bereits auf der Playlist!").then((data) => {
								console.log("Message sent!", data);
							}).catch((err) => {
								console.error(err);
							});
							return;
						} else {
							console.log("Song doesn't exist!");
							spotifyApi.addTracksToPlaylist(config.playlist_id, [SearchTrackdata.body.tracks.items[0].uri])
								.then(function (addTracksdata) {
									console.log('Added tracks to playlist!');
									//Say in chat that song was added to playlist
									client.say(config.CHANNEL_NAME, "Der Song: " + SearchTrackdata.body.tracks.items[0].name + " - " + SearchTrackdata.body.tracks.items[0].artists[0].name + " wurde hinzugefügt!").then((data) => {
										console.log("Message sent!", data);
									}).catch((err) => {
										console.error(err);
									});
								}, function (err) {
									console.log('Something went wrong when adding songs!', err);
								});
							return;
						}
					},
					function (err) {
						console.log('Something went wrong!', err);
					}
				);
		}, function (err) {
			console.error(err);
		});
}

//Get song Function
function nowPlaying() {
	spotifyApi.getMyCurrentPlaybackState()
		.then(function (data) {
			// Output items
			console.log("Now Playing: ", data.body.item.name);
			//Say in chat what the current song is
			client.say(config.CHANNEL_NAME, "Der momentane Song ist: " + data.body.item.name + " von " + data.body.item.artists[0].name).then((data) => {
				console.log("Message sent!", data);
			}).catch((err) => {
				console.error(err);
			});
		}, function (err) {
			console.log('Something went wrong!', err);
		});
}

//Skip song Function
function skipTrack() {
	spotifyApi.skipToNext()
		.then(function (data) {
			console.log("Skipped to next track!", data)
			//Say in chat that current song was skipped
			client.say(config.CHANNEL_NAME, "Der song wurde geskipped!").then((data) => {
				console.log("Message sent!", data);
			}).catch((err) => {
				console.error(err);
			});
		}, function (err) {
			if (err.statusCode == 404) {
				//If no music is playing, say in chat that no music is playing
				client.say(config.CHANNEL_NAME, "Es wird keine Musik abgespielt!").then((data) => {
					console.log("Message sent!", data);
				}).catch((err) => {
					console.error(err);
				});
			}
			console.log('Something went wrong!', err.statusCode);
		})
}

setTimeout(refreshToken, 3500000)