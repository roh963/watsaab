import fs from "fs"
import mongoose from "mongoose"
import logger from "../logger/winston.logger"

 // filter object  
export const filterObjectKeys = (fieldsArray,objectArray)=>{
    const filterArray = structuredClone(objectArray).map((originalobj)=>
    {
        let obj ={};
        structuredClone(fieldsArray)?.forEach((field)=>{
            if (field?.trim() in originalobj) {
                obj[field] = originalobj[field];
            }
        });
        if (object.keys(obj).length > 0) return obj
        return originalobj
    });
    return filterArray
}
 // Paginated response 
 export const getPaginatedPayload = (dataArray, page , limit )=>{
    const startPosition = +(page-1)*limit;
    const totalItems = dataArray.length;
    const totalPages = Math.ceil(totalItems/limit);   // extra page for extra items
    dataArray= structuredClone(dataArray).slice(startPosition, startPosition+limit);
    const payload = {
        page,
        limit,
        totalPages,
        previousPage: page > 1,
        nextPage : page < totalPages,
        totalItems,
        currentPageItems:dataArray?.length,
        data: dataArray
    }
   return payload
}
// server file convert in url
export const getStaticFilePath = (req, fileName) => {
    return `${req.protocol}://${req.get("host")}/images/${fileName}`;
  };


// send a file url 
  export const getLocalPath = (fileName) => {
    return `public/images/${fileName}`;
  };


  // remove file
   export const removeLocalFile = (localPath)=>{
    fs.unlink(localPath,(err)=>{
        if(err) logger.error ("Error while removing local files",err)
            else{
        logger.info("removed local:",localPath)}
    });
   }

// remove image that not be a used throught multer 
export const removeUnusedMulterImageFilesOnError = (req)=>{
    try {
        const multerFile = req.file;
        const multerFiles = req.files;

        if (multerFile) {
            removeLocalFile(multerFile.path)
        }
        if (multerFiles) {
            const filesValueArray = Object.values(multerFiles)
            filesValueArray.map((fileFields)=>{
                fileFields.map((fieldOject)=>{
                    removeLocalFile(fieldOject.path) 
                })
            })
            
        }

    } catch (error) {
        logger.error("Error while removing image files: ", error); 
    }
}


// mongoose pagination

export const getMongoosePagination= ({
    page=1,
    limit=10,
    customLabels
})=>{
    return {
        page :Math.max(page,1),
        limit :Math.max(limit,1),
        pagination: true,
        customLabels:{
            pagingCounter:"serialNumberStartFrom",
            ...customLabels
        }
    }
}

// get random number
export const getRandomNumber = (max) => {
    return Math.floor(Math.random() * max);
  };