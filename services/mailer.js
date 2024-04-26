//We use SendGrid to mail
//const sgMail = require("@sendgrid/mail")
const { MailtrapClient } = require("mailtrap");
const dotenv = require("dotenv");
dotenv.config({path:"../config.env"})

//Sets the bearer token in the document
//sgMail.setApiKey(process.env.SG_KEY);
const ENDPOINT = "https://send.api.mailtrap.io/";
const client = new MailtrapClient({ endpoint: ENDPOINT, token: '55465cab69f366d277a8f33276408ec9' });

const sendSGMail = async ({
recipient,
sender,
subject,
html,text,
attachments,
}) => {
    try{
        const from = {email: sender} //{email: sender || "praneethchitturi01@gmail.com"}
        const msg = {
            to: [{email:recipient}], //email of recipient
            from: from, //this will be our verified sender
            subject: subject,
            html: html,
            //text:text,
            //text:"",
        }

        return client.send(msg).then(console.log,console.error)
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