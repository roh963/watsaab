import multer from "multer";
import path from 'path'

const allowedFileTypes = /jpeg|jpg|png/;

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, "./public/images"); 
    },
    filename:(req,file,cb)=>{
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        const filenameWithoutExtension = file.originalname
        .toLowerCase() 
        .split(" ") 
        .join("-")  
        ?.split(".")[0];
        
        const uniqueSuffix = `${Date.now()}-${Math.ceil(Math.random() * 1e5)}`;
        cb(null, `${filenameWithoutExtension}-${uniqueSuffix}${fileExtension}`);
    }
})

const fileFilter = (req, file, cb) => {
    const extname = allowedFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error("Only .png, .jpg, and .jpeg format allowed!"));
      }
    };

const upload = multer({storage ,limits:{fileSize:1*1000*1000 },fileFilter})
 
export {upload} 