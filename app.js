const {client_secret, client_id, refresh_token, playlist_id, prefix} = require('./config.json');
var request = require('request'); // "Request" library
//var trackURI = "spotify:track:7d8GetOsjbxYnlo6Y9e5Kw";
var channel = "salkinxd";
var botUsername = "deepshit";




const { ChatClient } = require("dank-twitch-irc");
 
let client = new ChatClient();
 
client.on("ready", () => console.log("Successfully connected to chat"));
client.on("close", error => {
  if (error != null) {
    console.error("Client closed due to error", error);
  }
});
 
client.on("message", msg => {
  
  if (msg.senderUsername != botUsername && msg.messageText != undefined) {
    console.log(msg.messageText + " | " + msg.senderUsername);
    const args = msg.messageText.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    if (command == "sr") {
      console.log(args);
      addToPlaylist(args);
    }
  }
}); 
client.connect();
client.join(channel);


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
      args = encodeURIComponent(args.join(" ").trim());
      var findSongOptions = {
        url: "https://api.spotify.com/v1/search?q=" + args + "&type=track&limit=1",
        headers: { 'Authorization': 'Bearer ' + access_token}
      }
      request.get(findSongOptions, function(error, response, body) {
        if (!error) {
          var trackURI = JSON.parse(body).tracks.items[0].uri
          requestURL = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks?position=0&uris=" + trackURI;
          var addTrackOptions = {
            url: requestURL,
            headers: { 'Authorization': 'Bearer ' + access_token}
          };
          request.post(addTrackOptions, function(error, response, body) {
            console.log(body);
          })
        } else {
          console.log(error);
        }
      });
    }
  });
}