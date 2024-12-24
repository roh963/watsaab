import cloudinary from "cloudinary"
import fs from "fs"
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from "../../config.js";


cloudinary.config({ 
  cloud_name:CLOUDINARY_CLOUD_NAME, 
  api_key:CLOUDINARY_API_KEY, 
  api_secret:CLOUDINARY_API_SECRET 
});
console.log("Cloudinary Config:", cloudinary.config());


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.v2.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "watsaab.users", 

        }).catch((error) => {console.log(error);
        })
          

        // File has been uploaded successfully
        console.log("File is uploaded on Cloudinary: ", response.url);

        // Delete the local temporary file after successful upload
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        // If upload fails, delete the local file and return null
        fs.unlinkSync(localFilePath);
        console.error("Error uploading to Cloudinary:", error);
        return null;
    }
}




export {uploadOnCloudinary}