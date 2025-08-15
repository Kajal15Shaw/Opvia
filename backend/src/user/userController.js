import createHttpError from "http-errors"
import Joi from "joi";
import userModel from "./userModel.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from "../config/config.js";

const createUser = async (req, res, next) => {

    const { name, email, password } = req.body;

    if(!name || !email || !password) {
        return next(createHttpError(401,'All fields required'));
    }

    //Validation

    const userSchema = Joi.object({
        name: Joi.string()
            .min(3)
            .max(30)
            .required()
            .messages({
            "string.empty": "Name is required",
            "string.min": "Name must be at least 3 characters long",
            "string.max": "Name must not be more than 30 characters long"
            }),

        email: Joi.string()
            .email({ tlds: { allow: false } }) // disables TLD enforcement (so test@test.local works too)
            .required()
            .messages({
            "string.empty": "Email is required",
            "string.email": "Email must be a valid email address"
        }),

        password: Joi.string()
            .min(8)
            .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"))
            .required()
            .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 8 characters long",
            "string.pattern.base": "Password must contain at least one uppercase, one lowercase, one number, and one special character"
        })
    });

    const { error } = userSchema.validate(req.body);

    if(error) {
        return next(createHttpError(401, error instanceof Error ? error.message : 'Data Validation Failed'));
    }

    //Check if user already exists in the database

    let existingUser;

    try {
        existingUser = await userModel.findOne({ email });
    } catch (err) {
        console.error('Database Error',err);
    }

    if (existingUser) {
        return next(createHttpError(400, 'User already exists'));
    }

    //Hashing the password

    const hashedPassword = await bcrypt.hash(password, 10)

    //Creating the user in the Database/Model

    let user;

    try {
        user = await userModel.create({
        Username : name,
        email,
        password : hashedPassword
    });
    } catch (err) {
        console.error('Database Error', err);
    }

    if (!user) {
        return next(createHttpError(500, "User could not be created"));
    }


    //JWT token gneration

    const token = jwt.sign(
        { sub : user._id.toString() },
        config.secret,
        { expiresIn : "30d" }
    );

    res.status(201).json({'token' : token});

}

const login = async(req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return next(createHttpError(400,'All fields required'));
    } 

    //Joi validation

    const schema = Joi.object({
        email : Joi.string().email().required(),
        password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);

    if(error) {
        return next(createHttpError(401, error.message));
    }

    //Check in the Database

    let user;

    try {
        user = await userModel.findOne({ email });
    } catch (err) {
        console.error(err);
        return next(createHttpError(500, 'Unable to fetch user'));
    }

    if(!user) {
        return next(createHttpError(401, 'No user exists'));
    }

    //Verify Password

    const VerifyPassword = await bcrypt.compare(password, user.password);

    if(!VerifyPassword) {
        return next(createHttpError(401, 'Password not matched'));
    }

    //Token Generation

    const token = jwt.sign({ sub : user._id }, config.secret, { expiresIn: "30d" });

    res.status(200).json({'token':token});
}

const getUserById = async(req, res, next) => {
   try {
        const user = await userModel.findById(req.params.id);

        if (!user) {
            return next(createHttpError(404, 'User not found'));
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        return next(createHttpError(500, 'Error fetching user'));
    }
}
const updateUserById = async (req, res, next) => {
    try {
        const updateData = { ...req.body };

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const user = await userModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return next(createHttpError(404, 'User not found'));
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        return next(createHttpError(500, 'Error updating user'));
    }
};

export { createUser, login, getUserById, updateUserById }