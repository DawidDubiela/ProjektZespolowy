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

router.get('/kalendarz', authController.isLoggedIn, authController.getConsultations, (req,res) => {
    console.log("TUTAJ", req.consultation)
    if(req.user){
         res.render('kalendarz',{
             user: req.user,
             consultation: JSON.stringify(req.consultation)
         })
    } else{
        res.redirect('/logowanie')
    }   
})



module.exports = router