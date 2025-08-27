const Express = require('express')
const isAuth = require('../middleware/isAuth')
const Image64Model = require('../models/Image64')
const BlobModel = require('../models/Blob')
const ImageRouter = Express.Router()
const fs =require("fs");
const path = require("path") ;
const  Busboy = require("busboy");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

ImageRouter.post('/upload-base64-image', isAuth, async (req, res) => { 
    try {   
        const { image } = req.body
        console.log('Received image data:', image)
        if (!image) {
            return res.status(400).json({ message: 'Image data is required.' })
        }

        const newImage = new Image64Model({ image64: image })
        await newImage.save()

        res.status(201).json({ message: 'Image saved successfully.', imageId: newImage._id }) 
    } catch (error) {
        console.error('Error saving image:', error)
        res.status(500).json({ message: 'Internal server error.' })
    }
})

ImageRouter.get('/fetchbase64images', isAuth, async (req, res) => {
    try {
        const images = await Image64Model.find()
        return res.status(200).json({ success: true, images : images })
    } catch (error) {
        console.error('Error fetching images:', error)
        res.status(500).json({ message: 'Internal server error.' })
    }
})


// ImageRouter.post('/upload-blob-image', isAuth, async (req, res) => {
//     try {
//         const { image } = req.body;
//         if (!image) {
//             return res.status(400).json({ success: false, message: "No image data" });
//         }

//         // Database la save
//         const newImage = new BlobModel({ image });
//         await newImage.save();

//         res.json({ success: true, message: "Image uploaded", id: newImage._id });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });


ImageRouter.post("/upload-blob-image", isAuth, upload.single("file"), async (req, res) => {
    try {
        console.log("File saved:", req.file);

        // Example: save metadata to DB
        const newImage = new BlobModel({
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });
        await newImage.save();

        res.status(201).json({ success: true, message: "Blob image saved", imageId: newImage._id });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = ImageRouter 