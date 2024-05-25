const router = require("express").Router();
const { sendMessage,getMessages } = require("../controllers/messages");
const authController = require("../controllers/auth");

router.get("/:id",authController.protect,getMessages)
router.post("/send/:id",authController.protect,sendMessage)

module.exports = router