const ErrorHandler = require('../utils/errorhandler')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const User = require('../models/userModel')
const genToken = require("../utils/tokenGen")
const { get } = require('request')
const sendEmail = require('../utils/sendEmail')
const crypto = require("crypto");

exports.signupPage = catchAsyncErrors(
    async (req, res, next) => {
        let err = ''

        res.render('signUp',{err})
    }
)

exports.login = catchAsyncErrors(async (req, res, next)=>{
    let err = ''
    res.render('login', {err})
})

exports.createUser = catchAsyncErrors(
    async(req, res, next) => {
        const name = req.body.name
        const email = req.body.email
        const password = req.body.password
        
        const user = await User.create({
            name, 
            email, 
            password,
            prof_pic:{
                public_id: 'sameple id',
                url: "profilepic"
            }
        })
        genToken(user, 201, res);
    }
)



exports.loginUser = catchAsyncErrors(
    async(req, res, next) => {
        const email = req.body.email
        const password = req.body.password

        if(!email || !password) {
            const err = "Please enter required fields"
            res.render('login',{err})
            // return next(new ErrorHandler("Please enter required fields", 401))
            next()
        }

        const user = await User.findOne({email: email}).select("+password")
        if(!user){
            // console.log('hi');
            const err = "Invalid email or password"
            res.render('login',{err})
            // return next(new ErrorHandler("Invalid email or password", 401))
            next()  
        }

        const passMatch = await user.comparePassword(password)
        // console.log(passMatch);

        if(!passMatch){
            const err = "Invalid password or Email"
            res.render('login',{err})
            // return next(new ErrorHandler("Invalid password or Email", 401))
        }
        // console.log(user);
        genToken(user, 200, res)
    }
)

exports.logOut = catchAsyncErrors(
    async(req, res, next)=>{
        
        // console.log(req.cookies.user.name);
        res.cookie('token',null, {
            expires: new Date(Date.now()),
            httpOnly: true
        })

        // res.status(200).json({
        //     success: true,
        //     message: `${req.cookies.user.name} Logged out`
        // })
        res.status(200).redirect('/api/v1/login')
    }
)

exports.forgotPassword = catchAsyncErrors(
    async(req, res, next)=>{
        const user = await User.findOne({email:req.body.email})
        if(!user) return next(new ErrorHandler("User not found", 404))

        const resetToken = await user.getResetPasswordToken()
        await user.save({validateBeforeSave: false})

        const resetPasswordUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`
    
        const message = `Your password reset link is : \n\n ${resetPasswordUrl}\n\n`


        try {
            await sendEmail({
                email: user.email,
                subject: `Ecommerce Password Recovery`,
                message: message
            })
            res.status(200).json({
                success: true,
                message: `Email sent to ${user.email} successfully`,

            })
            
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined
            await user.save({validateBeforeSave: false})
            return next(new ErrorHandler(error.message,500))
        }
    }
)

exports.resetPassword = catchAsyncErrors(
    async(req, res, next) => {
        const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

        const user = await User.findOne(
            {
                resetPasswordToken,
                resetPasswordExpire: {$gt:Date.now()},
            }
        )

        if(!user)return next(new ErrorHandler("Invalid link or link expired", 400))

        if(req.body.password!=req.body.confirmPassword)
            return next(new ErrorHandler('Passwords do not match', 400))

        user.password  = req.body.password
        user.resetPasswordExpire = undefined
        user.resetPasswordToken = undefined

        await user.save({validateBeforeSave: false})
        genToken(user, 200, res)
    }
)

exports.getUserDetails = catchAsyncErrors(
    async(req, res, next) => {
        const id = req.cookies.user._id
        const user  = await User.findOne({_id:id})
        // res.status(200).json({
        //     success: true,
        //     user,
        // }) 

        res.status(200).render('index', {user}) 
    }
)

exports.updatePassword = catchAsyncErrors(
    async(req, res, next) => {
        const id = req.cookies.user._id
        const user = await User.findOne({_id:id}).select("+password")
        const passwordMatched = await user.comparePassword(req.body.oldPassword)
        if(!passwordMatched){
            return next(new ErrorHandler("Old password incorrect", 400)) 
        }

        if(req.body.newPassword!=req.body.confirmPassword){
            return next(new ErrorHandler("Confirm password incorrect", 400))
        }

        user.password = req.body.newPassword
        await user.save()
        res.status(200).json({
            success: true,
            user
        })
        genToken(user, 200, res)
    }
)


// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    };

    // if (req.body.avatar !== "") {
    //     const user = await User.findById(req.user.id);

    //     const imageId = user.avatar.public_id;

    //     await cloudinary.v2.uploader.destroy(imageId);

    //     const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    //     folder: "avatars",
    //     width: 150,
    //     crop: "scale",
    //     });

    //     newUserData.avatar = {
    //     public_id: myCloud.public_id,
    //     url: myCloud.secure_url,
    //     };
    // }
    console.log(req.user);
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
        new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
        );
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    });
});

// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
        new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 400)
        );
    }

    // const imageId = user.avatar.public_id;

    // await cloudinary.v2.uploader.destroy(imageId);

    await user.remove();

    res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    });
});
