'use client'

import { useState } from 'react'
import type { RegistrationAddon } from '@/types/conference'

interface Props {
  addons: RegistrationAddon[]
  onChange: (addons: RegistrationAddon[]) => void
  currency?: string
}

export default function RegistrationAddonsSection({
  addons,
  onChange,
  currency = 'EUR',
}: Props) {
  const [label, setLabel] = useState('')
  const [price, setPrice] = useState('0')

  const add = () => {
    if (!label.trim()) return
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `addon-${Date.now()}`
    onChange([
      ...addons,
      {
        id,
        name: label.trim().toLowerCase().replace(/\s+/g, '_'),
        label: label.trim(),
        price: Number(price) || 0,
        currency,
        maxQuantity: 5,
        active: true,
      },
    ])
    setLabel('')
    setPrice('0')
  }

  const remove = (id: string) => {
    onChange(addons.filter((a) => a.id !== id))
  }

  const toggle = (id: string) => {
    onChange(
      addons.map((a) => (a.id === id ? { ...a, active: a.active === false } : a))
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Registration add-ons</h3>
        <p className="text-sm text-gray-600 mt-1">
          Optional extras (workshops, dinners) offered during registration. Price is
          added to the fee total (Stripe live checkout still deferred).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Label (e.g. Gala dinner)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="w-28 border rounded-lg px-3 py-2 text-sm"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium"
        >
          Add
        </button>
      </div>

      {addons.length === 0 ? (
        <p className="text-sm text-gray-500">No add-ons yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {addons.map((addon) => (
            <li
              key={addon.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-gray-900">{addon.label}</span>
                <span className="text-gray-500 ml-2">
                  {Number(addon.price || 0).toFixed(2)} {addon.currency || currency}
                </span>
                {addon.active === false && (
                  <span className="ml-2 text-xs text-amber-700">inactive</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs text-slate-600 hover:underline"
                  onClick={() => toggle(addon.id)}
                >
                  {addon.active === false ? 'Activate' : 'Deactivate'}
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => remove(addon.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
