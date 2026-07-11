export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Students</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Tests</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700">Questions</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
          <h3 className="text-lg font-semibold text-gray-700">Results</h3>
          <p className="text-3xl font-bold text-amber-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
