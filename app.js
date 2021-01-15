const express = require("express")
const path = require("path")
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser")
const Swal = require('sweetalert2')
const hbs = require('hbs')
const cors = require('cors')


const app = express()
dotenv.config({ path: './.env' })

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 
}

app.use(cors(corsOptions));

const publicDirectory = path.join(__dirname, './public')
app.use(express.static(publicDirectory))

//parses url-encoded bodies
app.use(express.urlencoded({ extended: false }))
//parses json bodies
app.use(express.json())
app.use(cookieParser())



app.set('view engine', 'hbs')
hbs.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
})

//Define routes
app.use('/', require('./routes/pages'))
app.use('/auth', require('./routes/auth'))

//ustawiamy port
app.listen(3000);


