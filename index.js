const { google } = require("googleapis");
const fs = require("fs");
const readline = require('readline');

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) {
    console.error("Error loading client secret file:", err);
    return;
  }
  // Authorize a client with the loaded credentials.
  authorize(JSON.parse(content), listAdvertiserAccounts);
});

function authorize(credentials, callback) {
  console.log(credentials);
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    // redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile("token.json", (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/display-video"],
  });
  console.log("Authorize this app by visiting this URL:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile("token.json", JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listAdvertiserAccounts(auth) {
  const dv360 = google.displayvideo({ version: "v1", auth });
  dv360.advertisers.list(
    {
      // filter: 'partnerId=YOUR_PARTNER_ID', // Replace YOUR_PARTNER_ID with your partner ID
    },
    (err, res) => {
      if (err) {
        console.error("The API returned an error:", err);
        return;
      }
      const advertisers = res.data.advertisers;
      if (advertisers && advertisers.length) {
        console.log("Advertisers:");
        advertisers.forEach((advertiser) => {
          console.log(`${advertiser.displayName} (${advertiser.advertiserId})`);
        });
      } else {
        console.log("No advertisers found.");
      }
    }
  );
}

console.log(listAdvertiserAccounts());
