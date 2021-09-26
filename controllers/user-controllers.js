const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const fetch = require('node-fetch');

const HttpError = require('../models/http-error')
const User = require('../models/user');
const Blog = require('../models/task');
const { response } = require('express');
const mongoose = require('mongoose');

const client = new OAuth2Client('162003935215-rp7i00q4jsf94gdg6afqdtmkbr1ohbmk.apps.googleusercontent.com')

const userSignup = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new HttpError('Field Cannot be empty', 422))
    }
    const { username, email, password, } = req.body
    let existingUser
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Sign up failed,please try again', 500)
        return next(error)
    }
    if (existingUser) {
        const error = new HttpError('User Exists already, Please Log-In Instead', 422)
        return next(error)
    }
    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch (err) {
        const error = new HttpError('Could not sign-in the user, please try again', 500)
        return next(error)
    }
    const createdUser = new User({
        username,
        email,
        image: 'https://img.icons8.com/office/80/000000/test-account.png',
        password: hashedPassword,
        tasks: [],
        views: 0
    })
    try {
        await createdUser.save()
    } catch (err) {
        const error = new HttpError('Signing Up failed, please try again', 500)
        return next(error)
    }
    let token
    try {
        token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, "super_secret_dont_share", {})
    } catch (err) {
        const error = new HttpError('Signing Up failed, please try again', 500)
        return next(error)
    }
    res.status(201).json({ userId: createdUser.id, email: createdUser.email, username: createdUser.username, image: createdUser.image, token: token })
}

const userLogin = async (req, res, next) => {
    const { email, password } = req.body
    let existingUser
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Sign up failed,please try again', 500)
        return next(error)
    }
    if (!existingUser) {
        return next(new HttpError('Invalid Credentials, could not log you in', 401))
    }
    let isValidPassword = false
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        const error = new HttpError('Could not log you In, please check your credentials and try again', 500)
    }
    if (!isValidPassword) {
        return next(new HttpError('Invalid Credentials, could not log you in', 401))
    }
    let token

    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, "super_secret_dont_share", {})
    } catch (err) {
        const error = new HttpError('Log In failed, please try again', 500)
        return next(error)
    }
    res.json({
        userId: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        image: existingUser.image,
        token: token,
    })
}

const googleLogin = (req, res, next) => {
    const { tokenId } = req.body
    client.verifyIdToken({ idToken: tokenId, audience: '162003935215-rp7i00q4jsf94gdg6afqdtmkbr1ohbmk.apps.googleusercontent.com' })
        .then(response => {
            const { email_verified, name, email, picture } = response.payload;
            if (email_verified) {
                User.findOne({ email }).exec((err, user) => {
                    if (err) {
                        const error = new HttpError('Could not sign-in the user, please try again', 500)
                        return next(error)
                    } else {
                        if (user) {
                            let token
                            try {
                                token = jwt.sign({ userId: user.id, email: user.email }, "super_secret_dont_share", {})
                            } catch (err) {
                                const error = new HttpError('Log In failed, please try again', 500)
                                return next(error)
                            }
                            res.json({ userId: user.id, email: user.email, username: user.username, image: user.image, token: token })
                        } else {
                            let password = 'socialmediapwd'
                            // let hashedPassword
                            // try {
                            //     hashedPassword = await bcrypt.hash(password, 12)
                            // } catch (err) {
                            //     const error = new HttpError('Could not sign-in the user, please try again', 500)
                            //     return next(error)
                            // }
                            // consol
                            // let hashedPassword
                            //     hashedPassword = bcrypt.hash(password, 12)
                            const createdUser = new User({
                                username: name,
                                email: email,
                                image: picture,
                                password: password,
                                tasks: [],
                                views: 0
                            })
                            try {
                                createdUser.save()
                            } catch (err) {
                                const error = new HttpError('Signing Up failed, please try again', 500)
                                return next(error)
                            }
                            let token
                            try {
                                token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, "super_secret_dont_share", {})
                            } catch (err) {
                                const error = new HttpError('Signing Up failed, please try again', 500)
                                return next(error)
                            }
                            res.status(201).json({ userId: createdUser.id, email: createdUser.email, username: createdUser.username, image: createdUser.image, token: token })
                        }
                    }
                })
            }
        })
}

const facebookLogin = (req, res, next) => {
    const { userId, accessToken } = req.body;
    let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userId}/?fields=id,name,email&access_token=${accessToken}`
    fetch(urlGraphFacebook, {
        method: 'GET',
    })
        .then(response => response.json())
        .then(response => {
            const { email, name } = response
            User.findOne({ email }).exec((err, user) => {
                if (err) {
                    const error = new HttpError('Could not sign-in the user, please try again', 500)
                    return next(error)
                } else {
                    if (user) {
                        let token
                        try {
                            token = jwt.sign({ userId: user.id, email: user.email }, "super_secret_dont_share", {})
                        } catch (err) {
                            const error = new HttpError('Log In failed, please try again', 500)
                            return next(error)
                        }
                        res.json({ userId: user.id, email: user.email, username: user.username, image: user.image, token: token })
                    } else {
                        let password = 'socialmediapwd'
                        // let hashedPassword
                        // try {
                        //     hashedPassword = await bcrypt.hash(password, 12)
                        // } catch (err) {
                        //     const error = new HttpError('Could not sign-in the user, please try again', 500)
                        //     return next(error)
                        // }
                        // consol
                        // let hashedPassword
                        //     hashedPassword = bcrypt.hash(password, 12)
                        const createdUser = new User({
                            username: name,
                            email: email,
                            image: picture,
                            password: password,
                            tasks: [],
                            views: 0
                        })
                        try {
                            createdUser.save()
                        } catch (err) {
                            const error = new HttpError('Signing Up failed, please try again', 500)
                            return next(error)
                        }
                        let token
                        try {
                            token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, "super_secret_dont_share", {})
                        } catch (err) {
                            const error = new HttpError('Signing Up failed, please try again', 500)
                            return next(error)
                        }
                        res.status(201).json({ userId: createdUser.id, email: createdUser.email, username: createdUser.username, image: createdUser.image, token: token})
                    }
                }
            })
        })
}

const fetchAllTasks = async (req, res, next) => {
    const userId  = req.params.id
    let user
    try {
        user = await User.findById(userId)
    } catch (err) {
        const error = new HttpError('Something Went wrong,please try again', 500)
        return next(error)
    }
    if (!user) {
        return next(new HttpError('no Users for given Id', 500))
    }
    res.json({ userTasks: user.tasks })
}

const addTask = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
            );
        }
    const userId  = req.params.id
    const { title, description, completed } = req.body

    const createdTask = new Blog({
        title,
        description,
        completed,
    });
    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        const error = new HttpError(
            'Publishing the Blog failed, please try again.',
            500
        );
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id.', 404);
        return next(error);
    }
    try {
        user.tasks = user.tasks.concat(createdTask);
        await user.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Adding Task failed, please try again.',
            500
        );
        return next(error);
    }
    res.json({ userTasks: createdTask })
}

const deleteTask = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }
    const userId  = req.params.id
    const {taskid}  = req.body
    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        const error = new HttpError(
            'Publishing the Blog failed, please try again.',
            500
        );
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id.', 404);
        return next(error);
    }
    try {
        user.tasks = user.tasks.filter(task => task._id != taskid);
        await user.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Adding Task failed, please try again.',
            500
        );
        return next(error);
    }
    res.status(200).json({ message: 'Deleted Task.' });
}

const editTask = async (req, res, next) => {
    const userId  = req.params.id
    const {editTask}  = req.body
    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        const error = new HttpError(
            'Publishing the Blog failed, please try again.',
            500
        );
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id.', 404);
        return next(error);
    }
    try {
        for(let task of user.tasks) {
            if(task._id == editTask._id){
                task.title = editTask.title
                task.description = editTask.description
            }
        }
        user.markModified('tasks');
        await user.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Adding Task failed, please try again.',
            500
        );
        return next(error);
    }
    res.status(200).json({ message: 'Editing Task Completed.' });
}

const editcompleteTask = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }
    const userId  = req.params.id
    const {taskid}  = req.body
    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        const error = new HttpError(
            'Publishing the Blog failed, please try again.',
            500
        );
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id.', 404);
        return next(error);
    }
    try {
        for(let task of user.tasks) {
            if(task._id == taskid){
                task.completed = !task.completed
            }
        }
        user.markModified('tasks');
        await user.save()
    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Adding Task failed, please try again.',
            500
        );
        return next(error);
    }
    res.status(200).json({ message: 'completed Task.' });

}

const searchTask = async (req, res, next) => {
    const { profession, userid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Something went Wrong', 500)
        return next(error)
    }
    if (!user) {
        return next(new HttpError('Cound not find the user', 404))
    }
    user.profession = profession
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ user: user.toObject({ getters: true }) })

}



exports.userSignup = userSignup
exports.userLogin = userLogin
exports.googleLogin = googleLogin
exports.facebookLogin = facebookLogin
exports.fetchAllTasks = fetchAllTasks
exports.addTask = addTask
exports.deleteTask = deleteTask
exports.editTask = editTask
exports.editcompleteTask = editcompleteTask
exports.searchTask = searchTask
