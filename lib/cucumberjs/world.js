/*!
 * Cuked World
 */

var wd = require('webdriverio'),
    fs = require('fs'),
    chai = require('chai'),
    path = require('path'),
    chaiAsPromised = require('chai-as-promised'),
    SauceLabs = require('saucelabs'),
    DDPClient = require("ddp");

// setup assertions
chai.use(chaiAsPromised);
chai.should();

module.exports = function() {
  global.client = wd.remote({
    desiredCapabilities: {
      browserName: process.env['cuked.browser'],
      platform: process.env['cuked.platform'],
      name: process.env['cuked.name']
    },
    user: process.env['cuked.user'] || process.env.SAUCE_USERNAME,
    key: process.env['cuked.key'] || process.env.SAUCE_ACCESS_KEY,
    host: process.env['cuked.host'],
    port: process.env['cuked.port'],
    logLevel: process.env['cuked.log']
  });

  global.ddp = new DDPClient({
    host : process.env['cuked.ddp_host'],
    port : process.env['cuked.ddp_port'],
    ssl  : false,
    autoReconnect : true,
    autoReconnectTimer : 500,
    maintainCollections : true,
    ddpVersion : '1',
    useSockJs: true
    //path: "websocket"
  });

  // setup promises
  chaiAsPromised.transferPromiseness = global.client.transferPromiseness;

  // initialize webdriver session
  global.client.init(function() {
    var sessionID = this.requestHandler.sessionID;

    // global timeout
    this.timeoutsAsyncScript(10000);

    // helper method for sending test results to SauceLabs
    global.client.addCommand('sauceJobStatus', function(status, done) {
      var sauceAccount = new SauceLabs({
        username: process.env['cuked.user'] || process.env.SAUCE_USERNAME,
        password: process.env['cuked.key'] || process.env.SAUCE_ACCESS_KEY
      });

      sauceAccount.updateJob(sessionID, status, done);
    });

    // load cuked webdriver configuration
    var configPath = path.resolve(process.cwd(), process.env['cuked.path'], 'cuked.js');
    if (fs.existsSync(configPath)) {
      global.client = require(configPath)(this);
    }
  });

  // Cucumber World Object
  this.World = function World(callback) {
    this.client = global.client;
    this.ddp = global.ddp;

    callback();

    return this;
  };
};
