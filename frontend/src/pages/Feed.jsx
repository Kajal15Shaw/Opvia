// src/pages/Feed.jsx
import React, { useEffect, useState } from "react";
import { fetchPosts, likePost, createComment } from "../api";
import PostCard from "../components/PostCard";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

export default function Feed({ currentUserId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  console.log("Feed mounted. currentUserId:", currentUserId);
  loadPosts();
}, []);

const loadPosts = async () => {
  console.log("loadPosts called");
  try {
    setLoading(true);
    setError(null);
    const response = await fetchPosts();
    console.log("fetchPosts response:", response);

    const fetchedPosts = response?.posts ?? [];
    console.log("Fetched posts:", fetchedPosts);

    setPosts(fetchedPosts);
  } catch (err) {
    console.error("Error inside fetchPosts:", err);
    setError("Failed to load posts. Please try again later.");
  } finally {
    setLoading(false);
    console.log("Loading complete");
  }
};

  const handleLike = async (postId) => {
  try {
    const response = await likePost(postId);

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id === postId) {
          // fallback: if response has likedBy, use it; otherwise toggle locally
          const updatedLikedBy = response.likedBy
            ? response.likedBy
            : post.likedBy?.includes(currentUserId)
              ? post.likedBy.filter((id) => id !== currentUserId) // unlike
              : [...(post.likedBy || []), currentUserId]; // like

          const updatedLikeCount = response.like ?? updatedLikedBy.length;

          return {
            ...post,
            like: updatedLikeCount,
            likedBy: updatedLikedBy,
          };
        }
        return post;
      })
    );
  } catch (err) {
    console.error("Error liking post:", err);
    alert(err.response?.data?.message || "Failed to like post.");
  }
};



  const handleComment = async (writerId, postId, commentData) => {
  try {
    const response = await createComment(writerId, postId, commentData);

    // If API didn't return the comment for any reason, just refetch posts safely
    if (!response || !response.comment) {
      await loadPosts();
      return response;
    }

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: [...(post.comments || []), response.comment],
          commentIds: response.comment?._id
            ? [...(post.commentIds || []), response.comment._id]
            : (post.commentIds || []),
          commentCount:
            typeof response.commentCount === "number"
              ? response.commentCount
              : (post.commentCount || 0) + 1,
        };
      })
    );

    return response;
  } catch (err) {
    console.error("Error creating comment:", err);
    alert(err?.response?.data?.message || "Failed to add comment.");
    throw err;
  }
};



  const handleCreatePost = () => {
    navigate("/create-post");
  };

  return (
    <div className="page-container">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Home Feed</h2>

      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm flex justify-between items-center">
        <p className="text-blue-800 font-medium">What's on your mind?</p>
        <Button onClick={handleCreatePost}>Create New Post</Button>
      </div>

      {loading && <p className="text-center text-gray-600">Loading posts...</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="text-center text-gray-600">No posts yet. Be the first to create one!</p>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}