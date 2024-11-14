import express,{Router} from "express"

const  router = Router();

router.get('/',(req,res)=>{
    res.send(`<h1> hello get request chat </h1>`)
})

export default router;