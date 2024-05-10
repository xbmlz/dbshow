import fs from 'node:fs'
import os from 'node:os'
import gradient from 'gradient-string'
import { FetchingJSONSchemaStore, InputData, JSONSchemaInput, quicktype } from 'quicktype-core'
import type { RendererOptions } from 'quicktype-core'

export async function createDir(dir: string) {
  if (fs.existsSync(dir))
    await fs.promises.rm(dir, { recursive: true, force: true })
  await fs.promises.mkdir(dir, { recursive: true })
}

export async function writeFile(path: string, data: string) {
  await fs.promises.writeFile(path, data)
}

export function convertLineBreaks(text: string): string {
  if (!text)
    return text
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

export async function quicktypeJSONSchema(targetLanguage: string, typeName: string, jsonSchemaString: string, rendererOptions: RendererOptions) {
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

  // We could add multiple schemas for multiple types,
  // but here we're just making one type from JSON schema.
  await schemaInput.addSource({ name: typeName, schema: jsonSchemaString })

  const inputData = new InputData()
  inputData.addInput(schemaInput)

  return await quicktype({
    inputData,
    lang: targetLanguage,
    rendererOptions,
  })
}
