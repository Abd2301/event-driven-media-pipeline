import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'

interface MediaItem {
  id: string
  fileName: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  originalUrl?: string
  processedUrl?: string
  error?: string
  uploadedAt: string
}

function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiEndpoint, setApiEndpoint] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!apiKey || !apiEndpoint) {
      alert('Please configure API Key and Endpoint first')
      return
    }

    setIsUploading(true)
    
    for (const file of acceptedFiles) {
      try {
        // Create a new media item
        const newItem: MediaItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          status: 'PENDING',
          uploadedAt: new Date().toISOString()
        }
        
        setMediaItems(prev => [...prev, newItem])

        // Prepare upload request
        const uploadData = {
          fileName: file.name,
          contentType: file.type
        }

        // Get presigned URL for upload
        const uploadResponse = await axios.post(
          `${apiEndpoint}/media/upload`,
          uploadData,
          {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          }
        )

        const { uploadUrl, mediaId } = uploadResponse.data

        // Upload file to S3
        await axios.put(uploadUrl, file, {
          headers: {
            'Content-Type': file.type
          }
        })

        // Update item with media ID
        setMediaItems(prev => 
          prev.map(item => 
            item.id === newItem.id 
              ? { ...item, id: mediaId, status: 'PROCESSING' }
              : item
          )
        )

        // Start polling for status
        pollStatus(mediaId)

      } catch (error) {
        console.error('Upload failed:', error)
        setMediaItems(prev => 
          prev.map(item => 
            item.fileName === file.name 
              ? { ...item, status: 'FAILED', error: 'Upload failed' }
              : item
          )
        )
      }
    }
    
    setIsUploading(false)
  }, [apiKey, apiEndpoint])

  const pollStatus = async (mediaId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${apiEndpoint}/media/${mediaId}/status`,
          {
            headers: {
              'x-api-key': apiKey
            }
          }
        )

        const { status, processedUrl, error } = response.data

        setMediaItems(prev => 
          prev.map(item => 
            item.id === mediaId 
              ? { ...item, status, processedUrl, error }
              : item
          )
        )

        if (status === 'COMPLETED' || status === 'FAILED') {
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Status check failed:', error)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
      case 'PROCESSING':
        return <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'FAILED':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'PROCESSING':
        return 'text-blue-700 bg-blue-100 border-blue-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <PhotoIcon className="h-6 w-6 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Media Processing Pipeline
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              AWS Serverless
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Configuration Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            API Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://your-api-gateway-url.amazonaws.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Upload Media Files
          </h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop files here, or click to select files'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supports: JPEG, PNG, GIF (Max 10MB per file)
            </p>
          </div>
        </div>

        {/* Media Items List */}
        {mediaItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Processing Queue
            </h2>
            <div className="space-y-3">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.fileName}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(item.uploadedAt).toLocaleString()}
                      </p>
                      {item.error && (
                        <p className="text-xs text-red-600">{item.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    
                    {item.status === 'COMPLETED' && item.processedUrl && (
                      <a
                        href={item.processedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isUploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 text-sm">Uploading files...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
