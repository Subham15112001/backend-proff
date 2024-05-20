const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        // new Promise((resolve,reject)=>{
        //     resolve(requestHandler(req,res,next));
        // }).catch((err) => next(err))

        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err));
    }
}

export {asyncHandler}