require("dotenv").config();
var keys = require("./keys");
var request = require('request');
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');
var fs = require("fs");
var firstRun = require('first-run');
var chalk = require('chalk');
var inquirer = require('inquirer');
var command;
var args;


function init() {
  if(firstRun()) {
    console.log('\033c'); 
    console.log(chalk.cyan.bgWhite("  _     _   ____  _  "));
    console.log(chalk.green.bgWhite(" | |   (_) |  __|(_) "));
    console.log(chalk.yellow.bgWhite(" | |   | | | |   | | "));
    console.log(chalk.magenta.bgWhite(" | |__ | | | |   | | "));
    console.log(chalk.red.bgWhite(" |____||_| |_|   |_| "));
    console.log(chalk.red.bgWhite("                     "));
    console.log(chalk.green.bgWhite("Hey, I'm Liri! What can I help you with?"));
    console.log(chalk.gray("───────────────────────────────────────────"));
  }
  inquirer.prompt([
    {
      "name": 'commandChoice',
      "message": chalk.cyan('Some things you can ask me: '),
      "type": 'list',
      "choices": ['liri-home','my-tweets', 'spotify-this-song', 'movie-this', 'do-what-it-says', 'exit-liri'],
    },
    {
      type: 'input',
      name: 'arg',
      message: "What's the name of the song?",
      when: function (answers) {
        return answers.commandChoice==="spotify-this-song";
      }
    },
    {
      type: 'input',
      name: 'arg',
      message: "What's the name of the movie?",
      when: function (answers) {
        return answers.commandChoice==="movie-this";
      }
    }
  ])
  .then(function(answers){
    command = answers.commandChoice;
    console.log(command);
    args = answers.arg;
    option(answers.commandChoice, answers.arg);
  });
}


function option(command, args) {
  switch (command) {
    case "my-tweets":
      myTweets();
      break;
    case "spotify-this-song":
      spotifySong(args);
      break;
    case "movie-this":
      findMovie(args);
      break;
    case "do-what-it-says":
      doIt();
      break;
    case "liri-home":
      liriHome();
      break;
    case "exit-liri":
      endProgram();
      break;
    default:
      console.log("Sorry, I don't understand what you just said.");
      init();
  }
}

function titleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function myTweets() {
  var output = "";
  var client = new Twitter(keys.twitter);
  client.get('statuses/user_timeline', function(error, tweets, response) {
    if (error) throw error;
    for (var i = 0; i < tweets.length; i++) {
      output += chalk.black("───────────────────────────────────────────\n");
      output += chalk.blue(tweets[i].created_at) + "\n";
      output += chalk.blue(tweets[i].text) + "\n";
    }
    output += "───────────────────────────────────────────\n";
    logIt(output);
    console.log(output);
    init();
  });
}

function spotifySong(song) {
  if(song=="") {
    song = "The Sign Ace of Base";
  }
  var output = "";
  var spotify = new Spotify(keys.spotify);
  spotify
    .search({
      type: 'track',
      query: song
    })
    .then(function(response) {
      var songInfo = response.tracks.items[0];
      if (songInfo) {
        output += "───────────────────────────────────────────\n";
        output += chalk.green("ARTIST: " + songInfo.artists[0].name+"\n");
        output += chalk.green("SONG:   \"" + titleCase(song).trim() + "\"\n");
        output += chalk.green("LINK:   " + songInfo.href+"\n");
        output += chalk.green("ALBUM:  " + songInfo.album.name+"\n");
      } else {
        output += chalk.green("Sorry, I couldn't find that song.\n");
      }
      output += "───────────────────────────────────────────\n";
      logIt(output);
      console.log(output);
      init();
    })
    .catch(function(err) {
      console.log(err);
      init();
    });
}

function findMovie(title) {
  var output = "";
  if (title == "") {
    title = "mr nobody";
  }
  var queryUrl = "http://www.omdbapi.com/?t=" + title + "&y=&plot=short&apikey=trilogy";

  request(queryUrl, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var content = JSON.parse(body);
      if (content.Title === undefined) {
        output += "\n───────────────────────────────────────────\n";
        output += chalk.yellow("Sorry, I couldn't find that movie. \n");
      } else {
        output += "───────────────────────────────────────────\n";
        output += chalk.yellow("TITLE:           " + content.Title + "\n");
        output += chalk.yellow("YEAR:            " + content.Year + "\n");
        output += chalk.yellow("IMDB Rating:     " + content.Ratings[0].Value + "\n");
        output += chalk.yellow("Rotten Tomatoes: " + content.Ratings[1].Value + "\n");
        output += chalk.yellow("Country:         " + content.Country + "\n");
        output += chalk.yellow("Language:        " + content.Language + "\n");
        output += chalk.yellow("Plot:            " + content.Plot + "\n");
        output += chalk.yellow("Actors:          " + content.Actors + "\n");
      }
    } else {
      output += error;
      init();
    }
    output += "\n───────────────────────────────────────────\n";
    logIt(output);
    console.log(output);
    init();
  });

}

function doIt() {
  fs.readFile("random.txt", "utf8", function(error, data) {
    if (error) {
      return console.log(error);
    }
    var dataArr = data.split(",");
    command = dataArr[0];
    args = dataArr[1];
    option(command, args);
  });
}

function logIt(output) {
  var sep = "═══════════════════════════════════════════\n";
  var argsText = "";
  if(args) {
    argsText = "Argument: "+args+"\n";
  }
  output = sep + "\n" + Date() + "\nCommand: "+command+"\n"+argsText+output;
  fs.appendFile("log.txt", output, function(err) {
    if (err) {
      return console.log(err);
    }
  });
}

function liriHome() {
  fs.writeFile("log.txt", "", function(err) {
    if (err) {
      return console.log(err);
    }
    init();
  });

  firstRun.clear();
}

function endProgram() {
  return;
}

init();
