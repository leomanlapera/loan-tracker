import { describe, it, expect } from 'vitest'
import { escapeCell, toCsv, isoDate } from './csv'

describe('csv escape', () => {
  it('leaves simple strings unquoted', () => {
    expect(escapeCell('hello')).toBe('hello')
  })
  it('quotes and escapes commas, quotes, newlines', () => {
    expect(escapeCell('a,b')).toBe('"a,b"')
    expect(escapeCell('with "quote"')).toBe('"with ""quote"""')
    expect(escapeCell('two\nlines')).toBe('"two\nlines"')
  })
  it('formats dates as ISO', () => {
    const d = new Date('2026-03-05T12:34:56Z')
    expect(escapeCell(d)).toBe('2026-03-05')
    expect(isoDate(d)).toBe('2026-03-05')
  })
  it('numbers pass through unquoted', () => {
    expect(escapeCell(123.45)).toBe('123.45')
  })
  it('null becomes empty', () => {
    expect(escapeCell(null)).toBe('')
  })
})

describe('toCsv', () => {
  it('joins headers and rows with CRLF and trailing newline', () => {
    const csv = toCsv(['a', 'b'], [
      [1, 2],
      ['x', 'y'],
    ])
    expect(csv).toBe('a,b\r\n1,2\r\nx,y\r\n')
  })
})
