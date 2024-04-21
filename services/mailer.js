//We use SendGrid to mail
const sgMail = require("@sendgrid/mail")
const dotenv = require("dotenv");
dotenv.config({path:"../config.env"})

//Sets the bearer token in the document
sgMail.setApiKey(process.env.SG_KEY);

const sendSGMail = async ({
recipient,
sender,
subject,
html,text,
attachments,
}) => {
    try{
        const from = sender || "praneethchitturi01@gmail.com"
        const msg = {
            to: recipient, //email of recipient
            from: from, //this will be our verified sender
            subject,
            html: html,
            text:text,
            //text:"",
            attachments
        }

        return sgMail.send(msg)
    } catch(error) {
        console.log(error)
    }
}

exports.sendEmail = async (args)=> {
    if (process.env.NODE_ENV === "development") {
        return new Promise.resolve();
    } else {
        return sendSGMail(args);
    }
}