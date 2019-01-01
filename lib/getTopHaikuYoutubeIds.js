const url = require("url");
const got = require("got");
const qs = require("qs");

const WEEKLY_HAIKUS_URL = "https://www.reddit.com/r/youtubehaiku/top/.json?t=week";
const VALID_YOUTUBE_DOMAINS = ["youtube.com", "youtu.be", "m.youtube.com"];

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
    .map(p => ({ title: p.data.title, videoId: extractYoutubeId(p.data.url) }))
    .reverse();
}

module.exports = getTopHaikuYoutubeIds;
