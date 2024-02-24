const Button = ({
  label = "Button",
  type = "submit",
  className = "",
  disabled = false,
}) => {
  return (
    <button
      type={type}
      className={`text-white bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-1/2  px-5 py-2.5 text-center ${className}`}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
