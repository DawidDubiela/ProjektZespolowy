const express = require("express")
const path = require("path")
const mysql = require("mysql")
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser")

dotenv.config({ path: './.env'})

const app = express()

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
})

const publicDirectory = path.join(__dirname, './public')
app.use(express.static(publicDirectory))

//parses url-encoded bodies
app.use(express.urlencoded({ extended: false }))
//parses json bodies
app.use(express.json())
app.use(cookieParser())

app.set('view engine', 'hbs')

//laczymy sie z baza danych
db.connect( (error) => {
  if (error){
    console.log(error)
  } else{
     console.log("Connected to the database sucessfully!")
  }
})

//Define routes
app.use('/', require('./routes/pages'))
app.use('/auth', require('./routes/auth'))

//ustawiamy port
app.listen(3000, () =>{
  console.log("Server running on port 3000")
})


