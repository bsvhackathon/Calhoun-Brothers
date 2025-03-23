import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [wsMessage, setWsMessage] = useState<string>('')
  const [inputMessage, setInputMessage] = useState<string>('')
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Create WebSocket connection
    ws.current = new WebSocket('ws://localhost:3001')

    ws.current.onopen = () => {
      console.log('Connected to WebSocket')
    }

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'welcome') {
        setWsMessage(data.message)
      } else if (data.type === 'message') {
        setWsMessage(`Server: ${data.content}`)
      }
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('WebSocket connection error')
    }

    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket')
    }

    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

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

  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && inputMessage.trim()) {
      ws.current.send(inputMessage)
      setInputMessage('')
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#1a1a1a]">
      <div className="w-full max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-8 text-white">Chain Games Frontend</h1>
        
        {/* WebSocket Section */}
        <div className="mb-8 p-6 bg-[#2a2a2a] rounded-xl">
          <h2 className="text-2xl font-semibold mb-4 text-white">WebSocket Chat</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-lg bg-[#3a3a3a] text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>
          {wsMessage && (
            <div className="p-4 bg-[#3a3a3a] rounded-lg text-white">
              {wsMessage}
            </div>
          )}
        </div>

        {/* REST API Section */}
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
