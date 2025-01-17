import {
  Box,
  Button,
  CloseButton,
  Flex,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { CreatePostLogo } from "../../assets/constants";
import { BsFillImageFill } from "react-icons/bs";
import { useEffect, useRef, useState } from "react";
import usePreviewImage from "../../hooks/usePreviewImage";
import useShowToast from "../../hooks/useShowToast";
import useAuthStore from "../../store/authStore";
import usePostStore from "../../store/postStore";
import useUserProfileStore from "../../store/userProfileStore";
import { useLocation } from "react-router-dom";
import axios from "axios";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

const CreatePost = () => {
  const [image, setImage] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [caption, setCaption] = useState("");
  const imageRef = useRef(null);
  const { handleImageChange, selectedFile, setSelectedFile } =
    usePreviewImage();
  const showToast = useShowToast();
  const { isLoading, handleCreatePost } = useCreatePost();

  useEffect(() => {
    if (selectedFile) {
      const base64ToBlob = (base64) => {
        const byteString = atob(base64.split(",")[1]);
        const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], { type: mimeString });
      };

      const base64Image = selectedFile; // Your Base64 string
      const blob = base64ToBlob(base64Image);
      setImage(new File([blob], "image.png"));
    }
  }, [selectedFile]); // Only run this effect when `selectedFile` changes

  const handlePostCreation = async () => {
    try {
      await handleCreatePost(image, caption);
      onClose();
      setCaption("");
      setSelectedFile(null);
      setImage(null);
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  return (
    <>
      <Tooltip
        hasArrow
        label={"Create"}
        placement="right"
        ml={1}
        openDelay={500}
        display={{ base: "block", md: "none" }}
      >
        <Flex
          alignItems={"center"}
          gap={4}
          _hover={{ bg: "whiteAlpha.400" }}
          borderRadius={6}
          p={2}
          w={{ base: 10, md: "full" }}
          justifyContent={{ base: "center", md: "flex-start" }}
          onClick={onOpen}
        >
          <CreatePostLogo />
          <Box display={{ base: "none", md: "block" }}>Create</Box>
        </Flex>
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />

        <ModalContent bg={"black"} border={"1px solid gray"}>
          <ModalHeader>Create Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Textarea
              placeholder="Post caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <Input
              type="file"
              hidden
              ref={imageRef}
              onChange={handleImageChange}
            />

            <BsFillImageFill
              onClick={() => imageRef.current.click()}
              style={{
                marginTop: "15px",
                marginLeft: "5px",
                cursor: "pointer",
              }}
              size={16}
            />

            {selectedFile && (
              <Flex
                mt={5}
                w={"full"}
                position={"relative"}
                justifyContent={"center"}
              >
                <Image src={selectedFile} alt="selected image" />
                <CloseButton
                  position={"absolute"}
                  top={2}
                  right={2}
                  onClick={() => setSelectedFile(null)}
                  bg={"black"}
                />
              </Flex>
            )}
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={handlePostCreation} isLoading={isLoading}>
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreatePost;

function useCreatePost() {
  const showToast = useShowToast();
  const [isLoading, setIsLoading] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const createPost = usePostStore((state) => state.createPost);
  const addPost = useUserProfileStore((state) => state.addPost);
  const userProfile = useUserProfileStore((state) => state.userProfile);
  const { pathname } = useLocation();

  const handleCreatePost = async (selectedFile, caption) => {
    if (isLoading) return;
    if (!selectedFile) throw new Error("Please select an image");
    setIsLoading(true);
    const newPost = {
      caption: caption,
      likes: [],
      comments: [],
      createdAt: Date.now(),
      createdBy: authUser.uid,
    };

    try {
      const postDocRef = await addDoc(collection(firestore, "posts"), newPost);
      const userDocRef = doc(firestore, "users", authUser.uid);

      await updateDoc(userDocRef, { posts: arrayUnion(postDocRef.id) });

      let downloadUrl = "";
      if (selectedFile) {
        const data = new FormData();
        data.append("file", selectedFile); // Add the image file
        data.append("upload_preset", "usUploadPreset"); // Replace with your preset name
        data.append("folder", "posts"); // Specify the folder
        data.append("public_id", postDocRef.id); // Rename the file with Post ID
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dsrmejtxm/image/upload`,
          data
        );

        // const uploadedImageUrl = response.data.secure_url;

        // const result = await response.json();
        console.log("Cloudinary response:", response);
        if (response.statusText == "OK") {
          // setUploadedUrl(result.secure_url);
          downloadUrl = response.data.secure_url;
          console.log("Image uploaded successfully!");
          console.log(response.data.secure_url);
        } else {
          showToast("Upload failed:", response.error.message, "error");
        }
      }

      await updateDoc(postDocRef, { imageUrl: downloadUrl });

      newPost.imageUrl = downloadUrl;

      if (userProfile.uid === authUser.uid)
        createPost({ ...newPost, id: postDocRef.id });

      if (pathname !== "/" && userProfile.uid === authUser.uid)
        addPost({ ...newPost, id: postDocRef.id });

      showToast("Success", "Post created successfully", "success");
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleCreatePost };
}
