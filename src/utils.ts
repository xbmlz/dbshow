import fs from 'node:fs'

export async function createDir(dir: string) {
  if (!fs.existsSync(dir))
    await fs.promises.mkdir(dir, { recursive: true })
}

export async function writeFile(path: string, data: string) {
  await fs.promises.writeFile(path, data)
}

export function convertLineBreaks(text: string): string {
  // \n -> <br>, \r\n -> <br>
  return text.replace(/\n/g, '<br>').replace(/\r\n/g, '<br>').replace(/\r/g, '<br>')
}
