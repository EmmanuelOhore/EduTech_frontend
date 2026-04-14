import { ErrorMessage, Field } from "formik";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type InputProps = {
  type: string;
  name: string;
  label?: string;
  placeholder?: string;
  className?: string;
};

const Inputfield = ({ type, name, label, placeholder, className }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex w-full flex-col gap-2 max-phoneL:gap-1">
      {label && (
        <label
          htmlFor={name}
          className={`text-sm font-semibold text-slate-700 max-phoneL:text-xs ${className ?? ""}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Field
          id={name}
          type={isPassword && showPassword ? "text" : type}
          name={name}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#184e77] focus:ring-2 focus:ring-[#184e77]/10 max-phoneL:px-3 max-phoneL:py-2 max-phoneL:text-xs"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      <ErrorMessage name={name} component="div" className="text-sm text-red-600" />
    </div>
  );
};

export default Inputfield;
