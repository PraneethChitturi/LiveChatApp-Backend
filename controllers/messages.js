const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const OneToOneMessage = require("../models/OnetoOneMessage");

exports.sendMessage = async(req,res,next)=>{
    try {
        const {message} = req.body;
        const {id:receiverId} = req.params
        const senderId = req.user._id
        const conversation=await OneToOneMessage.findOne({
            participants:{$all:[senderId,receiverId]},
        })

        if (!conversation) {
            conversation = await OneToOneMessage.create({
                participants:[senderId,receiverId],
            })
        }

        const newMessage = {
            from:senderId,
            to:receiverId,
            text:message
        }

        if (newMessage){
            conversation.messages.push(newMessage)
        }

        await conversation.save();
        res.status(200).json(newMessage)
    } catch (error) {
        console.log("Error in sendMessage controller: ",error.message)
        res.status(400).json({error:"Internal Server Error"})
    }
}


exports.getMessages = async(req,res,next)=>{
    try {
        const {id:userToChatId} = req.params
        const senderId = req.user._id

        const conversation = await OneToOneMessage.findOne({
            participants:{$all:[senderId,userToChatId]}
        })

        if(!conversation) return res.status(200).json([])

        res.status(200).json(conversation.messages)
    } catch (error) {

    }
}