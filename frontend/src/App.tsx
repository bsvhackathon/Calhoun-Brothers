import { useState } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('http://localhost:3001')
      setMessage(response.data.message)
    } catch (err) {
      setError('Failed to fetch data from the backend')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-full max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-8 text-white">Chain Games Frontend</h1>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 disabled:cursor-not-allowed mb-4 transform transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none font-semibold text-lg"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
        {error && <p className="text-lg text-red-500 bg-red-100 p-4 rounded-md my-4">{error}</p>}
        {message && <p className="text-lg text-green-500 bg-green-100 p-4 rounded-md my-4">{message}</p>}
      </div>
    </div>
  )
}

export default App
