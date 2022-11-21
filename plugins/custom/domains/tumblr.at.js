export default {
  re: [
    /^https?:\/\/(at\.tumblr\.com)\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)/i,
    /^https?:\/\/(tumblr\.app\.link)\/([a-z0-9-]+)/i,
  ],
  getData: function (cheerio, cb) {
    const links = cheerio("a");
    for (let i = 0; i < links.length; i++) {
      const linkUrl = new URL(links[i].attribs.href);
      if (linkUrl.hostname.includes(".tumblr.com")) {
        return cb({ redirect: linkUrl.href });
      }
    }
    return null;
  },
};
