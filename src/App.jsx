export default function FeedBackLogin() {
  return (
    <div className="bg-background min-h-screen flex text-on-surface font-body-md">
      {/* Split Screen Container */}
      <div className="flex w-full min-h-screen">
        {/* Left Column: 3D Illustration & Gradient Overlay */}
        <div className="hidden lg:flex w-1/2 relative bg-surface-container overflow-hidden items-center justify-center">
          {/* Background Image */}
          <img
            alt="Illustration of food sharing"
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="https://static01.nyt.com/images/2018/03/22/style/22mealshare-1/00mealshare-1-superJumbo.jpg"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-secondary-fixed-dim mix-blend-multiply opacity-80 z-10"></div>

          {/* Subtle Brand Element Overlaid */}
          <div className="relative z-20 flex flex-col items-center text-on-primary text-center px-margin">
            <span className="material-symbols-outlined icon-fill text-[80px] mb-md text-surface-container-lowest drop-shadow-md">
              local_florist
            </span>
            <h2 className="font-display text-display text-surface-container-lowest drop-shadow-md leading-tight">
              FeedBack
              <br />
              Nourishing Communities
            </h2>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-margin md:p-lg relative">
          {/* Login Card */}
          <div className="w-full max-w-[480px] bg-surface-container-lowest rounded-xl shadow-md p-lg border border-outline-variant/30">
            {/* Brand / Header */}
            <div className="mb-margin text-center">
              <h1 className="font-h1 text-h1 text-on-surface mb-xs">
                Welcome Back
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Sign in to continue making an impact.
              </p>
            </div>

            <form className="space-y-md">
              {/* Email / Phone Input */}
              <div>
                <label
                  className="block font-label-md text-label-md text-on-surface mb-xs"
                  htmlFor="identifier"
                >
                  Email or Phone Number
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined">person</span>
                  </div>

                  <input
                    className="block w-full pl-[40px] pr-sm py-sm bg-surface rounded-lg border-2 border-outline-variant text-on-surface shadow-inner placeholder-on-surface-variant/50 focus:border-primary-container focus:ring-0 transition-colors duration-300 ease-out-back font-body-md text-body-md"
                    id="identifier"
                    name="identifier"
                    placeholder="Enter your details"
                    type="text"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  className="block font-label-md text-label-md text-on-surface mb-xs"
                  htmlFor="password"
                >
                  Password
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined">lock</span>
                  </div>

                  <input
                    className="block w-full pl-[40px] pr-sm py-sm bg-surface rounded-lg border-2 border-outline-variant text-on-surface shadow-inner placeholder-on-surface-variant/50 focus:border-primary-container focus:ring-0 transition-colors duration-300 ease-out-back font-body-md text-body-md"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                  />

                  <button
                    className="absolute inset-y-0 right-0 pr-sm flex items-center text-on-surface-variant hover:text-primary transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      visibility_off
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-xs">
                <div className="flex items-center">
                  <input
                    className="h-5 w-5 rounded border-outline-variant text-primary-container focus:ring-primary-container bg-surface transition-colors cursor-pointer"
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                  />

                  <label
                    className="ml-sm block font-body-md text-body-md text-on-surface-variant cursor-pointer"
                    htmlFor="remember-me"
                  >
                    Remember Me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    className="font-label-md text-label-md text-primary-container hover:text-primary transition-colors duration-300"
                    href="#"
                  >
                    Forgot Password?
                  </a>
                </div>
              </div>

              {/* Primary CTA Button */}
              <div className="pt-sm">
                <button
                  className="w-full flex justify-center items-center gap-xs py-sm px-md border border-transparent rounded-lg shadow-sm font-label-md text-label-md text-on-primary-container bg-primary-container border-b-[3px] border-on-primary-container/20 hover:bg-[#ffb04f] hover:-translate-y-[1px] hover:shadow-md active:translate-y-[2px] active:border-b-0 active:mb-[3px] transition-all duration-300 ease-out-back"
                  type="submit"
                >
                  Login
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-margin mb-margin relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/40"></div>
              </div>

              <div className="relative flex justify-center text-sm">
                <span className="px-sm bg-surface-container-lowest font-caption text-caption text-on-surface-variant uppercase tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-md">
              <button
                className="w-full inline-flex justify-center items-center gap-sm py-sm px-md border-2 border-surface-container-high rounded-lg bg-surface font-label-md text-label-md text-on-surface shadow-sm hover:bg-surface-container-low transition-colors duration-300 ease-out-back"
                type="button"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  ></path>
                </svg>
                Google
              </button>

              <button
                className="w-full inline-flex justify-center items-center gap-sm py-sm px-md border-2 border-surface-container-high rounded-lg bg-surface font-label-md text-label-md text-on-surface shadow-sm hover:bg-surface-container-low transition-colors duration-300 ease-out-back"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5 text-on-surface"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z"></path>
                </svg>
                Apple
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-margin text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Don&apos;t have an account?
                <a
                  className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors duration-300 ml-1"
                  href="#"
                >
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
