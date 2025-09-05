"use client";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Logo */}
        <div
          className="flex flex-col justify-center items-center text-center fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="text-center">
            <h1
              className="text-6xl font-black text-slate-700 tracking-tight leading-none slide-in-left opacity-0"
              style={{ animationDelay: "0.4s" }}
            >
              OUDAOUDOX
            </h1>
            <div className="mt-4 flex items-center justify-center">
              <div
                className="h-1 bg-teal-500 flex-1 max-w-16 scale-in opacity-0"
                style={{ animationDelay: "0.8s" }}
              ></div>
              <p
                className="mx-4 text-lg font-semibold text-teal-600 tracking-wide slide-in-right opacity-0"
                style={{ animationDelay: "0.9s" }}
              >
                DECORATION - MENUISERIE - TRAVAUX DIVERS
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Clerk SignIn */}
        <div
          className="flex justify-center lg:justify-end slide-in-up opacity-0"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="w-full max-w-md">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-white/80  backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_18px_70px_rgba(0,0,0,0.35)] overflow-hidden px-6 py-7",
                  headerTitle: "text-slate-700",
                  headerSubtitle: "text-slate-700",
                  form: "space-y-4",
                  formFieldLabel: "text-slate-700",
                  formFieldInput:
                    "bg-white/5 border border-white/15 text-slate-700 placeholder:text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c8aa6d]/70 focus:border-transparent",
                  socialButtonsBlockButton:
                    "bg-white/10 hover:bg-white/15 text-slate-700 border border-white/10 rounded-xl transition-colors",
                  dividerLine: "bg-white/12",
                  dividerText: "text-slate-700",
                  formButtonPrimary:
                    "bg-slate-600  hover:bg-slate-700  text-white font-medium rounded-lg shadow-md transition-colors",
                  footer: "hidden", // حذف الفوتر والخط
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Animations CSS améliorées */}
      <style jsx>{`
        /* Respect des préférences de réduction de mouvement */
        @media (prefers-reduced-motion: reduce) {
          .fade-in-up,
          .slide-in-left,
          .slide-in-right,
          .slide-in-up,
          .scale-in {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }

        /* Animation d'entrée depuis le bas avec fade */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        /* Animation de glissement depuis la gauche */
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
            filter: blur(3px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        /* Animation de glissement depuis la droite */
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
            filter: blur(3px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        /* Animation de glissement depuis le bas */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        /* Animation d'échelle avec fade */
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scaleX(0);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        /* Classes d'animation avec timing optimisé */
        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          will-change: transform, opacity, filter;
        }

        .slide-in-left {
          animation: slideInLeft 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          will-change: transform, opacity, filter;
        }

        .slide-in-right {
          animation: slideInRight 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          will-change: transform, opacity, filter;
        }

        .slide-in-up {
          animation: slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          will-change: transform, opacity, filter;
        }

        .scale-in {
          animation: scaleIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          will-change: transform, opacity;
          transform-origin: left center;
        }

        /* Effet de hover subtil sur le titre */
        h1:hover {
          transform: scale(1.02);
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Animation de la ligne de séparation */
        .scale-in {
          transform-origin: left center;
        }
      `}</style>
    </div>
  );
}
