import { DataTypes } from "sequelize";
import { sequelize } from "./data_base.js";
import { activity } from "./activities.model.js";
import { user } from "./users.model.js";

export const reaction=sequelize.define('Reactions',{
    reactionId:{
        type:DataTypes.UUID,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4
    },
    activityId:{
        type:DataTypes.UUID,
        allowNull:false,
        references:{
            model:activity,
            key:'activitiesId'
        }
    },
    studentId:{
        type:DataTypes.UUID,
        allowNull:false,
        references:{
            model:user,
            key:'userId'
        }
    },
    emoji:{
        type:DataTypes.STRING,
        allowNull:false
    },
    timestamp:{
        type:DataTypes.DATE,
        allowNull:false,
        defaultValue:DataTypes.NOW

    }
});

activity.hasMany(reaction,{foreignKey:'activityId'});
reaction.belongsTo(activity,{foreignKey:'activityId'});

user.hasMany(reaction,{foreignKey:'studentId'});
reaction.belongsTo(user,{foreignKey:'studentId'});