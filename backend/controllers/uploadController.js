const uploadImage = (req,res)=>{
  if(!req.file){
    return res.status(400).json({ message: "No file uploaded"});
  }
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.status(200).json({ url: fileUrl });
  
}

module.exports = { uploadImage };