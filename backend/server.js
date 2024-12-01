import dotenv from 'dotenv';
dotenv.config();

import express from 'express'
import { getUserByEmail,migrate } from './data_base/index.js';
import { user } from './data_base/users.model.js';
import { activity } from './data_base/activities.model.js';
import { expressjwt } from "express-jwt";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { reaction } from './data_base/reactions.model.js';

const jwtSecret = process.env.JWT_SECRET;

const app=express();
app.use(express.json());
migrate();

app.use(expressjwt({
    secret:jwtSecret,
    algorithms:['HS256']
}).unless({
    path:['/login'] //endpointuri excluse
}));

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

        
        return res.status(200).json({ message: 'Login successful', token });
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

        const lastActivity = await activity.findOne({ order: [['code', 'DESC']] });
        const nextCode = lastActivity ? lastActivity.code + 1 : 1;
        
        const newActivity=await activity.create({
            title,
            description,
            code:nextCode,
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

app.get('/teacher-activities', async (req,res)=>{
    try{
    
        if (!req.auth || req.auth.role !== 'teacher') {
            return res.status(403).json({ error: 'Only teachers can access activities' });
        }

        const activities = await activity.findAll({
            where: { teacherId: req.auth.userId },
            order: [['start_date', 'ASC']]
        });

        if (activities.length === 0) {
            return res.status(200).json({
                message: 'No activities found for this teacher'
            });
        }

        return res.status(200).json({
            message: 'Activities retrieved successfully',
            activities,
        });
    } catch (error) {
        console.error('Error fetching teacher activities:', error);
        return res.status(500).json({ error: 'Server error' });
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
                attributes:['activitiesId','code','title']
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
            where:{activitiesId:activity_id}
        });
        
        if(!exist)
        {
            return res.status(404).json({error:'Activity not found.'});
        }

        const reaction=await reaction.create({
            activityId:activity_id,
            studentId:req.auth.userId,
            emoji:emoji,
            timestamp:new Date()
        });

        res.status(200).json({message:'Feedback created'});
    }
    catch(e)
    {
        console.log("Error from creating reaction:",e);
        return res.status(500).json({error:"Internal server error."});
    }
});

app.get('/multiple-reactions/:activityId', async (req,res)=>{
    
    if (!req.auth || req.auth.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can access activities' });
    }

    const {activityId}=req.params;

    try{
        const multiple_reactions=await reaction.findAll({
            where:{activityId:activityId},
            attributes:['emoji','timestamp','studentId'],
            order:[['timestamp','ASC']]
        })

        if(multiple_reactions===0)
        {
            return res.status(200).json({ error: "You don't have feedback for this activity." });
        }

        return res.status(200).json(multiple_reactions);
    }
    catch(e)
    {
        console.log("Error from fetching feedback:",e);
        return res.status(500).json({error:"Internal server error."});
    }
});

app.listen(3001,()=>{
    console.log('has started');
});