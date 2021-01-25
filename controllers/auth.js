const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const { promisify } = require('util')
const db = require('../db.js')

exports.login = async (req, res) => {
    const x = 0;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).render('login', {
                message: 'Nie wprowadzono emailu lub hasla'
            })
        }
        db.query('select * from users where email =?', [email], async (error, results) => {
            if (results.length == 0) {
                res.status(401).render('login', {
                    message: 'Wprowadzono złe dane'
                })
            }
            else if (!(await bcryptjs.compare(password, results[0].password))) {
                res.status(401).render('login', {
                    message: 'Wprowadzono złe dane'
                })
            }
            else {
                const id = results[0].user_id
                const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })
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
    const { name, email, password, passwordConfirm } = req.body
    if (name.length == 0 || email.length == 0 || password.length == 0) {
        return res.render('register', {
            message: 'Wypełnij wszystkie pola'
        })
    }

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

        db.query('insert into users set ?', { name: name, email: email, password: hashedPassword, role: 1 }, (error, reuslts) => {
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
    if (req.cookies.jwt) {
        try {
            //veryifying token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET
            )
            //check if user exists
            db.query('select * from users where user_id = ?', [decoded.id], (error, result) => {
                if (!result) {
                    return next()
                }
                req.user = result[0]
                return next()
            })
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
    res.status(200).redirect('/logowanie')
}

exports.getConsultations = async (req, res, next) => {
    db.query('select consultation_id, start, end, c.consultant_id, name from consultation c  join users x on c.consultant_id = x.user_id; ', async (error, results) => {
        if (error) {
            console.log(error)
            next()
        }
        req.consultation = results
        next()
    }
    )
}

exports.addToQueue = async (req, res) => {
    db.query(
        "select* from queue where fk_consultation = ? and fk_student = ?",
        [req.body.id_consultation, req.body.user.user_id],
        async (error, results) => {
            if (results.length != 0) {
                req.body.message = "Jestes juz zapisany na ta konsultacje";
                req.body.icon = "error";
                res.send(JSON.stringify(req.body));
            } else if (req.body.user.role == 2) {
                req.body.message = "Konsultant nie moze zostac dodany do kolejki";
                req.body.icon = "error";
                res.send(JSON.stringify(req.body));
            } else {
                db.query(`select* 
                from consultation where 
                consultation_id = ?
                and end>=now();`, [req.body.id_consultation], async (error, results) => {
                    if (results.length == 0) {
                        req.body.message = "Konsultacja na którą próbujesz się zapisać się zakończyła";
                        req.body.icon = "error";
                        res.send(JSON.stringify(req.body));
                    }
                    else {
                        db.query("insert into queue set ?", {
                            fk_consultation: req.body.id_consultation,
                            fk_student: req.body.user.user_id
                        }, async (error, results) => {
                            if (results) {
                                db.query("call fixPosition(?)", [req.body.id_consultation], async (error, results) => {
                                    req.body.icon = "success";
                                    req.body.message = "Zostales dodany do kolejki";
                                    res.send(JSON.stringify(req.body));
                                })
                            }
                            else {
                                console.log(error)
                            }
                        })
                    }
                })
            }
        }
    )
};

exports.adminLog = async (req, res) => {
    {
        try {
            const { login, password } = req.body;
            if (!login || !password) {
                return res.status(400).render('adminlog', {
                    message: 'Nie wprowadzono loginu lub hasla'
                })
            }
            db.query('select * from admin where login =?', [login], async (error, results) => {
                if (!results || !(await bcryptjs.compare(password, results[0].password))) {
                    res.status(401).render('adminlog', {
                        message: 'Wprowadzono złe dane'
                    })
                } else {
                    const id = results[0].admin_id
                    const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_EXPIRES_IN
                    })
                    const cookieOptions = {
                        expires: new Date(
                            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                        ),
                        httpOnly: true
                    }
                    res.cookie('jwt', token, cookieOptions)
                    res.status(200).redirect('/adminpanel')
                }
            })
        } catch (error) {
            console.log(error)
        }
    }
}

exports.isAdmin = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            //veryifying token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET
            )
            //check if user exists
            db.query('select * from admin where admin_id = ?', [decoded.id], (error, result) => {
                if (!result) {
                    return next()
                }
                req.admin = result[0]
                return next()
            })
        } catch (error) {
            console.log(error)
            return next()
        }
    } else {
        next()
    }
}


exports.registerConsultant = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body
    if (name.length == 0 || email.length == 0 || password.length == 0) {
        return res.render('addCounsultant', {
            message: 'Wypełnij wszystkie pola'
        })
    }
    db.query('select email from users where email = ? and role = 2', [email], async (error, results) => {

        if (error) {
            console.log(error)
        }
        if (results.length > 0) {
            return res.render('addConsultant', {
                message: 'Ten email jest zajety'
            })
        } else if (password !== passwordConfirm) {
            return res.render('addConsultant', {
                message: 'Hasla sie nie zgadzaja'
            })
        }

        let hashedPassword = await bcryptjs.hash(password, 8)

        db.query('insert into users set ?', { email: email, password: hashedPassword, name: name, role: 2 }, (error, reuslts) => {
            if (error) {
                console.log(error)
            } else {
                return res.render('addConsultant', {
                    message: 'Uzytkownik zostal zarejestrowany'
                })
            }
        })
    })
}


exports.registerConsultation = (req, res) => {
    const { id, start, end } = req.body
    var startv = start.replace('T', ' ');
    var endv = end.replace('T', ' ');
    var now = new Date();
    now = now.toISOString().slice(0, -8);
    if (id.length == 0 || start.length == 0 || end.length == 0) {
        return res.render('addConsultation', {
            message: 'Wypełnij wszystkie pola'
        })
    }

    else if (start > end) {
        return res.render('addConsultation', {
            message: 'Zostały wprowadzone złe dane, data początku jest po dacie zakończenia.'
        })
    }

    else if (start < now || end < now) {
        return res.render('addConsultation', {
            message: 'Zostały wprowadzone złe dane, nie można zarejestrować konsultacji, która zaczeła/skończyła się przed jej dodaniem'
        })
    }

    db.query('select* from users where user_id = ? and role = 2', [parseInt(id)], (error, results) => {
        if (error) {
            console.log(error)
        }
        else if (results.length == 0) {
            valid = 1;
            return res.render('addConsultation', {
                message: 'Konsultant o takim id nie isnieje'
            })
        }
        else {
            db.query(`select* 
                from consultation
                where consultant_id = ?
                and ((? >= start 
                and ? <= end)
                or (? >= start
                and ? <= end)
                or (? <= start 
                and ? >= end ));`, [parseInt(id), start, start, end, end, start, end], (error, results) => {
                if (error) {
                    console.log(error)
                }
                else if (results.length > 0) {
                    valid = 1;
                    return res.render('addConsultation', {
                        message: 'Konsultacja pokrywa się z już istniejącą konsultacją'
                    })
                }
                else {
                    db.query('insert into consultation set ?', { start: start, end: end, consultant_id: parseInt(id), startv: startv, endv: endv }, (error, reuslts) => {
                        if (error) {
                            console.log(error)
                        } else {
                            return res.render('addConsultation', {
                                message: 'Konsultacja została dodana'
                            })
                        }
                    })
                }
            })
        }
    })
}

exports.getConsUser = async (req, res, next) => {

    db.query(`select startv,endv, u2.name, q.position
        from queue q
        inner join consultation c
        on q.fk_consultation = c.consultation_id 
        inner join users u 
        on u.user_id = q.fk_student 
        inner join users u2 
        on u2.user_id = c.consultant_id 
        where fk_student = ?`, [req.user.user_id], async (error, results) => {
        if (error) {
            console.log(error)
            next()
        }
        req.consultation = results
        next()
    }
    )
}
exports.isConsultant = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            //veryifying token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET
            )
            //check if user exists
            db.query(
                `select startv,endv,u2.name as 'konsultant',u2.email,u.name, position, consultation_id, consultant_id, u.user_id
                from queue 
                join consultation on fk_consultation = consultation_id
                join users u on fk_student = u.user_id
                join users u2 on consultant_id = u2.user_id
                where start <= now() and end >= now() and 
                consultant_id = (select user_id from users where user_id = ? and role = 2) order by position asc`
                , [decoded.id], (error, result) => {
                    if (result.length == 0) {
                        return next()
                    }
                    req.consultant = result
                    return next()
                })
        } catch (error) {
            console.log(error)
            return next()
        }
    } else {
        next()
    }
}

exports.dfq = async (req, res, next) => {
    db.query(`delete 
    from queue 
    where fk_consultation = ?
    and fk_student =?`, [req.body.consultation, req.body.user], (error, result) => {
        if (result) {
            db.query(`call fixPosition(?)`, [req.body.consultation])
            res.status('200').send({ status: 'Succes' });
            return next()
        }
        else if (error) {
            res.status('500').send({ status: 'Failure' });
            console.log(error)
            return next()
        }
        else {
            next()
        }
    })
}

exports.dropFromQue = async (req, res, next) => {
    db.query(`delete 
    from queue 
    where fk_consultation = ?
    and fk_student =?`, [req.body.id_consultation, req.body.user], (error, result) => {
        if (result && result.affectedRows > 0) {
            db.query(`call fixPosition(?)`, [req.body.id_consultation])
            req.body.icon = 'success';
            req.body.message = "Zostaleś usunięty z kolejki";
            res.send(JSON.stringify(req.body));
            return next()
        }
        else if (error) {
            req.body.icon = 'error';
            req.body.message = "Coś poszło nie tak";
            res.send(JSON.stringify(req.body));
            console.log(error)
            return next()
        }
        else {
            req.body.icon = 'error';
            req.body.message = "Nie jesteś jeszcze zapisany do tej kolejki..";
            res.send(JSON.stringify(req.body));
            next()
        }
    })
}

exports.getConsultants = async (req, res, next) => {
    db.query(`select user_id, name from users where role = 2`, (error, results) => {
        if (results) {
            req.body.consultants = results;
            return next()
        }
        else if (error) {
            console.log(error);
            return next()
        }
        else {
            req.body.consultants = [];
        }
    })
}


