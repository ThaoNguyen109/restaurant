import { Client } from '@stomp/stompjs'
import { API_CONFIG } from '../config/api'

// ─── Singleton STOMP client ───────────────────────────────────────────────────
let stompClient = null
let isConnected = false

// topic → Set<callback>
const subscriptions = new Map()
// topic → STOMP subscription object
const activeStompSubscriptions = new Map()

// ─── Build native WebSocket URL ──────────────────────────────────────────────
function buildWsUrl() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  let wsHost = 'localhost:8080'
  try {
    const parsed = new URL(API_CONFIG.baseUrl)
    wsHost = parsed.host
  } catch {
    // fallback
  }
  return `${wsProtocol}//${wsHost}/ws`
}

// ─── Register a STOMP subscription ───────────────────────────────────────────
function registerTopicSubscription(topic) {
  if (!stompClient || !isConnected) {
    console.warn('[WS] Cannot subscribe to', topic, '- not connected yet')
    return
  }
  if (activeStompSubscriptions.has(topic)) {
    console.log('[WS] Already subscribed to', topic, '- skipping')
    return
  }

  try {
    const sub = stompClient.subscribe(topic, (message) => {
      console.log('[WS] 📩 Message received on', topic, ':', message.body?.substring(0, 100))
      try {
        const payload = JSON.parse(message.body)
        const callbacks = subscriptions.get(topic)
        if (callbacks && callbacks.size > 0) {
          console.log('[WS] Dispatching to', callbacks.size, 'listener(s)')
          callbacks.forEach((cb) => {
            try { cb(payload) } catch (e) {
              console.error('[WS] Callback error:', e)
            }
          })
        } else {
          console.warn('[WS] No callbacks registered for', topic)
        }
      } catch (e) {
        console.error('[WS] JSON parse error:', e)
      }
    })
    activeStompSubscriptions.set(topic, sub)
    console.log('[WS] ✅ Successfully subscribed to', topic)
  } catch (err) {
    console.error('[WS] ❌ Subscribe error on', topic, ':', err)
  }
}

// ─── Initialize STOMP client (idempotent) ────────────────────────────────────
export function getWebSocketClient() {
  if (stompClient) return stompClient

  const wsUrl = buildWsUrl()
  console.log('[WS] 🔌 Creating STOMP client → ', wsUrl)

  stompClient = new Client({
    brokerURL: wsUrl,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      console.log('[WS] ✅ STOMP CONNECTED to', wsUrl)
      isConnected = true

      // Subscribe all pending topics
      const topicCount = subscriptions.size
      console.log('[WS] Re-subscribing', topicCount, 'pending topic(s)...')
      subscriptions.forEach((callbacks, topic) => {
        if (callbacks.size > 0) {
          // Force clear stale subscription so we can re-subscribe
          activeStompSubscriptions.delete(topic)
          registerTopicSubscription(topic)
        }
      })
    },

    onDisconnect: () => {
      console.log('[WS] ⚠️ STOMP DISCONNECTED')
      isConnected = false
      activeStompSubscriptions.clear()
    },

    onStompError: (frame) => {
      console.error('[WS] ❌ STOMP ERROR:', frame.headers?.['message'], frame.body)
    },

    onWebSocketError: (err) => {
      console.warn('[WS] ⚠️ WebSocket transport error:', err)
    },

    // Debug: log all raw STOMP frames
    debug: (str) => {
      // Chỉ log frame quan trọng, bỏ qua heartbeat
      if (str && !str.startsWith('>>> \n') && !str.startsWith('<<< \n')) {
        console.log('[WS-DEBUG]', str.substring(0, 200))
      }
    },
  })

  stompClient.activate()
  console.log('[WS] 🚀 Client activated, waiting for connection...')
  return stompClient
}

/**
 * Subscribe to a WebSocket topic.
 * @param {string} topic  e.g. '/topic/reservations'
 * @param {(payload: any) => void} callback
 * @returns {() => void}  unsubscribe function
 */
export function subscribeWebSocket(topic, callback) {
  console.log('[WS] 📌 subscribeWebSocket called for', topic)

  if (!subscriptions.has(topic)) {
    subscriptions.set(topic, new Set())
  }
  subscriptions.get(topic).add(callback)

  // Ensure client is activating
  getWebSocketClient()

  // If already connected, subscribe right now
  if (isConnected) {
    registerTopicSubscription(topic)
  } else {
    console.log('[WS] Not connected yet — will subscribe on connect')
  }

  // Return unsubscribe function
  return () => {
    console.log('[WS] 🗑️ Unsubscribing from', topic)
    const callbacks = subscriptions.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        subscriptions.delete(topic)
        const stompSub = activeStompSubscriptions.get(topic)
        if (stompSub) {
          try { stompSub.unsubscribe() } catch (_) {}
          activeStompSubscriptions.delete(topic)
        }
      }
    }
  }
}

/**
 * Returns current WebSocket connection state
 */
export function isWebSocketConnected() {
  return isConnected
}
