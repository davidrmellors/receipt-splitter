'use client'

import { useState } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'

interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface GroupMember {
  id: string
  name: string
}

interface SwipeableItemCardProps {
  item: ReceiptItem
  groupMembers: GroupMember[]
  currentUser: { id: string; name: string }
  onAssign: (itemId: string, assignment: ItemAssignment) => void
}

interface ItemAssignment {
  type: 'self' | 'member' | 'split' | 'custom'
  assignedTo?: string
  memberName?: string
  customSplit?: Array<{ userId: string; amount: number }>
}

export default function SwipeableItemCard({
  item,
  groupMembers,
  currentUser,
  onAssign
}: SwipeableItemCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showMemberSelect, setShowMemberSelect] = useState(false)
  const [showCustomSplit, setShowCustomSplit] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Transform values for visual feedback
  const rotateZ = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5])
  const scale = useTransform(y, [-100, 0, 100], [0.9, 1, 0.9])

  // Swipe threshold
  const SWIPE_THRESHOLD = 100

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false)

    const { offset, velocity } = info
    const swipeX = offset.x + velocity.x * 0.1
    const swipeY = offset.y + velocity.y * 0.1

    // Reset position
    x.set(0)
    y.set(0)

    // Determine swipe direction
    if (Math.abs(swipeX) > Math.abs(swipeY)) {
      // Horizontal swipe
      if (swipeX < -SWIPE_THRESHOLD) {
        // Left swipe - assign to self
        onAssign(item.id, { type: 'self' })
      } else if (swipeX > SWIPE_THRESHOLD) {
        // Right swipe - show member selection
        setShowMemberSelect(true)
      }
    } else {
      // Vertical swipe
      if (swipeY < -SWIPE_THRESHOLD) {
        // Up swipe - custom split
        setShowCustomSplit(true)
      } else if (swipeY > SWIPE_THRESHOLD) {
        // Down swipe - split evenly
        onAssign(item.id, { type: 'split' })
      }
    }
  }

  const handleMemberSelect = (member: GroupMember) => {
    onAssign(item.id, {
      type: 'member',
      assignedTo: member.id,
      memberName: member.name
    })
    setShowMemberSelect(false)
  }

  const handleCustomSplit = (splits: Array<{ userId: string; amount: number }>) => {
    onAssign(item.id, {
      type: 'custom',
      customSplit: splits
    })
    setShowCustomSplit(false)
  }

  return (
    <>
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          x,
          y,
          rotateZ,
          opacity,
          scale,
        }}
        className="relative"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 mx-4 my-2 border-2 border-gray-100 select-none">
          {/* Swipe Indicators */}
          {isDragging && (
            <>
              {/* Left indicator - Self */}
              <motion.div
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 font-bold"
                animate={{ opacity: x.get() < -50 ? 1 : 0.3 }}
              >
                <div className="text-2xl">👤</div>
                <div className="text-xs">You</div>
              </motion.div>

              {/* Right indicator - Others */}
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 font-bold"
                animate={{ opacity: x.get() > 50 ? 1 : 0.3 }}
              >
                <div className="text-2xl">👥</div>
                <div className="text-xs">Others</div>
              </motion.div>

              {/* Up indicator - Custom */}
              <motion.div
                className="absolute top-4 left-1/2 transform -translate-x-1/2 text-purple-500 font-bold"
                animate={{ opacity: y.get() < -50 ? 1 : 0.3 }}
              >
                <div className="text-2xl">⚡</div>
                <div className="text-xs">Custom</div>
              </motion.div>

              {/* Down indicator - Split */}
              <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-orange-500 font-bold"
                animate={{ opacity: y.get() > 50 ? 1 : 0.3 }}
              >
                <div className="text-2xl">⚖️</div>
                <div className="text-xs">Split</div>
              </motion.div>
            </>
          )}

          {/* Item Content */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ${item.price.toFixed(2)}
            </div>
            {item.quantity > 1 && (
              <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
            )}
          </div>

          {/* Swipe Instructions */}
          {!isDragging && (
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500 space-y-1">
                <div>👈 Swipe left: Assign to you</div>
                <div>👉 Swipe right: Assign to someone</div>
                <div>👆 Swipe up: Custom split</div>
                <div>👇 Swipe down: Split evenly</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Member Selection Modal */}
      {showMemberSelect && (
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
            <h3 className="text-lg font-semibold mb-4">Assign to:</h3>
            <div className="space-y-2">
              {groupMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border"
                >
                  {member.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMemberSelect(false)}
              className="mt-4 w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Custom Split Modal */}
      {showCustomSplit && (
        <CustomSplitModal
          item={item}
          groupMembers={[currentUser, ...groupMembers]}
          onSave={handleCustomSplit}
          onCancel={() => setShowCustomSplit(false)}
        />
      )}
    </>
  )
}

interface CustomSplitModalProps {
  item: ReceiptItem
  groupMembers: Array<{ id: string; name: string }>
  onSave: (splits: Array<{ userId: string; amount: number }>) => void
  onCancel: () => void
}

function CustomSplitModal({ item, groupMembers, onSave, onCancel }: CustomSplitModalProps) {
  const [splits, setSplits] = useState<Record<string, number>>(
    Object.fromEntries(groupMembers.map(member => [member.id, 0]))
  )

  const totalSplit = Object.values(splits).reduce((sum, amount) => sum + amount, 0)
  const remaining = item.price - totalSplit

  const handleSave = () => {
    const validSplits = Object.entries(splits)
      .filter(([, amount]) => amount > 0)
      .map(([userId, amount]) => ({ userId, amount }))

    if (Math.abs(remaining) < 0.01) {
      onSave(validSplits)
    }
  }

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
          Split {item.name} (${item.price.toFixed(2)})
        </h3>

        <div className="space-y-3">
          {groupMembers.map((member) => (
            <div key={member.id} className="flex items-center space-x-3">
              <label className="flex-1 text-sm font-medium">{member.name}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={item.price}
                value={splits[member.id] || ''}
                onChange={(e) =>
                  setSplits({
                    ...splits,
                    [member.id]: parseFloat(e.target.value) || 0
                  })
                }
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="0.00"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Total assigned:</span>
            <span>${totalSplit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Remaining:</span>
            <span className={remaining > 0.01 ? 'text-red-600' : 'text-green-600'}>
              ${remaining.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={Math.abs(remaining) > 0.01}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Split
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}