const ora = require("ora");

const getTopHaikuYoutubeIds = require("../lib/getTopHaikuYoutubeIds");
const createYoutubePlaylist = require("../lib/createYoutubePlaylist");

async function program() {
  const spinner = ora().start();
  const spinnerProgressCb = message => (spinner.text = message);

  try {
    spinner.text = "Loading haikus...";

    const haikuYoutubeVideos = await getTopHaikuYoutubeIds();

    await createYoutubePlaylist(haikuYoutubeVideos, spinnerProgressCb);

    spinner.succeed("Done !");
  } catch (e) {
    spinner.fail("Oh noes...");
    const message = e.errors ? e.errors[0].message : e;
    console.error(message);
  }
}

program();
