var express = require('express');
var router = express.Router();
let userController = require('../controllers/users')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let { checkLogin } = require('../utils/authHandler')


router.post('/register', async function (req, res, next) {
  let newUser = await userController.CreateAnUser(
    req.body.username,
    req.body.password,
    req.body.email,
    '69a4f929f8d941f2dd234b88'
  )
  res.send(newUser)
});
router.post('/login', async function (req, res, next) {
  let { username, password } = req.body;
  let getUser = await userController.FindByUsername(username);
  if (!getUser) {
    res.status(404).send({
      message: "username khong ton tai hoac thong tin dang nhap sai"
    })
    return;
  }
  let result = bcrypt.compareSync(password, getUser.password);
  if (result) {
    let token = jwt.sign({
      id: getUser._id,
      exp: Date.now() + 3600 * 1000
    }, "HUTECH")
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000
    });
    res.send(token)
  } else {
    res.status(404).send({
      message: "username khong ton tai hoac thong tin dang nhap sai"
    })
  }
});
//localhost:3000
router.get('/me', checkLogin, async function (req, res, next) {
  let user = await userController.FindByID(req.userId);
  res.send(user)
});
router.post('/logout', checkLogin, function (req, res, next) {
  res.cookie('token', null, {
    maxAge: 0,
    httpOnly: true
  })
  res.send("logout")
})


let userModel = require('../schemas/users')

router.post('/change-password', checkLogin, async function (req, res, next) {
  try {
    let { oldpassword, newpassword } = req.body;
    let user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    let isMatch = bcrypt.compareSync(oldpassword, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Old password is wrong" });
    }

    user.password = newpassword;
    await user.save();

    res.send({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


module.exports = router;


//mongodb
