import { useState } from "react";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import useUserProfileStore from "../store/userProfileStore";
import axios from "axios";

const useEditProfile = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const setUserProfile = useUserProfileStore((state) => state.setUserProfile);
  const showToast = useShowToast();
  // const [uploadedUrl, setUploadedUrl] = useState("");

  const editProfile = async (inputs, selectedFile) => {
    if (isUpdating || !authUser) return;
    setIsUpdating(true);

    const userDocRef = doc(firestore, "users", authUser.uid);

    try {
      let imageUrl = authUser.profilePictureUrl;

      if (selectedFile) {
        const data = new FormData();
        data.append("file", selectedFile); // Add the image file
        data.append("upload_preset", "usUploadPreset"); // Replace with your preset name
        data.append("folder", "profilePic"); // Specify the folder
        data.append("public_id", userDocRef.id); // Rename the file with Post ID
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dsrmejtxm/image/upload`,
          data
        );
        console.log(userDocRef.id);
        // const uploadedImageUrl = response.data.secure_url;

        // const result = await response.json();
        console.log("Cloudinary response:", response);
        if (response.statusText == "OK") {
          // setUploadedUrl(result.secure_url);
          imageUrl = response.data.secure_url;
          console.log("Image uploaded successfully!");
          console.log(response.data.secure_url);
        } else {
          showToast("Upload failed:", response.error.message, "error");
        }
      }

      const updatedUser = {
        ...authUser,
        fullName: inputs.fullName || authUser.fullName,
        username: inputs.username || authUser.username,
        bio: inputs.bio || authUser.bio,
        profilePicUrl: imageUrl || authUser.profilePicUrl,
      };
      console.log("Updated user:", updatedUser);

      await updateDoc(userDocRef, updatedUser);
      localStorage.setItem("user-info", JSON.stringify(updatedUser));
      setAuthUser(updatedUser);
      setUserProfile(updatedUser);
      showToast("Success", "Profile updated successfully", "success");
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };
  return { editProfile, isUpdating };
};

export default useEditProfile;
