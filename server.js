
// required files and packages
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var request = require("request");
var mongoose = require("mongoose");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var Save = require("./models/Save.js");
var logger = require("morgan");
var cheerio = require("cheerio");
var path = require("path");
var app = express();
var PORT = process.env.PORT || 8000;

// Parse application/x-www-form-urlencoded
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("./public"));

// database config
mongoose.Promise = Promise;
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var dbConnect = process.env.MONGODB_URI || "mongodb://localhost/mongoScraper";
if(process.env.MONGODB_URI) {
	// Connect to the Mongo DB
    mongoose.connect(process.env.MONGODB_URI)
} else {
	// Connect to the Mongo DB
    mongoose.connect(dbConnect);
}


// mongoose to db connection 
var db = mongoose.connection;
db.on('error',function(err){
    console.log('Mongoose Error',err);
});
db.once('open', function(){
    console.log("Mongoose connection successful");
});

// configure handlebars
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");
// get index.html file for home view to display on /
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

require("./routes/scrape")(app);
require("./routes/html.js")(app);

app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

// set up server on specified port
app.listen(PORT, function () {
    console.log("App listening on PORT " + PORT);
});