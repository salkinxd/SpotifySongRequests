var SpotifyWebApi = require('spotify-web-api-node');
var config = require("./config.json");
var tmi = require('tmi.js');
var votes = 0;
var credentials = {
	clientId: config.client_id,
	clientSecret: config.client_secret,
	redirectUri: 'https://salkin.at/callback'
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
		function(data) {
			console.log('The access token has been refreshed!');
	
			// Save the access token so that it's used in future calls
			spotifyApi.setAccessToken(data.body['access_token']);
		},
		function(err) {
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


function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}


// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  // Remove whitespace from chat message
  const args = msg.slice(config.prefix.length).split(' ');
  const command = args.shift().toLowerCase();
  console.log("Command: " + command)
  console.log("Args: " + args)
  // If the command is known, let's execute it
  if (command === 'sr') {
    if (args.length > 0) {
      var arguments = args.join(" ").trim();
      addToPlaylist(arguments);
    } else {
      client.say(config.CHANNEL_NAME, "Mit \"!sr song\" kannst du einen Song anfragen!")
      .then((data) => {
          console.log("Sent Message!");
      }).catch((err) => {
          console.error(err);
      });
    }

  }
  if (command === 'srplaylist') {
    client.say(config.CHANNEL_NAME, "Das ist die Playlist: https://open.spotify.com/playlist/" + config.playlist_id)
    .then((data) => {
        console.log("Sent Message!", data);
    }).catch((err) => {
        console.error(err);
    });
  }
  if (command === "song") {
    nowPlaying();
  }
  if (command === "skip") {
	  console.log(context['mod']);
	  if (context['mod'] || context['display-name'] === "Salkinxd" || context['display-name'] === "SpiceTV") {
		  console.log("User is mod!");
		  skipTrack();
	  } else {
		  console.log("User is not a mod!")
		  client.say(config.CHANNEL_NAME, "Sorry, du bist leider kein Moderator.").then((data) => {console.log("Message sent!", data);}).catch((err) => {console.error(err);});
	  }
    
  }
}

function addToPlaylist(args) {
	spotifyApi.searchTracks(args)
  	.then(function(SearchTrackdata) {
		//client.say(config.CHANNEL_NAME, "Song: " + data.body.tracks.items[0].name + " von " +  data.body.tracks.items[0].artists[0].name + " wurde hinzugefügt!").then((data) => {console.log("Message sent!", data);}).catch((err) => {console.error(err);});
		var trackURI = SearchTrackdata.body.tracks.items[0].uri
		var trackURIshort = SearchTrackdata.body.tracks.items[0].uri.split(":")[2]
		spotifyApi.getPlaylistTracks(config.playlist_id)
		.then(
			function(GetPlaylistdata) {
				//console.log('The playlist contains these tracks', GetPlaylistdata.body.items);
				function checkIfTrackExists(age) { return age.track.id === trackURIshort; }
				if(GetPlaylistdata.body.items.some(checkIfTrackExists)) {
					console.log("Song already exists!");
					client.say(config.CHANNEL_NAME, "Dieser Song existiert bereits auf der Playlist!").then((data) => {console.log("Message sent!", data);}).catch((err) => {console.error(err);});
					return;
				} else {
					console.log("Song doesn't exist!");
					spotifyApi.addTracksToPlaylist(config.playlist_id, [SearchTrackdata.body.tracks.items[0].uri])
					.then(function(addTracksdata) {
						console.log('Added tracks to playlist!');
						client.say(config.CHANNEL_NAME, "Der Song: " + SearchTrackdata.body.tracks.items[0].name + " - " + SearchTrackdata.body.tracks.items[0].artists[0].name + " wurde hinzugefügt!").then((data) => {console.log("Message sent!", data);}).catch((err) => {console.error(err);});
					}, function(err) {
						console.log('Something went wrong when adding songs!', err);
					});
					return;
				}
			},
			function(err) {
				console.log('Something went wrong!', err);
			}
		);
  }, function(err) {
    console.error(err);
  });
}

function nowPlaying() {
	spotifyApi.getMyCurrentPlaybackState({})
	.then(function(data) {
	  // Output items
	  console.log("Now Playing: ",data.body.item.name);
	  client.say(config.CHANNEL_NAME, "Der momentane Song ist: " + data.body.item.name + " von " + data.body.item.artists[0].name).then((data) => {console.log("Message sent!", data);}).catch((err) => {console.error(err);});
	}, function(err) {
	  console.log('Something went wrong!', err);
	});
}
function skipTrack() {
	spotifyApi.skipToNext()
	.then(function(data) {
		console.log("Skipped to next track!", data)
		client.say(config.CHANNEL_NAME, "Der song wurde geskipped!").then((data) => {console.log("Message sent!", data);}).catch((err) => {console.error(err);});
	}, function(err) {
		if (err.statusCode == 404) {
			client.say(config.CHANNEL_NAME, "Es wird keine Musik abgespielt!").then((data) => {console.log("Message sent!", data);}).catch((err) => {console.error(err);});
		}
		console.log('Something went wrong!', err.statusCode);
	})
}

setTimeout(refreshToken,3500000)
