import { createApp } from '../src/server'

export default async (req: any, res: any) => {
  const app = await createApp()
  await app.ready()
  app.server.emit('request', req, res)
}
