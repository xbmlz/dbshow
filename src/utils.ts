import fs from 'node:fs'
import os from 'node:os'
import gradient from 'gradient-string'

export async function createDir(dir: string) {
  if (fs.existsSync(dir))
    await fs.promises.rm(dir, { recursive: true, force: true })
  await fs.promises.mkdir(dir, { recursive: true })
}

export async function writeFile(path: string, data: string) {
  await fs.promises.writeFile(path, data)
}

export function convertLineBreaks(text: string): string {
  // \n -> <br>, \r\n -> <br>
  return text.replace(/\n/g, '<br>').replace(/\r\n/g, '<br>').replace(/\r/g, '<br>')
}

export function renderGradientString(text: string): string {
  return gradient([
    { color: '#42d392', pos: 0 },
    { color: '#42d392', pos: 0.1 },
    { color: '#647eff', pos: 1 },
  ])(text)
}

export function getLocalIPv4Addresses(): string[] {
  const interfaces = os.networkInterfaces()
  if (!interfaces)
    return []
  const addresses: string[] = []
  for (const name in interfaces) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface?.internal)
        addresses.push(iface?.address ?? '')
    }
  }
  return addresses
}

export function toInterfaceName(str: string): string {
  const words = str.toLowerCase().split('_')
  const interfaceName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  return interfaceName
}
