const { google } = require("googleapis");
const formatDate = require("date-fns/format");

function getYoutubeClient() {
  const authTokens = JSON.parse(process.env.GOOGLE_OAUTH_TOKENS);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${process.env.OAUTH_SERVER_PORT}`
  );
  oauth2Client.credentials = authTokens;
  google.options({ auth: oauth2Client });

  return google.youtube("v3");
}

const noop = () => {};
async function createYoutubePlaylist(haikuYoutubeVideos, progressCb = noop) {
  const youtube = getYoutubeClient();

  const playlistTitle = `Top Haikus of the week [${formatDate(new Date(), "YYYY-MM-DD")}]`;
  progressCb("Creating youtube playlist...");
  const playlistCreationResponse = await youtube.playlists.insert({
    requestBody: {
      snippet: { title: playlistTitle },
      status: { privacyStatus: "private" }
    },
    part: "snippet,status"
  });
  const playlistId = playlistCreationResponse.data.id;

  for (let { videoId, title } of haikuYoutubeVideos) {
    progressCb(`Adding  [${videoId}] "${title}" to youtube playlist...`);

    try {
      await youtube.playlistItems.insert({
        part: "snippet",
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId
            }
          }
        }
      });
    } catch (e) {
      if (e.response.status === 403) continue;
    }
  }
}

module.exports = createYoutubePlaylist;
