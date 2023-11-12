const express=require('express');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
require('dotenv').config();
const app=express();

mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log('connected to database'))
.catch((err)=>console.log(err));

const User=require('./modals/User');

const loginRouter=require('./routes/Login');
const userRouter=require('./routes/User');
const blogRouter=require('./routes/Blog');
const adminRouter=require('./routes/Admin');

const PORT=process.env.PORT || 5000;

app.use(express.json());

const authenticateUser =async (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const checkUser = User.findOne({ _id: decodedToken.userId });
    if (!checkUser) {
        return res.status(401).json({ error: 'No User Exists' });
    }
    if (checkUser.isDisabled) {
        return res.status(401).json({ error: 'User is disabled' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const authenticateAdmin =async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const checkUser = User.findOne({ _id: decodedToken.userId });
        if (!checkUser) {
            return res.status(401).json({ error: 'No User Exists' });
        }
        if (decodedToken.role !== 'admin') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

app.get('/',(req,res)=>{
    res.send('hello world');
});

app.use('/user', loginRouter);
app.use('/user', authenticateUser , userRouter);
app.use('/blog', authenticateUser, blogRouter);
app.use('/admin', authenticateAdmin, adminRouter);

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
});