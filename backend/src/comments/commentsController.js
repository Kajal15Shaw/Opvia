import createHttpError from "http-errors";
import commentsModel from "./commentsModel.js";
import userModel from '../user/userModel.js';
import postModel from '../post/postModel.js'
import userProfileModel from "../userProfile/userProfileModel.js";

const createComment = async( req, res, next ) => {
    const { writerId, postId } = req.params;

    const { id, message } = req.body; //post owner's Id

    if(!writerId || !id || !message ||!postId) {
        return next(createHttpError(401, 'All fields required'));
    }

    //Fetching user

    let user;

    try {
        user = await userModel.findOne({ _id : req.userId });
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'unable to fetch user'));
    }

    if(!user) {
        return next(createHttpError(404, 'No user found'));
    }

    //Fetching the user Profile

    let userProfile;

    try {
        userProfile = await userProfileModel.findOne({ name : user.Username });
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'Unable to fetch user profile'));
    }

    if(!userProfile) {
        return next(createHttpError(404, 'user profile not found'));
    }

    if(writerId !== userProfile._id.toString()) {
        return next(createHttpError(401, 'Unauthorized'));
    }

    //Finding post 

    let post;

    try {
        post = await postModel.findOne({ _id : postId });
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'Unable to fetch post'));
    }

    if(!post) {
        return next(createHttpError(404, 'Post not found'));
    }

    const commentIdList = post.commentIds;

    let comment;

    try {
        comment = await commentsModel.create({
            from : writerId,
            to: id,
            message
        })
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'unable to find and update comment'));
    }

    commentIdList.push(comment._id);

    //Adding this comment to post's commentIds

    let updatedPost;

    try {
        updatedPost = await postModel.findOneAndUpdate(
            { _id : postId },
            { commentIds : commentIdList },
            { new : true }
        );
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'Database Error'));
    }

    if(updatedPost) {
        res.status(201).json({
            'message' : 'comment created successfully',
            comment,
            commentCount: updatedPost.commentIds.length,
            postId: updatedPost._id,
});
    } else {
        res.status(500).json({'error' : 'Internal Server Error'});
    }

}

const getCommentById = async( req, res, next ) => {
    const { id } = req.params; //commentID

    if(!id) {
        return next(createHttpError(400, 'id is required'));
    }

    let comment;

    try {
        comment = await commentsModel.findOne({ _id : id });
    } catch (err) {
        return next(createHttpError(401, err instanceof Error ? err.message : 'failed to fetch comment'));
    }

    if(!comment) { 
        return next(createHttpError(404, 'Comment not found'));
    }

    res.status(200).json({comment});
}

const deleteComment = async( req, res, next ) => {
    const { id } = req.params; //Comment Id

    if(!id) {
        return next(createHttpError(400, 'id is required'));
    }

    let user;

    try {
        user = await userModel.findOne({ _id : req.userId });
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'unable to fetch user'));
    }

    if(!user) {
        return next(createHttpError(404, 'No user found'));
    }

    //Fetching comment from id

    let comment;

    try {
        comment = await commentsModel.findOne({ _id : id });
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'Unable to fetch comment'));
    }

    if(!comment) {
        return next(createHttpError(404, 'No comment found'));
    }

    //Fetching the user Profile

    let userProfile;

    try {
        userProfile = await userProfileModel.findOne({ name : user.Username });
    } catch (err) {
        return next(createHttpError(400, err instanceof Error ? err.message : 'Unable to fetch user profile'));
    }

    if(!userProfile) {
        return next(createHttpError(404, 'user profile not found'));
    }

    //Checking if the user is the owner of comment
    
    if(comment.from !== userProfile._id.toString()) {
        return next(createHttpError(401, 'Unauthorized'));
    }

    //Deleting the comment

    let deleteComment;

    try {
        deleteComment = await commentsModel.deleteOne({ _id : id });
    } catch (err) {
        return next(createHttpError(404, err instanceof Error ? err.message : 'Comment not found'));
    }

    if(deleteComment) {
        res.status(200).json({'message':'comment deleted successfully'});
    } else {
        res.status(500).json({'error':'Internal Server Error'});
    }
    
}

export { createComment, getCommentById, deleteComment }