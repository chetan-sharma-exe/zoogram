import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore";
import useUserProfileStore from "../store/userProfileStore";
import useShowToast from "./useShowToast";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const useFollowUser = (userId) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFollowing, setIsFollowing] = useState(() => {
    // Initialize with the correct following state from authUser
    const userInfo = JSON.parse(localStorage.getItem("user-info"));
    return userInfo?.following?.includes(userId) || false;
  });
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const { userProfile, setUserProfile } = useUserProfileStore();
  const showToast = useShowToast();

  const handleFollowUser = async () => {
    setIsUpdating(true);
    try {
      const currentUserRef = doc(firestore, "users", authUser.uid);
      const userToFollowOrUnfollowRef = doc(firestore, "users", userId);

      // First update the database
      await Promise.all([
        updateDoc(currentUserRef, {
          following: isFollowing ? arrayRemove(userId) : arrayUnion(userId),
        }),
        updateDoc(userToFollowOrUnfollowRef, {
          followers: isFollowing
            ? arrayRemove(authUser.uid)
            : arrayUnion(authUser.uid),
        }),
      ]);

      // Then update all local state
      const updatedFollowing = isFollowing
        ? authUser.following.filter((uid) => uid !== userId)
        : [...authUser.following, userId];

      const updatedAuthUser = {
        ...authUser,
        following: updatedFollowing,
      };

      // Update all states at once
      setAuthUser(updatedAuthUser);
      setIsFollowing(!isFollowing);

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          followers: isFollowing
            ? userProfile.followers.filter((uid) => uid !== authUser.uid)
            : [...userProfile.followers, authUser.uid],
        });
      }

      // Update localStorage
      localStorage.setItem("user-info", JSON.stringify(updatedAuthUser));
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update isFollowing when authUser changes
  useEffect(() => {
    if (authUser?.following) {
      setIsFollowing(authUser.following.includes(userId));
    }
  }, [authUser, userId]);

  return { isUpdating, isFollowing, handleFollowUser };
};

export default useFollowUser;
