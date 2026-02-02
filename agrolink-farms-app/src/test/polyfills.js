// Polyfills for Node.js test environment
const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, WritableStream, TransformStream } = require('stream/web')

// Add polyfills to global scope
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.WritableStream = WritableStream
global.TransformStream = TransformStream

// Mock BroadcastChannel for MSW
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

// Add fetch polyfill
require('whatwg-fetch')