const http = require("http");
const enableDestroy = require("server-destroy");

const getTopHaikuYoutubeIds = require("../lib/getTopHaikuYoutubeIds");
const createYoutubePlaylist = require("../lib/createYoutubePlaylist");

async function createPlaylist() {
  const haikuYoutubeVideos = await getTopHaikuYoutubeIds();
  await createYoutubePlaylist(haikuYoutubeVideos);
}

const server = http
  .createServer((_req, res) => {
    createPlaylist().then(() => server.destroy());
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end();
  })
  .listen(process.env.PORT || 3000);

enableDestroy(server);
