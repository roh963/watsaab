 import   jwt  from 'jsonwebtoken';
 import { ACCESS_TOKEN_SECRET } from "../../config.js";
import { ApiResponse } from '../utils/ApiResponse.js';

 const authenticationToken= async (req,res,next)=>{
    const token = req.headers["authorization"]?.split(" ")[1];

    if (! token) {
       return res.status(401).json( new ApiResponse(401, null, "error in token"))
    }
    try {
        const decode= jwt.verify(token,ACCESS_TOKEN_SECRET)

        req.user= decode
        next();
    } catch (error) {
        return res(403).json(new ApiResponse(403,null,"expired the token"))
    }
 }
 export default authenticationToken;