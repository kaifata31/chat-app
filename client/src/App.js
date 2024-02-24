import "./App.css";
import Dashboard from "./modules/Dashboard";
import Form from "./modules/Form";
import { Routes, Route, Navigate } from "react-router-dom";
function App() {
  const ProtectedRoute = ({ children, auth = false }) => {
    const isLoggedIn = localStorage.getItem("user:token") !== null || false;

    if (!isLoggedIn && auth) {
      return <Navigate to={`/users/signin`} />;
    } else if (
      isLoggedIn &&
      ["/users/signin", "/users/signup"].includes(window.location.pathname)
    ) {
      return <Navigate to={`/`} />;
    }

    return children;
  };

  return (
    // <div className="bg-[#051526] min-h-screen flex justify-center items-center">
    //   {/* <Form /> */}
    //   <Dashboard />
    // </div>
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute auth={true}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/signin"
        element={
          <ProtectedRoute>
            <Form isSigninPage={true} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/signup"
        element={
          <ProtectedRoute>
            <Form isSigninPage={false} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
