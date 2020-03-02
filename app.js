const {client_secret, client_id, refresh_token, playlist_id, prefix, BOT_USERNAME, OAUTH_TOKEN, CHANNEL_NAME} = require('./config.json');
var request = require('request'); // "Request" library
var tmi = require('tmi.js');
const opts = {
  identity: {
    username: BOT_USERNAME,
    password: OAUTH_TOKEN
  },
  channels: [
    CHANNEL_NAME
  ]
};

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
  console.log(msg);
  // Remove whitespace from chat message
  const args = msg.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();
  console.log(command)
  console.log(args)
  // If the command is known, let's execute it
  if (command === 'sr') {
    var arguments = args.join(" ").trim();
    addToPlaylist(arguments);
  }
  if (command === 'srplaylist') {
    client.say(CHANNEL_NAME, "This is the playlist: https://open.spotify.com/playlist/" + playlist_id)
    .then((data) => {
        console.log("Sent Message!");
    }).catch((err) => {
        console.error(err);
    });
  }
}

function addToPlaylist(args) {
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };
  
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token;
    console.log(response.statusCode);
    console.log(response.statusMessage);
    if (!error && response.statusCode === 200) {
      
      var findSongOptions = {
        url: "https://api.spotify.com/v1/search?q=" + encodeURIComponent(args) + "&type=track&limit=1",
        headers: { 'Authorization': 'Bearer ' + access_token}
      }
      request.get(findSongOptions, function(error, response, findSongBody) {
        if (!error) {
          console.log(JSON.parse(findSongBody).tracks.items[0])
          var trackURI = JSON.parse(findSongBody).tracks.items[0].uri
          requestURL = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks?position=0&uris=" + trackURI;
          var addTrackOptions = {
            url: requestURL,
            headers: { 'Authorization': 'Bearer ' + access_token}
          };
          request.post(addTrackOptions, function(error, response, body) {
            console.log(body);
            client.say(CHANNEL_NAME, "Added '" + JSON.parse(findSongBody).tracks.items[0].name + " - " + JSON.parse(findSongBody).tracks.items[0].artists[0].name + "' to the Playlist!")
            .then((data) => {
                console.log("Sent Message!");
            }).catch((err) => {
                console.error(err);
            });
          })
        } else {
          console.log(error);
        }
      });
    }
  });
}