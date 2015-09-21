module.exports = {

    re: [
        /https?:\/\/twitter\.com\/(\w+)\/status(?:es)?\/(\w+)/i,
        /https?:\/\/pic.twitter\.com\//i
        ],

    mixins: [
        "canonical",
        "favicon"
    ],

    provides: 'twitter_oembed',

    getData: function(meta, request, options, cb) {
        var m = meta.canonical.split(/(\d+)$/);
        if (!m) {
            return cb();
        }
        var id = m[1];

        var c = options.getProviderOptions("twitter") || options.getProviderOptions("twitter.status");
        var url = "https://api.twitter.com/1.1/statuses/oembed.json";
        var qs = {
            id: id,
            hide_media: c.hide_media,
            hide_thread: c.hide_thread,
            omit_script: c.omit_script
        };

        var oauth = {
            consumer_key: c.consumer_key,
            consumer_secret: c.consumer_secret,
            token: c.access_token,
            token_secret: c.access_token_secret
        };

        // TODO: cache!
        request({url: url, qs: qs, oauth: oauth}, function(error, response, data) {
            if (error) {
                return cb(error);
            }

            if (response.statusCode !== 200) {
                return cb('Non-200 response from Twitter API');
            }

            var oembed = JSON.parse(data);

            oembed.title = meta['html-title'].replace(/on Twitter:.*?$/, "on Twitter");

            oembed["min-width"] = c["min-width"];
            oembed["max-width"] = c["max-width"];

            cb(null, {
                twitter_oembed: oembed
            });
        });
    },

    getMeta: function(twitter_oembed) {
        return {
            title: twitter_oembed.title,
            author: twitter_oembed.author_name,
            author_url: twitter_oembed.author_url,
            site: twitter_oembed.site_name || twitter_oembed.provider_name,
            description: twitter_oembed.html.replace(/<(.*?)>/g, '')
        };
    },

    getLink: function(urlMatch, og, twitter_oembed, options) {

        var html = twitter_oembed.html;

        if (options.getProviderOptions('twitter.center', true)) {
            html = html.replace('<blockquote class="twitter-tweet"', '<blockquote class="twitter-tweet" align="center"');
        }

        var show_video = urlMatch[1] === 'video' && options.getProviderOptions('twitter.media_only');

        var links = [];

        if (show_video) {

            html = html.replace(/class="twitter-tweet"/g, 'class="twitter-video"');
            links.push({
                html: html,
                type: CONFIG.T.text_html,
                rel: [CONFIG.R.oembed, CONFIG.R.player, CONFIG.R.inline, CONFIG.R.ssl],
                "min-width": twitter_oembed["min-width"],
                "max-width": twitter_oembed["max-width"]
            });

        } else {

            links.push({
                html: html,
                type: CONFIG.T.text_html,
                rel: [CONFIG.R.oembed, CONFIG.R.app, CONFIG.R.inline, CONFIG.R.ssl],
                "min-width": twitter_oembed["min-width"],
                "max-width": twitter_oembed["max-width"]
            });
        }

        if (og.image && og.image.user_generated) {
            links.push({
                href: og.image.url,
                type: CONFIG.T.image,
                rel: [CONFIG.R.image]
            });
        }

        return links;
    },

    tests: [
        "https://twitter.com/TSwiftOnTour/status/343846711346737153",

        "https://twitter.com/Tackk/status/610432299486814208/video/1",
        "https://twitter.com/BarstoolSam/status/602688682739507200/video/1",
        "https://twitter.com/RockoPeppe/status/582323285825736704?lang=en"  // og-image
    ]
};