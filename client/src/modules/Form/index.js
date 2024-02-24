import { useState } from "react";
import Button from "../../Components/Button";
import Input from "../../Components/Input";
import { useNavigate } from "react-router-dom";

function Form({ isSigninPage = true }) {
  const navigate = useNavigate();
  const [data, setData] = useState({
    ...(!isSigninPage && {
      fullName: "",
    }),
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    console.log("data-> ", data);
    e.preventDefault();
    const res = await fetch(
      `http://localhost:8000/api/${isSigninPage ? "login" : "register"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (res.status === 400) {
      alert("Invalid Credentials");
    } else {
      const resData = await res.json();

      if (resData.token) {
        localStorage.setItem("user:token", resData.token);
        localStorage.setItem("user:details", JSON.stringify(resData.user));
        navigate("/");
      }
    }
  };

  return (
    <div className="bg-light h-screen flex items-center justify-center">
      <div className=" bg-white w-[600px] h-[700px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-4xl font-extrabold">
          Welcome {isSigninPage && "Back"}
        </div>
        <div className="text-xl font-light mb-10">
          {isSigninPage ? "Signin to explore" : "Signup to get started"}
        </div>

        <form
          className="flex flex-col items-center w-full"
          onSubmit={(e) => handleSubmit(e)}
        >
          {!isSigninPage && (
            <Input
              label="Full Name"
              name="name"
              placeholder="Enter Your Full Name"
              className="mb-5 w-[50%]"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
          )}

          <Input
            label="Email Address"
            name="email"
            placeholder="Enter Your email"
            className="mb-5 w-[50%]"
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            name="password"
            placeholder="Enter Your Password"
            className="mb-8 w-[50%]"
            // type="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />

          <Button
            label={isSigninPage ? "Sign In" : "Sign Up"}
            className="mb-4"
            type="submit"
          />
        </form>
        <div>
          {isSigninPage
            ? "Didn't have an account?"
            : "Already have an account?"}
          <span
            className="text-primary cursor-pointer underline"
            onClick={() =>
              navigate(`/users/${isSigninPage ? "signup" : "signin"}`)
            }
          >
            {isSigninPage ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Form;
