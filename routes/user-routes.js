const express = require('express')
const { check } = require('express-validator')
const router = express.Router()
const checkAuth = require('../middleware/check-auth')
const userControllers = require('../controllers/user-controllers')

router.post('/auth/signup',[
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min: 6})
], userControllers.userSignup)
router.post('/auth/login', userControllers.userLogin)

router.post('/auth/googlelogin', userControllers.googleLogin)
router.post('/auth/facebooklogin', userControllers.facebookLogin)

// router.get('/profile/:id', userControllers.fetchUserAllInfo)

router.use(checkAuth)

router.get('/gettasks/:id', userControllers.fetchAllTasks)
router.post('/task/new/:id', userControllers.addTask)
router.post('/task/delete/:id', userControllers.deleteTask)
router.post('/task/edit/:id', userControllers.editTask)
router.post('/task/editcomplete/:id', userControllers.editcompleteTask)
router.post('/task/search/:id', userControllers.searchTask)

// router.patch('/profile/profession', userControllers.updateProfession)
// router.patch('/profile/bio', userControllers.updateBio)
// router.patch('/profile/picture', userControllers.updateImage)

// router.post('/userbookmark', userControllers.addUserBookmark)
// router.post('/userlike', userControllers.addUserLike)
// router.post('/userbookmarkremove', userControllers.removeUserBookmark)
// router.post('/userlikeremove', userControllers.removeUserLike)

// router.get('/user/bookmark/:userid', userControllers.fetchUserBookmark)
// router.get('/user/like/:userid', userControllers.fetchUserLike)

module.exports = router