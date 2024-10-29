import { ApiResponse } from "../utils/ApiResponse";

const authorize = (requiredroles)=>{
     return  (req,res, next)=>{
        try {
           const userrole=  req.user && req.user.role
           if (! requiredroles.includes(userrole) ) {
            return res.status(403).json( new ApiResponse(403,null,"access denied you do not have permission"))
           }
           next()
        } catch (error) {
            return res.status(500).json( new ApiResponse(500,null,"authorization error"))
        }
     }
}
export default  authorize;