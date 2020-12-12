const mysql = require("mysql")
const express = require("express")
const bodyParser = require("body-parser")
const encoder = bodyParser.urlencoded()

const app = express()
app.use(express.static("public"))
app.use(express.json())

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Maciej12',
  database: 'project'
})


//laczymy sie z baza danych
connection.connect(function (error) {
  if (error) throw error
  else console.log("Connected to the database sucessfully!")
})

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html")
})

app.post("/", encoder, function (req, res) {
  var username = req.body.username
  var password = req.body.password


  connection.query("select * from users where email = ? and password = ? ", [username, password],
    function (error, results, fields) {
      console.log(error)
      console.log(results)
      console.log(fields)
      if (results.length > 0) {
        res.sendFile(__dirname + "/kalendarz.html")
      }
      else {
        res.redirect("/")
      }
    })

})



//ustawiamy port
app.listen(3000)


