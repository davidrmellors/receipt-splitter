'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-2xl mx-auto"
      >
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Receipt Splitter
          </h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Split bills effortlessly with your friends. Scan receipts, assign items, and track who owes what.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/signin"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-blue-600 text-3xl mb-3">📱</div>
            <h3 className="font-semibold text-lg mb-2">Scan Receipts</h3>
            <p className="text-gray-600 text-sm">
              Use your phone camera to capture receipts instantly
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-blue-600 text-3xl mb-3">↔️</div>
            <h3 className="font-semibold text-lg mb-2">Swipe to Assign</h3>
            <p className="text-gray-600 text-sm">
              Swipe left for yourself, right for others, up for custom splits
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-blue-600 text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-lg mb-2">Track Balances</h3>
            <p className="text-gray-600 text-sm">
              See who owes what across multiple receipts and groups
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
