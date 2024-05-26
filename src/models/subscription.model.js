import mongoose,{Schema, Types} from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, // the user subscibing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, // the channel subscibing
        ref:"User"
    }
},{timestamps:true});

export const Subscription = mongoose.model("Subscription",subscriptionSchema)