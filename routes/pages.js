const express = require('express')

const router = express.Router()

router.get('/', (req, res) => {
    res.render('index');
})

router.get('/rejestracja', (req, res) => {
    res.render('register');
})

router.get('/logowanie', (req, res) => {
    res.render('login');
})




module.exports = router