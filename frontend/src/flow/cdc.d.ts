// Type declarations for Vite's ?raw imports
declare module '*.cdc?raw' {
  const content: string
  export default content
}
