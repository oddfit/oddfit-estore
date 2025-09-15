// src/pages/NotAuthorizedPage.tsx
export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Not authorized</h1>
        <p className="text-gray-600">You need admin access to view this page.</p>
      </div>
    </div>
  );
}
