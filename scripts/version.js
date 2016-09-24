var version = require('../package.json').version;
var replace = require('replace');

replace({
    regex: "#VERSION#",
    replacement: version,
    paths: ['comic-scraper.user.js'],
});
