/*
  app.js -- This creates an Express 
*/

// *********************************************************** //
//  Loading packages to support the server
// *********************************************************** //
// First we load in all of the packages we need for the server...
const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
const debug = require("debug")("personalapp:server"); 
const layouts = require("express-ejs-layouts");
const axios = require("axios")

// *********************************************************** //
//  Loading models
// *********************************************************** //
const ToDoItem = require("./models/ToDoItem")
const Schedule = require('./models/Schedule')

const Book = require('./models/Book')

// *********************************************************** //
//  Loading JSON datasets
// *********************************************************** //
const books = require('./public/data/books.json')



// *********************************************************** //
//  Connecting to the database
// *********************************************************** //

const mongoose = require( 'mongoose' );
const mongodb_URI = 'mongodb+srv://Isaac:compass@goldingscpa02-cluster.12muj.mongodb.net/test'

mongoose.connect( mongodb_URI, { useNewUrlParser: true, useUnifiedTopology: true } );
// fix deprecation warnings
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});





// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: "zzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
    resave: false,
    saveUninitialized: false
  })
);

// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //



// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res, next) => {
  res.render("index");
});







// /* ************************
//   Loading (or reloading) the data into a collection
//    ************************ */

app.get('/upsertDB',
  async (req,res,next) => {

    for (b of books){
      const {_id, title, publishedDate}=b;

      date = "0000-00-00T00:00:00.000-0000"
      if (typeof publishedDate !== "undefined"){
      date = publishedDate.$date;
      b.publishedDate = date;
      }


      await Book.findOneAndUpdate({_id, title},b,{upsert:true})
    }
    const num = await Book.find({}).count();
    res.send("data uploaded: "+num)
  }
)


app.post('/books/byTitle',
  // show list of courses in a given subject
  async (req,res,next) => {
    const {title} = req.body;
    const book = await Book.findOne({title:title})
    
    res.locals.book = book
    console.log(book)

    res.render('bookList')
  }
)

app.get('/books/show/:bookID',
  // show all info about a course given its courseid
  async (req,res,next) => {
    const {bookID} = req.params;
    const book = await Book.findOne({_id:bookID})
    res.locals.book = book


    res.render('book')
  }
)

app.post('/books/byCategory',
  // show courses taught by a faculty send from a form
  async (req,res,next) => {
    const category = req.body.category;
    const books = 
       await Book
                 .find({categories:category})
    res.locals.books = books
    res.render('bookListCat')
  }
)



// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
// notice that the function has four parameters which is how Express indicates it is an error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = "5000";
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
