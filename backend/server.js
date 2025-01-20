import dotenv from 'dotenv';
dotenv.config();

import express from 'express'
import cors from 'cors';
import { getUserByEmail,migrate } from './data_base/index.js';
import { user } from './data_base/users.model.js';
import { activity } from './data_base/activities.model.js';
import { expressjwt } from "express-jwt";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { reaction } from './data_base/reactions.model.js';
import {v4 as uuidv4} from 'uuid'

const jwtSecret = process.env.JWT_SECRET;

const app=express();
app.use(express.json());

const allowedOrigins = [
    'http://localhost:3000', // Pentru dezvoltare locală
    'https://continuous-feedback-applic-git-770f52-denisas-projects-a50d7f08.vercel.app' // Domeniul frontend-ului din Vercel
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Dacă folosești cookies sau autentificare
};

app.use(cors(corsOptions));


migrate();

app.use(expressjwt({
    secret: jwtSecret,
    algorithms: ['HS256']
  }).unless({
    path: ['/login']
  }));
  
  app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      console.error('Unauthorized error: ', err);
      return res.status(401).json({ message: 'Invalid token' });
    }
    next();
  });

function generateUniqueCode()
{
    const date=Date.now();
    const date_miliseconds=date%1000;
    if (date_miliseconds < 100) {
        date_miliseconds = `0${date_miliseconds}`;
    }
    console.log(date_miliseconds);
    const code_uuid=uuidv4();
    const unique_code=code_uuid.replace(/\D/g,'');//I replace all the characters that are not numbers and keep only the digits
    console.log(unique_code);
    const long_code=`${date_miliseconds}${unique_code}`;
    const code=long_code.slice(0,6);
    return code;
}


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const foundUser = await user.findOne({ where: { email } });

        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, foundUser.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Generăm un JWT
        const token = jwt.sign(
            { userId: foundUser.userId, role: foundUser.role }, 
            process.env.JWT_SECRET,                             
            { expiresIn: '1h' }                              
        );

        
        return res.status(200).json({ 
            message: 'Login successful', 
            token, 
            role: foundUser.role,
            userId:foundUser.userId
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

app.post('/activities',async (req,res)=>{

    const {title,description,start_date,end_date}=req.body;
    if(!title || !description || !start_date || !end_date)
    {
        return res.status(400).json('All fields are required');
    }
    
    try{
    
        if(!req.auth || req.auth.role!=='teacher')
        {
            return res.status(403).json({error:'Only teachers can create activities.'})
        }

        const code=generateUniqueCode();
        
        const newActivity=await activity.create({
            title,
            description,
            code:code,
            start_date,
            end_date,
            teacherId:req.auth.userId
        });
     
        return res.status(201).json({message:'Activity created successfully ',activity:newActivity});
    }
    catch(e)
    {
        console.error('Error creating activity:',e);
        return res.status(500).json({ error: e.message });
    }
    

});

app.get('/:email/user', async (req,res)=>{
        const userEmail=req.params.email;
        const user=await getUserByEmail(userEmail);
        if(!user)
        {
            res.status(404).json({error: 'Email not found'});
        }
        else{
            res.status(200).json({user:user});
        }
});

app.get('/show_teachers',async (req,res)=>{
    try{
        const teachers=await user.findAll({
            where:{role:'teacher'},
            attributes:['userId','name']
        });

        if(teachers.length===0)
        {
            return res.status(404).json({error:'No teacher found.'});
        }

        return res.status(200).json({teachers:teachers});
    }
    catch(e)
    {
        console.log("Error while fetching teachers:",e);
        return res.status(500).json({error:"Internal server error."});
    }
});

app.get('/teacher-activities-for-students/:teacherId',async (req,res)=>{
    
    //http://localhost:3001/activities/12345
    const {teacherId}=req.params;

    if(!teacherId)
    {
        return res.status(400).json({error:'You should add teacher ID.'});
    }

    try{
        const exist=await user.findOne({
            where:{
                userId:teacherId,
                role:'teacher'
            }
            
        });

        if(!exist)
        {
            return res.status(404).json({error:"Doesn't exist a teacher with this ID."});
        }

        const activities=await activity.findAll({
                where:{teacherId:teacherId}
        });

        if(!activities)
        {
            return res.status(404).json({error:"This teacher doesn't have activities."});
        }

        return res.status(200).json({activities:activities});
    }
    catch(e)
    {
        console.log("Error finding activities for this teacher:",e);
        return res.status(500).json({error:"Internal server error."});
    }
});


app.post('/validate-code',async (req,res)=>{
              
        if(!req.auth || req.auth.role!=='student')
            {
                return res.status(403).json({error:'Only students can use this code.'});
            }
        
        const{activity_id, code_activity}=req.body;

        if(!activity_id || !code_activity)
        {
            return res.status(400).json({error:"You should choose an activity and add activity code"});
        }

    try{
        const chosen_activity=await activity.findOne({
                where:
                {
                    activitiesId:activity_id
                },
                attributes:['activitiesId','code','title','description','start_date','end_date']
        });

        if(!chosen_activity)
        {
            return res.status(404).json({error:"Not found"});
        }

       if(Number(chosen_activity.code) === Number(code_activity))
       {
            return res.status(200).json({message:"Activity code is valid: ",chosen_activity});
       }
       else{
        return res.status(400).json({error:"Invalid activity code."});
       }

    }
    catch(e)
    {
        console.log("Error validating activity code:",e);
        return res.status(500).json({error:"Internal server error."});
    }
});

app.post('/student_feedback',async (req,res)=>{
    if(!req.auth || req.auth.role!=='student')
        {
            return res.status(403).json({error:'Only students can provide feedback.'});
        }
    
    const {activity_id,emoji}=req.body;
    if(!activity_id || !emoji)
    {
        return res.status(400).json({error:'Activity ID or emoji is missing'});
    }
    try{
        const exist=await activity.findOne({
            where:{activitiesId:activity_id},
            attributes:['end_date']
        });
        
        if(!exist)
        {
            return res.status(404).json({error:'Activity not found.'});
        }

        const current_date=new Date();
        const activity_end_date=new Date(exist.end_date);
        if(activity_end_date<current_date)
        {
            return res.status(400).json({error:'This activity is no long available.'})
        }

        const newReaction=await reaction.create({
            activityId:activity_id,
            studentId:req.auth.userId,
            emoji:emoji,
            timestamp:current_date
        });

        res.status(200).json({message:'Feedback created:',reaction:newReaction});
    }
    catch(e)
    {
        console.log("Error from creating reaction:",e);
        return res.status(500).json({error:"Internal server error."});
    }
});

app.get('/teacher-activities', async (req, res) => {
    try {
      if (!req.auth || req.auth.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can access activities' });
      }
  
      const activities = await activity.findAll({
        where: { teacherId: req.auth.userId },
        attributes: ['activitiesId', 'title', 'code', 'start_date', 'end_date'],
        include: [{
          model: reaction,
          attributes: ['emoji', 'timestamp', 'studentId'],
        }],
        order: [['start_date', 'ASC']],
      });
      console.log(activities);
  
      if (activities.length === 0) {
        return res.status(404).json({ message: 'No activities found for this teacher' });
      }
  
      return res.status(200).json({ activities });
    } catch (error) {
      console.error('Error fetching teacher activities:', error);
      return res.status(500).json({ error: 'Server error' });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running now on port ${PORT}`);
});
