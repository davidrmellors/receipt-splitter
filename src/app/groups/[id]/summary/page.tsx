'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Balance {
  userId: string
  userName: string
  owes: number
  owed: number
  net: number
}

interface Receipt {
  id: string
  storeName: string
  date: string
  total: number
  items: number
  status: 'pending' | 'settled'
}

interface Payment {
  id: string
  fromUser: string
  fromUserName: string
  toUser: string
  toUserName: string
  amount: number
  date: string
  description: string
  status: 'pending' | 'completed'
}

export default function GroupSummary() {
  const params = useParams()
  const groupId = params.id as string

  const [balances, setBalances] = useState<Balance[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    // In a real app, this would fetch data from Supabase
    // For now, using mock data
    setBalances([
      { userId: '1', userName: 'You', owes: 15.50, owed: 22.75, net: 7.25 },
      { userId: '2', userName: 'Alice', owes: 8.25, owed: 12.00, net: 3.75 },
      { userId: '3', userName: 'Bob', owes: 25.00, owed: 5.50, net: -19.50 },
      { userId: '4', userName: 'Charlie', owes: 12.00, owed: 20.50, net: 8.50 }
    ])

    setReceipts([
      { id: '1', storeName: 'McDonald\'s', date: '2024-01-15', total: 45.50, items: 4, status: 'pending' },
      { id: '2', storeName: 'Grocery Store', date: '2024-01-14', total: 87.25, items: 12, status: 'settled' },
      { id: '3', storeName: 'Pizza Hut', date: '2024-01-13', total: 32.99, items: 2, status: 'pending' }
    ])

    setPayments([
      {
        id: '1',
        fromUser: '3',
        fromUserName: 'Bob',
        toUser: '1',
        toUserName: 'You',
        amount: 19.50,
        date: '2024-01-15',
        description: 'McDonald\'s receipt',
        status: 'pending'
      }
    ])

    setLoading(false)
  }, [])

  const handleMarkAsPaid = async (paymentId: string) => {
    setPayments(prev =>
      prev.map(payment =>
        payment.id === paymentId
          ? { ...payment, status: 'completed' as const }
          : payment
      )
    )
  }

  const handleRequestPayment = (balance: Balance) => {
    setSelectedBalance(balance)
    setShowPaymentModal(true)
  }

  const totalGroupExpenses = receipts.reduce((sum, receipt) => sum + receipt.total, 0)
  const pendingPayments = payments.filter(p => p.status === 'pending')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/groups/${groupId}`} className="text-xl font-bold text-gray-900">
              ← Group Summary
            </Link>
            <Link
              href={`/groups/${groupId}/scan`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Receipt
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="text-2xl font-bold text-blue-600">${totalGroupExpenses.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Group Expenses</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="text-2xl font-bold text-green-600">{receipts.length}</div>
            <div className="text-sm text-gray-600">Total Receipts</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="text-2xl font-bold text-orange-600">{pendingPayments.length}</div>
            <div className="text-sm text-gray-600">Pending Payments</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Balances */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Balances</h2>
            </div>
            <div className="divide-y">
              {balances.map((balance, index) => (
                <motion.div
                  key={balance.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {balance.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{balance.userName}</div>
                      <div className="text-sm text-gray-500">
                        Owes: ${balance.owes.toFixed(2)} • Owed: ${balance.owed.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${
                        balance.net > 0 ? 'text-green-600' : balance.net < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {balance.net > 0 ? '+' : ''}${balance.net.toFixed(2)}
                    </div>
                    {balance.net < 0 && (
                      <button
                        onClick={() => handleRequestPayment(balance)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Request Payment
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Receipts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Recent Receipts</h2>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {receipts.map((receipt, index) => (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{receipt.storeName}</div>
                      <div className="text-sm text-gray-500">
                        {receipt.items} items • {receipt.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${receipt.total.toFixed(2)}</div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          receipt.status === 'settled'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {receipt.status === 'settled' ? 'Settled' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white rounded-lg shadow-sm border"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Pending Payments</h2>
            </div>
            <div className="divide-y">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {payment.fromUserName} owes {payment.toUserName}
                    </div>
                    <div className="text-sm text-gray-500">{payment.description}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </div>
                    {payment.toUser === '1' && ( // Current user is owed money
                      <button
                        onClick={() => handleMarkAsPaid(payment.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Payment Request Modal */}
      {showPaymentModal && selectedBalance && (
        <PaymentModal
          balance={selectedBalance}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={() => {
            // Handle payment request
            setShowPaymentModal(false)
          }}
        />
      )}
    </div>
  )
}

interface PaymentModalProps {
  balance: Balance
  onClose: () => void
  onSubmit: () => void
}

function PaymentModal({ balance, onClose, onSubmit }: PaymentModalProps) {
  const [amount, setAmount] = useState(Math.abs(balance.net).toString())
  const [message, setMessage] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full"
      >
        <h3 className="text-lg font-semibold mb-4">
          Request Payment from {balance.userName}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a note about this payment..."
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Request
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}