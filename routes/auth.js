const express = require('express')
const authController = require('../controllers/auth')

const router = express.Router()

router.post('/rejestracja', authController.register)

router.post('/logowanie', authController.login)

router.get('/wyloguj', authController.logout)

router.post('/admin', authController.adminLog)

router.post('/kolejka', authController.isLoggedIn, authController.addToQueue)

router.post('/addConsultant', authController.registerConsultant)

router.post('/addConsultation', authController.registerConsultation)

router.delete('/dfq', authController.isConsultant, authController.dfq)

router.delete('/dropFromQue', authController.isLoggedIn, authController.dropFromQue)



module.exports = router