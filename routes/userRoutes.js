const express = require('express')
const { createUser, loginUser, logOut, forgotPassword, login, resetPassword, getUserDetails, updatePassword, updateProfile, getAllUser, getSingleUser, updateUserRole, deleteUser, signupPage } = require('../controllers/userController')
const { isAuthenticatedUser, isAllowed } = require('../middleware/auth')
const router = express.Router()

router.route('/signup').post(createUser).get(signupPage)

router.route('/login').post(loginUser).get(login)

router.route('/logout').get(logOut) 

router.route('/password/forgot').post(forgotPassword)

router.route('/password/reset/:token').put(resetPassword)

router.route('/me').get(isAuthenticatedUser, getUserDetails)

router.route('/password/update').put(isAuthenticatedUser, updatePassword)

router.route('/me/update').put(isAuthenticatedUser, updateProfile)

router.route('/admin/users').get(isAuthenticatedUser, isAllowed('admin'), getAllUser)

router.route('/admin/:id').get(isAuthenticatedUser, isAllowed('admin'), getSingleUser)

router.route('/admin/:id').put(isAuthenticatedUser, isAllowed('admin'), updateUserRole)

router.route('/admin/:id').delete(isAuthenticatedUser, isAllowed('admin'), deleteUser)



module.exports  = router 
