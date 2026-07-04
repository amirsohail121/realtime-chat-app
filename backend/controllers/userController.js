const User = require('../models/User');

const searchUsers = async(req,res)=>{
  const query = req.query.query;

  if(!query){
    return res.status(400).json({message:"Search query is required"});
  }
  try{
    const users = await User.find({
      $or:[
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      _id:{$ne:req.user._id},
    }).select("_id name email profilePic bio ");
    res.status(200).json(users);
  }catch(err){
    return res.status(500).json({message:err.message})
  }
}

module.exports = { searchUsers };