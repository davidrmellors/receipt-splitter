'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, DollarSign, Receipt, Clock, Users, Plus, Loader2, CheckCircle } from 'lucide-react'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4 sm:py-0 sm:h-16">
            <Button variant="ghost" asChild className="text-xl font-bold justify-start p-0">
              <Link href={`/groups/${groupId}`}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Group Summary
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/groups/${groupId}/scan`}>
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Receipt</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div className="text-lg sm:text-2xl font-bold text-primary">
                    ${totalGroupExpenses.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Total Group Expenses
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-green-600" />
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {receipts.length}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Total Receipts
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">
                    {pendingPayments.length}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Pending Payments
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Balances */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Balances
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-medium text-sm">
                            {balance.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{balance.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            Owes: ${balance.owes.toFixed(2)} • Owed: ${balance.owed.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-semibold ${
                            balance.net > 0 ? 'text-green-600' : balance.net < 0 ? 'text-destructive' : 'text-muted-foreground'
                          }`}
                        >
                          {balance.net > 0 ? '+' : ''}${balance.net.toFixed(2)}
                        </div>
                        {balance.net < 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestPayment(balance)}
                          >
                            Request Payment
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Receipts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Recent Receipts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                          <div className="font-medium">{receipt.storeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {receipt.items} items • {receipt.date}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-semibold">${receipt.total.toFixed(2)}</div>
                          <Badge
                            variant={receipt.status === 'settled' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {receipt.status === 'settled' ? 'Settled' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 sm:mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">
                          {payment.fromUserName} owes {payment.toUserName}
                        </div>
                        <div className="text-sm text-muted-foreground">{payment.description}</div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
                        <div className="text-lg font-semibold">
                          ${payment.amount.toFixed(2)}
                        </div>
                        {payment.toUser === '1' && ( // Current user is owed money
                          <Button
                            onClick={() => handleMarkAsPaid(payment.id)}
                            size="sm"
                            className="ml-3 sm:ml-0"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Request Payment from {balance.userName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Message (optional)
              </Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add a note about this payment..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="flex-1"
              >
                Send Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}