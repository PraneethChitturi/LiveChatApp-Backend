const jwt = require("jsonwebtoken") //Send user token for login useful to authentication
const crypto = require("crypto")
//Model for CRUD Options
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const {promisify} = require("util")
const otpGenerator = require("../otp-generator")
const signToken = (userId)=>{
    jwt.sign({userId},process.env.JWT_SECRET)
}

//Sign Up => Register - SendOTP - verifyOTP

//api.tawk.com/auth/register


//Register New User
exports.register = async(req,res,next)=>{
    const {firstName,lastName,email,password} = req.body;

    const filteredBody = filterObj(req.body,"firstName","lastName","password","email");

    //check if a verified user with given email exists
    const existing_user = await User.findOne({email:email});

    if(existing_user && existing_user.verified){
        res.status(400).json({
            status:"error",
            message:"Email is already in use, Please login."
        })
        return;
    }
    else if(existing_user){
        await User.findOneAndUpdate({email:email},filteredBody,{new:true,validateModifiedOnly:true});

        req.userId = existing_user._id;
        next();
    } else {
        //If user record is not available in DB
        const new_user = await User.create(filteredBody);

        //generate OTP and send email to user
        req.userId = new_user._id;
        next();
    }


}
//Send OTP
exports.sendOTP=async(req,res,next)=>{
    const {userId}=req;
    const new_otp = otpGenerator(6,{lowerCaseAlphabets:false,upperCaseAlphabets:false,specialChars:false})

    const otp_expiry_time = Date.now() + 10*60*1000; //10mins after otp is sent

    //
    await User.findByIdAndUpdate(userId,{
        orp:new_otp,
        otp_expiry_time,
    });

    //Send Mail

    res.status(200).json({
        status:"success",
        message:"OTP sent Successfully!"
    })
}

exports.verifyOTP = async (req,res,next)=>{
    //Verify OTP and update user record accordingly
    const {email,otp} = req.body;

    const user= await User.findOne({
        email,
        otp_expiry_time:{$gt:Date.now()},
    })

    if(!user){
        res.status(400).json({
            status:"error",
            message:"Email is Invalid or OTP expired"
        })
        return;
    }

    if(!await user.correctOTP(otp,user.otp)){
        res.status(400).json({
            status:"error",
            message:"OTP is incorrect"
        })
        return;
    }

    //OTP is correct
    user.verified = true;
    user.otp = undefined;

    await user.save({new:true,validateModifiedOnly:true});

    const token = signToken(user._id);
    res.status(200).json({
        status:"success",
        message:"Logged in successfully",
        token,
    })
}
//Login User
exports.login = async (req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password){
        res.status(400).json({
            status: "error",
            message:"Both email and password are required"
        })
        return;
    }

    const userDoc = await User.findOne({email:email}).select("+password");

    if(!userDoc || !(await userDoc.correctPassword(password,userDoc.password))){
        res.status(400).json({
            status:"error",
            message:"Email or password is incorrect",
        })
        return;
    } 


    const token = signToken(userDoc._id);
    res.status(200).json({
        status:"success",
        message:"Logged in successfully",
        token,
    })

};

//Make  sure users who logged in are accessing
//Two types of Routes -> Protected (Only logged in Users can access)
//                    -> UnProtected (Public can access; anybody)
exports.protect = async (req,res,next)=>{
    //1) Getting Token (JWT) and check if its there
    let token;

    // 'Bearer ksdlabsddksmd'
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];

    }
    else if(req.cookied.jwt) { //Sometimes can be sent in cookies
        token = req.cookies.jwt;

    }
    else {
        req.status(400).json({
            status:"error",
            message:"You are not logged in! Please log in to get access"
        })
        return;
    }

    //2) Verify if Token is correct or not
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);

    //3) Check if user still exist
    const this_user = await User.findById(decoded.userId);

    if(!this_user){
        res.status(400).json({
            status:"error",
            message:"The user belonging to this token doesn't exist"
        })
        return;
    }

    //4) Check if user changed their password after token was issued
    if(this_user.changedPasswordAfter(decoded.iat)){
        res.status(400).json({
            status:"error",
            message:"User recently updated Password! Please log in again"
        })
    }

    //Pass control to next middleware
    req.user = this_user;
    next();

}

//Reset Password
exports.forgotPassword = async (req,res,next)=>{
    //1) Get Users email
    const user = await User.findOne({email:req.body.email}) ;

    if(!user){
        res.status(400).json({
            status:"error",
            message:"There is no user with given Email Address"
        })
        return;
    }

    //2) Generate random reset token
    const resetToken = user.createPasswordResetToken();

    const resetURL =`https://tawk.com/auth/reset-password/?code=${resetToken}`;

    try {
        //Sending Email with resetURL to User
        res.status(200).json({
            status:"success",
            message:"Reset Password Link sent to Email"
        })

    } catch(error) {
        //If error in sending mail, reset token in backend db 
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({validateBeforeSave:false})

        res.status(500).json({
            status:"error",
            message:"There was an error sending the email, Please try again later."
        })
        return;
    }

}

exports.resetPassword = async (req,res,next)=>{
    //1) Get User based on token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

    const user = User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}})

    //2) If token has expired or user is out of time window 
    if (!user){
        res.status(400).json({
            status:"error",
            message:"Token is invalid or Expired"
        })
        return;
    }

    //3) Updating Password and nulling our resetTokens
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    //3) Actually saving the new update
    await user.save();

    //Send an Email to user informing about Password Reset

    //4) Log in the user and send new JWT
    const token = signToken(user._id);
    res.status(200).json({
        status:"success",
        message:"Password Reset Succesfull",
        token,
    })
}