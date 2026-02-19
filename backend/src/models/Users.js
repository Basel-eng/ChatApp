import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    min: 3,
    max: 100,
    required: true,
  },
  email: {
    type: String,
    min: 5,
    max: 100,
    required: true,
  },
  password: {
    type: String,
    min: 6,
    max: 100,
    required: true,
  },
  profilePic:{
    type:String
  }
});

const Users = mongoose.model("users", userSchema);
export default Users;
