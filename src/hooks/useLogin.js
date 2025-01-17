import useShowToast from "./useShowToast.js";
import { auth, firestore } from "../firebase/firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import useAuthStore from "../store/authStore.js";

const useLogin = () => {
  const showToast = useShowToast();
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const loginUser = useAuthStore((state) => state.login);

  const login = async (inputs) => {
    if (!inputs.email || !inputs.password) {
      return showToast("Error", "Please fill in all fields", "error");
    }
    try {
      const userCred = await signInWithEmailAndPassword(
        inputs.email,
        inputs.password
      );

      if (userCred) {
        const docRef = doc(firestore, "users", userCred.user.uid);
        const docSnap = await getDoc(docRef);
        localStorage.setItem("user-info", JSON.stringify(docSnap.data()));
        loginUser(docSnap.data());
      }
    } catch (error) {
      // console.log(error);
    }
  };

  return { loading, error, login };
};

export default useLogin;
