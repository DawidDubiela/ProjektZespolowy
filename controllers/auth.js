const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const { promisify } = require('util')
const { nextTick } = require('process')

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).render('login', {
                message: 'Nie wprowadzono emailu lub hasla'
            })
        }
        db.query('select * from users where email =?', [email], async (error, results) => {
            console.log("LOGIN RESULTS " + JSON.stringify(results))
            if (!results || !(await bcryptjs.compare(password, results[0].password))) {
                res.status(401).render('login', {
                    message: 'Wprowadzono złe dane'
                })
            } else {
                const id = results[0].user_id
                const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })
                console.log("The token is" + token)
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt', token, cookieOptions)
                res.status(200).redirect('/profil')
            }
        })
    } catch (error) {
        console.log(error)
    }



}

exports.register = (req, res) => {
    console.log(req.body)
    const { name, email, password, passwordConfirm } = req.body

    db.query('select email from users where email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error)
        }
        if (results.length > 0) {
            return res.render('register', {
                message: 'Ten email jest zajety'
            })
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'Hasla sie nie zgadzaja'
            })
        }

        let hashedPassword = await bcryptjs.hash(password, 8)
        console.log(hashedPassword)

        db.query('insert into users set ?', { name: name, email: email, password: hashedPassword }, (error, reuslts) => {
            if (error) {
                console.log(error)
            } else {
                return res.render('register', {
                    message: 'Uzytkownik zostal zarejestrowany'
                })
            }
        })


    })

}

exports.isLoggedIn = async (req, res, next) => {
    console.log(req.cookies)
    if (req.cookies.jwt) {
        try {
            //veryifying token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET
            )
            //check if user exists
            db.query('select * from users where user_id = ?', [decoded.id], (error, result) => {
                console.log(result)
                if (!result) {
                    return next()
                }
                req.user = result[0]
                return next()
            })
            console.log(decoded)
        } catch (error) {
            console.log(error)
            return next()
        }
    } else {
        next()
    }
}

exports.logout = async (req, res) => {
    res.cookie('jwt', 'wyloguj', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    })
    res.status(200).redirect('/')
}

exports.getConsultations = async (req, res, next) => {
    db.query('select * from consultation', async (error, results) => {
        console.log("LOGIN RESULTS " + JSON.stringify(results))
        if (error) {
            console.log(error)
             next()
        }
            req.consultation = results
             next()
    }
    )    
}

