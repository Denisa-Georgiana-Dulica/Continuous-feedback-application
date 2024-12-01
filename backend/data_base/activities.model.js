import { DataTypes } from "sequelize";
import { sequelize } from "./data_base.js";
import { user } from "./users.model.js";


export const activity=sequelize.define('Activities',{
    activitiesId:{
        type:DataTypes.UUID,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4
    },
    title:{
        type:DataTypes.STRING,
        allowNull:false,
        validate:{notEmpty:true}
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:false,
        validate:{notEmpty:true}
    },
    code:{ 
        type:DataTypes.INTEGER,
        allowNull:false,
        unique:true,
    },
    start_date:{ 
        type:DataTypes.DATE,
        allowNull:false
    },
    end_date:{ 
        type:DataTypes.DATE,
        allowNull:false
    },
    teacherId:{
        type:DataTypes.UUID,
        allowNull:false,
        references:{
            model:user,
            key:'userId'
        },
        onDelete:'SET NULL',
        onUpdate:'CASCADE' 
        
    }
   
});


user.hasMany(activity,{foreignKey:'teacherId'});
activity.belongsTo(user,{foreignKey:'teacherId'});
