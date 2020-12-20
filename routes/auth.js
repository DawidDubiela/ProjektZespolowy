const express = require('express')
const authController = require('../controllers/auth')

const router = express.Router()

router.post('/rejestracja', authController.register)

router.post('/logowanie', authController.login)

router.get('/wyloguj', authController.logout)




   

module.exports = router