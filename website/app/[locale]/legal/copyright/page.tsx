export default function CopyrightPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">DMCA Notice & Takedown Policy</h1>

      <div className="prose max-w-none">
        <p className="mb-6">
          FANTIKX complies with the Digital Millennium Copyright Act (DMCA) and international copyright laws.
        </p>

        <p className="mb-6">
          If a copyright owner believes that their content has been used without authorization, they may submit a
          takedown request to:
        </p>

        <p className="font-bold text-lg mb-6">copyright@fantikx.com</p>

        <p className="mb-4">Upon receiving a valid DMCA notice:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>the reported content will be removed or disabled,</li>
          <li>the uploader will be notified,</li>
          <li>repeat offenders may have their accounts terminated.</li>
        </ul>

        <p className="mb-6">
          FANTIKX acts solely as a hosting provider and is not responsible for user-uploaded media or audio.
        </p>
      </div>
    </div>
  )
}
