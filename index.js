const url = require("url");

const ora = require("ora");
const got = require("got");
const qs = require("qs");
const formatDate = require("date-fns/format");
const { google } = require("googleapis");

const WEEKLY_HAIKUS_URL = "https://www.reddit.com/r/youtubehaiku/top/.json?t=week";

const VALID_YOUTUBE_DOMAINS = ["youtube.com", "youtu.be", "m.youtube.com"];

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

function extractYoutubeId(youtubeUrl) {
  const { pathname, query } = url.parse(youtubeUrl);
  const parsedQuery = qs.parse(query);
  return parsedQuery.v ? parsedQuery.v : pathname.match(/.*\/([\w-]+)$/)[1];
}

async function getTopHaikuYoutubeIds() {
  const response = await got(WEEKLY_HAIKUS_URL, { json: true });

  if (!response.body) {
    throw new Error("Failed to fetch haikus");
  }

  return response.body.data.children
    .filter(post => VALID_YOUTUBE_DOMAINS.includes(post.data.domain))
    .map(p => extractYoutubeId(p.data.url))
    .reverse();
}

async function program() {
  const spinner = ora().start();

  try {
    const youtube = getYoutubeClient();

    spinner.text = "Loading haikus...";

    const haikuYoutubeIds = await getTopHaikuYoutubeIds();

    spinner.text = "Creating youtube playlist...";

    const playlistTitle = `Top Haikus of the week [${formatDate(new Date(), "YYYY-MM-DD")}]`;
    const playlistCreationResponse = await youtube.playlists.insert({
      requestBody: {
        snippet: { title: playlistTitle },
        status: { privacyStatus: "private" }
      },
      part: "snippet,status"
    });

    const playlistId = playlistCreationResponse.data.id;
    for (let videoId of haikuYoutubeIds) {
      spinner.text = `Adding "${videoId}" to youtube playlist...`;

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
    }

    spinner.succeed("Done !");
  } catch (e) {
    spinner.fail("Oh noes...");
    const message = e.errors ? e.errors[0].message : e;
    console.error(message);
  }
}

program();
