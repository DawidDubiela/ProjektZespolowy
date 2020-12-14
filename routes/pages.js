const express = require('express')
const authController = require('../controllers/auth')
const router = express.Router()


router.get('/', authController.isLoggedIn, (req, res) => {
    if(req.user){
        res.render('profile',{
            user: req.user
        })
    }else{
        res.render('login')
    }
    
})

router.get('/rejestracja', (req, res) => {
    res.render('register')
})

router.get('/logowanie', (req, res) => {
    res.render('login')
})

router.get('/profil', authController.isLoggedIn, (req,res) => {
    if(req.user){
         res.render('profile',{
             user: req.user
         })
    } else{
        res.redirect('/logowanie')
    }   
})

router.get('/kalendarz', (req, res) => {
    res.render('kalendarz')
})


module.exports = router