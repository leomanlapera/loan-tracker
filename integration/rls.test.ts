import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestUser, deleteTestUser, type TestUser } from './helpers/users'

let userA: TestUser
let userB: TestUser

beforeAll(async () => {
  userA = await createTestUser('rls-a')
  userB = await createTestUser('rls-b')
})

afterAll(async () => {
  if (userA) await deleteTestUser(userA.id)
  if (userB) await deleteTestUser(userB.id)
})

describe('RLS — borrowers', () => {
  it('user A can insert a borrower for themselves', async () => {
    const { error } = await userA.client
      .from('borrowers')
      .insert({ user_id: userA.id, full_name: 'Juan Dela Cruz' })
    expect(error).toBeNull()
  })

  it('user A cannot insert a borrower for user B', async () => {
    const { error } = await userA.client
      .from('borrowers')
      .insert({ user_id: userB.id, full_name: 'Impersonation Attempt' })
    expect(error).not.toBeNull()
  })

  it('user B cannot see user A borrowers', async () => {
    const { data, error } = await userB.client.from('borrowers').select('id, full_name')
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })

  it('user B cannot update user A borrowers', async () => {
    const { data: aRows } = await userA.client.from('borrowers').select('id').limit(1)
    const targetId = aRows?.[0]?.id
    expect(targetId).toBeDefined()
    const { data, error } = await userB.client
      .from('borrowers')
      .update({ full_name: 'Hacked' })
      .eq('id', targetId!)
      .select()
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })

  it('user B cannot delete user A borrowers', async () => {
    const { data: aRows } = await userA.client.from('borrowers').select('id').limit(1)
    const targetId = aRows?.[0]?.id
    expect(targetId).toBeDefined()
    const { data, error } = await userB.client
      .from('borrowers')
      .delete()
      .eq('id', targetId!)
      .select()
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })
})

describe('RLS — loans + custom schedule', () => {
  let loanId: string

  it('user A can create a loan against their own borrower', async () => {
    const { data: b } = await userA.client
      .from('borrowers')
      .insert({ user_id: userA.id, full_name: 'Loan Borrower' })
      .select('id')
      .single()
    const borrowerId = b!.id
    const { data, error } = await userA.client
      .from('loans')
      .insert({
        user_id: userA.id,
        borrower_id: borrowerId,
        principal: 10000,
        monthly_rate: 5,
        tenure_months: 3,
        start_date: '2026-01-01',
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    loanId = data!.id
  })

  it('user B cannot read user A loans', async () => {
    const { data, error } = await userB.client.from('loans').select('id')
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })

  it('user B cannot insert into loan_custom_schedule for user A loan', async () => {
    const { error } = await userB.client
      .from('loan_custom_schedule')
      .insert({ loan_id: loanId, period: 1, planned_amount: 100 })
    expect(error).not.toBeNull()
  })

  it('user A can insert into loan_custom_schedule for own loan', async () => {
    const { error } = await userA.client
      .from('loan_custom_schedule')
      .insert({ loan_id: loanId, period: 1, planned_amount: 100 })
    expect(error).toBeNull()
  })

  it('user B cannot read loan_custom_schedule rows for user A loan', async () => {
    const { data, error } = await userB.client
      .from('loan_custom_schedule')
      .select('period')
      .eq('loan_id', loanId)
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })
})

describe('RLS — payments', () => {
  it('user A can create a payment for their own loan', async () => {
    const { data: loan } = await userA.client.from('loans').select('id').limit(1).single()
    const { error } = await userA.client.from('payments').insert({
      user_id: userA.id,
      loan_id: loan!.id,
      amount: 100,
      paid_on: '2026-02-01',
      method: 'cash',
    })
    expect(error).toBeNull()
  })

  it('user B cannot see user A payments', async () => {
    const { data, error } = await userB.client.from('payments').select('id')
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })

  it('user B cannot insert payment against user A loan', async () => {
    const { data: aLoan } = await userA.client.from('loans').select('id').limit(1).single()
    const { error } = await userB.client.from('payments').insert({
      user_id: userB.id,
      loan_id: aLoan!.id,
      amount: 50,
      paid_on: '2026-02-01',
      method: 'cash',
    })
    // Tightened RLS blocks this via the "loan belongs to caller" WITH CHECK.
    expect(error).not.toBeNull()
  })
})

describe('RLS — activity_log', () => {
  it('user B sees zero activity rows for user A', async () => {
    const { data, error } = await userB.client.from('activity_log').select('id')
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })

  it('users cannot write to activity_log directly', async () => {
    const { error } = await userA.client.from('activity_log').insert({
      user_id: userA.id,
      entity_type: 'borrower',
      entity_id: userA.id,
      action: 'create',
    })
    expect(error).not.toBeNull()
  })
})

describe('RLS — profiles', () => {
  it('user A can read their own profile row', async () => {
    const { data, error } = await userA.client.from('profiles').select('id').eq('id', userA.id).single()
    expect(error).toBeNull()
    expect(data?.id).toBe(userA.id)
  })

  it('user B cannot read user A profile row', async () => {
    const { data, error } = await userB.client.from('profiles').select('id').eq('id', userA.id)
    expect(error).toBeNull()
    expect(data ?? []).toEqual([])
  })
})
