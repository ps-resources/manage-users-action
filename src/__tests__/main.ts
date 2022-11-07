import {expect, test} from '@jest/globals'

test.skip('throws invalid number', async () => {})

test.skip('wait 500 ms', async () => {
  const start = new Date()
  const end = new Date()
  const delta = Math.abs(end.getTime() - start.getTime())
  expect(delta).toBeGreaterThan(450)
})
