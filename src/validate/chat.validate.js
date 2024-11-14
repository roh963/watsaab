import { body } from "express-validator";

export const createAGroupChatValidator = () => {
     return [
        body("name").trim().notEmpty().withMessage("Group name is required"),
        body("participants").isArray({min:2,max:100,}).withMessage( "Participants must be an array with more than 2 members and less than 100 members")
     ]
}

export const updateGroupChatNameValidator =()=>{
    return  [
        body("name").trim().notEmpty().withMessage("Group name is required")
    ]
}