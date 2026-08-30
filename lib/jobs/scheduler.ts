// Mock in-memory scheduler standing in for a real job queue (BullMQ +
// Upstash Redis, per CLAUDE.md's tech stack). `scheduleAt` mirrors
// `queue.add(name, payload, { delay })` — swap this file for a real BullMQ
// Queue/Worker pair later; every other module here calls only scheduleAt()
// and cancelScheduled(), so that's the entire migration surface.

const timers = new Map<string, ReturnType<typeof setTimeout>>()
let jobCounter = 0

export function scheduleAt(runAt: Date, run: () => void | Promise<void>): string {
  const id = `job_${++jobCounter}`
  const delayMs = Math.max(0, runAt.getTime() - Date.now())
  const timer = setTimeout(() => {
    timers.delete(id)
    void run()
  }, delayMs)
  timers.set(id, timer)
  return id
}

export function cancelScheduled(id: string): void {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}
