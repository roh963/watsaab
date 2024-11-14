const asyncHandler = (resolveHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(resolveHandler(req,res, next)).catch((err)=>next(err));
    }
}
export {asyncHandler}