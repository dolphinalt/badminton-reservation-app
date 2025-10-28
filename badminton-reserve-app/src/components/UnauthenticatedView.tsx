import LoginButton from "./LoginButton";

export default function UnauthenticatedView() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Badminton</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Court Reservation
          </h2>
          <p className="text-gray-600">
            Please sign in to reserve courts and manage your badminton sessions.
          </p>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold">Court 1</div>
              <div className="text-sm text-green-500">Available</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold">Court 2</div>
              <div className="text-sm text-green-500">Available</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold">Court 3</div>
              <div className="text-sm text-green-500">Available</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <LoginButton />
          <p className="text-xs text-gray-500">
            By signing in, you agree to our terms of service and can reserve
            courts for up to 30 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
