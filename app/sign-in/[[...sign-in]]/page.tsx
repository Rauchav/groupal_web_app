// NOTE FOR DEVELOPER: To remove GitHub from social login options,
// go to Clerk Dashboard → User & Authentication → Social Connections
// and disable the GitHub provider there.
// Apple and Google should be the only enabled social providers.

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#002356] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/brand/LOGO FONDO AZUL.png"
            alt="Groupal"
            className="h-12 mx-auto mb-4"
          />
          <p className="text-white/70 text-sm">
            Buy together. Save massive.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-2xl rounded-2xl",
              headerTitle: "text-[#002356] font-bold",
              formButtonPrimary:
                "bg-[#048943] hover:bg-[#037a3b] text-white",
              footerActionLink: "text-[#002356] hover:text-[#1b4487]",
            },
          }}
        />
      </div>
    </main>
  )
}
