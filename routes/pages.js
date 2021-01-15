const express = require('express')
const authController = require('../controllers/auth')
const router = express.Router()


router.get('/', authController.isLoggedIn, authController.isAdmin, authController.isConsultant, (req, res) => {
    if (req.consultant) {
        res.redirect('/profil')
    }
    else if (req.user) {
        res.redirect('/profil')
    }
    else if (req.admin) {
        res.redirect('/adminpanel');
    }
    else {
        res.redirect('/logowanie');
    }
})

router.get('/rejestracja', (req, res) => {
    res.render('register')
})

router.get('/admin', (req, res) => {
    res.render('adminlog')
})

router.get('/logowanie', (req, res) => {
    res.render('login')
})

router.get('/profil',  authController.isLoggedIn, authController.getConsUser, authController.isConsultant, (req, res) => {
    if (req.consultant) {
        res.render('profile', {
            consultant: req.consultant,
            consultantprimo: req.consultant[0],
            consultation: req.consultation
        })
    }
    else if (req.user) {
        res.render('profile', {
            user: req.user,
            consultation: req.consultation
        })
    }
    else if (req.admin) {
        res.render('adminpanel', {
            admin: req.admin
        })
    }
    else {
        res.redirect('/logowanie')
    }
})

router.get('/adminpanel', authController.isAdmin, (req, res) => {
    if (req.admin) {
        res.render('adminpanel', {
            admin: req.admin
        })
    } else {
        res.redirect('/admin')
    }
})


router.get('/kalendarz', authController.isLoggedIn, authController.getConsUser, authController.getConsultations, (req, res) => {
    if (req.user) {
        res.render('kalendarz', {
            user: JSON.stringify(req.user),
            consultation: JSON.stringify(req.consultation)
        })
    } else {
        res.redirect('/logowanie')
    }
})

router.get('/addConsultant', (req, res) => {
    res.render('addConsultant')
})

router.get('/addConsultation', authController.getConsultants, (req, res) => {
    res.render('addConsultation',{
        consultants: req.body.consultants
    })
})



module.exports = router