const http = require("http");
const url = require("url");

const { google } = require("googleapis");
const opn = require("opn");
const qs = require("qs");
const fs = require("fs");
const enableDestroy = require("server-destroy");

async function program() {
  const YOUTUBE_OAUTH_SCOPE = "https://www.googleapis.com/auth/youtube";
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${process.env.OAUTH_SERVER_PORT}`
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: YOUTUBE_OAUTH_SCOPE
  });

  const server = http
    .createServer(async (req, res) => {
      try {
        const queryString = qs.parse(url.parse(req.url).query);
        const { tokens } = await oauth2Client.getToken(queryString.code);

        fs.appendFileSync(".env", `\nGOOGLE_OAUTH_TOKENS=${JSON.stringify(tokens)}`);
      } catch (e) {
        console.log(e);
      } finally {
        res.setHeader("Content-Type", "text/html");
        res.end("CLOSE ME", () => server.destroy());
      }
    })
    .listen(process.env.OAUTH_SERVER_PORT);

  enableDestroy(server);

  await opn(authUrl, { wait: false }).then(cp => cp.unref());
}

program().catch(console.error);
