const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { User } = require('./models/User');
const { auth } =require('./middleware/auth');

const config = require('./config/key');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected!!'))
  .catch(err => console.log(err));

app.get('/', (req, res) => res.send('Hi?!?'));

app.post('/api/users/register', (req, res) => {
  const user = new User(req.body);

  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    })
  });
})

app.post('/api/users/login', (req, res) => {
  // 이메일 확인
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "입력하신 이메일을 가진 정보를 찾을 수 없습니다."
      });
    }

    // 비밀번호 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다."});
      }

      // 토큰 생성
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        res.cookie("x_auth", user.token)
        .status(200)
        .json({ loginSuccess: true, userId: user.id });
      })
    });
  })
});

app.get('api/users/auth', auth, (req, res) => {
  const {id, email, role, name, lastname, image}  = req.user;
  res.status(200).json({
    id: id,
    email: email,
    isAdmin: role === 0 ? false : true,
    isAuth: true,
    name: name,
    lastname: lastname,
    image: image,
  });
});

app.listen(port, () => console.log(`start prot ${port}`));
