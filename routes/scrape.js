// require the dependencies
var cheerio = require("cheerio");
var request = require("request");
// require the models
var Note = require("../models/Note.js");
var Article = require("../models/Article.js");
var Save = require("../models/Save");

module.exports = function (app) {
    app.get("/scrape", function (req, res) {
        request("http://www.packers.com/", function (error, response, html) {

            // Load the HTML into cheerio and save it to a variable
            var $ = cheerio.load(html);

            $("div.itm-wrp-2").each(function (i, element) {

                // console.log("******element******* ", element);
                var result = {};

                // console.log("------------------------- Child: " + [i] + " ------------------------------");
                result.title = $(element).children("h3").children("a").attr("title");
                result.summary = $(element).children("p").text();
                linkA = "http://www.packers.com";
                linkB = $(element).children("h3").children("a").attr("href");
                result.link = linkA + linkB;
                // result.byline = $(element).children("p.byline").text();

                // console.log("************* title: ", result.title);
                // console.log("************* summary: ", result.summary);
                // console.log("************* link: ", result.link);
                // console.log("************************ End of Child: " + [i] + " ****************************");


                // Save these results in an object that we'll push into the results array we defined earlier
                if (result.title && result.summary && result.link) {
                    console.log("************************ New Item " + [i] + " ****************************"); 
                    console.log(" RESULT: ", result);

                    var entry = new Article(result);
                    // Now, save that entry to the db
                    Article.update(
                        {link: result.link},
                        result,
                        { upsert: true },
                        function (error, doc){
                            if (error) {
                                console.log(error);
                            }
                        }
                    );
                }
            });
            res.json({"code" : "success"});
            // res.json(true);
        });
    });

    // Get route for  all the articles
    app.get("/articles", function (req, res) {
        Article.find({}, function (error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.send(doc);
            }
        });
    });
    // Get route for  all the articles with the id
    app.get("/articles/:id", function (req, res) {
        Article.find({
                "_id": req.params.id
            })
            .populate("note")
            .exec(function (error, doc) {
                if (error) {
                    console.log(error)
                } else {
                    res.send(doc);
                }
            });
    });

    // get route to return all saved articles
    app.get("/saved/all", function (req, res) {
        Save.find({})
            .populate("note")
            .exec(function (error, data) {
                if (error) {
                    console.log(error);
                    res.json({"code" : "error"});
                } else {
                    res.json(data);
                }
            });
    });

    // post route to save the article
    app.post("/save", function (req, res) {
        var result = {};
        result.id = req.body._id;
        result.summary = req.body.summary;
        result.byline = req.body.byline;
        result.title = req.body.title;
        result.link = req.body.link;
        // Save these results in an object that we'll push into the results array we defined earlier
        var entry = new Save(result);
        // Now, save that entry to the db
        entry.save(function (err, doc) {
            // Log any errors
            if (err) {
                console.log(err);
                res.json(err);
            }
            // Or log the doc
            else {
                res.json(doc);
            }
        });
        //res.json(result);
    });

    // route to delete saved articles
    app.delete("/delete", function (req, res) {
        var result = {};
        result._id = req.body._id;
        Save.findOneAndRemove({
            '_id': req.body._id
        }, function (err, doc) {
            // Log any errors
            if (err) {
                console.log("error:", err);
                res.json(err);
            }
            // Or log the doc
            else {
                res.json(doc);
            }
        });
    });

    app.get("/notes/:id", function (req, res) {
        if(req.params.id) {
            Note.find({
                "article_id": req.params.id
            })
            .exec(function (error, doc) {
                if (error) {
                    console.log(error)
                } else {
                    res.send(doc);
                }
            });
        }
    });


    // Create a new note or replace an existing note
    app.post("/notes", function (req, res) {
        if (req.body) {
            var newNote = new Note(req.body);
            newNote.save(function (error, doc) {
                if (error) {
                    console.log(error);
                } else {
                    res.json(doc);
                }
            });
        } else {
            res.send("Error");
        }
    });
    // find and update the note
    app.get("/notepopulate", function (req, res) {
        Note.find({
            "_id": req.params.id
        }, function (error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.send(doc);
            }
        });
    });

    // delete a note

    app.delete("/deletenote", function (req, res) {
        var result = {};
        result._id = req.body._id;
        Note.findOneAndRemove({
            '_id': req.body._id
        }, function (err, doc) {
            // Log any errors
            if (err) {
                console.log("error:", err);
                res.json(err);
            }
            // Or log the doc
            else {
                res.json(doc);
            }
        });
    });
}